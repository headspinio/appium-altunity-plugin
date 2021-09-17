import { AltKeyCode, Position } from '../../build/client'
import { AltUnityClient, AltBy } from '../../src'
import B from 'bluebird'

export type Jump = {
    startMs: number,
    durationMs: number
}

export enum Direction {
    LEFT,
    RIGHT,
}

const GameSelectors = {
    Player: {by: AltBy.NAME, selector: 'Player'}
}

export default class GameModel {
    client: AltUnityClient
    playerDidMove: boolean = false
    startingPos?: Position | null = null

    constructor(client: AltUnityClient) {
        this.client = client
    }

    async player() {
        return await this.client.findObject(GameSelectors.Player)
    }

    async playerPosition() {
        const player = await this.player()
        return {x: player.worldX, y: player.worldY}
    }

    private async objectsNearPlayer(name: string, distance: number) {
        const playerPos = await this.playerPosition()
        const objects = await this.client.findObjects({by: AltBy.NAME, selector: name})
        return objects.filter((object) => Math.abs(object.worldX - playerPos.x) <= distance)
    }

    async getNumTokensNearPlayer(distance: number = 5) {
        return (await this.objectsNearPlayer('Token', distance)).length
    }

    async getNumEnemiesNearPlayer(distance: number = 5) {
        return (await this.objectsNearPlayer('Enemy', distance)).length
    }

    async checkPlayerDied(waitForRespawn: boolean = true) {
        if (!this.playerDidMove || !this.startingPos) {
            return false
        }
        if (waitForRespawn) {
            await B.delay(4000) // always want to wait for player to respawn
        }
        const curPos = await this.playerPosition()
        if (Math.abs(curPos.x - this.startingPos.x) < 1) {
            this.playerDidMove = false
            return true
        }
        return false
    }

    async playerRun(runMs: number, direction: Direction = Direction.RIGHT) {
        if (!this.startingPos) {
            this.startingPos = await this.playerPosition()
        }
        const key = direction === Direction.RIGHT ? AltKeyCode.RightArrow : AltKeyCode.LeftArrow
        await this.client.keyDown(key)
        await B.delay(runMs)
        await this.client.keyUp(key)
        this.playerDidMove = true
    }

    async playerRunWithJumps(runMs: number, jumps: Jump[], direction: Direction = Direction.RIGHT) {
        for (const jump of jumps) {
            if (jump.startMs + jump.durationMs > runMs) {
                throw new Error("Can't jump longer than you run")
            }
        }
        const key = direction === Direction.RIGHT ? AltKeyCode.RightArrow : AltKeyCode.LeftArrow

        const actions: {t: number, action: () => Promise<any>}[] = []
        actions.push({t: 0, action: async () => await this.client.keyDown(key)})
        actions.push({t: runMs, action: async () => await this.client.keyUp(key)})

        for (const jump of jumps) {
            const t = jump.startMs
            actions.push({t, action: async () => await this.client.keyDown(AltKeyCode.Space)})
            actions.push({
                t: t + jump.durationMs,
                action: async () => await this.client.keyUp(AltKeyCode.Space)
            })
        }

        actions.sort((a1, a2) => a1.t - a2.t)

        for (let i = 0; i < actions.length; i++) {
            if (actions[i - 1]) {
                const waitMs = actions[i].t - actions[i - 1].t
                console.log(`Going to wait ${waitMs} before next action`)
                await B.delay(waitMs)
            }
            console.log(`Running action ${i}`)
            await actions[i].action()
        }

        if (jumps.length) {
            // cool down after final jump if there was one
            await B.delay(600)
        }
    }
}
