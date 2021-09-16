import { AltUnityClient } from '..'
import { AltBy } from '../by'
import { getPath } from './command-helpers'
import AltElement, { AltElementData } from '../alt-element'

export type FindParams = {
    by: AltBy,
    selector: string,
    enabled?: boolean
}

export async function findObjects(this: AltUnityClient, params: FindParams): Promise<AltElement[]> {
    const selectorPath = getPath(params.by, params.selector)
    const camera = getPath(this.cameraBy, this.cameraPath)
    const res = await this.sendCommand('findObjects', [
        selectorPath,
        this.cameraBy,
        camera,
        (params.enabled ?? true).toString()
    ])
    return JSON.parse(res).map((data: {}) => new AltElement(this, data as AltElementData))
}

export async function findAllObjects(this: AltUnityClient, enabled: boolean = true) {
    return await this.findObjects({by: AltBy.PATH, selector: '//*', enabled})
}

export async function findObject(this: AltUnityClient, params: FindParams): Promise<AltElement> {
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
    return new AltElement(this, JSON.parse(res) as AltElementData)
}

export async function getCurrentScene(this: AltUnityClient): Promise<AltElement> {
    const res = await this.sendCommand('getCurrentScene')
    return new AltElement(this, JSON.parse(res) as AltElementData)
}
