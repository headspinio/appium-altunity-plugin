import B from 'bluebird'
import type { AltUnityClient } from '..'
import AltElement from '../alt-element'
import { AltKeyCode } from '../key-code'

const DEFAULT_TAP_COUNT = 1
const DEFAULT_TAP_INTERVAL_MS = 50

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

export async function pressKey(this: AltUnityClient, keyCode: AltKeyCode, durationMs: number,
                               power: number = 1) {
    const durationSecs = durationMs / 1000
    await this.sendCommand('pressKeyboardKey', [keyCode.toString(), power.toString(), durationSecs.toString()])
    await this.waitTillActionFinished(durationMs)
}

export type Position = {
    x: number,
    y: number
}

export type AltTapArgs = {
    pos?: Position,
    count?: number,
    intervalMs?: number,
}

export async function tapCoordinates(this: AltUnityClient, args: AltTapArgs, wait: boolean = true) {
    if (!args.pos) {
        throw new Error('Position is required for tap')
    }
    args.count ??= DEFAULT_TAP_COUNT
    args.intervalMs ??= DEFAULT_TAP_INTERVAL_MS
    const intervalSecs = args.intervalMs / 1000
    await this.sendCommand(
        'tapCoordinates',
        [JSON.stringify(args.pos), args.count.toString(), intervalSecs.toString(), wait.toString()],
        wait
    )
}

export async function tapElement(this: AltUnityClient, element: AltElement, args: AltTapArgs,
                                 wait: boolean = true, cmdName: string = 'tapElement') {
    if (cmdName === 'tapElement' && !args.count) {
        // the no-count default tap behavior is actually to call this other command for some reason
        await this.sendCommand('tapObject', [element.toJSON(), '1'])
        return
    }

    args.count ??= DEFAULT_TAP_COUNT
    args.intervalMs ??= DEFAULT_TAP_INTERVAL_MS
    const intervalSecs = args.intervalMs / 1000
    await this.sendCommand(
        cmdName,
        [element.toJSON(), args.count.toString(), intervalSecs.toString(), wait.toString()],
        wait
    )
}

export async function clickElement(this: AltUnityClient, element: AltElement, args: AltTapArgs,
                                   wait: boolean = true) {
    return await this.tapElement(element, args, wait, 'clickElement')
}
