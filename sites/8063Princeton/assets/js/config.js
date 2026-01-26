// Centralized site configuration
// Update these values to customize the site
// No frameworks; simple global CONFIG object used by main.js

window.CONFIG = {
  propertyName: "8063 Princeton Dr",
  location: "Naples, FL",
  formUrl: "",
  email: "hello@example.com",
  // Optional: if set, the site will show a native booking form
  // in the modal and POST to this endpoint (serverless/API).
  // Leave blank to continue using the embedded Google Form only.
  bookingApiUrl: "https://api.diwali.group/v1/bookings",
  // Turnstile site key for verification (test key by default; replace with your real key)
  // Get one from Cloudflare Turnstile and set it here for production.
  turnstileSiteKey: "1x00000000000000000000AA",
  // Slug identifier for this property (used by the API)
  siteSlug: "8063-princeton-dr",
  // Default notification email (the backend should ultimately own this)
  notifyEmail: "naplesrental8063@gmail.com",
  // Optional carousels for feature cards on Home
  // Provide an array of image paths to rotate through.
  carousels: {
    living: [
      "assets/img/gallery/living.webp",
      "assets/img/gallery/pool-1.webp",
      "assets/img/gallery/pool-2.webp",
      "assets/img/gallery/sunset.webp",
      "assets/img/gallery/sunset-2.webp",
      "assets/img/gallery/sunset-3.webp"
    ]
  },
  // Optional: choose images for the feature cards on Home
  // Update these paths to point to your preferred photos
  featuredImages: {
    living: "assets/img/gallery/living.webp",
    kitchen: "assets/img/gallery/kitchen.webp",
    bedroom: "assets/img/gallery/bedroom-1.webp",
    study: "assets/img/gallery/study.webp"
  }
};
