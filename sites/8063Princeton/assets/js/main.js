// Main behavior: inject config, handle nav state, simple UX
(function () {
  function setText(selector, text) {
    var el = document.querySelector(selector);
    if (el && text) el.textContent = text;
  }

  function setAttrAll(selector, attr, value) {
    document.querySelectorAll(selector).forEach(function (el) {
      if (value) el.setAttribute(attr, value);
    });
  }

  function wireCTAs(formUrl) {
    var ctas = document.querySelectorAll('.js-book-btn');
    ctas.forEach(function (btn) {
      if (formUrl) {
        btn.setAttribute('href', formUrl);
        btn.setAttribute('target', '_blank');
        btn.setAttribute('rel', 'noopener noreferrer');
      }
    });
  }

  function activateNav() {
    var path = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('nav a').forEach(function (a) {
      var href = a.getAttribute('href');
      if ((path === '' && href.endsWith('index.html')) || href === path) {
        a.setAttribute('aria-current', 'page');
      }
    });
  }

  function wireMobileNav() {
    var toggle = document.querySelector('[data-nav-toggle]');
    var nav = document.querySelector('[data-nav]');
    if (!toggle || !nav) return;
    toggle.addEventListener('click', function () {
      var expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!expanded));
      nav.classList.toggle('is-open');
    });
  }

  function wireContact(email) {
    if (!email) return;
    var mailtos = document.querySelectorAll('.js-email');
    mailtos.forEach(function (a) {
      a.setAttribute('href', 'mailto:' + email);
      a.textContent = email;
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var cfg = window.CONFIG || {};
    // Title and branding
    setText('[data-site-name]', cfg.propertyName);
    setText('[data-site-location]', cfg.location);
    if (cfg.propertyName && cfg.location) {
      document.title = cfg.propertyName + ' — ' + cfg.location;
    } else if (cfg.propertyName) {
      document.title = cfg.propertyName;
    }

    wireCTAs(cfg.formUrl);
    wireContact(cfg.email);
    activateNav();
    wireMobileNav();

    // Simple fade carousel for feature images if configured in CONFIG.carousels
    function initFadeCarousel(imgEl, images, intervalMs) {
      if (!imgEl || !images || images.length === 0) return;
      var idx = 0;
      var next = function () {
        idx = (idx + 1) % images.length;
        var nextSrc = images[idx];
        // Fade out
        imgEl.style.opacity = '0';
        var temp = new Image();
        temp.onload = function () {
          imgEl.src = nextSrc;
          // Slight delay to ensure style application
          requestAnimationFrame(function(){ imgEl.style.opacity = '1'; });
        };
        temp.src = nextSrc;
      };
      // Set initial state
      imgEl.classList.add('fade-img');
      imgEl.style.opacity = '1';
      // Ensure first image is from list
      if (images[0]) imgEl.src = images[0];
      // Start rotation
      setInterval(next, intervalMs || 3500);
    }

    // Feature images on Home using Option A: assets/img/featured/{key}.webp
    // Falls back to CONFIG.featuredImages[key], unless a carousel is configured.
    ['living','kitchen','bedroom','study'].forEach(function (key) {
      var el = document.querySelector('[data-feature="' + key + '"]');
      if (!el) return;

      // If a carousel is defined for this key, initialize and skip static image handling
      if (cfg.carousels && Array.isArray(cfg.carousels[key]) && cfg.carousels[key].length) {
        // Ensure accessible alt text
        if (!el.getAttribute('alt')) {
          el.setAttribute('alt', key.charAt(0).toUpperCase() + key.slice(1) + ' photos');
        }
        el.setAttribute('loading', 'lazy');
        initFadeCarousel(el, cfg.carousels[key], 3500);
        return;
      }

      var featuredPath = 'assets/img/featured/' + key + '.webp';
      var setAlt = function () {
        if (!el.getAttribute('alt')) {
          el.setAttribute('alt', key.charAt(0).toUpperCase() + key.slice(1) + ' photo');
        }
        el.setAttribute('loading', 'lazy');
      };
      var tryFallback = function () {
        if (cfg.featuredImages && cfg.featuredImages[key]) {
          el.src = cfg.featuredImages[key];
          setAlt();
        }
      };
      // Preload to avoid broken image if missing
      var test = new Image();
      test.onload = function () { el.src = featuredPath; setAlt(); };
      test.onerror = function () { tryFallback(); };
      test.src = featuredPath;
    });
  });
})();
