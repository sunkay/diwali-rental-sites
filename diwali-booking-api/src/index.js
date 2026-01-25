export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    const cors = buildCorsHeaders(origin, env.ALLOWED_ORIGIN);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    // Only allow /booking path
    if (url.pathname !== '/booking') {
      return json({ error: 'Not found' }, 404, cors);
    }

    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405, cors);
    }

    let payload;
    try {
      payload = await request.json();
    } catch {
      return json({ error: 'Invalid JSON' }, 400, cors);
    }

    // Extract & validate required fields
    const { name, email, phone, startDate, endDate, message, turnstileToken } = payload || {};
    const missing = [];
    if (!name) missing.push('name');
    if (!email) missing.push('email');
    if (!startDate) missing.push('startDate');
    if (!endDate) missing.push('endDate');
    if (!turnstileToken) missing.push('turnstileToken');
    if (missing.length) {
      return json({ error: 'Missing required fields', fields: missing }, 400, cors);
    }
    if (!isValidEmail(email)) {
      return json({ error: 'Invalid email' }, 400, cors);
    }

    // Verify Turnstile token (mandatory)
    const ip = request.headers.get('CF-Connecting-IP') || undefined;
    const okTurnstile = await verifyTurnstile(turnstileToken, env.TURNSTILE_SECRET_KEY, ip);
    if (!okTurnstile) {
      return json({ error: 'Turnstile validation failed' }, 403, cors);
    }

    // Compose email
    const to = (env.NOTIFY_TO || '').trim();
    if (!to) {
      return json({ error: 'Server misconfigured: NOTIFY_TO missing' }, 500, cors);
    }

    const subject = `Booking Request — ${name} (${startDate} → ${endDate})`;
    const textBody = [
      'New Booking Request',
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${phone || ''}`,
      `Start: ${startDate}`,
      `End: ${endDate}`,
      `Message: ${message || ''}`,
      `Submitted: ${new Date().toISOString()}`
    ].join('\n');
    const htmlBody = `
      <div style="font:14px/1.6 system-ui,-apple-system,Segoe UI,Roboto,Arial;">
        <h2 style="margin:0 0 8px;">New Booking Request</h2>
        <table style="border-collapse:collapse;border:1px solid #eee;">
          ${row('Name', name)}
          ${row('Email', email)}
          ${row('Phone', phone || '')}
          ${row('Start', startDate)}
          ${row('End', endDate)}
          ${row('Message', message || '')}
          ${row('Submitted', new Date().toISOString())}
        </table>
        <p style="color:#555;margin:12px 0 0;">Note: This email is a request, not a confirmed booking.</p>
      </div>`;

    try {
      // Cloudflare Email Routing (send_email binding)
      // Keep payload minimal; do not log request body
      await env.BOOKING_EMAIL.send({
        personalizations: [
          { to: to.split(',').map((e) => ({ email: e.trim() })).filter((x) => x.email) }
        ],
        from: { email: env.SENDER_EMAIL || 'noreply@diwali.group', name: 'Diwali Booking' },
        subject,
        content: [
          { type: 'text/plain', value: textBody },
          { type: 'text/html', value: htmlBody }
        ],
        reply_to: { email }
      });
    } catch (err) {
      return json({ error: 'Failed to send email' }, 502, cors);
    }

    return json({ ok: true }, 200, cors);
  }
};

function buildCorsHeaders(origin, allowed) {
  const headers = new Headers();
  headers.set('Vary', 'Origin');
  if (origin && origin === allowed) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type');
  }
  return headers;
}

function json(data, status = 200, cors = new Headers()) {
  const headers = new Headers(cors);
  headers.set('Content-Type', 'application/json');
  return new Response(JSON.stringify(data), { status, headers });
}

function isValidEmail(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || ''));
}

function row(k, v) {
  const esc = (s = '') => String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
  return `<tr><th style="text-align:left;padding:6px 8px;border:1px solid #eee;">${esc(k)}</th><td style="padding:6px 8px;border:1px solid #eee;">${esc(v)}</td></tr>`;
}

async function verifyTurnstile(token, secret, ip) {
  if (!secret || !token) return false;
  const form = new URLSearchParams();
  form.set('secret', secret);
  form.set('response', token);
  if (ip) form.set('remoteip', ip);
  try {
    const resp = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form
    });
    if (!resp.ok) return false;
    const data = await resp.json();
    return !!data.success;
  } catch {
    return false;
  }
}

