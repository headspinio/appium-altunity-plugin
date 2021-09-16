import AltUnityClient from '..';

export async function getServerVersion(this: AltUnityClient) {
    return await this.sendCommand('getServerVersion')
}

export async function closeConnection(this: AltUnityClient) {
    await this.sendCommand('closeConnection')
}
