import { downloadTestApp } from './helpers'

downloadTestApp().catch((err) => {
    console.error(err)
    process.exit(1)
})
