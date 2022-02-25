import B from 'bluebird'
import { AltUnityClient, DEFAULT_VALIDATION_STR } from '..'
import AltElement from '../alt-element'
import { CommandParameters } from '../connection'
import { AltKeyCode } from '../key-code'

const DEFAULT_TAP_COUNT = 1
const DEFAULT_TAP_INTERVAL_MS = 250
const WAIT_VALIDATIONS = [DEFAULT_VALIDATION_STR, 'Finished']

export type Position = {
    x: number,
    y: number
}

export type AltTapArgs = {
    pos?: Position,
    count?: number,
    intervalMs?: number,
}

export async function keyDown(this: AltUnityClient, keyCode: AltKeyCode, power: number = 1) {
    return await this.sendSimpleCommand('keyDown', {keyCode, power})
}

export async function keyUp(this: AltUnityClient, keyCode: AltKeyCode) {
    return await this.sendSimpleCommand('keyUp', {keyCode})
}

export async function isActionFinished(this: AltUnityClient) {
    const res = await this.sendSimpleCommand('actionFinished')
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
    await this.sendTwoPartCommand('pressKeyboardKey', {
        keyCode,
        power,
        duration: durationSecs,
        wait: true,
    }, WAIT_VALIDATIONS)
}

function getTapData(args: AltTapArgs, wait: boolean, element?: AltElement) {
    args.count ??= DEFAULT_TAP_COUNT
    args.intervalMs ??= DEFAULT_TAP_INTERVAL_MS
    const intervalSecs = args.intervalMs / 1000
    const data: CommandParameters = {
        coordinates: args.pos,
        count: args.count,
        interval: intervalSecs,
        wait,
    }
    if (element) {
        data.altUnityObject = element.asUnityObject()
    }
    return data
}

export async function tapCoordinates(this: AltUnityClient, args: AltTapArgs, wait: boolean = true) {
    if (!args.pos) {
        throw new Error('Position is required for tap')
    }
    const data = getTapData(args, wait)
    if (wait) {
        return await this.sendTwoPartCommand('tapCoordinates', data, WAIT_VALIDATIONS)
    }
    return await this.sendSimpleCommand('tapCoordinates', data)
}

export async function tapElement(this: AltUnityClient, element: AltElement, args: AltTapArgs,
                                 wait: boolean = true, cmdName: string = 'tapElement') {
    const data = getTapData(args, wait, element)
    if (wait) {
        return await this.sendTwoPartCommand(cmdName, data, WAIT_VALIDATIONS)
    }
    return await this.sendSimpleCommand(cmdName, data)
}

export async function clickElement(this: AltUnityClient, element: AltElement, args: AltTapArgs,
                                   wait: boolean = true) {
    return await this.tapElement(element, args, wait, 'clickElement')
}
