# IdeaStore presentation accounts

All people and projects below are fictional demonstration data. These public
passwords are for the local development database, not a deployed application.

| Login email (user ID) | Password | Name | Purpose |
| --- | --- | --- | --- |
| admin@ideastore.test | Admin@12345 | Aditi Kulkarni | Admin dashboard, moderation, and account controls |
| rohan@ideastore.test | Demo@12345 | Rohan Deshmukh | Member vault, editing, and publishing |
| sneha@ideastore.test | Demo@12345 | Sneha Patil | A second member for comments and privacy checks |
| arjun@ideastore.test | Demo@12345 | Arjun Shah | Another member with business and community ideas |
| meera@ideastore.test | Demo@12345 | Meera Joshi | Initially suspended; restore in Admin before logging in |

## Load the data

From `backend`, run `npm.cmd run seed:demo`. It can start the local MongoDB itself
if needed, or connect to an already running `dev:local` instance. It seeds only
`mongodb://127.0.0.1:27018/ideastore_local`, keeps the database files in
`backend/.local-data`, and does not read or change your Atlas credentials.

Then start `npm.cmd run dev:local` in `backend` and `npm.cmd run dev` in `frontend`.
Open http://localhost:5173 and use an email/password from the table.

The dataset contains **5 users, 14 published ideas, 4 private drafts, and 28 comments**.
Published ideas cover all seven categories, with enough items to show pagination.
Active accounts have occupations, biographies, and example profile links. Images
use the app's initials fallback. The example.com profile links are placeholders.

The command uses stable IDs and adds missing records without replacing existing
records, changed passwords, edited ideas, or changed account statuses. Rerunning
it recreates deleted demo records. It does not remove your own accounts or ideas.

## Suggested presentation (5–7 minutes)

1. Start on Home and open Explore ideas. Show categories, search for `campus`,
   and move between pages. Open an idea to show its author and discussion.
2. Log in as Rohan. Open My vault: it includes public ideas and a private draft.
   Edit the private draft, then publish it if you want to demonstrate sharing.
3. Add a new idea with visibility set to Only me. Log out, then log in as Sneha:
   that private idea must not appear in her vault or the public feed.
4. As Sneha, comment on Rohan's published idea. Edit her occupation or bio in Profile,
   save, and refresh to show persistence.
5. Log in as Aditi (admin). Show counts, member records, published-content moderation,
   and Meera's suspended status. Restore Meera, then show that she can log in.
6. Toggle dark mode and demonstrate navigation in a narrow browser window.

Deleting an idea/comment or suspending an account affects this saved demo database.
Use a newly created idea to demonstrate deletion if you want to keep the sample feed.
After demonstrating suspension, restore the account so its login works next time.
