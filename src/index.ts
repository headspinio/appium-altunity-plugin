import { BasePlugin } from 'appium/plugin'
import type { NextHandler } from './types'
import AltUnityClient, { AltBy, AltElement, AltKeyCode } from './client';
import {
    getPageSource,
    getContexts,
    getCurrentContext,
    setContext,
    unityElementGuard,
    click,
    elementDisplayed,
    getLocation,
    getElementRect,
    getText,
    getAttribute,
    getProperty,
    UnityElement,
    findElement,
    findElements,
    _find,
    _findWithAltBy,
    performActions,
    _performKeyActions,
    _performPointerActions,
    getUrl,
    setUrl,
    execute,
    execute_getTimeScale,
    execute_setTimeScale,
    execute_setComponentProperty,
} from './commands'
import {ExternalDriver} from '@appium/types';

const EXTRA_CAPS = {
    altUnityHost: {presence: true},
    altUnityPort: {presence: true},
}

export type Size = {
    width: number,
    height: number,
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
    unityElements: {[id: string]: UnityElement} = {}
    cachedScreenDims?: Size

    getPageSource = getPageSource
    getCurrentContext = getCurrentContext
    getContexts = getContexts
    setContext = setContext
    unityElementGuard = unityElementGuard
    click = click
    elementDisplayed = elementDisplayed
    getLocation = getLocation
    getElementRect = getElementRect
    getText = getText
    getAttribute = getAttribute
    getProperty = getProperty
    findElement = findElement
    findElements = findElements
    _find = _find
    _findWithAltBy = _findWithAltBy
    performActions = performActions
    _performKeyActions = _performKeyActions
    _performPointerActions = _performPointerActions
    getUrl = getUrl
    setUrl = setUrl
    execute = execute
    execute_getTimeScale = execute_getTimeScale
    execute_setTimeScale = execute_setTimeScale
    execute_setComponentProperty = execute_setComponentProperty

    constructor(name: string) {
        super(name)
        this.client = new AltUnityClient({log: this.logger})
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

    async createSession(next: NextHandler, driver: ExternalDriver) {
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
        this.client = new AltUnityClient({host: altUnityHost, port: altUnityPort, log: this.logger})
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

    async unityContextGuard(next: NextHandler, fn: () => Promise<any>) {
        if (!this.isInUnityContext) {
            return await next()
        }
        return await fn()
    }

    async getCachedScreenDims(driver: ExternalDriver): Promise<Size> {
        if (!this.cachedScreenDims) {
            if (!driver.getWindowSize) {
                throw new Error(`Tried to get window size from driver but it doesn't support it`)
            }
            this.cachedScreenDims = await driver.getWindowSize()
        }
        return this.cachedScreenDims
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
