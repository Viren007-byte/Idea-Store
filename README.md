# IdeaStore

A MERN application for a private idea vault and a public idea community, implemented
in TypeScript with Zod, JWT, Redux, Material UI, and Tailwind CSS.

## Features

- Registration, bcrypt password hashing, HTTP-only JWT cookies, protected API routes,
  session restoration after refresh, and logout that revokes all of the user's sessions.
- Private/public idea creation, viewing, editing, and deletion. Private ideas are
  owner-only, including against administrators. New ideas start private in the editor.
- Personal dashboard with counts, visibility filters, search, and pagination.
- Community discovery with category filters, search, and pagination.
- Comments on public ideas. Comment authors, idea owners, and administrators can remove comments.
- Profile editing: name, occupation, bio, image URL, GitHub, LinkedIn, Instagram, Facebook.
- Administrator statistics, account suspension/restoration, and public-content moderation.
- Responsive navigation, light/dark themes, loading/empty/error states, accessible form labels.
- Zod validation, owner/role enforcement, request rate limits, security headers,
  origin checks for mutations, and invalidated sessions when accounts are suspended.

## Requirements and setup

Use Node.js **22.13 or newer** (Node 24 LTS recommended), npm, and MongoDB (local or Atlas).
Windows PowerShell may block `npm.ps1`; the commands below use `npm.cmd`.
On macOS/Linux use `npm` instead. Existing backend/.env is preserved.

1. Install dependencies in each folder:
   - `cd backend` then `npm.cmd ci`
   - `cd frontend` then `npm.cmd ci`
2. Copy `backend/.env.example` to `backend/.env` only if you do not already have one.
   Supply your MongoDB URI, a random secret, and the allowed frontend origins.
   For local MongoDB: `mongodb://127.0.0.1:27017/ideastore`.
   For Atlas, use its connection string with a database name such as `/ideastore`,
   confirm the cluster is active, and allow your current IP in Network Access.
   URL-encode special characters in database passwords.
3. Check connectivity: in `backend`, run `npm.cmd run check:db`.
4. Start the API: in `backend`, run `npm.cmd run dev` (or `npm.cmd start`).
5. Start the UI: in a second terminal, in `frontend`, run `npm.cmd run dev`.
6. Open **http://localhost:5173**. Register, log in, and create your first idea.

The API runs on port 8000. Vite proxies `/api` to it. Both localhost and 127.0.0.1
frontend origins are allowed by default. Use the same hostname throughout a session.
No real users or demo ideas are inserted into your configured database automatically.
If MongoDB is unreachable, the UI shows a service warning; the API returns 503 and
retries connecting every 30 seconds. It does not silently switch to temporary storage.

### Run without Atlas or a separately installed MongoDB

From `backend`, use **`npm.cmd run dev:local`** instead of `npm.cmd run dev`.
This explicitly starts a real local MongoDB process on 127.0.0.1:27018 and the API
on port 8000. Start the frontend normally in another terminal.

The first run may download the MongoDB executable. Data persists in
`backend/.local-data` across restarts; this directory is ignored by Git. The command
does not edit `.env` or use your Atlas database. Keep that directory to retain local
accounts and ideas. Stop with Ctrl+C. This mode is for local development only.

## Enable an administrator

For a ready-made local presentation with fictional accounts, ideas, and comments,
run `npm.cmd run seed:demo` from `backend`. Credentials and a presentation walkthrough
are in [DEMO.md](DEMO.md). Demo seeding never targets Atlas.

Register your own account through the UI first. Then run from `backend`:

```powershell
npm.cmd run admin:promote -- your-email@example.com
```

When using `dev:local`, keep it running and instead use
`npm.cmd run admin:promote:local -- your-email@example.com`.

Log in and open **Admin** in the navigation. Admin roles cannot be requested during
registration or changed through a profile update. There is no default admin password.
Administrators can suspend regular accounts, restore them, and remove published ideas
and comments. They cannot read private idea contents or suspend other admins in the UI.

## Checks

```powershell
# backend
npm.cmd run build
npm.cmd test

# frontend
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
npm.cmd run test:e2e
```

API tests start a disposable MongoDB using mongodb-memory-server. Browser tests start
an isolated API/database on port 8001 and Vite on 5174 and use installed Google Chrome.
The first test run may download a MongoDB binary. Test accounts and sample content are
created only in the disposable database. Browser tests never use backend/.env credentials.
Ports 8001 and 5174 must be free; tests stop their servers afterwards. On Linux/macOS,
change the Playwright Vite command from `npm.cmd` to `npm` if needed.

## Project map

- `backend/src/app.ts`: HTTP middleware and route registration.
- `backend/src/auth.ts`: account, session, and profile endpoints.
- `backend/src/ideas.ts`: idea and comment endpoints.
- `backend/src/admin.ts`: account controls and public-content moderation.
- `backend/src/models.ts` / `schemas.ts`: database models and request validation.
- `backend/tests`: isolated API and browser-test fixtures.
- `frontend/src/main.tsx`: application entry point.
- `frontend/src/app`: typed screens, Redux store, API client, and shared UI.
- `frontend/tests`: browser workflow and responsive-layout checks.

## API overview

All routes below use `/api/v1` as a prefix. Session cookies are required for protected routes.

| Route | Access | Purpose |
| --- | --- | --- |
| POST /user/register, POST /user/login | Public | Create account / authenticate |
| GET /user/me, PATCH /user/profile, POST /user/logout | Signed in | Session and profile |
| GET /ideas | Public | Published ideas; q, category, page, limit |
| GET /ideas/mine | Signed in | Own ideas; q, visibility, page, limit |
| POST /ideas | Signed in | Create an idea |
| GET /ideas/:id | Public | View a published idea |
| GET /ideas/:id/owned | Owner | View own private or public idea |
| PATCH /ideas/:id, DELETE /ideas/:id | Owner | Edit / remove own idea |
| GET /ideas/:id/comments | Public | Read public discussion |
| POST /ideas/:id/comments | Signed in | Comment on published content |
| DELETE /ideas/:id/comments/:commentId | Author / idea owner / admin | Remove comment |
| GET /admin/stats, GET /admin/users, GET /admin/ideas | Admin | Monitor platform |
| PATCH /admin/users/:id | Admin | Suspend / restore regular account |
| DELETE /admin/ideas/:id | Admin | Remove published content |

`GET /api/health` returns 200 with database connected, or 503 when disconnected.
Deleting an idea also removes its comments. Unpublishing hides its existing comments;
republishing makes that conversation visible again.

## Deployment and data care

Build the backend with `npm.cmd run build` and run `npm.cmd run start:production`.
Build the frontend with `npm.cmd run build`; serve `frontend/dist` with SPA fallback.
Use an HTTPS reverse proxy that serves the frontend and forwards `/api` to the backend.
Set NODE_ENV=production, a random SECRET_KEY of at least 32 characters, the correct
FRONTEND_URL, and a production MongoDB URI. Cookies become Secure in production.
Keep the frontend and API on the same site for SameSite=Strict cookies. Vite's dev proxy
is not included in the production build. Configure `VITE_API_URL` before building only
if using a separate API origin on the same site. Do not expose the Vite dev server publicly.

Maintain MongoDB backups or Atlas backups. Private access controls are not a guarantee
against intellectual-property theft; public ideas can be read and copied. The app does
not provide IP registration, end-to-end encryption, payments, email verification, or
password-reset email flows; those were not features in the supplied requirements PDF.
