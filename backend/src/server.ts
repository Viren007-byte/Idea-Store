import mongoose from 'mongoose'
import { app } from './app.js'
import { config } from './config.js'

let connecting = false
async function connect() {
  if (connecting || mongoose.connection.readyState === 1) return
  connecting = true
  try {
    await mongoose.connect(config.MONGO_URI, { serverSelectionTimeoutMS: 10000 })
    console.log('MongoDB connected')
  } catch (error) {
    console.error('MongoDB unavailable:', error instanceof Error ? error.name : 'ConnectionError')
  } finally { connecting = false }
}
const server = app.listen(config.PORT, () => {
  console.log(`IdeaStore API: http://localhost:${config.PORT}`)
  void connect()
})
const retry = setInterval(() => void connect(), 30000)
retry.unref()
async function shutdown() {
  clearInterval(retry)
  server.close()
  await mongoose.disconnect()
}
process.on('SIGINT', () => void shutdown())
process.on('SIGTERM', () => void shutdown())
