import AltUnityClient from '..';
import AltElement, { AltElementData } from '../alt-element';

export async function getServerVersion(this: AltUnityClient) {
    return await this.sendSimpleCommand('getServerVersion')
}

export async function getScreenshotAsB64(this: AltUnityClient): Promise<string> {
    return await this.sendTwoPartCommand('getPNGScreenshot')
}

export async function getScreenshotAsPNG(this: AltUnityClient): Promise<Buffer> {
    const b64Str = await this.getScreenshotAsB64()
    return Buffer.from(b64Str, 'base64')
}

export async function getCurrentScene(this: AltUnityClient): Promise<string> {
    const res = await this.sendSimpleCommand('getCurrentScene')
    return (new AltElement(this, res as AltElementData)).name
}

export async function loadScene(this: AltUnityClient, sceneName: string, loadSingle: boolean = true) {
    await this.sendTwoPartCommand('loadScene', {sceneName, loadSingle}, ['Ok', 'Scene Loaded'])
}

export async function getTimeScale(this: AltUnityClient) {
    const timeScale = await this.sendSimpleCommand('getTimeScale')
    return parseFloat(timeScale)
}

export async function setTimeScale(this: AltUnityClient, timeScale: number) {
    await this.sendSimpleCommand('setTimeScale', {timeScale: timeScale.toString()})
}
