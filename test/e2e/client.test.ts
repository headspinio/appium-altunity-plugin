// TODO test currently assumes the test game running and port 13000 active
import { AltUnityClient, AltBy, AltElement, AltKeyCode } from '../../src'
import { emptyLogger, startTestActivity, stopTestActivity } from '../helpers'
import B from 'bluebird'
import expect from 'expect'

const log = emptyLogger
const client = new AltUnityClient({log})

describe('AltUnityClient', () => {
    before(async () => {
        await startTestActivity()
        await client.connect()
    })

    after(async () => {
        await client.disconnect()
        await stopTestActivity()
    })

    it('get the version from the server', async () => {
        expect(await client.getServerVersion()).toMatch(/^[0-9]+\.[0-9]+\.[0-9]+/)
    })

    it('find all objects', async () => {
        const objs = await client.findAllObjects()
        expect(objs.length).toBeGreaterThan(5)
    })

    it('find one object', async () => {
        const obj = await client.findObject({by: AltBy.NAME, selector: 'Player'})
        expect(obj).toBeInstanceOf(AltElement)
        expect(obj.name).toEqual('Player')
    })

    it('get screenshot', async () => {
        const b64 = await client.getScreenshotAsB64()
        expect(b64).toMatch(/^iVBOR/)
        const binary = await client.getScreenshotAsPNG()
        expect(binary).toBeInstanceOf(Buffer)
        expect(binary.length).toBeGreaterThan(1000)
    })

    it('press key down and up', async () => {
        let player = await client.findObject({by: AltBy.NAME, selector: 'Player'})
        const x1 = player.worldX
        await client.keyDown(AltKeyCode.RightArrow)
        await B.delay(500)
        await client.keyUp(AltKeyCode.RightArrow)
        player = await client.findObject({by: AltBy.NAME, selector: 'Player'})
        const x2 = player.worldX
        expect(x2).toBeGreaterThan(x1)
    })

    it('press key for duration', async () => {
        let player = await client.findObject({by: AltBy.NAME, selector: 'Player'})
        const x1 = player.worldX
        await client.pressKey(AltKeyCode.RightArrow, 500)
        player = await client.findObject({by: AltBy.NAME, selector: 'Player'})
        const x2 = player.worldX
        expect(x2).toBeGreaterThan(x1)
    })

    it('load a scene', async () => {
        await client.loadScene('SampleScene')
    })

    it('get current scene', async () => {
        const name = await client.getCurrentScene()
        expect(name).toEqual('SampleScene')
    })

    it('get the time scale', async () => {
        expect(await client.getTimeScale()).toEqual(1)
    })

    it('set the time scale', async () => {
        await client.setTimeScale(1.5)
        try {
            expect(await client.getTimeScale()).toEqual(1.5)
        } finally {
            await client.setTimeScale(1)
        }
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

    it('get element text', async () => {
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

    it('tap element', async () => {
        await withPause(async () => {
            // first assert we are on the main menu
            const menuHeader = await client.findObject({by: AltBy.PATH, selector: '//Main/Header'})
            expect(await menuHeader.getText()).toEqual('Platformer Template')

            // now find the settings button
            const els = await client.findObjects({by: AltBy.PATH, selector: '//Button/Text'})
            for (const el of els) {
                if (await el.getText() === 'Settings') {
                    await el.tapViaCoords()
                    break
                }
            }
            await B.delay(1000)

            // now assert we are on the settings menu
            const settingsHeader = await client.findObject({by: AltBy.PATH, selector: '//Settings/Header'})
            expect(await settingsHeader.getText()).toEqual('Settings')
        })
    })
})
