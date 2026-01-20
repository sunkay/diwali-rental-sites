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

