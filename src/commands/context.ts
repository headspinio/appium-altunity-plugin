import type { NextHandler } from '../types'
import { AltUnityPlugin, UNITY_CONTEXT } from '..'

export async function getContexts(this: AltUnityPlugin, next: NextHandler) {
    let existingContexts = []
    try {
        existingContexts = await next()
    } catch (err) {
        this.logger.info(`Default behavior failed handling getContexts, ignoring`)
        this.logger.info(`Original error: ${err}`)
    }
    return [...existingContexts, UNITY_CONTEXT]
}

export async function getCurrentContext(this: AltUnityPlugin, next: NextHandler) {
    if (this.isInUnityContext) {
        return UNITY_CONTEXT
    }
    try {
        return await next()
    } catch (err) {
        this.logger.info(`Default behavior failed handling getContext, ignoring`)
        this.logger.info(`Original error: ${err}`)
        return null
    }
}

export async function setContext(this: AltUnityPlugin, next: NextHandler, name: string) {
    if (name !== UNITY_CONTEXT) {
        this.isInUnityContext = false
        try {
            return await next()
        } catch (err) {
            this.logger.info(`Default behavior failed handling setContext, ignoring`)
            this.logger.info(`Original error: ${err}`)
        }
    }
    this.isInUnityContext = true
}
