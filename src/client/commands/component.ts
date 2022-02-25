import type { AltUnityClient } from '..'
import { AltElement } from '../alt-element'
import { AltComponent } from '../alt-component'

export async function getComponentProperty(
    this: AltUnityClient, element: AltElement, component: AltComponent, property: string,
    assemblyName: string = '', maxDepth: number = 2
): Promise<string> {
    return await this.sendSimpleCommand('getObjectComponentProperty', {
        altUnityObject: element.asUnityObject(),
        component: component.name,
        property: property,
        assembly: assemblyName,
        maxDepth,
    })
}
