import type { Browser } from 'webdriverio'

export type Jumps = {
}

export enum Direction {
    LEFT,
    RIGHT,
}

export default class GameModel {
    driver: Browser<'async'>

    constructor(driver: Browser<'async'>) {
        this.driver = driver
    }

    async pause() {
    }

    async selectMenu(menuName: string) {
    }

    async getPlayerPosition() {
    }

    async getEnemyCount() {
    }

    async getTokenCount() {
    }

    async runWithJumps(runMs: number, jumps: Jumps, direction: Direction) {
    }
}
