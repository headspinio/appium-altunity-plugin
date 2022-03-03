import AltUnityClient, { AltElement } from '.'

type AltComponentData = {
    componentName: string,
    assemblyName: string,
}

type AltComponentField = {
    name: string,
    value: string,
    type: number,
}

class AltComponent {
    private client: AltUnityClient
    private element: AltElement
    private data: AltComponentData

    constructor(client: AltUnityClient, element: AltElement, data: AltComponentData) {
        this.client = client
        this.element = element
        this.data = data
    }

    get name() { return this.data.componentName }
    get assemblyName() { return this.data.assemblyName }

    toJSON() { return JSON.stringify(this.data) }
    toObject() { return this.data }

    async getProperty(property: string, assemblyName: string, maxDepth?: number) {
        return await this.client.getComponentProperty(this.element, this, property, assemblyName,
                                                      maxDepth)
    }

    async setProperty(property: string, assemblyName: string, value: any) {
    }
}

export default AltComponent
export { AltComponent, AltComponentData, AltComponentField }
