import mongoose, { Schema, type InferSchemaType } from 'mongoose'

const userSchema = new Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  bio: { type: String, default: '' }, occupation: { type: String, default: '' },
  photoUrl: { type: String, default: '' }, instagram: { type: String, default: '' },
  linkedin: { type: String, default: '' }, github: { type: String, default: '' },
  facebook: { type: String, default: '' },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  active: { type: Boolean, default: true },
  sessionVersion: { type: Number, default: 0, select: false },
}, { timestamps: true })
// Retain the existing collection so previously registered users are preserved.
export const User = mongoose.model('User', userSchema, 'users')
export type UserDocument = mongoose.HydratedDocument<InferSchemaType<typeof userSchema>>

const ideaSchema = new Schema({
  title: { type: String, required: true }, summary: { type: String, required: true },
  content: { type: String, required: true }, category: { type: String, required: true },
  tags: { type: [String], default: [] },
  visibility: { type: String, enum: ['private', 'public'], default: 'private' },
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
}, { timestamps: true })
ideaSchema.index({ visibility: 1, createdAt: -1 })
export const Idea = mongoose.model('Idea', ideaSchema)

const commentSchema = new Schema({
  body: { type: String, required: true },
  idea: { type: Schema.Types.ObjectId, ref: 'Idea', required: true, index: true },
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true })
export const Comment = mongoose.model('Comment', commentSchema)

export function publicUser(user: UserDocument) {
  const { password: _password, sessionVersion: _sessionVersion, ...safe } = user.toObject()
  return safe
}
