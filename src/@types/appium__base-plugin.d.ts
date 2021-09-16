declare module '@appium/base-plugin' {

    import type { Server } from 'http'
    import type { Application } from 'express'
    import type { BaseDriver } from '@appium/base-driver'

    class BasePlugin {
        static newMethodMap: {}
        static get argsConstraints(): {}
        constructor(pluginName: string, opts?: {})
        name: string
        logger: any
        opts: {}

        static updateServer(
            expressApp: Application,
            httpServer: Server
        ): Promise<void>

        handle(
            next: () => Promise<void>,
            driver: BaseDriver,
            cmdName: string,
            ...args: any[]
        ): Promise<any>
    }

    export default BasePlugin
    export type { BasePlugin }
}
