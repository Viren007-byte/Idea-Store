import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'

dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)), quiet: true })
const env = z.object({
  MONGO_URI: z.string().min(1),
  SECRET_KEY: z.string().min(8),
  PORT: z.coerce.number().int().min(1).max(65535).default(8000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  FRONTEND_URL: z.string().default('http://localhost:5173,http://127.0.0.1:5173'),
}).parse(process.env)
if (env.NODE_ENV === 'production' && env.SECRET_KEY.length < 32) {
  throw new Error('Production SECRET_KEY must contain at least 32 characters')
}
export const config = { ...env, origins: env.FRONTEND_URL.split(',').map(value => value.trim().replace(/\/$/, '')) }
