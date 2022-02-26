import type { RemoteOptions, Browser } from 'webdriverio'
import { remote } from 'webdriverio'
import { UNITY_CONTEXT } from '../../src'
import type { ElementReference } from '@wdio/protocols'

// assuming an Appium 2.x server with the UiAutomator2 driver installed and this plugin linked in
// Also assumes the game is installed with the appropriate package
// Also assumes port forwarding set up

const APP_PKG = 'com.DefaultCompany.AppiumWorkshop'
const APP_ACT = 'com.unity3d.player.UnityPlayerActivity'
const capabilities = {
    platformName: 'Android',
    'appium:automationName': 'UiAutomator2',
    'appium:appPackage': APP_PKG,
    'appium:appActivity': APP_ACT,
    'appium:altUnityHost': 'localhost',
    'appium:altUnityPort': 13000,
}
const WDIO_PARAMS: RemoteOptions = {
    hostname: 'localhost',
    port: 4723,
    path: '/',
    connectionRetryCount: 0,
    logLevel: 'silent',
    capabilities
}

let driver: Browser<'async'>

async function findAndValidate(strategy: string, selector: string) {
    const el = await driver.findElement(strategy, selector) as ElementReference & {error?: any}
    if (el.error) {
        throw new Error(`Element could not be found with strategy '${strategy}' and selector '${selector}'`)
    }
    return driver.$(el)
}

beforeAll(async () => {
    driver = await remote(WDIO_PARAMS)
})

test('get page source', async () => {
    const regularSource = await driver.getPageSource()
    expect(regularSource).toContain('<android.widget')
    await driver.switchContext(UNITY_CONTEXT)
    const unitySource = await driver.getPageSource()
    expect(unitySource).toContain('<Unity>')
    expect(unitySource).toContain('<Player')
})

describe('find and interact with elements', () => {
    let player: any
    const playerId = 'SuperPlayer'

    beforeAll(async () => {
        const context = await driver.getContext()
        if (context !== UNITY_CONTEXT) {
            await driver.switchContext(UNITY_CONTEXT)
        }
    })

    test('find by xpath - single', async () => {
        player = await findAndValidate('xpath', '//Player')
    })

    test('get element attribute', async () => {
        expect(await player.getAttribute('name')).toEqual('Player')
    })

    test('get element location', async () => {
        const location = await player.getLocation()
        expect(location.x).toBeGreaterThan(0)
        expect(location.y).toBeGreaterThan(0)
    })

    test('find by xpath - multiple', async () => {
        const tokens = await driver.$$('//Token')
        expect(tokens).toHaveLength(100)
    })

    test('find by id', async () => {
        player = await findAndValidate('id', playerId)
        expect(await player.getAttribute('name')).toEqual('Player')
    })

    test('find by css selector', async () => {
        player = await findAndValidate('css selector', `#${playerId}`)
        expect(await player.getAttribute('name')).toEqual('Player')
    })

    test('find by tag name', async () => {
        player = await findAndValidate('tag name', 'Player')
        expect(await player.getAttribute('name')).toEqual('Player')
    })
})

afterAll(async () => {
    if (driver) {
        await driver.deleteSession()
    }
})
