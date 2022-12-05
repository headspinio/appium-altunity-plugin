import { AltUnityPlugin } from '..'
import { NextHandler } from '../types'
import { BaseDriver, errors } from 'appium/driver'
import { select as xpathQuery } from 'xpath'
import { DOMParser } from 'xmldom'
import { UnityElement, UNITY_ELEMENT_PREFIX } from './element'
import { AltBy } from '../client'

const VALID_STRATEGIES = [
    'xpath',
    'id',
    'css selector',
    'link text',
    'partial link text',
    'tag name',
]

export async function findElement(this: AltUnityPlugin, next: NextHandler, driver: BaseDriver, strategy: string, selector: string) {
    return await this._find(next, driver, strategy, selector, false)
}

export async function findElements(this: AltUnityPlugin, next: NextHandler, driver: BaseDriver, strategy: string, selector: string) {
    return await this._find(next, driver, strategy, selector, true)
}

export async function _findWithAltBy(this: AltUnityPlugin, by: AltBy, selector: string, contains: boolean = false): Promise<UnityElement[]> {
    const elements = await this.client.findObjects({by, selector, contains})
    return elements.map((el) => {
        const unityEl = new UnityElement(el)
        this.unityElements[unityEl.id] = unityEl
        return unityEl
    })
}

export async function _find(this: AltUnityPlugin, next: NextHandler, driver: BaseDriver, strategy: string, selector: string, multiple: boolean) {
    return await this.unityContextGuard(next, async () => {
        let els: UnityElement[] = []

        switch (strategy) {
            case 'xpath':
                const xmlStr = await this.getPageSource(next)
                const dom = new DOMParser().parseFromString(xmlStr)
                const nodes = xpathQuery(selector, dom) as Element[]
                els = nodes.map((n) => {
                    const id = getNodeAttrVal(n, 'id')
                    const elId = `${UNITY_ELEMENT_PREFIX}${id}`
                    return this.unityElements[elId]
                })
                break

            case 'id':
                els = await this._findWithAltBy(AltBy.ID, selector)
                break

            case 'css selector':
                if (selector[0] !== '#') {
                    throw new errors.InvalidArgumentError(`The only valid use of the css selector strategy is to ` +
                                                          `find and element by ID, e.g., #id`)
                }
                const id = selector.replace(/^#/, '')
                els = await this._findWithAltBy(AltBy.ID, id)
                break

            case 'link text':
                els = await this._findWithAltBy(AltBy.TEXT, selector)
                break

            case 'partial link text':
                els = await this._findWithAltBy(AltBy.TEXT, selector, true)
                break

            case 'tag name':
                els = await this._findWithAltBy(AltBy.TAG, selector)
                break

            default:
                throw new errors.InvalidArgumentError(`The Unity context does not support the '${strategy}' strategy. ` +
                                                      `Please choose one of: ${JSON.stringify(VALID_STRATEGIES)}`)

        }

        if (!multiple) {
            if (els.length < 1) {
                throw new errors.NoSuchElementError(undefined)
            }
            return els[0].asW3CElementObject
        }
        return els.map((e) => e.asW3CElementObject)
    })
}

function getNodeAttrVal (node: Element, attr: string) {
  const attrObjs = Object.values(node.attributes).filter((obj) => obj.name === attr)
  if (!attrObjs.length) {
    throw new Error(`Tried to retrieve a node attribute '${attr}' but the node didn't have it`)
  }
  return attrObjs[0].value
}
