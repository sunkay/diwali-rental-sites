## Summary

Describe the change and the problem it solves.

## Changes
- [ ] API
- [ ] DB/Migrations
- [ ] Frontend
- [ ] Docs

## Verification
- [ ] Local D1 migrations applied (`wrangler d1 migrations apply diwali_bookings --local`)
- [ ] Remote D1 migrations applied if needed (`--remote`)
- [ ] API endpoints tested with curl (list, create, update, delete)
- [ ] CORS verified for allowed/disallowed origins
- [ ] `/admin` protected by Cloudflare Access only (not `/v1/*`)

## Security
- [ ] No secrets committed (use `wrangler secret put` or `.dev.vars` locally)
- [ ] CORS remains restricted to real frontends

## Docs
- [ ] Updated `docs/OPERATIONS.md` or `AGENTS.md` if behavior changed
- [ ] Added entries to `docs/CHANGELOG.md`

Closes #

