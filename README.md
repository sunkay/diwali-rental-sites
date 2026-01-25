## Rental Sites

This repository hosts multiple rental property sites (for GitHub Pages), organized as one folder per rental site.

### Structure

- `index.html` — Landing page listing all rental sites
- `404.html` — Friendly not‑found page with redirect
- `.nojekyll` — Disables Jekyll on GitHub Pages
- `sites/` — Folder containing rental sites
  - `8063Princeton/` — Self-contained site for 8063 Princeton Dr

Each site folder is self-contained with its own `assets`, pages (`index.html`, `gallery.html`, etc.), and does not depend on global assets.

### Adding a New Rental

1. Copy an existing site folder under `sites/<NewRentalName>/`.
2. Update `assets/js/config.js` and page content for the new property.
3. Add a link to the new site in the root `index.html` list.

### GitHub Pages

Enable GitHub Pages for this repository by selecting the `main` branch (root) as the publishing source. The landing page lives at `/`, and each rental is served from `/sites/<RentalName>/`.

### Booking Email via Serverless (optional)

GitHub Pages is static and cannot send emails itself. To have the site send emails when a request is submitted, deploy a tiny serverless function (e.g., Cloudflare Worker) and point the on-site modal form to it.

1. Create a Cloudflare account and a new Worker (HTTP service).
2. Paste the code from `serverless/cloudflare-worker.js`.
3. Add secrets (Worker settings → Variables):
   - `RESEND_API_KEY`: API key from Resend (or adapt code to your provider)
   - `TO_EMAIL`: e.g., `naplesrental8063@gmail.com`
   - `FROM_EMAIL`: e.g., `Bookings <bookings@yourdomain.com>` (or `onboarding@resend.dev` during setup)
4. Deploy the Worker and copy the public URL.
5. In `sites/<Rental>/assets/js/config.js`, set `bookingApiUrl` to the Worker URL.
6. The booking modal will switch from the embedded Google Form to the native form and POST to your Worker, which emails the request.

Note: Keep the Google Form URL in `formUrl` as a fallback and for data collection if desired.
