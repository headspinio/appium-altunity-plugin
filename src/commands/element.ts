import { AltUnityPlugin } from '..'
import { NextHandler } from '../types'
import { util } from '@appium/support'
import { BaseDriver } from '@appium/base-driver'

// for some reason tsc can't find the errors export from basedriver, but it's there
import * as bdStar from '@appium/base-driver'
import { AltElement, Position } from '../client'
import { AltElementData } from '../client/alt-element'
const { errors } = bdStar as {[name: string]: any}


export const UNITY_ELEMENT_PREFIX = 'unity-element-'

export class UnityElement {

    element: AltElement
    id: string

    constructor(element: AltElement) {
        this.element = element
        this.id = `${UNITY_ELEMENT_PREFIX}${element.id}`
    }

    get location(): Position {
        return { x: this.element.x, y: this.element.y }
    }

    get asW3CElementObject() {
        return {[util.W3C_WEB_ELEMENT_IDENTIFIER]: this.id}
    }
}

export async function unityElementGuard(this: AltUnityPlugin, next: NextHandler, elId: string,
                                      fn: (el: UnityElement) => Promise<any>) {
    return await this.unityContextGuard(next, async () => {
        const el = this.unityElements[elId]
        if (!el) {
            throw new errors.NoSuchElementError()
        }
        return await fn(el)
    })
}

export async function click(this: AltUnityPlugin, next: NextHandler, driver: BaseDriver, elId: string) {
    return await this.unityElementGuard(next, elId, async (el) => await el.element.tapViaCoords())
}

export async function elementDisplayed(this: AltUnityPlugin, next: NextHandler, driver: BaseDriver, elId: string) {
    return await this.unityElementGuard(next, elId, async (el) => {
        const {width, height} = await this.getCachedScreenDims(driver)
        const {x, y} = el.element.asUnityObject()
        return x >= 0 && x <= width && y >= 0 && y <= height
    })
}

export async function getLocation(this: AltUnityPlugin, next: NextHandler, _: BaseDriver, elId: string) {
    return await this.unityElementGuard(next, elId, async (el) => el.location)
}

export async function getElementRect(this: AltUnityPlugin, next: NextHandler, _: BaseDriver, elId: string) {
    // just report 0 for width and height since we don't know them
    return await this.unityElementGuard(next, elId, async (el) => ({...el.location, width: 0, height: 0}))
}

export async function getText(this: AltUnityPlugin, next: NextHandler, _: BaseDriver, elId: string) {
    return await this.unityElementGuard(next, elId, async (el) => {
        try {
            return await el.element.getText()
        } catch (err: any) {
            if ((err as Error).message.includes('Component TMP_InputField')) {
                return null
            }
            throw err
        }
    })
}

export async function getAttribute(this: AltUnityPlugin, next: NextHandler, _: BaseDriver, attr: keyof AltElementData, elId: string) {
    return await this.unityElementGuard(next, elId, async (el) => {
        const data = el.element.asUnityObject()
        return data[attr]
    })
}
