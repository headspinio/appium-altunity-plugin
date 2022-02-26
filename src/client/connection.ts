import { EventEmitter } from 'events'
import { truncate } from 'lodash'
import WebSocket from 'ws'
import B from 'bluebird'

B.config({
    cancellation: true
})

const TRUNCATE_LEN = 300

export enum NotificationType {
    LOAD_SCENE = 'LOAD_SCENE',
    UNLOAD_SCENE = 'UNLOAD_SCENE',
    LOG = 'LOG',
    APP_PAUSED = 'APP_PAUSED',
}

export type ResponseError = {
    type: string,
    message: string,
    trace: string,
}

export type CommandParameters = {
    [key: string]: any
}

export type BaseMessage = {
    commandName: string,
    messageId: string,
}

export type Message = CommandParameters & BaseMessage

export type Response = BaseMessage & {
    data: any,
    error: ResponseError,
    isNotification: boolean,
}

export type ConnectionOpts = {
    log: any,
    host: string,
    port: number,
    commandTimeout?: number,
}

type MessageCallbacks = {
    [messageId: string]: {
        responseCount: number,
        validations: string[],
        cb: (responses: Response[]) => void,
        timerPromise: B<void>
    }
}

export class NoConnectionError extends Error {
    constructor() {
        super(`There is no websocket connection active`)
    }
}

export class CommandTimeoutError extends Error {
    constructor(msgId: string, timeout: number) {
        super(`Message with id ${msgId} timed out after ${timeout}s`)
    }
}

export class ResponseValidationError extends Error {
    constructor(msgId: string, resIdx: number, expected: any, actual: any) {
        super(`Could not validate response for message ${msgId}, response #${resIdx + 1} in sequence: ` +
              `We expected the data to be '${expected}' but it was '${actual}'`)
    }
}

export class NotificationHandler extends EventEmitter {

    handle(message: Response) {
        const data = JSON.parse(message.data)
        let eventType: NotificationType
        let result = data

        switch (message.commandName) {
            case 'loadSceneNotification':
                eventType = NotificationType.LOAD_SCENE
                break
            case 'unloadSceneNotification':
                eventType = NotificationType.UNLOAD_SCENE
                break
            case 'logNotification':
                eventType = NotificationType.LOG
                break
            case 'applicationPausedNotification':
                eventType = NotificationType.APP_PAUSED
                result = !!data
            default:
                throw new Error(`Received a notification of type '${message.commandName}' but ` +
                                `didn't know how to handle it`)
        }

        this.emit(eventType, result)
    }
}

export class Connection {

    protected log: any
    protected host: string
    protected port: number
    protected ws: WebSocket | null = null
    protected notificationHandler = new NotificationHandler()
    protected messageCallbacks: MessageCallbacks = {}
    protected responseStore: {[messageId: string]: Response[]} = {}
    protected closeCallback: (() => void) | null = null

    private _commandTimeoutSecs = 5

    constructor(opts: ConnectionOpts) {
        this.log = opts.log
        this.host = opts.host
        this.port = opts.port
        if (opts.commandTimeout) {
            this.commandTimeout = opts.commandTimeout
        }
    }

    get commandTimeout() {
        return this._commandTimeoutSecs
    }

    set commandTimeout(secs: number) {
        this._commandTimeoutSecs = secs
    }

    async connect() {
        const wsUrl = `ws://${this.host}:${this.port}/altws/`
        this.log.info(`Initiating websocket connection to ${wsUrl}`)
        return await new Promise((res, rej) => {
            this.ws = new WebSocket(wsUrl)
            this.ws.on('message', this.handleIncomingMessage.bind(this))
            this.ws.on('close', this.handleClose.bind(this))
            this.ws.on('error', rej)
            this.ws.on('open', res)
        })
    }

    async handleIncomingMessage(jsonMessage: Buffer) {
        const response = JSON.parse(jsonMessage.toString('utf8')) as Response
        this.log.info(`Received response for message ${response.messageId}`)
        this.log.debug(truncate(JSON.stringify(response), {length: TRUNCATE_LEN}))

        if (response.isNotification) {
            this.notificationHandler.handle(response)
            return
        }

        if (!Object.keys(this.messageCallbacks).includes(response.messageId)) {
            this.log.warn(`Received message with id '${response.messageId}' when we ` +
                          `weren't expecting one, maybe it timed out?; ignoring. ` +
                          `Message data:`)
            this.log.warn(jsonMessage.toString('utf8'))
            return
        }

        const callback = this.messageCallbacks[response.messageId]

        try {
            // if anything goes wrong in here, we still want to unset the timer

            // the 'data' field is itself stringified, so turn it back
            response.data = JSON.parse(response.data)

            if (!this.responseStore[response.messageId]) {
                this.responseStore[response.messageId] = []
            }
            const store = this.responseStore[response.messageId]

            const msgProcessingIdx = store.length

            // check if we should do validations on the response for the current response in the
            // response sequences
            const expectedData = callback.validations[msgProcessingIdx]
            if (typeof expectedData !== 'undefined' && expectedData !== response.data) {
                throw new ResponseValidationError(response.messageId, msgProcessingIdx,
                                                  expectedData, response.data)
            }

            // if we've passed validation, add the response to the sequence
            store.push(response)

            // if we've reached the end of our sequence, wrap everything up and return it via the
            // callback
            if (store.length === callback.responseCount) {
                callback.cb(store)
                delete this.messageCallbacks[response.messageId]
                delete this.responseStore[response.messageId]
            }

            // otherwise do nothing and wait for the next response in the sequence
        } finally {
            // whether or not we've successfully replied, make sure to end the timer
            callback.timerPromise.cancel()
        }
    }

    async handleClose() {
        this.ws = null
        if (this.closeCallback) {
            this.closeCallback()
            this.closeCallback = null
            return
        }
        this.log.error(`Websocket connection was closed when we did not expect`)
    }

    async sendMessage(message: Message, responseCount: number = 1, validations: string[] = []): Promise<Response[]> {
        this.log.info(`Sending message ${message.messageId} with command ${message.commandName}`)
        this.log.debug(truncate(JSON.stringify(message), {length: TRUNCATE_LEN}))
        return await new Promise(async (res, rej) => {
            try {
                if (!this.ws) {
                    throw new NoConnectionError()
                }
                const jsonMessage = JSON.stringify(message)

                const timerPromise = B.delay(this._commandTimeoutSecs * 1000)

                // set a handler keyed on message id
                this.messageCallbacks[message.messageId] = {responseCount, validations, cb: res, timerPromise}

                this.ws.send(jsonMessage)

                // now wait for our command timeout
                await timerPromise

                // if we get here and the response handler has not already been removed, that means
                // we timed out, so throw an error
                if (this.messageCallbacks[message.messageId]) {
                    delete this.messageCallbacks[message.messageId]
                    throw new CommandTimeoutError(message.messageId, this._commandTimeoutSecs)
                }
            } catch (err) {
                rej(err)
            }
        })
    }

    async sendSimpleMessage(message: Message, validation?: string): Promise<Response> {
        let responses
        if (typeof validation === 'string') {
            responses = await this.sendMessage(message, 1, [validation])
        } else {
            responses = await this.sendMessage(message, 1)
        }
        return responses[0]
    }

    async close() {
        this.log.info(`Closing the websocket connection`)
        await new Promise<void>((res) => {
            if (!this.ws) {
                throw new NoConnectionError()
            }
            this.closeCallback = res
            this.ws.close()
            this.ws = null
        })
        this.log.info(`Websocket connection is now closed`)
    }
}
