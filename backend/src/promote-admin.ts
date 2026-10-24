import mongoose from 'mongoose'
import { z } from 'zod'
import { config } from './config.js'
import { User } from './models.js'

const email = z.string().email().parse(process.argv[2]).toLowerCase()
try {
  await mongoose.connect(config.MONGO_URI, { serverSelectionTimeoutMS: 10000 })
  const user = await User.findOneAndUpdate({ email }, { $set: { role: 'admin', active: true } }, { returnDocument: 'after' })
  if (!user) throw new Error('Register this email in the app first')
  console.log(`Administrator enabled for ${user.email}`)
} catch (error) {
  console.error(error instanceof Error ? error.message.replace(/mongodb[^\s]*/g, '[connection]') : 'Unable to promote user')
  process.exitCode = 1
} finally { await mongoose.disconnect() }
