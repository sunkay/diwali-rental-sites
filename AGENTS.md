Agent Guide

Purpose
- This repo hosts the Diwali rental sites and a Cloudflare Worker API that handles multi‑site bookings stored in D1.

Primary Components
- `diwali-booking-api/`: Cloudflare Worker + D1 migrations (the API).
- `sites/<SiteName>/`: Static sites that call the API (e.g., `sites/8063Princeton/`).
- Docs: `docs/OPERATIONS.md` (runbook), `docs/CHANGELOG.md` (recent changes).

Current State (2026‑01‑26)
- API live at `https://api.diwali.group/v1` with CRUD endpoints and soft delete.
- Admin HTML at `/admin` is protected by Cloudflare Access; admin API requires Basic Auth.
- Turnstile enforced on public POSTs. CORS restricted via `wrangler.jsonc`.
- D1 schema includes `site` and `extras`. Migrations 001 and 002 applied remotely.

How To Work Safely
- Secrets: Never commit secrets. Set with `wrangler secret put`. Local dev secrets go in `.dev.vars` (ignored by git).
- CORS: Modify `vars.ALLOWED_ORIGINS` in `wrangler.jsonc` for front‑end origins only.
- Access: Only scope Cloudflare Access to `/admin*`. Do not gate `/v1/*` unless requirements change.
- Changes: Prefer incremental changes with verification steps (curl/D1 queries). Keep edits focused.

Workflow For Agents
1) Plan: Use the plan tool to outline 2‑5 short steps. Keep exactly one in‑progress step.
2) Small commits: Edit files via patches; keep changes scoped to the task.
3) Verify early: Use `wrangler d1 ... --local` for schema checks; use curl for API checks.
4) Deploy: `wrangler deploy` when secrets, DB, and routes are configured.
5) Document: Update `docs/CHANGELOG.md` for notable changes and reference `docs/OPERATIONS.md` if runbooks change.

Key Commands (cheat sheet)
- List DBs: `wrangler d1 list`
- Migrations: `wrangler d1 migrations apply diwali_bookings [--local|--remote]`
- Query D1: `wrangler d1 execute diwali_bookings --remote --command "PRAGMA table_info(bookings);"`
- Secrets: `wrangler secret put TURNSTILE_SECRET_KEY` (also `ADMIN_USER`, `ADMIN_PASS`)
- Deploy: `wrangler deploy`
- Tail: `wrangler tail diwali-booking-api --format pretty`

Frontend Integration Notes
- Each site’s config at `sites/<Site>/assets/js/config.js` must set:
  - `bookingApiUrl`: `https://api.diwali.group/v1/bookings`
  - `turnstileSiteKey`: site key from Cloudflare Turnstile
  - `siteSlug`: stable slug (e.g., `8063-princeton-dr`)

References
- Operations runbook: `docs/OPERATIONS.md`
- Recent changes: `docs/CHANGELOG.md`

Next Tasks (Backlog)
- Turnstile to production: set `TURNSTILE_SECRET_KEY` via `wrangler secret put` and update each site’s `turnstileSiteKey`; redeploy Worker + sites; verify end‑to‑end.
- Email notifications: on create, send an email (e.g., Resend). Add secrets (API key, from/to), implement a minimal mailer, and document in OPERATIONS.
- Admin UX: add filters (by `site`, date range, status) and pagination controls to `/admin` HTML.
- Rate limiting: add Cloudflare WAF rules/Rate Limits for `POST /v1/bookings` (per IP/site) to reduce abuse.
- Environments: create staging Worker/domain (e.g., `staging-api.diwali.group`) with separate D1 and secrets; document a promotion flow.
- Observability: structured error logging and optional Workers Analytics Engine dashboard for booking volume by site.
- Data export: admin‑only CSV download endpoint for bookings (site/date filtered) and D1 backup routine.

Environment Assumptions
- Cloudflare
  - Workers account is already selected via `wrangler login`.
  - Route: `api.diwali.group` maps to this Worker (see `wrangler.jsonc` routes).
  - Access app scopes only `/admin*` (not `/v1/*`).
- D1
  - Database name: `diwali_bookings`, bound as `env.DB`.
  - Migrations 001 and 002 are applied remotely; new migrations must be applied with `--remote`.
- Tooling
  - Node 18+ and Wrangler v4.x.
  - Secrets set via `wrangler secret put`; no secrets in git. Local dev uses `.dev.vars` (ignored).
