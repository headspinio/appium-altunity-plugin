import { AltUnityPlugin } from '..'
import { NextHandler } from '../types'
import { BaseDriver, errors } from 'appium/driver'


export const EXECUTE_PREFIX = 'unity:'

type ExecuteMethod = (...args: any[]) => Promise<any>
export type SetPropertyArgs = {
    elementId: string,
    component: string,
    property: string,
    value: any,
}

export async function execute(this: AltUnityPlugin, next: NextHandler, _: BaseDriver, script: string, args: any[]) {
    const cmdMap: {[fn: string]: ExecuteMethod} = {
        setTimeScale: this.execute_setTimeScale,
        getTimeScale: this.execute_getTimeScale,
        setProperty: this.execute_setComponentProperty,
    }
    return await this.unityContextGuard(next, async () => {
        const command = script.replace(new RegExp(`^${EXECUTE_PREFIX} ?`), '')
        if (!Object.keys(cmdMap).includes(command)) {
            throw new errors.InvalidArgumentError(`There is no '${EXECUTE_PREFIX}${command}' command`)
        }
        return await cmdMap[command].bind(this)(...args)
    })
}

export async function execute_getTimeScale(this: AltUnityPlugin) {
    return await this.client.getTimeScale()
}

export async function execute_setTimeScale(this: AltUnityPlugin, timeScale: number) {
    await this.client.setTimeScale(timeScale)
}

export async function execute_setComponentProperty(this: AltUnityPlugin, args: SetPropertyArgs) {
    const next = async () => {
        throw new Error(`Cannot call set component property without valid element id`)
    }
    return await this.unityElementGuard(next, args.elementId, async (el) => {
        return await el.element.setComponentProperty(
            args.component,
            args.property,
            '',
            args.value,
        )
    })
}
