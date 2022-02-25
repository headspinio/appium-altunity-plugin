import type { AltTapArgs } from './commands/actions'
import { AltUnityClient } from './index'

type AltElementData = {
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
        return `<${this.name} id="${this.id}" x="${this.x}" y="${this.y}", type="${this.type}" />`
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
}

export { AltElement, AltElementData }
