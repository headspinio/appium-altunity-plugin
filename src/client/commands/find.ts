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
    const path = getPath(params.by, params.selector)
    const cameraPath = getPath(this.cameraBy, this.cameraPath)
    const res = await this.sendSimpleCommand('findObjects', {
        by: params.by,
        path,
        cameraBy: this.cameraBy,
        cameraPath,
        enabled: params.enabled,
    })
    return res.map((data: {}) => new AltElement(this, data as AltElementData))
}

export async function findAllObjects(this: AltUnityClient, enabled: boolean = true) {
    return await this.findObjects({by: AltBy.PATH, selector: '//*', enabled})
}

export async function findObject(this: AltUnityClient, params: FindParams): Promise<AltElement> {
    const enabled = params.enabled ?? true
    let path = getPath(params.by, params.selector)
    const res = await this.sendSimpleCommand('findObject', {
        by: params.by,
        path,
        cameraBy: this.cameraBy,
        cameraPath: getPath(this.cameraBy, this.cameraPath),
        enabled,
    })
    return new AltElement(this, res as AltElementData)
}

export async function getCurrentScene(this: AltUnityClient): Promise<AltElement> {
    const res = await this.sendSimpleCommand('getCurrentScene')
    return new AltElement(this, res as AltElementData)
}
