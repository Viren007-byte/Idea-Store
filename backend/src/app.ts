import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import mongoose from 'mongoose'
import { config } from './config.js'
import { authRouter } from './auth.js'
import { ideaRouter } from './ideas.js'
import { adminRouter } from './admin.js'
import { errorHandler, HttpError } from './security.js'

export const app = express()
app.disable('x-powered-by')
app.use(helmet())
app.use(cors({ origin: config.origins, credentials: true }))
app.use(express.json({ limit: '64kb' }))
app.use(cookieParser())
app.use('/api', rateLimit({ windowMs: 60000, limit: config.NODE_ENV === 'test' ? 5000 : 300, standardHeaders: 'draft-7', legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please wait a minute.' } }))
app.get('/api/health', (_req, res) => {
  const connected = mongoose.connection.readyState === 1
  res.status(connected ? 200 : 503).json({ status: connected ? 'ok' : 'degraded', database: connected ? 'connected' : 'disconnected' })
})
app.use('/api', (req, _res, next) => {
  if (mongoose.connection.readyState !== 1) return next(new HttpError(503, 'Database unavailable. Please try again later.'))
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    const origin = req.get('origin')
    if ((origin && !config.origins.includes(origin)) || req.get('sec-fetch-site') === 'cross-site') {
      return next(new HttpError(403, 'Request origin is not allowed'))
    }
  }
  next()
})
app.use('/api/v1/user', authRouter)
app.use('/api/v1/ideas', ideaRouter)
app.use('/api/v1/admin', adminRouter)
app.use((_req, _res, next) => next(new HttpError(404, 'Endpoint not found')))
app.use(errorHandler)
