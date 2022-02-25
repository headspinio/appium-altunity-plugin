// TODO test currently assumes the TestGame.app running on mac separately
import { AltUnityClient, AltBy, AltElement, AltKeyCode } from '.'
import B from 'bluebird'

const client = new AltUnityClient({log: console})

async function main() {
    await client.connect()
    try {
        console.log(await client.findAllObjects())
    } finally {
        await client.disconnect()
    }
}

main().catch(console.error.bind(console))
