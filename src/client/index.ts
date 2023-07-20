import {
    getServerVersion,
    findObject,
    findObjects,
    findAllObjects,
    getCurrentHierarchy,
    getHierarchy,
    getCurrentScene,
    loadScene,
    getTimeScale,
    setTimeScale,
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
    setComponentProperty,
    Position,
} from './commands'
import { AltBy } from './by'
import { AltKeyCode } from './key-code'
import { AltElement } from './alt-element'
import { Connection, CommandParameters } from './connection'
import { retryInterval } from 'asyncbox'

const DEFAULT_ALTUNITY_HOST = '127.0.0.1'
const DEFAULT_ALTUNITY_PORT = 13000

export const DEFAULT_VALIDATION_STR = 'Ok'

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
    log: any,
    commandTimeout?: number
}

export class AltUnityError extends Error {
    type: string
    trace: string

    constructor(type: string, message: string, trace: string) {
        super(message)
        this.type = type
        this.trace = trace
    }
}

export default class AltUnityClient {
    // fields
    public host: string
    public port: number
    public serverVersion?: string
    public cameraBy: AltBy
    public cameraPath: string

    protected conn: Connection
    protected log?: any

    // general commands
    getServerVersion = getServerVersion
    getScreenshotAsPNG = getScreenshotAsPNG
    getScreenshotAsB64 = getScreenshotAsB64
    getCurrentScene = getCurrentScene
    loadScene = loadScene
    getTimeScale = getTimeScale
    setTimeScale = setTimeScale

    // find commands
    findObject = findObject
    findObjects = findObjects
    findAllObjects = findAllObjects
    getCurrentHierarchy = getCurrentHierarchy
    getHierarchy = getHierarchy

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
    setComponentProperty = setComponentProperty

    constructor(opts: ClientOpts) {
        if (!opts.host) {
            opts.host = DEFAULT_ALTUNITY_HOST
        }
        if (!opts.port) {
            opts.port = DEFAULT_ALTUNITY_PORT
        }
        this.host = opts.host
        this.port = opts.port
        this.conn = new Connection({
            log: opts.log,
            port: opts.port,
            host: opts.host,
            commandTimeout: opts.commandTimeout
        })
        this.log = opts.log
        this.cameraBy = AltBy.NAME
        this.cameraPath = '' // default camera path is empty
    }

    async connect() {
        let numTries = 0
        const maxTries = 15
        await retryInterval(maxTries, 1000, async () => {
            numTries++
            this.log.info(`Attempting to connect to AltUnity server. This is attempt ${numTries}/${maxTries}`)
            try {
                await this.conn.connect()
            } catch (err: any) {
                throw new Error(`Could not connect to the AltUnity server. Original error was: ${err.message}`)
            }
        })
        this.log.info(`Connection to AltUnity server established`)
    }

    async disconnect() {
        await this.conn.close()
    }

    async _sendCommand(commandName: string, data?: CommandParameters, responseCount: number = 1, validations: string[] = []) {
        const curMsgId = Date.now()
        const message = {...data, commandName, messageId: curMsgId.toString()}
        const responses = await this.conn.sendMessage(message, responseCount, validations)

        for (const res of responses) {
            if (res.error) {
                throw new AltUnityError(res.error.type, res.error.message, res.error.trace)
            }
        }

        return responses.map((r) => r.data)
    }

    async sendSimpleCommand(commandName: string, data?: CommandParameters) {
        const datas = await this._sendCommand(commandName, data, 1)
        return datas[0]
    }

    async sendTwoPartCommand(commandName: string, data?: CommandParameters, validations: string[] = [DEFAULT_VALIDATION_STR]) {
        const datas = await this._sendCommand(commandName, data, 2, validations)
        return datas[1]
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
