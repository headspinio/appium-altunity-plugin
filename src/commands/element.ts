import { AltUnityPlugin } from '..'
import { NextHandler } from '../types'
import { util } from 'appium/support'
import { BaseDriver, errors } from 'appium/driver'
import { AltElement, Position } from '../client'
import { AltElementData, ALT_ELEMENT_KEYS } from '../client/alt-element'
import {ExternalDriver} from '@appium/types'


export const UNITY_ELEMENT_PREFIX = 'unity-element-'
export const ALL_COMPONENTS_PROP = '*'
const COMPONENT_PROPERTY_RE = /(.+):(.+)/

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
            throw new errors.NoSuchElementError(undefined)
        }
        return await fn(el)
    })
}

export async function click(this: AltUnityPlugin, next: NextHandler, driver: BaseDriver, elId: string) {
    return await this.unityElementGuard(next, elId, async (el) => await el.element.tapViaCoords())
}

export async function elementDisplayed(this: AltUnityPlugin, next: NextHandler, driver: ExternalDriver, elId: string) {
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

export async function getAttribute(this: AltUnityPlugin, next: NextHandler, _: BaseDriver, attr: string, elId: string) {
    return await this.unityElementGuard(next, elId, async (el) => {
        if (!ALT_ELEMENT_KEYS.includes(attr)) {
            throw new Error(`Cannot get '${attr}' attribute from element`)
        }
        const data = el.element.asUnityObject()
        return data[attr as keyof AltElementData]
    })
}

export async function getProperty(this: AltUnityPlugin, next: NextHandler, _: BaseDriver, prop: string, elId: string): Promise<string> {
    return await this.unityElementGuard(next, elId, async (el) => {
        // then check if it's of the form 'component:property' to return a component prop directly
        const componentMatch = COMPONENT_PROPERTY_RE.exec(prop)
        if (componentMatch) {
            const [, component, property] = componentMatch
            return JSON.stringify(await el.element.getComponentProperty(component, property, ''))
        }

        const allComponents = await el.element.getComponents()
        // otherwise if it's the magic '*', return all components
        if (prop === ALL_COMPONENTS_PROP) {
            return JSON.stringify(allComponents.map((c) => c.toObject()))
        }

        // otherwise it must be the name of a component to return
        const components = allComponents.filter((c) => c.name === prop)
        if (!components[0]) {
            throw new Error(`Element had no component named '${prop}'`)
        }
        return JSON.stringify(components[0].toObject())
    })
}
