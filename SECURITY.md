Security Policy

Reporting a Vulnerability
- Please email diwali.synllc@gmail.com with details and reproduction steps.
- Do not open public issues for security reports.

Scope
- Cloudflare Worker (`diwali-booking-api`) and D1 schema/migrations.
- Frontend sites under `sites/` that call the API.

Best Practices in This Repo
- No secrets in git. Use `wrangler secret put` and `.dev.vars` locally.
- CORS limited to known frontends via `vars.ALLOWED_ORIGINS`.
- Cloudflare Access only on `/admin*` (admin UI). Admin API uses Basic Auth until Access is added there.
- Turnstile enforced for public POSTs to reduce abuse.

