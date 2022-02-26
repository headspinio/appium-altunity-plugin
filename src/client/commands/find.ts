import { AltUnityClient } from '..'
import { AltBy } from '../by'
import { getPath } from './command-helpers'
import AltElement, { AltElementData } from '../alt-element'

export type FindParams = {
    by: AltBy,
    selector: string,
    enabled?: boolean
}

export type HierarchyElement = {
    element: AltElement,
    children: HierarchyElement[],
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

function buildHierarchyFromElement(element: AltElement, allEls: AltElement[]): HierarchyElement {
    //console.log(`examining element ${element.id} with transformid ${element.transformId} and parent ${element.transformParentId}`)
    // find all the children of this element
    const children = allEls
        .filter((child) => child.transformParentId === element.transformId)
        .map((child) => buildHierarchyFromElement(child, allEls))
    return {
        element,
        children
    }
}

export async function getCurrentHierarchy(this: AltUnityClient): Promise<HierarchyElement[]> {
    const els = await this.findAllObjects()
    return await this.getHierarchy(els)
}

export async function getHierarchy(this: AltUnityClient, els: AltElement[]) {
    const rootEls = els.filter((e) => e.transformParentId === 0)
    return rootEls.map((e) => buildHierarchyFromElement(e, els))
}
