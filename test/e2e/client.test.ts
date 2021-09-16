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
    const x1 = player.x
    await client.keyDown(AltKeyCode.RightArrow)
    await B.delay(500)
    await client.keyUp(AltKeyCode.RightArrow)
    player = await client.findObject({by: AltBy.NAME, selector: 'Player'})
    const x2 = player.x
    expect(x2).toBeGreaterThan(x1)
})

test('press key for duration', async () => {
    let player = await client.findObject({by: AltBy.NAME, selector: 'Player'})
    const x1 = player.x
    await client.pressKey(AltKeyCode.RightArrow, 500)
    player = await client.findObject({by: AltBy.NAME, selector: 'Player'})
    const x2 = player.x
    expect(x2).toBeGreaterThan(x1)
})
