import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import bcrypt from 'bcryptjs'

process.env.NODE_ENV = 'test'
process.env.SECRET_KEY = 'browser-tests-only-not-a-production-key'
process.env.FRONTEND_URL = 'http://127.0.0.1:5174'
const mongo = await MongoMemoryServer.create()
process.env.MONGO_URI = mongo.getUri('ideastore_browser_test')
await mongoose.connect(process.env.MONGO_URI)
const { app } = await import('../src/app.js')
const { User, Idea, Comment } = await import('../src/models.js')
await Promise.all([User.init(), Idea.init(), Comment.init()])
const admin = await User.create({ firstName: 'Alex', lastName: 'Morgan', email: 'admin@example.test', password: await bcrypt.hash('BrowserTest123!', 12), role: 'admin' })
await Idea.insertMany([
  { title: 'A second life for everyday things', summary: 'A neighborhood repair library that brings tools, practical skills, and curious people together.', content: 'Build a community network of repair volunteers and share tools through local libraries. Every repaired item becomes a story of something saved.', category: 'Environment', tags: ['community', 'sustainability'], visibility: 'public', owner: admin._id },
  { title: 'Learning beyond the classroom', summary: 'Small, student-led learning circles that turn real-world curiosity into collaborative projects.', content: 'Give students a place to propose their own questions and form small groups to investigate them with guidance from a mentor.', category: 'Education', tags: ['learning', 'collaboration'], visibility: 'public', owner: admin._id },
  { title: 'A calmer corner of the internet', summary: 'A reading space that values thoughtful discoveries over endless scrolling and notifications.', content: 'Design a simple reading workspace where people save a few meaningful articles and discuss them with a small group of friends.', category: 'Technology', tags: ['digital-wellbeing', 'design'], visibility: 'public', owner: admin._id },
])
const server = app.listen(8001, '127.0.0.1', () => console.log('Isolated browser-test API ready on port 8001'))
async function close() { server.close(); await mongoose.disconnect(); await mongo.stop(); process.exit(0) }
process.on('SIGINT', () => void close())
process.on('SIGTERM', () => void close())
