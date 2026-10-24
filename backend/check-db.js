import dotenv from 'dotenv'
import mongoose from 'mongoose'
import { fileURLToPath } from 'node:url'

dotenv.config({ path: fileURLToPath(new URL('./.env', import.meta.url)), quiet: true })
try {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 })
    console.log('MongoDB connection successful')
} catch (error) {
    console.error('MongoDB connection failed:', error.code || error.name)
    process.exitCode = 1
} finally {
    await mongoose.disconnect()
}
