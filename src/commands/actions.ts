import { AltUnityPlugin } from '..'
import { NextHandler } from '../types'
import { BaseDriver, errors } from 'appium/driver'
import type { ActionSequence, KeyActionSequence, PointerActionSequence } from '@appium/types'
import { AltKeyCode } from '../client'
import B from 'bluebird'

const { InvalidArgumentError } = errors

const POINTER_ACTION_TYPE = 'pointer'
const PAUSE = 'pause'
const KEYUP = 'keyUp'
const KEYDOWN = 'keyDown'

function validateActions(actions: ActionSequence[]): ActionSequence {
    if (actions.length > 1) {
        throw new InvalidArgumentError(`The unity plugin does not allow multiple simultaneous actions. ` +
                                       `Ensure your actions object is a single sequence`)
    }

    return actions[0]
}

function validatePointerActions(actions: PointerActionSequence) {
    throw new InvalidArgumentError(`The unity plugin does not support pointer actions yet. ` +
                                   `Use the native context for that!`)
}

function validateKeyActions(actions: KeyActionSequence)  {
    for (const action of actions.actions) {
        if (action.type === PAUSE) {
            if (typeof action.duration !== 'number') {
                throw new InvalidArgumentError(`Pause actions must have a duration integer in ms`)
            }
        } else {
            if (typeof action.value !== 'string') {
                throw new InvalidArgumentError(`Each key action must contain a value`)
            }
            const intVal = parseInt(action.value, 10)
            if ((intVal >= 0 && !Object.values(AltKeyCode).includes(intVal)) ||
                !Object.keys(AltKeyCode).includes(action.value)) {
                throw new InvalidArgumentError(`Received key value '${action.value}' but it could ` +
                                               `not be mapped to a value in the AltKeyCode enum`)
            }
        }
    }
}

export async function _performKeyActions(this: AltUnityPlugin, actions: ActionSequence) {
    validateKeyActions(actions as KeyActionSequence)
    for (const action of actions.actions) {
        if ((action.type === KEYDOWN || action.type === KEYUP) && typeof action.value === 'string') {
            // we either get a string number or a string non-number
            let code = parseInt(action.value, 10)
            if (isNaN(code)) {
                code = AltKeyCode[action.value as keyof typeof AltKeyCode]
            }

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

export async function _performPointerActions(this: AltUnityPlugin, actions: ActionSequence) {
    validatePointerActions(actions as PointerActionSequence)
}

export async function performActions(this: AltUnityPlugin, next: NextHandler, _: BaseDriver, actions: ActionSequence[]) {
    return await this.unityContextGuard(next, async () => {
        const action = validateActions(actions)
        if (action.type === POINTER_ACTION_TYPE) {
            await this._performPointerActions(action)
        } else {
            await this._performKeyActions(action)
        }
    })
}
