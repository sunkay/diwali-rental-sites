Diwali Booking API — Operations Runbook

Overview
- Purpose: Multi-site bookings API on Cloudflare Workers with D1.
- Base URL: https://api.diwali.group
- Versioning: Path-based (`/v1`). Legacy `POST /booking` retained for compatibility.

Endpoints (v1)
- POST `/v1/bookings`: Public create. Requires Turnstile token.
- GET `/v1/bookings`: Admin list. Query: `site`, `limit`, `offset`, `includeDeleted`.
- GET `/v1/bookings/:id`: Admin read.
- PATCH `/v1/bookings/:id`: Admin update (`status`, `message`).
- DELETE `/v1/bookings/:id`: Admin soft delete (`status='deleted'`).
- Admin HTML: GET `/admin` (requires Cloudflare Access; lists latest 100).
- Admin JSON (legacy): GET `/admin/bookings` (requires auth).

Security
- Cloudflare Access: Protects only `/admin*` (SSO/MFA). Do NOT include `/v1/*`.
- Admin API Auth: Basic Auth (`ADMIN_USER`, `ADMIN_PASS`).
- CORS: Restricted to `vars.ALLOWED_ORIGINS` in `wrangler.jsonc`.
- Bot protection: Cloudflare Turnstile enforced on public create.
- Security headers: HSTS, `nosniff`, `no-referrer`, `no-store` added by Worker.

Database
- Type: Cloudflare D1 (SQLite).
- Table: `bookings`
  - Columns: `id`, `created_at`, `site`, `name`, `email`, `phone`, `start_date`, `end_date`, `message`, `ip`, `ua`, `status`, `extras`.
  - Indexes: `idx_bookings_created_at`, `idx_bookings_site_created`.
- Migrations:
  - `migrations/001_init.sql` — initial schema.
  - `migrations/002_add_site_extras.sql` — adds `site`, `extras`, site+created index.

Configuration (Wrangler)
- File: `diwali-booking-api/wrangler.jsonc`
  - `d1_databases`: binds DB as `env.DB`.
  - `routes`: custom domain `api.diwali.group`.
  - `vars` (non-secret):
    - `ALLOWED_ORIGINS`: comma list of allowed front-ends.
    - `SENDER_EMAIL`, `NOTIFY_TO` (reserved for future email integration).
- Secrets (set via `wrangler secret` — not in git):
  - `TURNSTILE_SECRET_KEY`: Cloudflare Turnstile secret.
  - `ADMIN_USER`, `ADMIN_PASS`: Basic auth for admin API.

Frontend Integration
- Site config: `sites/8063Princeton/assets/js/config.js`
  - `bookingApiUrl`: `https://api.diwali.group/v1/bookings`
  - `turnstileSiteKey`: production site key
  - `siteSlug`: e.g., `8063-princeton-dr`
- Booking form payload includes `site` and Turnstile token; accepts either `startDate/endDate` or `checkIn/checkOut`.

Deployment — Step by Step
1) Install/login
   - `npm i -g wrangler`
   - `wrangler login`
2) D1 database
   - `wrangler d1 list`
   - If needed: `wrangler d1 create diwali_bookings`
   - Ensure `wrangler.jsonc` has correct `database_id`
3) Migrations
   - Local dry-run: `wrangler d1 migrations apply diwali_bookings --local`
   - Remote: `wrangler d1 migrations apply diwali_bookings --remote`
4) Secrets (remote)
   - `wrangler secret put TURNSTILE_SECRET_KEY`
   - `wrangler secret put ADMIN_USER`
   - `wrangler secret put ADMIN_PASS`
   - Optional local: `.dev.vars` (ignored by git)
5) Deploy Worker
   - `wrangler deploy`
6) Verify API
   - Create (test Turnstile):
     - `curl -X POST "https://api.diwali.group/v1/bookings" -H "Content-Type: application/json" -d '{"site":"8063-princeton-dr","name":"Test Guest","email":"guest@example.com","phone":"555-1234","startDate":"2026-02-01","endDate":"2026-02-05","message":"API smoke test","turnstileToken":"1x0000000000000000000000000000000AA"}'`
     - Expect: `{ "ok": true, "id": <number> }`
   - Admin GET (unauth): `curl -i https://api.diwali.group/v1/bookings` → 401 + `WWW-Authenticate`
   - Admin list (auth): `curl -u <user>:<pass> "https://api.diwali.group/v1/bookings?site=8063-princeton-dr&limit=5"`
   - PATCH: `curl -u <user>:<pass> -X PATCH -H 'Content-Type: application/json' -d '{"status":"reviewing"}' "https://api.diwali.group/v1/bookings/1"`
   - DELETE: `curl -u <user>:<pass> -X DELETE "https://api.diwali.group/v1/bookings/1"`
   - includeDeleted: `curl -u <user>:<pass> "https://api.diwali.group/v1/bookings?site=8063-princeton-dr&includeDeleted=true"`
7) Cloudflare Access (dashboard)
   - Zero Trust → Access → Applications → Add Self-hosted
   - Domain: `api.diwali.group`; Path: `/admin*`
   - Policy: Allow → Include → Emails → you@example.com (and others)
   - Verify incognito: `https://api.diwali.group/admin` prompts for Access login
8) CORS verification
   - Allowed origin preflight:
     - `curl -i -X OPTIONS "https://api.diwali.group/v1/bookings" -H "Origin: https://princeton.diwali.group" -H "Access-Control-Request-Method: POST"`
     - Expect `access-control-allow-origin: https://princeton.diwali.group`
   - Disallowed origin preflight:
     - `curl -i -X OPTIONS "https://api.diwali.group/v1/bookings" -H "Origin: https://evil.example" -H "Access-Control-Request-Method: POST"`
     - Expect no `access-control-allow-origin` header

Changelog (2026-01-26)
- Worker (`diwali-booking-api/src/index.js`)
  - Added `/v1` CRUD routes, Turnstile, multi-site `site` slug, extras blob, soft delete.
  - Hardened CORS/headers; maintained legacy `POST /booking`.
  - Fixed D1 insert id via `res.meta.last_row_id`.
- DB migrations
  - `002_add_site_extras.sql` adds `site`, `extras`, and site+created index.
- Frontend
  - `sites/8063Princeton/assets/js/config.js`: `bookingApiUrl` → `/v1/bookings`, `siteSlug` added.
  - `sites/8063Princeton/assets/js/main.js`: includes `site` in payload; Turnstile wired.
- Docs
  - This runbook and README update for v1 usage.

Next Steps
- Swap Turnstile to production keys (Worker secret + frontend site key).
- Optional: Replace Basic Auth on admin API with Cloudflare Access (move under `/v1/admin/*` and scope the Access app).
- Add email notifications (use Resend/Email provider) from Worker on new booking.
- Add admin HTML filters (by `site`, date range, status).
- Set up staging domain and environment vars for non-prod.

Staging Environment
- Goal: Isolate testing from production using a separate Worker route, D1 database, and secrets.

1) Create staging D1
   - `wrangler d1 create diwali_bookings_staging`
   - Copy the staging Database ID from output or dashboard.

2) Configure staging env (wrangler)
   - Edit `diwali-booking-api/wrangler.jsonc` → `env.staging`:
     - Set `name` to `diwali-booking-api-staging` (already done in sample).
     - Set `routes[0].pattern` to your staging domain, e.g., `staging-api.diwali.group`.
     - Replace `database_id` with your staging D1 ID.
     - Set `vars.ALLOWED_ORIGINS` to your staging front-ends (e.g., `https://princeton-staging.diwali.group`).

3) Map staging domain (dashboard)
   - Cloudflare DNS → add `staging-api.diwali.group` (proxied, orange cloud) pointing to Workers custom domain as per Cloudflare guides.
   - Workers & Pages → your Worker → ensure route `staging-api.diwali.group` will be picked up on deploy.

4) Apply staging migrations (remote)
   - `cd diwali-booking-api`
   - `wrangler d1 migrations apply diwali_bookings --env staging --remote`

5) Set staging secrets
   - `wrangler secret put TURNSTILE_SECRET_KEY --env staging`
   - `wrangler secret put ADMIN_USER --env staging`
   - `wrangler secret put ADMIN_PASS --env staging`

6) Deploy staging Worker
   - `wrangler deploy --env staging`

7) Verify staging
   - Preflight (allowed origin):
     - `curl -i -X OPTIONS "https://staging-api.diwali.group/v1/bookings" -H "Origin: https://princeton-staging.diwali.group" -H "Access-Control-Request-Method: POST"`
     - Expect `access-control-allow-origin` echoes the staging origin.
   - Create (Turnstile test token):
     - `curl -X POST "https://staging-api.diwali.group/v1/bookings" -H "Content-Type: application/json" -d '{"site":"8063-princeton-dr","name":"Test","email":"t@example.com","phone":"555","startDate":"2026-02-01","endDate":"2026-02-02","turnstileToken":"1x0000000000000000000000000000000AA"}'`
   - Admin list (Basic):
     - `curl -u <user>:<pass> "https://staging-api.diwali.group/v1/bookings?site=8063-princeton-dr&limit=5"`

8) Frontend staging (optional)
   - Point a staging site’s `bookingApiUrl` to `https://staging-api.diwali.group/v1/bookings` and set a staging Turnstile site key.
