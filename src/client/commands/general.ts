import AltUnityClient from '..';

export async function getServerVersion(this: AltUnityClient) {
    return await this.sendCommand('getServerVersion')
}

export async function closeConnection(this: AltUnityClient) {
    await this.sendCommand('closeConnection')
}

export async function getScreenshotAsB64(this: AltUnityClient): Promise<string> {
    return await this.sendCommand('getPNGScreenshot', [], true)
}

export async function getScreenshotAsPNG(this: AltUnityClient): Promise<Buffer> {
    const b64Str = await this.getScreenshotAsB64()
    return Buffer.from(b64Str, 'base64')
}
