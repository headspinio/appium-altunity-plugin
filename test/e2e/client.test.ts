// TODO test currently assumes the TestGame.app running on mac separately
import { AltUnityClient } from '../..'

describe('client connection', () => {
  const client = new AltUnityClient({log: console})
  test('connect to a running altunity server', async () => {
    await client.connect()
  })
  test('get the version from the server', async () => {
      expect(await client.getServerVersion()).toMatch(/^[0-9]+\.[0-9]+\.[0-9]+/)
  });
  test('disconnect from a server', async () => {
    await client.disconnect()
  })
})
