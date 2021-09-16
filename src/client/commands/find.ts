import { AltUnityClient } from '..'
import { AltBy } from '../by'
import { getPath } from './command-helpers'
import AltElement from '../alt-element'

export type FindParams = {
    by: AltBy,
    selector: string,
    enabled?: boolean
}

export async function findObjects(this: AltUnityClient, params: FindParams) {
    const selectorPath = getPath(params.by, params.selector)
    const camera = getPath(this.cameraBy, this.cameraPath)
    const res = await this.sendCommand('findObjects', [
        selectorPath,
        this.cameraBy,
        camera,
        (params.enabled ?? true).toString()
    ])
    return JSON.parse(res).map((data: {}) => new AltElement(data))
}

export async function findAllObjects(this: AltUnityClient, enabled: boolean = true) {
    return await this.findObjects({by: AltBy.PATH, selector: '//*', enabled})
}

export async function findObject(this: AltUnityClient, params: FindParams) {
    const enabled = params.enabled ?? true
    let command = 'findObject'
    let path = getPath(params.by, params.selector)
    if (params.by === AltBy.NAME && enabled) {
        command = 'findActiveObjectByName'
        path = params.selector
    }
    const res = await this.sendCommand(command, [
        path,
        this.cameraBy,
        getPath(this.cameraBy, this.cameraPath),
        enabled.toString()
    ])
    return new AltElement(JSON.parse(res))
}