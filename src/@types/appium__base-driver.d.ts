declare module '@appium/base-driver' {

    class BaseDriver {
        // class variables
        static baseVersion: string
        static get argsConstraints(): {}

        constructor(opts?: {}, shouldValidateCaps?: boolean)

        // fields
        sessionId: string
        opts: DriverOpts
        initialOpts: DriverOpts
        caps?: {}
        originalCaps?: {}
        helpers: DriverHelpers
        basePath: string
        relaxedSecurityEnabled: boolean
        allowInsecure: string[]
        denyInsecure: string[]
        newCommandTimeoutMs: number
        implicitWaitMs: number
        locatorStrategies: string[]
        webLocatorStrategies: string[]
        settings: DeviceSettings
        protocol?: string

        // getters/setters
        get driverData(): {}
        get isCommandsQueueEnabled(): boolean
        get eventHistory(): {}
        get desiredCapConstraints(): {}

        set desiredCapConstraints(constraints: {})

        // non-command methods
        onUnexpectedShutdown(handler: () => any): void
        logEvent(eventName: string): void
        getStatus(): Promise<{}>
        sessionExists(sessionId: string): boolean
        logExtraCaps(caps: {}): void
        validateDesiredCaps(caps: {}): boolean
        isFeatureEnabled(name: string): boolean
        ensureFeatureEnabled(name: string): void
        executeCommand(cmd: string, ...args: any[]): Promise<any>
        startUnexpectedShutdown(err?: Error): Promise<void>
        validateLocatorStrategy(strategy: string, webContext?: boolean): void
        reset(): Promise<void>
        proxyActive(): boolean
        getProxyAvoidList(): [string, RegExp][]
        canProxy(): boolean
        proxyRouteIsAvoided(sessionId: string, method: string, url: string): boolean
        addManagedDriver(driver: BaseDriver): void
        getManagedDrivers(): BaseDriver[]

        // commands
        // TODO include all from commands dir
    }

    type DriverOpts = {
        tmpDir: string
        [key: string]: any
    }

    interface DriverHelpers {
        configureApp: (
            app: string,
            supportedAppExtensions: string[]
        ) => Promise<string>
        isPackageOrBundle: (app: string) => boolean
        duplicateKeys: <T>(
            input: T,
            firstKey: string,
            secondKey: string
        ) => T
        parseCapsArray: (cap: string|string[]) => string[]
    }

    class DeviceSettings {}

    export { BaseDriver, DriverHelpers, DriverOpts }
    export default BaseDriver
}
