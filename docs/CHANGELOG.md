Changelog

2026-01-26
- Introduced API versioning under `/v1` and kept `POST /booking` for back-compat.
- Added multi-site support: `site` slug per booking; filter via `?site=`.
- Added CRUD endpoints: `GET/POST /v1/bookings`, `GET/PATCH/DELETE /v1/bookings/:id`.
- Enforced Turnstile on public POSTs; added security headers and refined CORS.
- Added D1 migration `002_add_site_extras.sql` with `site` and `extras` columns.
- Updated frontend config: `bookingApiUrl` → `/v1/bookings`, added `siteSlug`, payload sends `site`.
- Fixed D1 insert response to return `id` via `res.meta.last_row_id`.
- Documented operations in `docs/OPERATIONS.md` and updated README with API v1 usage.

