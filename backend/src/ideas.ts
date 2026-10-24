import { Router } from 'express'
import { Comment, Idea } from './models.js'
import { commentSchema, ideaSchema, pageSchema } from './schemas.js'
import { HttpError, requireAuth, validId } from './security.js'

export const ideaRouter = Router()
const authorFields = 'firstName lastName photoUrl occupation'
export const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
ideaRouter.get('/', async (req, res) => {
  const { page, limit, q, category } = pageSchema.parse(req.query)
  const filter = { visibility: 'public' as const, ...(category ? { category } : {}),
    ...(q ? { $or: [{ title: new RegExp(escapeRegex(q), 'i') }, { summary: new RegExp(escapeRegex(q), 'i') }, { tags: new RegExp(escapeRegex(q), 'i') }] } : {}) }
  const [ideas, total] = await Promise.all([
    Idea.find(filter).select('-content').populate('owner', authorFields).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit),
    Idea.countDocuments(filter),
  ])
  res.json({ success: true, ideas, total, page, pages: Math.ceil(total / limit) })
})
ideaRouter.get('/mine', requireAuth, async (req, res) => {
  const { page, limit, q, visibility } = pageSchema.parse(req.query)
  const filter = { owner: req.user!._id, ...(visibility ? { visibility } : {}),
    ...(q ? { title: new RegExp(escapeRegex(q), 'i') } : {}) }
  const [ideas, total, privateCount, publicCount] = await Promise.all([
    Idea.find(filter).select('-content').populate('owner', authorFields).sort({ updatedAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit),
    Idea.countDocuments(filter),
    Idea.countDocuments({ owner: req.user!._id, visibility: 'private' }),
    Idea.countDocuments({ owner: req.user!._id, visibility: 'public' }),
  ])
  res.json({ success: true, ideas, total, page, pages: Math.ceil(total / limit), privateCount, publicCount })
})
ideaRouter.post('/', requireAuth, async (req, res) => {
  const input = ideaSchema.parse(req.body)
  const idea = await Idea.create({ ...input, owner: req.user!._id })
  res.status(201).json({ success: true, message: 'Idea saved', idea })
})
// Public views never reveal private idea existence. Owners use an authenticated endpoint.
ideaRouter.get('/:id', async (req, res) => {
  const idea = await Idea.findOne({ _id: validId(req.params.id), visibility: 'public' }).populate('owner', authorFields)
  if (!idea) throw new HttpError(404, 'Idea not found')
  res.json({ success: true, idea })
})
ideaRouter.get('/:id/owned', requireAuth, async (req, res) => {
  const idea = await Idea.findOne({ _id: validId(req.params.id), owner: req.user!._id }).populate('owner', authorFields)
  if (!idea) throw new HttpError(404, 'Idea not found')
  res.json({ success: true, idea })
})
ideaRouter.patch('/:id', requireAuth, async (req, res) => {
  const input = ideaSchema.parse(req.body)
  const idea = await Idea.findOneAndUpdate({ _id: validId(req.params.id), owner: req.user!._id },
    { $set: input }, { returnDocument: 'after', runValidators: true })
  if (!idea) throw new HttpError(404, 'Idea not found')
  res.json({ success: true, message: 'Idea updated', idea })
})
ideaRouter.delete('/:id', requireAuth, async (req, res) => {
  const idea = await Idea.findOneAndDelete({ _id: validId(req.params.id), owner: req.user!._id })
  if (!idea) throw new HttpError(404, 'Idea not found')
  await Comment.deleteMany({ idea: idea._id })
  res.json({ success: true, message: 'Idea deleted' })
})
ideaRouter.get('/:id/comments', async (req, res) => {
  const id = validId(req.params.id)
  if (!await Idea.exists({ _id: id, visibility: 'public' })) throw new HttpError(404, 'Idea not found')
  const { page, limit } = pageSchema.parse(req.query)
  const [comments, total] = await Promise.all([
    Comment.find({ idea: id }).populate('author', authorFields).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit),
    Comment.countDocuments({ idea: id }),
  ])
  res.json({ success: true, comments, total, page, pages: Math.ceil(total / limit) })
})
ideaRouter.post('/:id/comments', requireAuth, async (req, res) => {
  const id = validId(req.params.id)
  const input = commentSchema.parse(req.body)
  if (!await Idea.exists({ _id: id, visibility: 'public' })) throw new HttpError(404, 'Idea not found')
  const comment = await Comment.create({ ...input, idea: id, author: req.user!._id })
  await comment.populate('author', authorFields)
  res.status(201).json({ success: true, message: 'Comment posted', comment })
})
ideaRouter.delete('/:id/comments/:commentId', requireAuth, async (req, res) => {
  const idea = await Idea.findOne({ _id: validId(req.params.id), visibility: 'public' })
  if (!idea) throw new HttpError(404, 'Idea not found')
  const comment = await Comment.findOne({ _id: validId(req.params.commentId), idea: idea._id })
  if (!comment) throw new HttpError(404, 'Comment not found')
  if (comment.author.toString() !== req.user!.id && idea.owner.toString() !== req.user!.id && req.user!.role !== 'admin') {
    throw new HttpError(403, 'You cannot delete this comment')
  }
  await comment.deleteOne()
  res.json({ success: true, message: 'Comment deleted' })
})
