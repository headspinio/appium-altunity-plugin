import type { RemoteOptions, Browser } from 'webdriverio'
import { remote, Element } from 'webdriverio'
import { AltKeyCode, UNITY_CONTEXT } from '../../src'
import type { ElementReference } from '@wdio/protocols'
import { TEST_APK } from '../helpers'
import { AltComponentData } from '../../src/client/alt-component'
import { SetPropertyArgs } from '../../src/commands'
import expect from 'expect'

// assuming an Appium 2.x server with the UiAutomator2 driver installed and this plugin linked in
// also assumes port forwarding set up

const capabilities = {
    platformName: 'Android',
    'appium:automationName': 'UiAutomator2',
    'appium:app': TEST_APK,
    'appium:altUnityHost': '127.0.0.1',
    'appium:altUnityPort': 13000,
}
const WDIO_PARAMS: RemoteOptions = {
    hostname: '127.0.0.1',
    port: 4723,
    path: '/',
    connectionRetryCount: 0,
    logLevel: 'silent',
    capabilities
}
const PLAYER_ID = 'SuperPlayer'

let driver: Browser<'async'>

async function findAndValidate(strategy: string, selector: string) {
    const el = await driver.findElement(strategy, selector) as ElementReference & {error?: any}
    if (el.error) {
        throw new Error(`Element could not be found with strategy '${strategy}' and selector '${selector}'`)
    }
    return driver.$(el)
}

async function withPause<T>(fn: () => Promise<T>): Promise<T> {
    // press escape to get menu up
    await pressKey(AltKeyCode.Escape.toString(), 500)
    try {
        return await fn()
    } finally {
        // make sure to always dismiss menu
        await pressKey(AltKeyCode.Escape.toString(), 500)
    }
}

async function pressKey(key: string, duration: number) {
    const press = {
        type: 'key',
        id: 'keyboard',
        actions: [
            {type: 'keyDown', value: key},
            {type: 'pause', duration: duration},
            {type: 'keyUp', value: key},
        ]
    }
    await driver.performActions([press])
}

describe('AltUnityPlugin', () => {

    before(async () => {
        driver = await remote(WDIO_PARAMS)
    })

    describe('general', () => {

        it('get page source', async () => {
            const regularSource = await driver.getPageSource()
            expect(regularSource).toContain('<android.widget')
            await driver.switchContext(UNITY_CONTEXT)
            const unitySource = await driver.getPageSource()
            expect(unitySource).toContain('<Unity>')
            expect(unitySource).toContain('<Player')
        })

        it('load a scene via url', async () => {
            await driver.navigateTo('unity://SampleScene')
        })

        it('get the current scene as url', async () => {
            expect(await driver.getUrl()).toEqual('unity://SampleScene')
        })
    })

    describe('find and interact with elements', () => {
        let player: Element<'async'>

        before(async () => {
            const context = await driver.getContext()
            if (context !== UNITY_CONTEXT) {
                await driver.switchContext(UNITY_CONTEXT)
            }
        })

        it('find by xpath - single', async () => {
            player = await findAndValidate('xpath', '//Player')
        })

        it('get element attribute', async () => {
            expect(await player.getAttribute('name')).toEqual('Player')
        })

        it('get element property - comp:prop', async () => {
            player = await findAndValidate('xpath', '//Player')
            const propName = 'UnityEngine.BoxCollider2D:bounds'
            const prop = JSON.parse(await player.getProperty(propName) as string) as {[key: string]: any}
            expect(prop.size.x).toBeGreaterThan(0)
            expect(prop.size.y).toBeGreaterThan(0)
        })

        it('get element property - all components', async () => {
            const all = JSON.parse(await player.getProperty('*') as string) as AltComponentData[]
            expect(all).toHaveLength(9)
            const rigidBody = all.filter((c) => c.componentName.includes('AltUnityTester'))[0]
            expect(rigidBody.assemblyName).toEqual('Assembly-CSharp')
        })

        it('get element property - one component', async () => {
            const prop = JSON.parse(await player.getProperty('UnityEngine.Rigidbody2D') as string) as AltComponentData
            expect(prop.assemblyName).toEqual('UnityEngine.Physics2DModule')
        })

        it('get element displayed', async () => {
            expect(await player.isDisplayed()).toBeTruthy()
        })

        it('get element location', async () => {
            const location = await player.getLocation()
            expect(location.x).toBeGreaterThan(0)
            expect(location.y).toBeGreaterThan(0)
        })

        it('get element rect', async () => {
            const {x, y} = await player.getLocation()
            const {width, height} = await player.getSize()
            expect(x).toBeGreaterThan(10)
            expect(y).toBeGreaterThan(10)
            expect(width).toEqual(0)
            expect(height).toEqual(0)
        })

        // TODO get text from an element that actually has text too
        it('get element text - no text', async () => {
            expect(await player.getText()).toEqual(null)
        })

        it('find by xpath - multiple', async () => {
            const tokens = await driver.$$('//Token')
            expect(tokens).toHaveLength(100)
        })

        it('find by id', async () => {
            player = await findAndValidate('id', PLAYER_ID)
            expect(await player.getAttribute('name')).toEqual('Player')
        })

        it('find by css selector', async () => {
            player = await findAndValidate('css selector', `#${PLAYER_ID}`)
            expect(await player.getAttribute('name')).toEqual('Player')
        })

        it('find by tag name', async () => {
            player = await findAndValidate('tag name', 'Player')
            expect(await player.getAttribute('name')).toEqual('Player')
        })

        it('find by link text', async () => {
            const text = await withPause(async () => {
                const main = await findAndValidate('link text', 'Main')
                return await main.getText()
            })
            expect(text).toEqual('Main')
        })

        it('find by partial link text', async () => {
            const text = await withPause(async () => {
                const main = await findAndValidate('partial link text', 'Mai')
                return await main.getText()
            })
            expect(text).toEqual('Main')
        })

        it('set element component property', async () => {
            async function getMaxHP() {
                return JSON.parse(await player.getProperty('Platformer.Mechanics.Health:maxHP') as string)
            }
            async function setMaxHP(hp: number) {
                const args: SetPropertyArgs = {
                    elementId: player.elementId,
                    component: 'Platformer.Mechanics.Health',
                    property: 'maxHP',
                    value: hp,
                }
                await player.executeScript('unity: setProperty', [args])
            }
            const newMaxHP = 3
            const origMaxHP = await getMaxHP()
            expect(origMaxHP).not.toEqual(newMaxHP)
            await setMaxHP(newMaxHP)
            try {
                expect(await getMaxHP()).toEqual(newMaxHP)
            } finally {
                await setMaxHP(origMaxHP)
            }
        })

    })

    describe('key actions', () => {
        const pressRight = {
            type: 'key',
            id: 'keyboard',
            actions: [
                {type: 'keyDown', value: 'RightArrow'},
                {type: 'pause', duration: 750},
                {type: 'keyUp', value: AltKeyCode.RightArrow.toString()},
            ]
        }

        it('press a key', async () => {
            let player = await findAndValidate('id', PLAYER_ID)
            const initX = parseInt(await player.getAttribute('worldX'), 10)

            // open the menu
            await driver.performActions([pressRight])

            // now assert the menu is open
            player = await findAndValidate('id', PLAYER_ID)
            const newX = await player.getAttribute('worldX')

            expect(newX).toBeGreaterThan(initX)
        })
    })

    describe('execute unity methods', () => {
        it('get the time scale', async () => {
            expect(await driver.executeScript('unity: getTimeScale', [])).toEqual(1)
        })

        it('set the time scale', async () => {
            await driver.executeScript('unity: setTimeScale', [1.5])
            try {
                expect(await driver.executeScript('unity: getTimeScale', [])).toEqual(1.5)
            } finally {
                await driver.executeScript('unity: setTimeScale', [1])
            }
        })
    })

    after(async () => {
        if (driver) {
            await driver.deleteSession()
        }
    })
})
