import { z } from 'zod'

const name = z.string().trim().min(1, 'Name is required').max(60)
const email = z.string().trim().toLowerCase().email().max(254)
const password = z.string().min(8, 'Use at least 8 characters').max(72, 'Use at most 72 characters')
  .refine(value => Buffer.byteLength(value, 'utf8') <= 72, 'Password must fit within 72 UTF-8 bytes')
export const registerSchema = z.object({ firstName: name, lastName: name, email, password }).strict()
export const loginSchema = z.object({ email, password: z.string().min(1).max(200) }).strict()
const webUrl = z.union([z.literal(''), z.string().url().max(500).refine(value => /^https?:\/\//i.test(value), 'Use an HTTP or HTTPS URL')])
export const profileSchema = z.object({
  firstName: name, lastName: name, bio: z.string().trim().max(1000),
  occupation: z.string().trim().max(120), photoUrl: webUrl,
  github: webUrl, linkedin: webUrl, instagram: webUrl, facebook: webUrl,
}).strict()
export const categories = ['Technology', 'Education', 'Health', 'Environment', 'Business', 'Design', 'Other'] as const
export const ideaSchema = z.object({
  title: z.string().trim().min(5).max(160),
  summary: z.string().trim().min(10).max(300),
  content: z.string().trim().min(20).max(20000),
  category: z.enum(categories),
  tags: z.array(z.string().trim().min(1).max(30)).max(8).transform(values => [...new Set(values)]),
  visibility: z.enum(['private', 'public']),
}).strict()
export const commentSchema = z.object({ body: z.string().trim().min(1).max(2000) }).strict()
export const pageSchema = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  q: z.string().trim().max(100).default(''),
  category: z.enum(categories).optional(),
  visibility: z.enum(['private', 'public']).optional(),
})
