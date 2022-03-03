import type { AltUnityClient } from '..'
import { AltElement } from '../alt-element'
import { AltComponent } from '../alt-component'

export async function getComponentProperty(
    this: AltUnityClient, element: AltElement, component: AltComponent | string, property: string,
    assemblyName: string, maxDepth: number = 2
): Promise<string> {
    const componentName = typeof component === 'string' ? component : component.name
    return await this.sendSimpleCommand('getObjectComponentProperty', {
        altUnityObject: element.asUnityObject(),
        component: componentName,
        property: property,
        assembly: assemblyName,
        maxDepth,
    })
}

export async function setComponentProperty(
    this: AltUnityClient, element: AltElement, component: AltComponent | string, property: string,
    assemblyName: string, value: any
) {
    const componentName = typeof component === 'string' ? component : component.name
    return await this.sendSimpleCommand('setObjectComponentProperty', {
        altUnityObject: element.asUnityObject(),
        component: componentName,
        property: property,
        assembly: assemblyName,
        value: JSON.stringify(value),
    })
}

