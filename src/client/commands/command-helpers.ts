import { AltBy } from '../by';

const ATTRIBUTE_BASED_BY = [AltBy.ID, AltBy.TAG, AltBy.LAYER, AltBy.COMPONENT, AltBy.TEXT]

export function getPath(by: AltBy, value: string, contains: boolean = false) {
    if (contains) {
        return getPathContains(by, value)
    }

    if (ATTRIBUTE_BASED_BY.includes(by)) {
        return `//*[@${by.toString().toLowerCase()}=${value}]`
    }

    if (by === AltBy.NAME) {
        return `//${value}`
    }

    return value
}

export function getPathContains(by: AltBy, value: string) {
    if (by === AltBy.PATH) {
        return value
    }

    return `//*[contains(@${by.toString().toLowerCase()},${value})]`
}
