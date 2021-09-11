import net from 'net'
import { Deferred } from './utils'
import {
    closeConnection,
    getServerVersion
} from './commands'

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

    protected sock: net.Socket | null
    protected curMsgId: number | null
    protected log?: any
    protected responseBuffer: string
    protected responseFinished: Deferred<AltUnityResponse> | null

    // commands
    public getServerVersion = getServerVersion
    protected closeConnection = closeConnection

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
    }

    async connect() {
        await new Promise<void>((resolve, reject) => {
            try {
                this.sock = net.createConnection(
                    {host: this.host, port: this.port},
                    resolve
                )
                this.sock.setEncoding('utf8')
                this.sock.on('data', (data: string) => this.onData(data))
            } catch (err) {
                reject(err)
            }
        })
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
        if (this.curMsgId === null || this.responseFinished === null) {
            throw new Error('Received data when we were expecting none')
        }
        try {
            this.log?.debug(`Received ${data.length} bytes: ${data}`);
            if (data.includes(ResponseEncoding.END)) {
                this.finishReceivingResponse(data)
                return
            }
            this.responseBuffer += data
        } catch (err: any) {
            this.responseFinished.reject(err)
        }
    }

    async sendCommand(cmdName: string, args: string[] = []) {
        if (this.curMsgId !== null) {
            throw new Error(`Tried to send a new command while command ${this.curMsgId} was in progress`)
        }
        this.curMsgId = Date.now()
        const reqStr = [this.curMsgId, cmdName, ...args].join(RequestEncoding.SEPARATOR) +
                       RequestEncoding.END
        this.log?.debug(`Sending command ${this.curMsgId}: ${reqStr}`);
        await this.send(reqStr)
        this.responseFinished = new Deferred()
        const res = await this.responseFinished
        this.handleCommandErrors(res.data)
        if (res.log) {
            this.log?.debug(res.log)
        }
        return res.data
    }

    async handleCommandErrors(data: string) {
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
        const fullResponse = this.responseBuffer + lastChunk
        const parsedResponse = this.parseResponse(fullResponse)
        this.responseBuffer = ''
        this.curMsgId = null
        if (this.responseFinished === null) {
            throw new Error('Something went wrong, went to fulfill response finished but it didnt exist')
        }
        this.log?.debug('Finished receiving response:')
        this.log?.debug(parsedResponse)
        this.responseFinished?.resolve(parsedResponse)
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
    DEFAULT_ALTUNITY_HOST,
    DEFAULT_ALTUNITY_PORT,
}
