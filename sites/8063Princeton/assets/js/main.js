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
    var apiUrl = (cfg.bookingApiUrl || '').trim();
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
    var loader = document.createElement('div');
    loader.style.display = 'grid';
    loader.style.placeItems = 'center';
    loader.style.height = '50vh';
    loader.innerHTML = '<div class="muted">Loading…</div>';
    body.appendChild(loader);

    var usingNativeForm = !!apiUrl;

    if (usingNativeForm) {
      loader.style.display = 'none';
      var form = document.createElement('form');
      form.className = 'form';
      form.setAttribute('novalidate', '');
      form.innerHTML = [
        '<div class="form-grid">',
        '  <div class="row">',
        '    <div class="field">',
        '      <label for="f-name">Full name</label>',
        '      <input id="f-name" name="name" class="input" required />',
        '    </div>',
        '    <div class="field">',
        '      <label for="f-email">Email</label>',
        '      <input id="f-email" name="email" type="email" class="input" required />',
        '    </div>',
        '  </div>',
        '  <div class="row">',
        '    <div class="field">',
        '      <label for="f-phone">Phone</label>',
        '      <input id="f-phone" name="phone" class="input" required />',
        '      <div class="help">Include country/area code</div>',
        '    </div>',
        '    <div class="field">',
        '      <label for="f-guests">Guests</label>',
        '      <input id="f-guests" name="guests" type="number" min="1" max="12" class="input" value="2" required />',
        '    </div>',
        '  </div>',
        '  <div class="row">',
        '    <div class="field">',
        '      <label for="f-checkin">Check-in</label>',
        '      <input id="f-checkin" name="checkIn" type="date" class="input" required />',
        '    </div>',
        '    <div class="field">',
        '      <label for="f-checkout">Check-out</label>',
        '      <input id="f-checkout" name="checkOut" type="date" class="input" required />',
        '    </div>',
        '  </div>',
        '  <div class="field">',
        '    <label for="f-flex">Are your dates flexible?</label>',
        '    <select id="f-flex" name="flexibility" class="select">',
        '      <option value="No">No</option>',
        '      <option value="±1 day">±1 day</option>',
        '      <option value="±3 days">±3 days</option>',
        '      <option value="Flexible">Flexible</option>',
        '    </select>',
        '  </div>',
        '  <div class="field">',
        '    <label for="f-msg">Message for host (optional)</label>',
        '    <textarea id="f-msg" name="message" class="textarea" placeholder="Any details you’d like to share"></textarea>',
        '  </div>',
        '  <div class="field" hidden>',
        '    <label for="f-company">Company</label>',
        '    <input id="f-company" name="company" class="input" />',
        '  </div>',
        '  <div class="help">Payments are currently cash or check only. Request does not confirm a booking.</div>',
        '  <div class="actions">',
        '    <button type="submit" class="btn btn-primary">Send Request</button>',
        '    <a class="btn" href="', hasForm ? formUrl : 'book.html', '" target="_blank" rel="noopener">Use Google Form</a>',
        '  </div>',
        '  <div id="f-status" class="help" aria-live="polite"></div>',
        '</div>'
      ].join('');
      body.appendChild(form);

      function val(id){ var el = form.querySelector(id); return el ? el.value.trim() : ''; }
      function setStatus(msg, cls){ var s=form.querySelector('#f-status'); s.className='help ' + (cls||''); s.textContent=msg; }
      function validEmail(s){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s); }
      form.addEventListener('submit', function(ev){
        ev.preventDefault();
        setStatus('Sending…');
        // Basic validation
        var payload = {
          property: cfg.propertyName || 'Property',
          name: val('#f-name'),
          email: val('#f-email'),
          phone: val('#f-phone'),
          guests: val('#f-guests'),
          checkIn: val('#f-checkin'),
          checkOut: val('#f-checkout'),
          flexibility: val('#f-flex'),
          message: val('#f-msg'),
          honeypot: val('#f-company')
        };
        if (!payload.name || !validEmail(payload.email) || !payload.phone || !payload.checkIn || !payload.checkOut) {
          setStatus('Please complete required fields (name, email, phone, dates).', 'error');
          return;
        }
        fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).then(function(r){
          if (!r.ok) throw new Error('Request failed: ' + r.status);
          setStatus('Thanks! Your request has been sent. We will follow up shortly.', 'success');
          form.reset();
        }).catch(function(err){
          console.error(err);
          setStatus('Could not send right now. You can also use the Google Form link.', 'error');
        });
      });
    } else {
      // Fallback to embedded Google Form
      var iframe = document.createElement('iframe');
      iframe.className = 'modal-iframe';
      iframe.setAttribute('title', 'Booking form');
      if (hasForm) iframe.src = computeEmbedUrl(formUrl);
      body.appendChild(iframe);
      iframe.addEventListener('load', function(){ loader.style.display = 'none'; });
    }

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
