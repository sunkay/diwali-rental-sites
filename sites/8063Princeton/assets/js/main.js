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
      var idx = 0, timer = null, speed = intervalMs || (window.CONFIG && window.CONFIG.carouselSpeedMs) || 3500;

      // Build minimal UI: wrap, controls, dots
      var wrapper = document.createElement('div');
      wrapper.className = 'carousel';
      var parent = imgEl.parentNode;
      parent.insertBefore(wrapper, imgEl);
      wrapper.appendChild(imgEl);

      var prevBtn = document.createElement('button');
      prevBtn.className = 'ctrl prev';
      prevBtn.type = 'button';
      prevBtn.setAttribute('aria-label', 'Previous image');
      prevBtn.textContent = '‹';

      var nextBtn = document.createElement('button');
      nextBtn.className = 'ctrl next';
      nextBtn.type = 'button';
      nextBtn.setAttribute('aria-label', 'Next image');
      nextBtn.textContent = '›';

      var dots = document.createElement('div');
      dots.className = 'dots';
      var dotEls = images.map(function (_, i) {
        var d = document.createElement('span');
        d.className = 'dot' + (i === 0 ? ' active' : '');
        d.setAttribute('aria-label', 'Go to image ' + (i + 1));
        d.setAttribute('role', 'button');
        d.tabIndex = 0;
        dots.appendChild(d);
        return d;
      });

      wrapper.appendChild(prevBtn);
      wrapper.appendChild(nextBtn);
      wrapper.appendChild(dots);

      function setActive(i) {
        dotEls.forEach(function (el, j) { el.classList.toggle('active', j === i); });
      }

      function show(i) {
        idx = (i + images.length) % images.length;
        var nextSrc = images[idx];
        imgEl.style.opacity = '0';
        var temp = new Image();
        temp.onload = function () {
          imgEl.src = nextSrc;
          requestAnimationFrame(function(){ imgEl.style.opacity = '1'; });
          setActive(idx);
        };
        temp.src = nextSrc;
      }

      function start() { stop(); timer = setInterval(function(){ show(idx + 1); }, speed); }
      function stop() { if (timer) { clearInterval(timer); timer = null; } }

      // Wire controls
      prevBtn.addEventListener('click', function(){ show(idx - 1); start(); });
      nextBtn.addEventListener('click', function(){ show(idx + 1); start(); });
      dotEls.forEach(function (d, i) {
        d.addEventListener('click', function(){ show(i); start(); });
        d.addEventListener('keydown', function(e){ if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(i); start(); } });
      });

      wrapper.addEventListener('mouseenter', stop);
      wrapper.addEventListener('mouseleave', start);

      // Initial state
      imgEl.classList.add('fade-img');
      imgEl.style.opacity = '1';
      if (images[0]) imgEl.src = images[0];
      setActive(0);
      start();
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
