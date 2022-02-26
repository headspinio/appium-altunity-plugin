import type { NextHandler } from '../types'
import type { AltUnityPlugin } from '..'
import type { HierarchyElement } from '../client/commands'
import xmljs from 'xml-js'
import { UnityElement } from './element'

type XmlJsElement = {
    type: string,
    name: string,
    attributes?: {[key: string]: any},
    elements: XmlJsElement[]
}

type XmlJs = {
    elements: XmlJsElement[]
}

function hierarchyElementToXmlJs(element: HierarchyElement): XmlJsElement {
    return {
        type: 'element',
        name: element.element.name.replace(/[^a-zA-Z0-9_\-\.]/g, '_'),
        attributes: {...element.element.asUnityObject()},
        elements: element.children.map(hierarchyElementToXmlJs)
    }
}

function hierarchyToXmlJs(hierarchy: HierarchyElement[]): XmlJs {
    return {
        elements: [{
            type: 'element',
            name: 'Unity',
            elements: hierarchy.map(hierarchyElementToXmlJs)
        }]
    }
}

export async function getPageSource(this: AltUnityPlugin, next: NextHandler) {
    return await this.unityContextGuard(next, async () => {
        const allEls = await this.client.findAllObjects()

        // pre-emptively add all the elements we find in the cache
        for (const el of allEls) {
            const unityEl = new UnityElement(el)
            this.unityElements[unityEl.id] = unityEl
        }
        const hierarchy = await this.client.getHierarchy(allEls)
        const hierarchyJs = hierarchyToXmlJs(hierarchy)
        return xmljs.js2xml(hierarchyJs, {spaces: 4})
    })
}
