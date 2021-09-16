import BasePlugin from '@appium/base-plugin'
import type { BaseDriver } from '@appium/base-driver';
import type { NextHandler } from './types'
import AltUnityClient, { AltBy, AltElement } from './client';

class AltUnityPlugin extends BasePlugin {

    client?: AltUnityClient

    async createSession(next: NextHandler, driver: BaseDriver) {
        const newSessionResponse = await next()
        const {altUnityHost, altUnityPort} = driver.opts
        this.client = new AltUnityClient({host: altUnityHost, port: altUnityPort, log: this.logger})
        await this.client.connect()
        return newSessionResponse
    }

    async deleteSession(next: NextHandler) {
        try {
            await this.client?.disconnect()
        } finally {
            await next()
        }
    }
}

export {
    AltUnityPlugin,
    AltUnityClient,
    AltBy,
    AltElement,
}
