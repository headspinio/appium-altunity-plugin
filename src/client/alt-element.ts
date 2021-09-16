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
    parentId?: number
}

export default class AltElement {
    private data: AltElementData

    constructor(data: AltElementData) {
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
}

export { AltElement, AltElementData }
