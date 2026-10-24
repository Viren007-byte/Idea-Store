import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'

// Explicit local development mode. Keep Atlas credentials and the .env file untouched.
const dbPath = fileURLToPath(new URL('../.local-data', import.meta.url))
await mkdir(dbPath, { recursive: true })
const mongo = new MongoMemoryServer({ instance: {
  ip: '127.0.0.1', port: 27018, dbPath, dbName: 'ideastore_local', storageEngine: 'wiredTiger',
} })
try {
  await mongo.start(true)
  process.env.MONGO_URI = mongo.getUri('ideastore_local')
  const { config } = await import('../src/config.js')
  if (config.NODE_ENV === 'production') throw new Error('Use a managed database for production; dev:local is a development command')
  await mongoose.connect(process.env.MONGO_URI)
  const { app } = await import('../src/app.js')
  const server = app.listen(config.PORT, () => {
    console.log(`IdeaStore local API: http://localhost:${config.PORT}`)
    console.log(`Persistent local MongoDB: mongodb://127.0.0.1:27018/ideastore_local`)
    console.log(`Local data is saved in ${dbPath}`)
  })
  let stopping = false
  async function shutdown() {
    if (stopping) return
    stopping = true
    server.close()
    await mongoose.disconnect()
    // Never clean up the user's persistent database directory.
    await mongo.stop({ doCleanup: false })
  }
  server.on('error', error => { console.error(error.message); process.exitCode = 1; void shutdown() })
  process.on('SIGINT', () => void shutdown())
  process.on('SIGTERM', () => void shutdown())
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Local development startup failed')
  await mongoose.disconnect()
  await mongo.stop({ doCleanup: false })
  process.exitCode = 1
}
