import path from 'path'
import fs from 'fs'
import { mkdir, access } from 'fs/promises'
import util from 'util'
import { exec } from 'child_process'


const execPromise = util.promisify(exec)
const noop = () => {}
const TEST_APK_URL = 'https://github.com/projectxyzio/appium-altunity-plugin/releases/download/testapp-1/io.appium.unitysample.apk'
const TEST_DIR = path.resolve(__dirname, 'fixtures')
export const TEST_APK = path.resolve(TEST_DIR, 'io.appium.unitysample.apk')
export const TEST_PKG = 'io.appium.unitysample'
export const TEST_ACT = 'com.unity3d.player.UnityPlayerActivity'

export const emptyLogger = {
    debug: noop,
    info: noop,
    warn: noop,
    error: noop,
    log: noop,
}

export async function downloadTestApp() {
    console.log(`Checking if test apk already exists`)
    try {
        await access(TEST_APK, fs.constants.R_OK)
        console.log(`Test apk exists!`)
        return
    } catch (ign) {}

    console.log(`Test app doesn't exist. Creating fixtures dir`)
    await mkdir(TEST_DIR, {recursive: true})

    console.log(`Running curl to download test apk`)
    await execPromise(`curl -L ${TEST_APK_URL} -o ${TEST_APK}`)

    console.log(`Test apk downloaded`)
}

export async function startTestActivity() {
    await execPromise(`adb shell am start -W -n ${TEST_PKG}/${TEST_ACT} -S`)
}

export async function stopTestActivity() {
    await execPromise(`adb shell am force-stop ${TEST_PKG}`)
}
