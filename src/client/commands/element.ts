import type { AltUnityClient } from '..'
import { AltElement } from '../alt-element'
import { AltComponent, AltComponentData } from '../alt-component'

export async function getElementText(this: AltUnityClient, element: AltElement) {
    return await this.sendCommand('getText', [element.toJSON()])
}

export async function getElementComponents(this: AltUnityClient, element: AltElement): Promise<AltComponent[]> {
    const res = await this.sendCommand('getAllComponents', [element.id.toString()])
    const data = JSON.parse(res) as AltComponentData[]
    return data.map((d) => new AltComponent(this, element, d))
}

export async function getElementProperty(this: AltUnityClient, element: AltElement,
                                         component: AltComponent, property: string,
                                         assemblyName: string = '', maxDepth: number = 2) {
    return await this.sendCommand('getObjectComponentProperty', [
        element.toJSON(),
        JSON.stringify({component: component.name, property, assembly: assemblyName}),
        maxDepth.toString(),
    ])
}

