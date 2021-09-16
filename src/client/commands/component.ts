import type { AltUnityClient } from '..'
import { AltElement } from '../alt-element'
import { AltComponent, AltComponentField } from '../alt-component'

export async function getComponentProperty(
    this: AltUnityClient, element: AltElement, component: AltComponent, property: string,
    assemblyName: string = '', maxDepth: number = 2
): Promise<string> {
    return await this.sendCommand('getObjectComponentProperty', [
        element.toJSON(),
        JSON.stringify({component: component.name, property, assembly: assemblyName}),
        maxDepth.toString(),
    ])
}

export async function getComponentFields(
    this: AltUnityClient, element: AltElement, component: AltComponent
): Promise<AltComponentField[]> {
    const json = await this.sendCommand('getAllFields', [
        element.id.toString(),
        JSON.stringify({componentName: component.name}),
        'ALLFIELDS'
    ])
    return JSON.parse(json) as AltComponentField[]
}
