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

    // Feature images on Home using Option A: assets/img/featured/{key}.webp
    // Falls back to CONFIG.featuredImages[key], then leaves existing src.
    ['living','kitchen','bedroom','study'].forEach(function (key) {
      var el = document.querySelector('[data-feature="' + key + '"]');
      if (!el) return;
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
