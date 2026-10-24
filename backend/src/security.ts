import type { RequestHandler, ErrorRequestHandler } from 'express'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import { ZodError } from 'zod'
import { config } from './config.js'
import { User, type UserDocument } from './models.js'

declare global {
  namespace Express { interface Request { user?: UserDocument } }
}
export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message) }
}
export const cookieOptions = {
  httpOnly: true, secure: config.NODE_ENV === 'production', sameSite: 'strict' as const, path: '/',
}
export const requireAuth: RequestHandler = async (req, _res, next) => {
  try {
    const token = req.cookies?.token
    if (!token) throw new HttpError(401, 'Please log in to continue')
    let payload: jwt.JwtPayload
    try {
      const decoded = jwt.verify(token, config.SECRET_KEY, { algorithms: ['HS256'] })
      if (typeof decoded === 'string') throw new Error('Invalid token')
      payload = decoded
    } catch { throw new HttpError(401, 'Your session has expired. Please log in again.') }
    if (!mongoose.isValidObjectId(payload.userId)) throw new HttpError(401, 'Invalid session')
    const user = await User.findById(payload.userId).select('+sessionVersion')
    if (!user || !user.active || (user.sessionVersion ?? 0) !== payload.version) {
      throw new HttpError(401, 'Your session is no longer active. Please log in again.')
    }
    req.user = user
    next()
  } catch (error) { next(error) }
}
export const requireAdmin: RequestHandler = (req, _res, next) => {
  if (req.user?.role !== 'admin') return next(new HttpError(403, 'Administrator access required'))
  next()
}
export function validId(value: unknown): string {
  if (typeof value !== 'string' || !/^[a-f0-9]{24}$/i.test(value)) throw new HttpError(400, 'Invalid record ID')
  return value
}
export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(400).json({ success: false, message: error.issues[0]?.message || 'Invalid input', errors: error.flatten() })
  } else if (error instanceof HttpError) {
    res.status(error.status).json({ success: false, message: error.message })
  } else if (error?.code === 11000) {
    res.status(409).json({ success: false, message: 'An account with this email already exists' })
  } else if (error?.type === 'entity.parse.failed') {
    res.status(400).json({ success: false, message: 'Invalid JSON request' })
  } else if (error?.type === 'entity.too.large') {
    res.status(413).json({ success: false, message: 'Request is too large' })
  } else {
    console.error('Request failed:', error?.name || 'UnknownError')
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' })
  }
}
