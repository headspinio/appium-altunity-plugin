import net from 'net'
import { Deferred } from '../utils'
import {
    closeConnection,
    getServerVersion,
    findObject,
    findObjects,
    findAllObjects,
    getCurrentScene,
    getScreenshotAsB64,
    getScreenshotAsPNG,
    keyDown,
    keyUp,
    isActionFinished,
    waitTillActionFinished,
    pressKey,
    tapCoordinates,
    tapElement,
    clickElement,
    getElementText,
    getElementComponents,
    getComponentProperty,
    getComponentFields,
    Position,
} from './commands'
import { AltBy } from './by'
import { AltKeyCode } from './key-code'
import { AltElement } from './alt-element'

const DEFAULT_ALTUNITY_HOST = '127.0.0.1'
const DEFAULT_ALTUNITY_PORT = 13000

enum ResponseEncoding {
    START = 'altstart::',
    RESPONSE = '::response::',
    LOG = '::altLog::',
    END = '::altend'
}

enum RequestEncoding {
    SEPARATOR = ';',
    END = '&'
}

type AltUnityResponse = {
    data: string
    log: string
}

type ClientOpts = {
    host?: string
    port?: number
    log?: any
}

export default class AltUnityClient {
    // fields
    public host: string
    public port: number
    public serverVersion?: string
    public cameraBy: AltBy
    public cameraPath: string

    protected sock: net.Socket | null
    protected curMsgId: number | null
    protected log?: any
    protected responseBuffer: string
    protected responseFinished: Deferred<AltUnityResponse> | null

    // general commands
    protected closeConnection = closeConnection
    getServerVersion = getServerVersion
    getScreenshotAsPNG = getScreenshotAsPNG
    getScreenshotAsB64 = getScreenshotAsB64

    // find commands
    findObject = findObject
    findObjects = findObjects
    findAllObjects = findAllObjects
    getCurrentScene = getCurrentScene

    // action commands
    keyDown = keyDown
    keyUp = keyUp
    pressKey = pressKey
    isActionFinished = isActionFinished
    waitTillActionFinished = waitTillActionFinished
    tapCoordinates = tapCoordinates
    tapElement = tapElement
    clickElement = clickElement

    // element commands
    getElementText = getElementText
    getElementComponents = getElementComponents

    // component commands
    getComponentProperty = getComponentProperty
    getComponentFields = getComponentFields

    constructor(opts: ClientOpts) {
        if (!opts.host) {
            opts.host = DEFAULT_ALTUNITY_HOST
        }
        if (!opts.port) {
            opts.port = DEFAULT_ALTUNITY_PORT
        }
        this.host = opts.host
        this.port = opts.port
        this.sock = null
        this.curMsgId = null
        this.responseBuffer = ''
        this.responseFinished = null
        this.log = opts.log
        this.cameraBy = AltBy.NAME
        this.cameraPath = '' // default camera path is empty
    }

    async connect() {
        await new Promise<void>((resolve, reject) => {
            try {
                this.sock = net.createConnection(
                    {host: this.host, port: this.port},
                    resolve
                )
                this.sock.on('error', reject)
                this.sock.setEncoding('utf8')
                this.sock.on('end', () => {
                    this.log.info('Server disconnected, removing socket')
                    this.sock = null
                })
            } catch (err) {
                reject(err)
            }
        })
        if (this.sock) {
            this.sock.on('data', (data: string) => this.onData(data))
        }
    }

    async disconnect() {
        this.closeConnection()
        this.sock?.destroy()
        this.sock = null
        this.curMsgId = null
        this.responseBuffer = ''
        this.responseFinished = null
    }

    onData(data: string) {
        this.log?.debug(`Received ${data.length} bytes: ${data}`);
        if (this.curMsgId === null || this.responseFinished === null) {
            this.log?.error('This data was unexpected, will throw')
            throw new Error('Received data when we were expecting none')
        }
        try {
            if (data.includes(ResponseEncoding.END)) {
                this.finishReceivingResponse(data)
                return
            }
            this.responseBuffer += data
        } catch (err: any) {
            this.responseFinished.reject(err)
        }
    }

    async sendCommand(cmdName: string, args: string[] = [], multipart: boolean = false) {
        if (this.curMsgId !== null) {
            throw new Error(`Tried to send a new command while command ${this.curMsgId} was in progress`)
        }
        try {
            this.curMsgId = Date.now()
            const reqStr = [this.curMsgId, cmdName, ...args].join(RequestEncoding.SEPARATOR) +
                           RequestEncoding.END
            this.log?.debug(`Sending command ${this.curMsgId}: ${reqStr}`);
            await this.send(reqStr)
            let res = await this.waitForResponse()
            if (multipart) {
                // if we're doing screenshot or something else that sends an initial response then
                // a second one without another command in the middle, just receive data again
                res = await this.waitForResponse()
            }
            return res.data
        } finally {
            this.curMsgId = null
        }
    }

    async waitForResponse() {
        this.responseFinished = new Deferred()
        const res = await this.responseFinished
        this.handleCommandErrors(res.data)
        if (res.log) {
            this.log?.debug(res.log)
        }
        return res
    }

    handleCommandErrors(data: string) {
        // TODO can make nice error classes later
        if (data.startsWith('error:')) {
            throw new Error(data)
        }
    }

    async send(data: string) {
        return await new Promise<void>((resolve, reject) => {
            this.sock?.write(data, (err) => {
                if (err) {
                    return reject(err)
                }
                resolve()
            })
        })
    }

    finishReceivingResponse(lastChunk: string) {
        try {
            const fullResponse = this.responseBuffer + lastChunk
            const parsedResponse = this.parseResponse(fullResponse)
            if (this.responseFinished === null) {
                throw new Error('Something went wrong, went to fulfill response finished but it didnt exist')
            }
            this.log?.debug('Finished receiving response:')
            this.log?.debug(parsedResponse)
            this.responseFinished?.resolve(parsedResponse)
        } finally {
            this.responseBuffer = ''
        }
    }

    parseResponse(data: string) {
        const partSplitter = new RegExp(
            `${ResponseEncoding.START}|${ResponseEncoding.RESPONSE}|` +
            `${ResponseEncoding.LOG}|${ResponseEncoding.END}`
        )
        const parts = data.split(partSplitter)
        if (parts.length !== 5 || parts[0] || parts[4]) {
            throw new Error(`Response was not in correct encoding. It was: ${data}`)
        }
        if (parts[1] !== this.curMsgId?.toString()) {
            throw new Error(`Got a response for message ${parts[1]} but expecting a response to ` +
                            `message ${this.curMsgId}`)
        }
        return {
            data: parts[2],
            log: parts[3]
        }
    }

}

export {
    AltUnityClient,
    AltBy,
    AltElement,
    AltKeyCode,
    Position,
    DEFAULT_ALTUNITY_HOST,
    DEFAULT_ALTUNITY_PORT,
}
