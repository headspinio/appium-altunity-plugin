import { AltUnityPlugin } from '..'
import { NextHandler } from '../types'
import { BaseDriver } from 'appium/driver'

export async function getUrl(this: AltUnityPlugin, next: NextHandler, _: BaseDriver) {
    return await this.unityContextGuard(next, async () => {
        const curScene = await this.client.getCurrentScene()
        return `unity://${curScene}`
    })
}

export async function setUrl(this: AltUnityPlugin, next: NextHandler, _: BaseDriver, url: string) {
    return await this.unityContextGuard(next, async () => {
        const sceneName = url.replace(/^.+:\/\//, '')
        await this.client.loadScene(sceneName)
    })
}
