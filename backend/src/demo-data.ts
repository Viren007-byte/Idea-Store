import bcrypt from 'bcryptjs'
import { Types } from 'mongoose'
import { Comment, Idea, User } from './models.js'
import { commentSchema, ideaSchema, profileSchema, registerSchema } from './schemas.js'

// Fictional identities and public demo passwords. Nothing imports this into normal startup.
export const demoAccounts = [
  { firstName: 'Aditi', lastName: 'Kulkarni', email: 'admin@ideastore.test', password: 'Admin@12345', role: 'admin', active: true, occupation: 'Project administrator', bio: 'I look after the IdeaStore community and help students turn useful ideas into thoughtful projects.' },
  { firstName: 'Rohan', lastName: 'Deshmukh', email: 'rohan@ideastore.test', password: 'Demo@12345', role: 'user', active: true, occupation: 'Computer science student', bio: 'Interested in practical campus technology, accessible education, and small tools that solve everyday problems.' },
  { firstName: 'Sneha', lastName: 'Patil', email: 'sneha@ideastore.test', password: 'Demo@12345', role: 'user', active: true, occupation: 'Product design student', bio: 'I enjoy designing inclusive public spaces and finding simple ways for communities to work together.' },
  { firstName: 'Arjun', lastName: 'Shah', email: 'arjun@ideastore.test', password: 'Demo@12345', role: 'user', active: true, occupation: 'Student entrepreneur', bio: 'Exploring local business ideas, sustainable habits, and ways to connect talented people with opportunities.' },
  { firstName: 'Meera', lastName: 'Joshi', email: 'meera@ideastore.test', password: 'Demo@12345', role: 'user', active: false, occupation: 'Community volunteer', bio: 'A fictional suspended account for demonstrating how administrators restore member access.' },
] as const

const publicIdeas = [
  ['Campus lost-and-found hub', 'Technology', 1, 'A searchable campus noticeboard that helps students return lost belongings without sharing personal contact details.', 'Students submit the item category, approximate location, and a short description. A claimant answers a private identifying question before a handover is arranged at the college office.\n\nStart with one department, display QR links near common areas, and measure how many belongings are returned each week.', ['campus', 'web-app'], 'An identifying question is a good safeguard. Could the college office approve handovers?', 'Yes, using the office as the collection point would keep personal phone numbers private.'],
  ['A second life for everyday things', 'Environment', 2, 'A neighborhood repair library where people borrow tools, share skills, and keep useful items out of the waste stream.', 'Build a small tool library at a community center. Residents can reserve tools and attend repair sessions led by local volunteers.\n\nA repair notebook records common fixes and safe handling instructions. Begin with bicycles, bags, and furniture, then expand only when trained volunteers are available.', ['repair', 'sustainability'], 'We could begin with bicycle repairs during a monthly community event.', 'A simple borrowing register would help us understand which tools people actually need.'],
  ['Peer learning circles', 'Education', 1, 'Small student-led study groups that connect learners by subject and encourage explanation rather than memorization.', 'Students choose a topic they can explain and a topic they want to learn. The platform suggests small groups with complementary strengths.\n\nEach session includes a short explanation, a practice exercise, and a shared summary. A faculty mentor reviews the session plan before the first campus pilot.', ['students', 'peer-learning'], 'Could students choose a language for their learning circle?', 'Short practice exercises would make it easier to see whether the session helped.'],
  ['Daily movement buddies', 'Health', 3, 'A gentle campus activity challenge that encourages short walks, stretching breaks, and supportive group routines.', 'Create optional walking groups with flexible routes around campus. Participants set their own activity goals and check in without public rankings.\n\nThe app supports accessible alternatives and reminders to take breaks. It offers general habit tracking, not medical advice or treatment recommendations.', ['wellbeing', 'habits'], 'Please include seated activities so everyone can join.', 'A supportive check-in sounds more welcoming than a competitive leaderboard.'],
  ['Local makers weekend market', 'Business', 3, 'A digital directory that helps small local makers showcase their work and organize affordable weekend pop-up stalls.', 'Give makers a profile containing product categories, sample work, and upcoming stall dates. Visitors can browse the directory and plan a visit.\n\nThe first version focuses on discovery and event coordination rather than online payments. Interview local makers to understand what makes participating worthwhile.', ['local-business', 'makers'], 'A shared stall could make participation cheaper for first-time sellers.', 'We should ask makers whether they prefer monthly or weekly events before building scheduling tools.'],
  ['An accessible campus guide', 'Design', 2, 'A clear guide to step-free routes, building entrances, quiet spaces, and accessible facilities across the college campus.', 'Audit campus routes with volunteers and students who use accessibility facilities. Publish verified information with readable maps and plain-language directions.\n\nEach location includes its last review date and a way to report changes. The guide must work with keyboards and screen readers and remain usable on small phones.', ['accessibility', 'inclusive-design'], 'Last-reviewed dates will help people judge whether route information is current.', 'The audit should include students who use these facilities every day.'],
  ['One hour for the neighborhood', 'Other', 0, 'A volunteering board for small, clearly scoped community tasks that students can complete in about an hour.', 'Local organizers post a task, meeting point, estimated time, and the support available to volunteers. Tasks could include a reading session, a library sorting hour, or preparing event signs.\n\nCollege coordinators verify organizers before publishing tasks. Participation remains optional, with clear instructions for reporting a concern.', ['volunteering', 'community'], 'Clear meeting points and verified organizers would help first-time volunteers.', 'A short reflection after each task could capture useful feedback for the next event.'],
  ['QR shelf finder for the library', 'Technology', 1, 'A lightweight library tool that points readers to the correct shelf using a book code or a scanned QR label.', 'Map shelf identifiers to book categories in a small searchable directory. A QR label near the entrance opens the search page without requiring an app installation.\n\nLibrary staff can update shelf changes. Begin with one room and collect feedback from visitors before adding indoor navigation features.', ['library', 'qr-codes'], 'Could the first version show a simple shelf diagram instead of live navigation?', 'Staff should be able to update shelf labels without editing code.'],
  ['Refill stations, fewer plastic bottles', 'Environment', 3, 'A campus refill map that shows verified drinking-water points and encourages students to carry reusable bottles.', 'List verified refill points with opening times and the date they were last checked. Students can report an unavailable station so staff can review it.\n\nAvoid claiming real-time water quality from user reports. Partner with the facilities team for verification and publish maintenance notices when provided.', ['plastic-free', 'campus'], 'Maintenance notices would be more useful than an unverified quality score.', 'We could place a map near the main gate during orientation week.'],
  ['A timetable that leaves room to breathe', 'Education', 2, 'A study planner that balances assignment deadlines with realistic study blocks, breaks, and time for revision.', 'Students enter subjects, deadlines, and available study hours. The planner suggests manageable blocks and lets the student move them freely.\n\nMissed tasks are rescheduled without streak penalties. Test the design with a small group during one assignment cycle and ask whether planning feels easier.', ['planning', 'student-life'], 'Can we keep a manual planning option for students who prefer full control?', 'A weekly review could help people adjust unrealistic study estimates.'],
  ['A quiet corner to recharge', 'Health', 0, 'A student-informed directory of calm campus spaces suitable for a short break between lectures and activities.', 'Collect information about quiet seating, shade, opening hours, and accessibility. Students can suggest spaces, with staff confirming whether they are available for this purpose.\n\nThe directory is a practical campus resource rather than a mental-health service. Include clear notes about public access and expected behavior.', ['wellbeing', 'campus-spaces'], 'It would help to mention whether a space has shade and accessible seating.', 'Let us ask students which times of day these areas are actually quiet.'],
  ['Skill swaps for student businesses', 'Business', 3, 'A structured way for students to exchange useful skills, such as design, photography, tutoring, and basic bookkeeping.', 'Members list one skill they can offer and a small task for which they need help. Each exchange has an agreed scope, time estimate, and completion date.\n\nBegin with faculty-supervised project teams. Make it easy to decline requests and report unfair expectations so exchanges stay respectful.', ['skills', 'entrepreneurship'], 'An agreed task scope would prevent a small favor from becoming an unlimited commitment.', 'We could pilot this with poster design and event photography.'],
  ['Signs that make sense to everyone', 'Design', 2, 'A campus signage kit using clear language, readable contrast, consistent icons, and directions tested with new visitors.', 'Review common points of confusion around the campus. Design a small set of signs using large text and consistent placement.\n\nTest printed prototypes with students, visitors, and staff before replacing existing signs. Offer bilingual labels where the college community finds them useful.', ['wayfinding', 'visual-design'], 'Testing with new visitors should reveal confusing directions quickly.', 'Bilingual labels and consistent arrows could make the first prototype useful immediately.'],
  ['The society noticeboard', 'Other', 1, 'A shared calendar for college clubs that makes event details, participation rules, and volunteer opportunities easy to find.', 'Club coordinators submit event notices using a common template. Each notice includes date, venue, eligibility, organizer contact, and registration instructions.\n\nFaculty moderators review announcements before they appear in the public calendar. Start with a few clubs and include a printable weekly summary.', ['college-clubs', 'events'], 'A printable weekly summary would help people who do not check the site regularly.', 'The event template should make it clear whether advance registration is required.'],
] as const

const drafts = [
  [0, 'Draft: presentation feedback notebook', 'Education', 'A private outline for collecting constructive project-presentation feedback from students and faculty.'],
  [1, 'Draft: an offline revision companion', 'Technology', 'A private sketch of a revision tool that stores notes on a student’s device when internet access is limited.'],
  [2, 'Draft: reusable exhibition displays', 'Design', 'A private concept for modular exhibition panels that student teams can reuse across college events.'],
  [3, 'Draft: a shared delivery day', 'Business', 'A private plan for coordinating local maker deliveries on one predictable day each week.'],
] as const

export const demoId = (number: number) => new Types.ObjectId(`de${number.toString(16).padStart(22, '0')}`)

export async function seedDemoData() {
  await Promise.all([User.init(), Idea.init(), Comment.init()])
  // Refuse to take over an unrelated account that happens to use a demo email.
  for (const [index, account] of demoAccounts.entries()) {
    const existing = await User.findOne({ $or: [{ email: account.email }, { _id: demoId(index + 1) }] })
    if (existing && (existing.id !== demoId(index + 1).toString() || existing.email !== account.email)) {
      throw new Error(`Demo account collision for ${account.email}; no account was overwritten`)
    }
  }
  const hashes = new Map<string, string>()
  for (const account of demoAccounts) if (!hashes.has(account.password)) hashes.set(account.password, await bcrypt.hash(account.password, 12))
  const now = Date.now()
  const age = (days: number) => new Date(now - days * 86400000)
  for (const [index, account] of demoAccounts.entries()) {
    const registration = registerSchema.parse({ firstName: account.firstName, lastName: account.lastName, email: account.email, password: account.password })
    const profile = profileSchema.parse({ firstName: account.firstName, lastName: account.lastName, occupation: account.occupation, bio: account.bio, photoUrl: '', github: `https://example.com/demo/${account.firstName.toLowerCase()}`, linkedin: '', instagram: '', facebook: '' })
    await User.updateOne({ _id: demoId(index + 1) }, { $setOnInsert: { ...registration, ...profile,
      password: hashes.get(account.password), role: account.role, active: account.active, sessionVersion: 0,
      createdAt: age(30 - index), updatedAt: age(5),
    } }, { upsert: true, timestamps: false })
  }
  for (const [index, [title, category, owner, summary, content, tags, firstComment, secondComment]] of publicIdeas.entries()) {
    const id = demoId(100 + index)
    const input = ideaSchema.parse({ title, category, summary, content, tags: [...tags], visibility: 'public' })
    await Idea.updateOne({ _id: id }, { $setOnInsert: { ...input, owner: demoId(owner + 1), createdAt: age(index + 2), updatedAt: age(index + 1) } }, { upsert: true, timestamps: false })
    for (const [offset, body] of [firstComment, secondComment].entries()) {
      await Comment.updateOne({ _id: demoId(1000 + index * 2 + offset) }, { $setOnInsert: {
        ...commentSchema.parse({ body }), idea: id, author: demoId((owner + offset + 1) % 4 + 1),
        createdAt: age(index + 0.5 + offset * 0.1), updatedAt: age(index + 0.5 + offset * 0.1),
      } }, { upsert: true, timestamps: false })
    }
  }
  for (const [index, [owner, title, category, summary]] of drafts.entries()) {
    const input = ideaSchema.parse({ title, category, summary,
      content: `${summary}\n\nThis is a private working draft. Next steps: interview potential users, sketch a small prototype, and decide what to share with the community.\n\nPresentation note: this full draft should be visible only in its owner’s vault, even when another account is an administrator.`,
      tags: ['draft', 'work-in-progress'], visibility: 'private' })
    await Idea.updateOne({ _id: demoId(200 + index) }, { $setOnInsert: { ...input, owner: demoId(owner + 1), createdAt: age(4), updatedAt: age(1) } }, { upsert: true, timestamps: false })
  }
  return { users: demoAccounts.length, publicIdeas: publicIdeas.length, privateIdeas: drafts.length, comments: publicIdeas.length * 2 }
}
