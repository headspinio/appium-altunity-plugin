import BasePlugin from '@appium/base-plugin'
import type { BaseDriver } from '@appium/base-driver';
import type { NextHandler } from './types'
import AltUnityClient, { AltBy, AltElement, AltKeyCode } from './client';
import log from './logger'

const EXTRA_CAPS = {
    altUnityHost: {presence: true},
    altUnityPort: {presence: true},
}

export const UNITY_CONTEXT = 'UNITY'

export const enum Platform {
    Mac = 'mac',
    Windows = 'windows',
    Linux = 'linux',
    iOS = 'ios',
    Android = 'android',
}

class AltUnityPlugin extends BasePlugin {

    client: AltUnityClient
    platform?: Platform
    isInUnityContext: boolean

    constructor(name: string) {
        super(name)
        this.client = new AltUnityClient({log})
        this.isInUnityContext = false
    }

    shouldAvoidProxy(method: string, route: string) {
        if (this.isInUnityContext) {
            return true
        }
        if (route.match(/\/contexts?$/)) {
            return true
        }
        return false
    }

    async createSession(next: NextHandler, driver: BaseDriver) {
        if (driver.desiredCapConstraints) {
            driver.desiredCapConstraints = {...driver.desiredCapConstraints, ...EXTRA_CAPS}
        } else {
            driver.desiredCapConstraints = EXTRA_CAPS
        }

        // run the actual driver's create session now create session is weird and returns webdriver
        // protocol response, not a raw result, so we have to handle that
        const {value, error} = await next()
        if (error) {
            throw error
        }
        const [id, caps] = value
        this.platform = this.getPlatform(caps.platformName)

        // instantiate our unity client
        const {altUnityHost, altUnityPort} = caps
        this.client = new AltUnityClient({host: altUnityHost, port: altUnityPort, log})
        await this.client.connect()

        return [id, caps]
    }

    getPlatform(platformName: string) {
        switch (platformName.toLowerCase()) {
            case 'mac': return Platform.Mac
            case 'windows': return Platform.Windows
            case 'linux': return Platform.Linux
            case 'ios': return Platform.iOS
            case 'android': return Platform.Android
            default: throw new Error(`Can't find platform for '${platformName}'`)
        }
    }

    async getContexts(next: NextHandler) {
        let existingContexts = []
        try {
            existingContexts = await next()
        } catch (err) {
            log.info(`Default behavior failed handling getContexts, ignoring`)
            log.info(`Original error: ${err}`)
        }
        return [...existingContexts, UNITY_CONTEXT]
    }

    async getCurrentContext(next: NextHandler) {
        if (this.isInUnityContext) {
            return UNITY_CONTEXT
        }
        try {
            return await next()
        } catch (err) {
            log.info(`Default behavior failed handling getContext, ignoring`)
            log.info(`Original error: ${err}`)
            return null
        }
    }

    async setContext(next: NextHandler, name: string) {
        if (name !== UNITY_CONTEXT) {
            this.isInUnityContext = false
            try {
                return await next()
            } catch (err) {
                log.info(`Default behavior failed handling setContext, ignoring`)
                log.info(`Original error: ${err}`)
            }
        }
        this.isInUnityContext = true
    }

    async getPageSource(next: NextHandler) {
        if (!this.isInUnityContext) {
            return await next()
        }
        const allElements = await this.client.findAllObjects()
        const xmlElements = allElements.map((e) => e.toXMLNode())
        return `<Unity>\n\t${xmlElements.join('\n\t')}\n</Unity>`
    }

    async deleteSession(next: NextHandler) {
        try {
            await this.client.disconnect()
        } finally {
            await next()
        }
    }
}

export {
    AltUnityPlugin,
    AltUnityClient,
    AltBy,
    AltKeyCode,
    AltElement,
}
