// TODO test currently assumes the TestGame.app running on mac separately
import { AltUnityClient, AltBy, AltElement, AltKeyCode } from '../../src'
import B from 'bluebird'

const client = new AltUnityClient({/*log: console*/})

beforeAll(async () => {
    await client.connect()
})

afterAll(async () => {
    await client.disconnect()
})

test('get the version from the server', async () => {
    expect(await client.getServerVersion()).toMatch(/^[0-9]+\.[0-9]+\.[0-9]+/)
})

test('find all objects', async () => {
    const objs = await client.findAllObjects()
    expect(objs.length).toBeGreaterThan(5)
})

test('find one object', async () => {
    const obj = await client.findObject({by: AltBy.NAME, selector: 'Player'})
    expect(obj).toBeInstanceOf(AltElement)
    expect(obj.name).toEqual('Player')
})

test('get screenshot', async () => {
    const b64 = await client.getScreenshotAsB64()
    expect(b64).toMatch(/^iVBOR/)
    const binary = await client.getScreenshotAsPNG()
    expect(binary).toBeInstanceOf(Buffer)
    expect(binary.length).toBeGreaterThan(1000)
})

test('press key down and up', async () => {
    let player = await client.findObject({by: AltBy.NAME, selector: 'Player'})
    const x1 = player.worldX
    await client.keyDown(AltKeyCode.RightArrow)
    await B.delay(500)
    await client.keyUp(AltKeyCode.RightArrow)
    player = await client.findObject({by: AltBy.NAME, selector: 'Player'})
    const x2 = player.worldX
    expect(x2).toBeGreaterThan(x1)
})

test('press key for duration', async () => {
    let player = await client.findObject({by: AltBy.NAME, selector: 'Player'})
    const x1 = player.worldX
    await client.pressKey(AltKeyCode.RightArrow, 500)
    player = await client.findObject({by: AltBy.NAME, selector: 'Player'})
    const x2 = player.worldX
    expect(x2).toBeGreaterThan(x1)
})

test('get current scene', async () => {
    const el = await client.getCurrentScene()
    expect(el.name).toEqual('SampleScene')
})

async function withPause<T>(fn: () => Promise<T>): Promise<T> {
    // press escape to get menu up
    await client.pressKey(AltKeyCode.Escape, 500)
    try {
        return await fn()
    } finally {
        // make sure to always dismiss menu
        await client.pressKey(AltKeyCode.Escape, 500)
    }
}

test('get element text', async () => {
    const texts = await withPause(async () => {
        const els = await client.findObjects({by: AltBy.NAME, selector: 'Text'})
        const texts = []
        for (const el of els) {
            texts.push(await el.getText())
        }
        return texts
    })
    expect(texts).toContain('Main')
    expect(texts).toContain('Settings')
})

test('tap element', async () => {
    await withPause(async () => {
        // first assert we are on the main menu
        const menuHeader = await client.findObject({by: AltBy.PATH, selector: '//Main/Header'})
        expect(await menuHeader.getText()).toEqual('Platformer Template')

        // now find the settings button
        const els = await client.findObjects({by: AltBy.PATH, selector: '//Button/Text'})
        for (const el of els) {
            if (await el.getText() === 'Settings') {
                await el.tap()
                break
            }
        }
        await B.delay(1000)

        // now assert we are on the settings menu
        const settingsHeader = await client.findObject({by: AltBy.PATH, selector: '//Settings/Header'})
        expect(await settingsHeader.getText()).toEqual('Settings')
    })
})
