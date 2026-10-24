import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { demoAccounts, seedDemoData } from '../src/demo-data.js'

// Deliberately targets only this project's persistent LOCAL database, never Atlas/.env.
const uri = 'mongodb://127.0.0.1:27018/ideastore_local'
let ownedMongo: MongoMemoryServer | undefined
try {
  if (process.env.NODE_ENV === 'production') throw new Error('Demo accounts are for local development only')
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 1500 })
  } catch {
    await mongoose.disconnect()
    const dbPath = fileURLToPath(new URL('../.local-data', import.meta.url))
    await mkdir(dbPath, { recursive: true })
    ownedMongo = new MongoMemoryServer({ instance: { ip: '127.0.0.1', port: 27018, dbPath, dbName: 'ideastore_local', storageEngine: 'wiredTiger' } })
    await ownedMongo.start(true)
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 })
  }
  const counts = await seedDemoData()
  console.log('Local presentation data is ready:', counts)
  console.table(demoAccounts.map(account => ({ email: account.email, password: account.password, role: account.role, status: account.active ? 'active' : 'suspended — restore in Admin' })))
  console.log('Existing records and edits are preserved. Start the app with npm.cmd run dev:local.')
} catch (error) {
  console.error('Demo setup failed:', error instanceof Error ? error.message : 'Unknown error')
  process.exitCode = 1
} finally {
  await mongoose.disconnect()
  if (ownedMongo) await ownedMongo.stop({ doCleanup: false })
}
