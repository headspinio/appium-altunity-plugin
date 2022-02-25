import AltUnityClient from '..';

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
