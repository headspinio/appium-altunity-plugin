import { AltUnityPlugin } from '..'
import { NextHandler } from '../types'
import { BaseDriver } from '@appium/base-driver'
// for some reason tsc can't find the errors export from basedriver, but it's there
import * as bdStar from '@appium/base-driver'
const { errors } = bdStar as {[name: string]: any}


export const EXECUTE_PREFIX = 'unity:'

type ExecuteMethod = (...args: any[]) => Promise<any>

export async function execute(this: AltUnityPlugin, next: NextHandler, _: BaseDriver, script: string, args: any[]) {
    const cmdMap: {[fn: string]: ExecuteMethod} = {
        setTimeScale: this.execute_setTimeScale,
        getTimeScale: this.execute_getTimeScale,
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
