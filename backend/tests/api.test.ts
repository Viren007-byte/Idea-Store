import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import mongoose from 'mongoose'
import request from 'supertest'
import { MongoMemoryServer } from 'mongodb-memory-server'
import type { Express } from 'express'

process.env.NODE_ENV = 'test'
process.env.SECRET_KEY = 'test-only-key-not-used-by-the-real-app'
process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/ideastore_test'
let mongo: MongoMemoryServer
let app: Express
let owner: ReturnType<typeof request.agent>
let member: ReturnType<typeof request.agent>
let admin: ReturnType<typeof request.agent>
let ownerId: string
let memberId: string
let privateId: string
let publicId: string
let commentId: string
const idea = { title: 'Community repair notebook', summary: 'A shared notebook to make repair knowledge available to everyone.', content: 'Create a neighborhood network where people document repairs, exchange tools, and teach one another practical skills.', category: 'Environment', tags: ['repair', 'community'], visibility: 'private' }

before(async () => {
  mongo = await MongoMemoryServer.create()
  process.env.MONGO_URI = mongo.getUri('ideastore_test')
  app = (await import('../src/app.js')).app
  await mongoose.connect(process.env.MONGO_URI)
  const { User, Idea, Comment } = await import('../src/models.js')
  await Promise.all([User.init(), Idea.init(), Comment.init()])
  owner = request.agent(app); member = request.agent(app); admin = request.agent(app)
}, { timeout: 180000 })
after(async () => { await mongoose.disconnect(); if (mongo) await mongo.stop() })

test('health and unauthenticated route protection', async () => {
  await request(app).get('/api/health').expect(200)
  await request(app).get('/api/v1/user/me').expect(401)
  await request(app).post('/api/v1/ideas').send(idea).expect(401)
  await request(app).get('/api/v1/admin/stats').expect(401)
})
test('registration rejects malformed input, short passwords, and role injection', async () => {
  await request(app).post('/api/v1/user/register').send({ firstName: 'A', lastName: 'B', email: 'invalid', password: 'password123' }).expect(400)
  await request(app).post('/api/v1/user/register').send({ firstName: 'A', lastName: 'B', email: 'bad@example.com', password: 'short' }).expect(400)
  await request(app).post('/api/v1/user/register').send({ firstName: 'A', lastName: 'B', email: 'bad@example.com', password: 'password123', role: 'admin' }).expect(400)
  await request(app).post('/api/v1/user/register').send({ firstName: {}, lastName: 'B', email: 'bad@example.com', password: 123456789 }).expect(400)
})
test('registration hashes passwords, normalizes emails, and rejects duplicates', async () => {
  for (const [client, email, firstName] of [[owner, 'OWNER@example.com', 'Owner'], [member, 'member@example.com', 'Member'], [admin, 'admin@example.com', 'Admin']] as const) {
    await client.post('/api/v1/user/register').send({ firstName, lastName: 'Tester', email, password: 'password123' }).expect(201)
  }
  const { User } = await import('../src/models.js')
  const stored = await User.findOne({ email: 'owner@example.com' }).select('+password')
  assert.ok(stored); assert.notEqual(stored.password, 'password123'); assert.match(stored.password, /^\$2/)
  await request(app).post('/api/v1/user/register').send({ firstName: 'Duplicate', lastName: 'User', email: 'owner@example.com', password: 'password123' }).expect(409)
  await User.updateOne({ email: 'admin@example.com' }, { $set: { role: 'admin' } })
})
test('login creates HTTP-only sessions, restores identity, and omits secrets', async () => {
  await owner.post('/api/v1/user/login').send({ email: 'owner@example.com', password: 'wrong' }).expect(401)
  const login = await owner.post('/api/v1/user/login').send({ email: 'owner@example.com', password: 'password123' }).expect(200)
  assert.match(String(login.headers['set-cookie']), /HttpOnly/)
  assert.equal(login.body.user.password, undefined); assert.equal(login.body.user.sessionVersion, undefined)
  ownerId = login.body.user._id
  await owner.get('/api/v1/user/me').expect(200)
  memberId = (await member.post('/api/v1/user/login').send({ email: 'member@example.com', password: 'password123' }).expect(200)).body.user._id
  await admin.post('/api/v1/user/login').send({ email: 'admin@example.com', password: 'password123' }).expect(200)
  await member.get('/api/v1/admin/stats').expect(403)
})
test('profile updates are validated and cannot elevate account privileges', async () => {
  const profile = { firstName: 'Owner', lastName: 'Tester', bio: 'I enjoy building useful ideas.', occupation: 'Student', photoUrl: '', github: 'https://github.com/example', linkedin: '', instagram: '', facebook: '' }
  const result = await owner.patch('/api/v1/user/profile').send(profile).expect(200)
  assert.equal(result.body.user.occupation, 'Student')
  await owner.patch('/api/v1/user/profile').send({ ...profile, role: 'admin' }).expect(400)
  await owner.patch('/api/v1/user/profile').send({ ...profile, github: 'javascript:alert(1)' }).expect(400)
})
test('private ideas stay owner-only, including against admins', async () => {
  privateId = (await owner.post('/api/v1/ideas').send(idea).expect(201)).body.idea._id
  assert.equal((await request(app).get('/api/v1/ideas').expect(200)).body.total, 0)
  await request(app).get(`/api/v1/ideas/${privateId}`).expect(404)
  await member.get(`/api/v1/ideas/${privateId}/owned`).expect(404)
  await admin.get(`/api/v1/ideas/${privateId}/owned`).expect(404)
  await owner.get(`/api/v1/ideas/${privateId}/owned`).expect(200)
  await member.patch(`/api/v1/ideas/${privateId}`).send(idea).expect(404)
  await member.delete(`/api/v1/ideas/${privateId}`).expect(404)
  await member.post(`/api/v1/ideas/${privateId}/comments`).send({ body: 'Cannot comment on private content' }).expect(404)
})
test('idea validation rejects injected ownership and malformed IDs', async () => {
  await owner.post('/api/v1/ideas').send({ ...idea, owner: memberId }).expect(400)
  await owner.post('/api/v1/ideas').send({ ...idea, title: 'x' }).expect(400)
  await owner.post('/api/v1/ideas').send({ ...idea, tags: Array(9).fill('tag') }).expect(400)
  await request(app).get('/api/v1/ideas/not-an-id').expect(400)
  await request(app).get('/api/v1/ideas?page=-1').expect(400)
  await request(app).get('/api/v1/ideas?q=%5B').expect(200)
})
test('publishing, search, filtering, pagination, and dashboard counts', async () => {
  publicId = (await owner.post('/api/v1/ideas').send({ ...idea, visibility: 'public' }).expect(201)).body.idea._id
  await request(app).get(`/api/v1/ideas/${publicId}`).expect(200)
  const listing = await request(app).get('/api/v1/ideas?q=repair&category=Environment&limit=1').expect(200)
  assert.equal(listing.body.total, 1); assert.equal(listing.body.ideas[0].content, undefined)
  assert.equal((await request(app).get('/api/v1/ideas?category=Health').expect(200)).body.total, 0)
  const dashboard = await owner.get('/api/v1/ideas/mine').expect(200)
  assert.equal(dashboard.body.privateCount, 1); assert.equal(dashboard.body.publicCount, 1)
})
test('comments require authentication, support pagination, and enforce authorship', async () => {
  await request(app).post(`/api/v1/ideas/${publicId}/comments`).send({ body: 'Hello' }).expect(401)
  await member.post(`/api/v1/ideas/${publicId}/comments`).send({ body: ' ' }).expect(400)
  commentId = (await member.post(`/api/v1/ideas/${publicId}/comments`).send({ body: 'Could this include a local tool library?' }).expect(201)).body.comment._id
  const comments = await request(app).get(`/api/v1/ideas/${publicId}/comments?limit=1`).expect(200)
  assert.equal(comments.body.total, 1); assert.equal(comments.body.comments[0].author._id, memberId)
  const another = (await owner.post(`/api/v1/ideas/${publicId}/comments`).send({ body: 'Yes, that would be useful.' }).expect(201)).body.comment._id
  await member.delete(`/api/v1/ideas/${publicId}/comments/${another}`).expect(403)
  await owner.delete(`/api/v1/ideas/${publicId}/comments/${commentId}`).expect(200)
  await admin.delete(`/api/v1/ideas/${publicId}/comments/${another}`).expect(200)
})
test('unpublishing hides both the idea and its comments', async () => {
  await owner.patch(`/api/v1/ideas/${publicId}`).send(idea).expect(200)
  await request(app).get(`/api/v1/ideas/${publicId}`).expect(404)
  await request(app).get(`/api/v1/ideas/${publicId}/comments`).expect(404)
  await owner.patch(`/api/v1/ideas/${publicId}`).send({ ...idea, visibility: 'public' }).expect(200)
})
test('admin statistics and suspension revoke sessions without exposing passwords', async () => {
  const stats = await admin.get('/api/v1/admin/stats').expect(200)
  assert.equal(stats.body.stats.users, 3); assert.equal(stats.body.stats.database, 'connected')
  const users = await admin.get('/api/v1/admin/users?q=member').expect(200)
  assert.equal(users.body.total, 1); assert.equal(users.body.users[0].password, undefined)
  await admin.patch(`/api/v1/admin/users/${memberId}`).send({ active: false }).expect(200)
  await member.get('/api/v1/user/me').expect(401)
  await member.post('/api/v1/user/login').send({ email: 'member@example.com', password: 'password123' }).expect(401)
  await admin.patch(`/api/v1/admin/users/${memberId}`).send({ active: true }).expect(200)
  await member.post('/api/v1/user/login').send({ email: 'member@example.com', password: 'password123' }).expect(200)
  const { User } = await import('../src/models.js')
  const adminUser = await User.findOne({ email: 'admin@example.com' })
  await admin.patch(`/api/v1/admin/users/${adminUser!.id}`).send({ active: false }).expect(403)
})
test('admin moderation and owner deletion remove associated comments', async () => {
  await member.post(`/api/v1/ideas/${publicId}/comments`).send({ body: 'An idea to revisit.' }).expect(201)
  await admin.delete(`/api/v1/admin/ideas/${privateId}`).expect(404)
  await admin.delete(`/api/v1/admin/ideas/${publicId}`).expect(200)
  const { Comment } = await import('../src/models.js')
  assert.equal(await Comment.countDocuments({ idea: publicId }), 0)
  await owner.delete(`/api/v1/ideas/${privateId}`).expect(200)
  assert.equal((await owner.get('/api/v1/ideas/mine').expect(200)).body.total, 0)
})
test('cross-origin mutations, invalid JSON, and unknown endpoints fail safely', async () => {
  await owner.post('/api/v1/ideas').set('Origin', 'https://untrusted.example').send(idea).expect(403)
  await owner.post('/api/v1/ideas').set('Sec-Fetch-Site', 'cross-site').send(idea).expect(403)
  await request(app).post('/api/v1/user/register').set('Content-Type', 'application/json').send('{ broken').expect(400)
  await request(app).get('/api/v1/missing').expect(404)
})
test('logout invalidates the old JWT even if its cookie is replayed', async () => {
  const login = await owner.post('/api/v1/user/login').send({ email: 'owner@example.com', password: 'password123' }).expect(200)
  const cookie = String(login.headers['set-cookie'][0]).split(';')[0]
  await owner.post('/api/v1/user/logout').expect(200)
  await owner.get('/api/v1/user/me').expect(401)
  await request(app).get('/api/v1/user/me').set('Cookie', cookie).expect(401)
})
