import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import rateLimit from 'express-rate-limit'
import { config } from './config.js'
import { User, publicUser } from './models.js'
import { registerSchema, loginSchema, profileSchema } from './schemas.js'
import { cookieOptions, HttpError, requireAuth } from './security.js'

export const authRouter = Router()
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: config.NODE_ENV === 'test' ? 1000 : 30,
  standardHeaders: 'draft-7', legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again in 15 minutes.' } })
authRouter.post('/register', limiter, async (req, res) => {
  const input = registerSchema.parse(req.body)
  if (await User.exists({ email: input.email })) throw new HttpError(409, 'An account with this email already exists')
  await User.create({ ...input, password: await bcrypt.hash(input.password, 12) })
  res.status(201).json({ success: true, message: 'Account created. You can now log in.' })
})
authRouter.post('/login', limiter, async (req, res) => {
  const input = loginSchema.parse(req.body)
  const user = await User.findOne({ email: input.email }).select('+password +sessionVersion')
  if (!user || !await bcrypt.compare(input.password, user.password) || !user.active) {
    throw new HttpError(401, 'Incorrect email or password, or account unavailable')
  }
  const token = jwt.sign({ userId: user.id, version: user.sessionVersion ?? 0 }, config.SECRET_KEY,
    { expiresIn: '1d', algorithm: 'HS256' })
  res.cookie('token', token, { ...cookieOptions, maxAge: 86400000 })
    .json({ success: true, message: `Welcome back, ${user.firstName}`, user: publicUser(user) })
})
authRouter.get('/me', requireAuth, (req, res) => {
  res.json({ success: true, user: publicUser(req.user!) })
})
authRouter.patch('/profile', requireAuth, async (req, res) => {
  const input = profileSchema.parse(req.body)
  const user = await User.findByIdAndUpdate(req.user!.id, { $set: input }, { returnDocument: 'after', runValidators: true })
  res.json({ success: true, message: 'Profile updated', user: publicUser(user!) })
})
authRouter.post('/logout', requireAuth, async (req, res) => {
  await User.updateOne({ _id: req.user!.id }, { $inc: { sessionVersion: 1 } })
  res.clearCookie('token', cookieOptions).json({ success: true, message: 'Logged out on all devices' })
})
