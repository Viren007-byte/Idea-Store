# Requirements review

Implementation mapped to the supplied `Project Description.pdf`.

| Requirement | Implementation |
| --- | --- |
| MERN + TypeScript | Typed Express/Mongoose backend and React/Vite frontend |
| Authentication & security | bcrypt hashes, HTTP-only JWT cookies, verified protected routes, session restoration, revoked logout tokens |
| Idea CRUD & personal dashboard | Owner-only create/read/update/delete, private/public visibility, search, filters, counts, pagination |
| Profile customization | Name, occupation, bio, image URL, and four social links; validated API and editing screen |
| Admin control panel | User monitoring, suspension/restoration, aggregate counts, database connectivity, published-content removal |
| Community interaction | Public idea feed and paginated comments with author/owner/admin moderation |
| Zod validation | Strict request schemas for accounts, profile, ideas, comments, controls, and pagination |
| Responsive UI | Material UI components, Tailwind pipeline, mobile navigation, light/dark themes, accessible forms |
| Redux/Recoil | Typed Redux Toolkit authentication state |

## Verification

- API integration suite exercises authenticated CRUD, private access boundaries, role
  enforcement, validation, comments, suspension, filtering, and session revocation.
- Chrome browser suite exercises signup/login, session restoration after reload,
  idea creation/editing/publishing/deletion, comments, profile persistence, logout,
  admin controls, mobile navigation, and theme switching.
- Both application builds include TypeScript checking. Frontend lint is configured
  for TypeScript and React hooks.
- Tests use disposable MongoDB instances, separate from the user's configured database.

## Operating choices

Ideas begin private. Publishing makes their contents publicly readable. Admins
moderate published content but cannot read private vaults. Unpublishing hides the
idea and its comments; republishing restores the discussion. Deleting an idea removes
its comments. Suspending an account invalidates its sessions and preserves its data.

The application does not assert legal protection of intellectual property or provide
end-to-end encryption. MongoDB backups remain an operational responsibility.
Atlas needs valid network access and credentials. An explicit persistent local
database mode is available when Atlas is unavailable; see README.md.
