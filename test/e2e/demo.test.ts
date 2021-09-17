// TODO test currently assumes the TestGame.app running on mac separately
import { AltUnityClient } from '../../src'
import GameModel, { Direction } from './game-model'

const client = new AltUnityClient({/*log: console*/})
const game = new GameModel(client)

beforeAll(async () => {
    await client.connect()
})

afterAll(async () => {
    await client.disconnect()
})

test('should run and catch tokens while avoiding enemies', async () => {
    await game.playerRun(900)
    expect(await game.getNumTokensNearPlayer()).toBe(1)
    expect(await game.getNumEnemiesNearPlayer()).toBe(1)
    await game.playerRunWithJumps(1400, [{startMs: 500, durationMs: 700}])
    expect(await game.getNumTokensNearPlayer(2)).toBe(0)
    expect(await game.getNumEnemiesNearPlayer()).toBe(1)
})

test('should die when you run into an enemy', async () => {
    expect(game.playerDidMove).toBeTruthy()
    await game.playerRun(900, Direction.LEFT)
    expect(await game.checkPlayerDied()).toBeTruthy()
})
