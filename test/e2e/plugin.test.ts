import type { RemoteOptions, Browser } from 'webdriverio'
import { remote } from 'webdriverio'
import { UNITY_CONTEXT } from '../../src'
import GameModel from './game-model'

// assuming an Appium 2.x server with the Mac2 driver installed and this plugin linked in

const GAME_ID = 'com.unity.template.platformer'
const capabilities = {
    platformName: 'Mac',
    'appium:automationName': 'Mac2',
    'appium:bundleId': GAME_ID,
    'appium:noReset': true,
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

let game: GameModel
let driver: Browser<'async'>

beforeAll(async () => {
    driver = await remote(WDIO_PARAMS)
    game = new GameModel(driver)
})

test('get page source', async () => {
    const regularSource = await driver.getPageSource()
    expect(regularSource).toContain('<XCUIElement')
    await driver.switchContext(UNITY_CONTEXT)
    const unitySource = await driver.getPageSource()
    expect(unitySource).toContain('<Unity>')
})

afterAll(async () => {
    await driver.deleteSession()
})
