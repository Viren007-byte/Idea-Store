import { Router } from 'express'
import mongoose from 'mongoose'
import { z } from 'zod'
import { Comment, Idea, User, publicUser } from './models.js'
import { pageSchema } from './schemas.js'
import { escapeRegex } from './ideas.js'
import { HttpError, requireAdmin, requireAuth, validId } from './security.js'

export const adminRouter = Router()
adminRouter.use(requireAuth, requireAdmin)
adminRouter.get('/stats', async (_req, res) => {
  const [users, activeUsers, ideas, publicIdeas, comments] = await Promise.all([
    User.countDocuments(), User.countDocuments({ active: true }), Idea.countDocuments(),
    Idea.countDocuments({ visibility: 'public' }), Comment.countDocuments(),
  ])
  res.json({ success: true, stats: { users, activeUsers, ideas, publicIdeas, comments, database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' } })
})
adminRouter.get('/users', async (req, res) => {
  const { page, limit, q } = pageSchema.parse(req.query)
  const filter = q ? { $or: ['email', 'firstName', 'lastName'].map(key => ({ [key]: new RegExp(escapeRegex(q), 'i') })) } : {}
  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit), User.countDocuments(filter),
  ])
  res.json({ success: true, users: users.map(publicUser), total, page, pages: Math.ceil(total / limit) })
})
adminRouter.patch('/users/:id', async (req, res) => {
  const id = validId(req.params.id)
  const input = z.object({ active: z.boolean() }).strict().parse(req.body)
  const target = await User.findById(id)
  if (!target) throw new HttpError(404, 'User not found')
  if (target.role === 'admin') throw new HttpError(403, 'Administrator accounts cannot be suspended here')
  target.active = input.active
  await target.save()
  await User.updateOne({ _id: id }, { $inc: { sessionVersion: 1 } })
  res.json({ success: true, message: input.active ? 'Account restored' : 'Account suspended', user: publicUser(target) })
})
adminRouter.get('/ideas', async (req, res) => {
  const { page, limit, q } = pageSchema.parse(req.query)
  // Moderation exposes published content only. Private vaults stay owner-only.
  const filter = { visibility: 'public' as const, ...(q ? { title: new RegExp(escapeRegex(q), 'i') } : {}) }
  const [ideas, total] = await Promise.all([
    Idea.find(filter).select('-content').populate('owner', 'firstName lastName').sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit),
    Idea.countDocuments(filter),
  ])
  res.json({ success: true, ideas, total, page, pages: Math.ceil(total / limit) })
})
adminRouter.delete('/ideas/:id', async (req, res) => {
  const idea = await Idea.findOneAndDelete({ _id: validId(req.params.id), visibility: 'public' })
  if (!idea) throw new HttpError(404, 'Published idea not found')
  await Comment.deleteMany({ idea: idea._id })
  res.json({ success: true, message: 'Published idea removed' })
})
