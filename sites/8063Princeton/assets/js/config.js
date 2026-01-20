// Centralized site configuration
// Update these values to customize the site
// No frameworks; simple global CONFIG object used by main.js

window.CONFIG = {
  propertyName: "8063 Princeton Dr",
  location: "Naples, FL",
  formUrl: "https://forms.gle/your-booking-form-placeholder",
  email: "hello@example.com",
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
