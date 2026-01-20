# Rental Property Website

A fast, accessible, mobile‑first static site for showcasing a rental property. Built with HTML, CSS, and vanilla JS and hosted on GitHub Pages.

## Quick Start

- Edit `assets/js/config.js` and set:
  - `propertyName`: Your property name
  - `location`: City, State (or region)
  - `formUrl`: Link to your Google Form (booking request)
  - `email`: Your contact email
- Replace images in `assets/img/` (and `assets/img/gallery/`) with your photos. Keep descriptive `alt` text.
- Open `index.html` locally to preview.

## Local Preview

From the repo root, run:

`python3 -m http.server 8000`

Then open http://localhost:8000/ in your browser.

Alternatively (if `python` points to Python 3):

`python -m http.server 8000`

## Choose Home Feature Images (Option A)

- Put your chosen photos in `assets/img/featured/` with these exact names:
  - `living.webp`
  - `kitchen.webp`
  - `bedroom.webp`
  - `study.webp`
- The site will automatically use these for the Home feature cards. If any are missing, it falls back to the mappings in `assets/js/config.js` (`featuredImages`) and then to the default images in the HTML.
- Tip: Use `.webp` for smaller, faster images. If you prefer JPG/PNG for these slots, set paths in `config.js` instead.

## File Structure

- `index.html` — Home
- `gallery.html` — Gallery
- `rates.html` — Rates
- `policies.html` — Policies
- `contact.html` — Contact
- `assets/css/styles.css` — Styles (mobile‑first, neutral palette)
- `assets/js/config.js` — Central config (form URL, email, property name, location)
- `assets/js/main.js` — Injects config, nav state, and behaviors
- `assets/img/` — Images (use optimized formats like `.webp`; gallery photos in `assets/img/gallery/`)
- `.nojekyll` — Disables Jekyll processing on GitHub Pages

## Accessibility Basics

- Semantic HTML + proper headings
- Descriptive `alt` text on all images
- Visible focus styles and keyboard‑friendly navigation
- Reasonable contrast and large hit targets

## Publish on GitHub Pages

1. Push this repository to GitHub.
2. In GitHub, go to: `Settings` → `Pages`.
3. Under `Build and deployment`:
   - Source: `Deploy from a branch`
   - Branch: `main` and `/ (root)` folder
4. Click `Save`.
5. Wait for the green check. Your site will be available at the URL shown on the Pages screen.

### Tips

- Use relative asset paths (`assets/...`) so pages work locally and on Pages.
- If you change CSS/JS and don’t see updates, hard refresh or append a cache‑buster query (e.g., `styles.css?v=2`).
- Keep copy short and clear. Every page already includes a prominent “Request to Book” button.

## Changing the Booking Link

- Update `formUrl` in `assets/js/config.js`. All “Request to Book” buttons update automatically.

## License

Private project. All rights reserved.
