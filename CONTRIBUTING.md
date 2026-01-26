Contributing Guide

Thank you for contributing to Diwali Rental Sites and the Bookings API.

Principles
- Keep changes minimal, focused, and verifiable.
- Do not commit secrets. Use `wrangler secret put` or `.dev.vars` locally (ignored by git).
- Preserve security defaults: Turnstile on public POST, Access only on `/admin*`, CORS restricted.

Local Setup
1) Prereqs: Node 18+, npm, Cloudflare account.
2) Install Wrangler: `npm i -g wrangler` and `wrangler login`.
3) D1: Ensure DB exists (`wrangler d1 list`) and migrations apply locally:
   - `cd diwali-booking-api`
   - `wrangler d1 migrations apply diwali_bookings --local`
4) Secrets (local optional): create `diwali-booking-api/.dev.vars` with `TURNSTILE_SECRET_KEY`, `ADMIN_USER`, `ADMIN_PASS`.

Making Changes
- API: Edit `diwali-booking-api/src/index.js`. Add migrations to `diwali-booking-api/migrations/NNN_name.sql` for schema changes.
- Frontend: Update `sites/<Site>/assets/js/config.js` and `main.js` accordingly.
- Docs: Keep `docs/OPERATIONS.md` and `docs/CHANGELOG.md` up to date.

Testing
- API via curl: create/list/read/update/delete under `/v1/bookings`.
- D1 verify: `wrangler d1 execute diwali_bookings --local --command "PRAGMA table_info(bookings);"`
- CORS: OPTIONS preflight with allowed/disallowed origins.
- Admin: Access gate only on `/admin*`.

Deploying
1) Apply remote migrations: `wrangler d1 migrations apply diwali_bookings --remote`.
2) Set/update secrets as needed: `wrangler secret put TURNSTILE_SECRET_KEY` (and admin creds).
3) `wrangler deploy`.
4) Verify endpoints and CORS.

Pull Requests
- Use the PR template checklist.
- Include curl commands or logs proving the change works.
- Update CHANGELOG.md for notable changes.

Security
- Report vulnerabilities privately to the maintainer (see `SECURITY.md`).

