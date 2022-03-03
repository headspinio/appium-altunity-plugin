import type { AltTapArgs } from './commands/actions'
import { AltUnityClient } from './index'

export type AltElementData = {
    name: string
    id: number
    x: number
    y: number
    z: number
    mobileY: number
    type: string
    enabled: boolean
    worldX: number
    worldY: number
    worldZ: number
    idCamera: number
    transformParentId: number
    transformId: number
}

// XXX sad that we have to duplicate these because we can't generate the type from this or this
// from the type :-(
export const ALT_ELEMENT_KEYS = [
    'name',
    'id',
    'x',
    'y',
    'z',
    'mobileY',
    'type',
    'enabled',
    'worldX',
    'worldY',
    'worldZ',
    'idCamera',
    'transformParentId',
    'transformId',
]

export default class AltElement {
    private data: AltElementData
    private client: AltUnityClient

    constructor(client: AltUnityClient, data: AltElementData) {
        this.client = client
        this.data = data
    }

    get name() { return this.data.name }
    get id() { return this.data.id }
    get x() { return this.data.x }
    get y() { return this.data.y }
    get z() { return this.data.z }
    get mobileY() { return this.data.mobileY }
    get type() { return this.data.type }
    get enabled() { return this.data.enabled }
    get worldX() { return this.data.worldX }
    get worldY() { return this.data.worldY }
    get worldZ() { return this.data.worldZ }
    get idCamera() { return this.data.idCamera }
    get transformParentId() { return this.data.transformParentId }
    get transformId() { return this.data.transformId }

    asUnityObject() {
        return this.data
    }

    toJSON() {
        return JSON.stringify(this.data)
    }

    toXMLNode() {
        return `<${this.name} id="${this.id}" x="${this.x}" y="${this.y}" type="${this.type}" parentId="${this.transformParentId}" transformId="${this.transformId}" />`
    }

    async getText() {
        return await this.client.getElementText(this)
    }

    async getComponents() {
        return await this.client.getElementComponents(this)
    }

    async tap(args: AltTapArgs = {}) {
        return await this.client.tapElement(this, args)
    }

    async tapViaCoords() {
        return await this.client.tapCoordinates({pos: {x: this.x, y: this.y}})
    }

    async click(args: AltTapArgs = {}) {
        return await this.client.clickElement(this, args)
    }

    async getComponentProperty(component: string, property: string, assemblyName: string, maxDepth?: number) {
        return await this.client.getComponentProperty(this, component, property, assemblyName,
                                                      maxDepth)
    }

    async setComponentProperty(component: string, property: string, assemblyName: string, value: any) {
        return await this.client.setComponentProperty(this, component, property, assemblyName, value)
    }
}

export { AltElement }
