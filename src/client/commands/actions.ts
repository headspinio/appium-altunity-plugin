import B from 'bluebird'
import type { AltUnityClient } from '..'
import { AltKeyCode } from '../key-code'

export async function keyDown(this: AltUnityClient, keyCode: AltKeyCode, power: number = 1) {
    return await this.sendCommand('keyDown', [keyCode.toString(), power.toString()])
}

export async function keyUp(this: AltUnityClient, keyCode: AltKeyCode) {
    return await this.sendCommand('keyUp', [keyCode.toString()])
}

export async function isActionFinished(this: AltUnityClient) {
    const res = await this.sendCommand('actionFinished')
    return res === 'Yes'
}

export async function waitTillActionFinished(this: AltUnityClient, durationMsHint: number) {
    await B.delay(durationMsHint)
    const interval = 300
    while (!await this.isActionFinished()) {
        await B.delay(interval)
    }
}

export async function pressKey(this: AltUnityClient, keyCode: AltKeyCode, durationMs: number, power: number = 1) {
    await this.sendCommand('pressKeyboardKey', [keyCode.toString(), power.toString(), durationMs.toString()])
    await B.delay(durationMs)
}
