import { AltUnityPlugin } from '..'
import { NextHandler } from '../types'
import { Actions, Action, BaseDriver } from '@appium/base-driver'
import { AltKeyCode } from '../client'
import B from 'bluebird'

// for some reason tsc can't find the errors export from basedriver, but it's there
import * as bdStar from '@appium/base-driver'
const { errors } = bdStar as {[name: string]: any}
const { InvalidArgumentError } = errors

const POINTER_ACTION_TYPE = 'pointer'
const PAUSE = 'pause'
const KEYUP = 'keyUp'
const KEYDOWN = 'keyDown'

function validateActions(actions: Actions[]): Actions {
    if (actions.length > 1) {
        throw new InvalidArgumentError(`The unity plugin does not allow multiple simultaneous actions. ` +
                                       `Ensure your actions object is a single sequence`)
    }

    return actions[0]
}

function validatePointerActions(actions: Action[]) {
    throw new InvalidArgumentError(`The unity plugin does not support pointer actions yet. ` +
                                   `Use the native context for that!`)
}

function validateKeyActions(actions: Action[])  {
    for (const action of actions) {
        if (action.type === PAUSE) {
            if (typeof action.duration !== 'number') {
                throw new InvalidArgumentError(`Pause actions must have a duration integer in ms`)
            }
        } else {
            if (typeof action.value !== 'string') {
                throw new InvalidArgumentError(`Each key action must contain a value`)
            }
            const intVal = parseInt(action.value, 10)
            if (!Object.values(AltKeyCode).includes(intVal)) {
                throw new InvalidArgumentError(`Received key value '${action.value}' but it could ` +
                                               `not be mapped to a value in the AltKeyCode enum`)
            }
        }
    }
}

export async function _performKeyActions(this: AltUnityPlugin, actions: Action[]) {
    validateKeyActions(actions)
    for (const action of actions) {
        console.log(action)
        if ((action.type === KEYDOWN || action.type === KEYUP) && typeof action.value === 'string') {
            const code = parseInt(action.value, 10)
            if (action.type === KEYDOWN) {
                await this.client.keyDown(code)
            } else {
                await this.client.keyUp(code)
            }
        }
        if (action.type === PAUSE && typeof action.duration === 'number') {
            await B.delay(action.duration)
        }
    }
}

export async function _performPointerActions(this: AltUnityPlugin, actions: Action[]) {
    validatePointerActions(actions)
}

export async function performActions(this: AltUnityPlugin, next: NextHandler, _: BaseDriver, actions: Actions[]) {
    return await this.unityContextGuard(next, async () => {
        const action = validateActions(actions)
        if (action.type === POINTER_ACTION_TYPE) {
            await this._performPointerActions(action.actions)
        } else {
            await this._performKeyActions(action.actions)
        }
    })
}
