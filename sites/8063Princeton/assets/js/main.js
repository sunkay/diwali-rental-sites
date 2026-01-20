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
      // Always point CTAs to local book.html for a stable entry point.
      // book.html will redirect to CONFIG.formUrl or show a fallback.
      btn.setAttribute('href', 'book.html');
      btn.removeAttribute('target');
      btn.removeAttribute('rel');
    });
  }

  // Modal booking experience
  function computeEmbedUrl(url) {
    if (!url) return '';
    try {
      // If docs.google.com form, ensure embedded=true
      if (url.indexOf('docs.google.com/forms') !== -1) {
        // Normalize to /viewform
        if (url.indexOf('/viewform') === -1) {
          // Some links end with /viewform?usp=sf_link
          // Leave as-is if not found; Google will redirect.
        }
        if (url.indexOf('embedded=true') === -1) {
          return url + (url.indexOf('?') === -1 ? '?' : '&') + 'embedded=true';
        }
      }
      // For forms.gle short links, return as-is (Google will redirect to embeddable target)
      return url;
    } catch (_) { return url; }
  }

  function initBookingModal(cfg) {
    var formUrl = cfg.formUrl;
    var hasForm = !!formUrl && !/your-booking-form-placeholder/i.test(formUrl);
    var ctas = document.querySelectorAll('.js-book-btn');
    if (!ctas.length) return;

    // Build modal once
    var backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.setAttribute('aria-hidden', 'true');
    backdrop.style.display = 'none';

    var modal = document.createElement('div');
    modal.className = 'modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    var titleId = 'modal-title-' + Math.random().toString(36).slice(2);
    modal.setAttribute('aria-labelledby', titleId);

    var header = document.createElement('div');
    header.className = 'modal-header';
    var title = document.createElement('h2');
    title.className = 'modal-title';
    title.id = titleId;
    title.textContent = 'Request to Book' + (cfg.propertyName ? ' — ' + cfg.propertyName : '');
    var close = document.createElement('button');
    close.className = 'modal-close';
    close.type = 'button';
    close.setAttribute('aria-label', 'Close booking dialog');
    close.textContent = '✕';
    header.appendChild(title); header.appendChild(close);

    var body = document.createElement('div');
    body.className = 'modal-body';
    var iframe = document.createElement('iframe');
    iframe.className = 'modal-iframe';
    iframe.setAttribute('title', 'Booking form');
    if (hasForm) iframe.src = computeEmbedUrl(formUrl);
    var loader = document.createElement('div');
    loader.style.display = 'grid';
    loader.style.placeItems = 'center';
    loader.style.height = '50vh';
    loader.innerHTML = '<div class="muted">Loading form…</div>';
    body.appendChild(loader);
    body.appendChild(iframe);
    iframe.addEventListener('load', function(){ loader.style.display = 'none'; });

    var footer = document.createElement('div');
    footer.className = 'modal-footer';
    var note = document.createElement('div');
    note.className = 'modal-note';
    note.textContent = 'Payments are currently cash or check only. A booking is not confirmed until we review and follow up.';
    var openNew = document.createElement('a');
    openNew.href = hasForm ? formUrl : 'book.html';
    openNew.target = '_blank';
    openNew.rel = 'noopener noreferrer';
    openNew.className = 'link';
    openNew.textContent = 'Open full form';
    footer.appendChild(note); footer.appendChild(openNew);

    modal.appendChild(header); modal.appendChild(body); modal.appendChild(footer);
    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);

    function openModal() {
      if (!hasForm) { window.location.href = 'book.html'; return; }
      backdrop.style.display = 'grid';
      backdrop.removeAttribute('aria-hidden');
      document.body.classList.add('modal-open');
      // Focus close for accessibility
      close.focus();
      document.addEventListener('keydown', onKey);
      backdrop.addEventListener('click', onBackdrop);
    }
    function closeModal() {
      document.body.classList.remove('modal-open');
      backdrop.style.display = 'none';
      backdrop.setAttribute('aria-hidden', 'true');
      document.removeEventListener('keydown', onKey);
      backdrop.removeEventListener('click', onBackdrop);
    }
    function onKey(e) { if (e.key === 'Escape') { e.preventDefault(); closeModal(); } }
    function onBackdrop(e) { if (e.target === backdrop) { closeModal(); } }
    close.addEventListener('click', closeModal);

    ctas.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        openModal();
      });
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
    initBookingModal(cfg);

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
