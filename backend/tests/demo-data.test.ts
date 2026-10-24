import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import request from 'supertest'
import bcrypt from 'bcryptjs'
import { demoAccounts, demoId, seedDemoData } from '../src/demo-data.js'
import { Comment, Idea, User } from '../src/models.js'

process.env.NODE_ENV = 'test'
process.env.SECRET_KEY = 'isolated-demo-seed-test-secret'
let mongo: MongoMemoryServer
before(async () => {
  mongo = await MongoMemoryServer.create()
  process.env.MONGO_URI = mongo.getUri('demo_seed_test')
  await mongoose.connect(process.env.MONGO_URI)
}, { timeout: 180000 })
after(async () => { await mongoose.disconnect(); if (mongo) await mongo.stop() })

test('demo dataset supports logins, privacy, pagination, and safe repeated seeding', async () => {
  await User.create({ firstName: 'Existing', lastName: 'Member', email: 'existing@example.test', password: await bcrypt.hash('Existing@123', 4) })
  const summary = await seedDemoData()
  assert.deepEqual(summary, { users: 5, publicIdeas: 14, privateIdeas: 4, comments: 28 })
  assert.equal(await User.countDocuments(), 6)
  assert.equal(await Idea.countDocuments(), 18)
  assert.equal(await Comment.countDocuments(), 28)
  const { app } = await import('../src/app.js')
  for (const account of demoAccounts) {
    const result = await request(app).post('/api/v1/user/login').send({ email: account.email, password: account.password })
    assert.equal(result.status, account.active ? 200 : 401, `${account.email} login`)
    if (account.active) { assert.equal(result.body.user.role, account.role); assert.equal(result.body.user.password, undefined) }
  }
  const rohan = request.agent(app)
  const sneha = request.agent(app)
  await rohan.post('/api/v1/user/login').send({ email: demoAccounts[1].email, password: demoAccounts[1].password }).expect(200)
  await sneha.post('/api/v1/user/login').send({ email: demoAccounts[2].email, password: demoAccounts[2].password }).expect(200)
  await rohan.get(`/api/v1/ideas/${demoId(201)}/owned`).expect(200)
  await sneha.get(`/api/v1/ideas/${demoId(201)}/owned`).expect(404)
  const page = await request(app).get('/api/v1/ideas?page=2&limit=12').expect(200)
  assert.equal(page.body.ideas.length, 2)
  assert.equal(page.body.pages, 2)
  assert.equal((await request(app).get(`/api/v1/ideas/${demoId(100)}/comments`).expect(200)).body.total, 2)

  await User.updateOne({ _id: demoId(2) }, { $set: { bio: 'My presentation changes stay saved.' } })
  await User.updateOne({ _id: demoId(5) }, { $set: { active: true } })
  await Idea.updateOne({ _id: demoId(100) }, { $set: { title: 'An edited presentation idea' } })
  await seedDemoData()
  assert.equal(await User.countDocuments(), 6)
  assert.equal(await Idea.countDocuments(), 18)
  assert.equal(await Comment.countDocuments(), 28)
  assert.equal((await User.findById(demoId(2)))?.bio, 'My presentation changes stay saved.')
  assert.equal((await User.findById(demoId(5)))?.active, true)
  assert.equal((await Idea.findById(demoId(100)))?.title, 'An edited presentation idea')
  assert.ok(await User.exists({ email: 'existing@example.test' }))

  await User.updateOne({ _id: demoId(1) }, { $set: { email: 'renamed@example.test' } })
  await assert.rejects(seedDemoData(), /Demo account collision/)
  assert.equal(await User.countDocuments(), 6)
})
