const noop = () => {}

export const emptyLogger = {
    debug: noop,
    info: noop,
    warn: noop,
    error: noop,
    log: noop,
}
