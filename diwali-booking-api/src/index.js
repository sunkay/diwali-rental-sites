// Cloudflare Worker: Bookings API (v1) with multi-site support
const API_PREFIX = '/v1';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    const cors = buildCorsHeaders(origin, env.ALLOWED_ORIGINS);

    if (request.method === 'OPTIONS') return noContent(cors);

    // Admin routes (HTML)
    if (url.pathname === '/admin' && request.method === 'GET') {
      if (!(await isAuthorized(request, env))) return unauthorized();
      const list = await listBookings(env, { limit: 100, offset: 0, site: null, includeDeleted: false });
      return html(renderAdmin(list), 200);
    }

    // Admin JSON list (legacy)
    if (url.pathname === '/admin/bookings' && request.method === 'GET') {
      if (!(await isAuthorized(request, env))) return unauthorized();
      const limit = clampInt(url.searchParams.get('limit'), 1, 200, 50);
      const offset = clampInt(url.searchParams.get('offset'), 0, 10000, 0);
      const site = (url.searchParams.get('site') || '').trim() || null;
      const includeDeleted = (url.searchParams.get('includeDeleted') || '') === 'true';
      const data = await listBookings(env, { limit, offset, site, includeDeleted });
      return json({ ok: true, data }, 200, cors);
    }

    // v1 API: list bookings (admin)
    if (url.pathname === `${API_PREFIX}/bookings` && request.method === 'GET') {
      if (!(await isAuthorized(request, env))) return unauthorized();
      const limit = clampInt(url.searchParams.get('limit'), 1, 200, 50);
      const offset = clampInt(url.searchParams.get('offset'), 0, 10000, 0);
      const site = (url.searchParams.get('site') || '').trim() || null;
      const includeDeleted = (url.searchParams.get('includeDeleted') || '') === 'true';
      const data = await listBookings(env, { limit, offset, site, includeDeleted });
      return json({ ok: true, data }, 200, cors);
    }

    // v1 API: create booking (public)
    if (url.pathname === `${API_PREFIX}/bookings` && request.method === 'POST') {
      return handleCreateBooking(request, env, cors);
    }

    // v1 API: item operations (admin)
    if (url.pathname.startsWith(`${API_PREFIX}/bookings/`)) {
      const id = parseInt(url.pathname.slice(`${API_PREFIX}/bookings/`.length), 10);
      if (!Number.isFinite(id)) return json({ error: 'Invalid ID' }, 400, cors);
      if (!(await isAuthorized(request, env))) return unauthorized();
      if (request.method === 'GET') {
        const row = await getBooking(env, id);
        if (!row) return json({ error: 'Not found' }, 404, cors);
        return json({ ok: true, data: row }, 200, cors);
      }
      if (request.method === 'PATCH') {
        let body; try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400, cors); }
        const allowed = {};
        if (typeof body.status === 'string') allowed.status = String(body.status).slice(0, 32);
        if (typeof body.message === 'string') allowed.message = String(body.message).slice(0, 5000);
        if (!Object.keys(allowed).length) return json({ error: 'No updatable fields' }, 400, cors);
        await updateBooking(env, id, allowed);
        const row = await getBooking(env, id);
        return json({ ok: true, data: row }, 200, cors);
      }
      if (request.method === 'DELETE') {
        await softDeleteBooking(env, id);
        return json({ ok: true }, 200, cors);
      }
      return json({ error: 'Method not allowed' }, 405, cors);
    }

    // Back-compat create endpoint
    if (url.pathname === '/booking' && request.method === 'POST') {
      return handleCreateBooking(request, env, cors);
    }

    return json({ error: 'Not found' }, 404, cors);
  }
};

function buildCorsHeaders(origin, allowedCsv) {
  const headers = new Headers();
  headers.set('Vary', 'Origin');
  const allowed = (allowedCsv || '').split(',').map(s => s.trim()).filter(Boolean);
  if (origin && allowed.includes(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
  return headers;
}

function applySecurity(h) {
  h.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  h.set('X-Content-Type-Options', 'nosniff');
  h.set('Referrer-Policy', 'no-referrer');
  h.set('Cache-Control', 'no-store');
}

function noContent(cors = new Headers()) {
  const h = new Headers(cors);
  applySecurity(h);
  return new Response(null, { status: 204, headers: h });
}

function json(data, status = 200, cors = new Headers()) {
  const h = new Headers(cors);
  h.set('Content-Type', 'application/json');
  applySecurity(h);
  return new Response(JSON.stringify(data), { status, headers: h });
}

function html(content, status = 200) {
  const h = new Headers({ 'Content-Type': 'text/html; charset=utf-8' });
  applySecurity(h);
  return new Response(content, { status, headers: h });
}

function validEmail(s) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || '')); }
function clampInt(v, min, max, d) { const n = parseInt(v, 10); if (Number.isFinite(n)) return Math.max(min, Math.min(max, n)); return d; }

async function verifyTurnstile(token, secret, ip) {
  if (!secret || !token) return false;
  const form = new URLSearchParams();
  form.set('secret', secret);
  form.set('response', token);
  if (ip) form.set('remoteip', ip);
  try {
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: form
    });
    if (!r.ok) return false;
    const j = await r.json();
    return !!j.success;
  } catch { return false; }
}

async function listBookings(env, { limit, offset, site, includeDeleted }) {
  let q = `SELECT id, created_at, site, name, email, phone, start_date, end_date, message, status, extras FROM bookings`;
  const cond = [];
  const args = [];
  if (!includeDeleted) { cond.push(`status != 'deleted'`); }
  if (site) { cond.push(`site = ?`); args.push(site); }
  if (cond.length) q += ` WHERE ` + cond.join(' AND ');
  q += ` ORDER BY datetime(created_at) DESC LIMIT ? OFFSET ?`;
  args.push(limit, offset);
  const rs = await env.DB.prepare(q).bind(...args).all();
  return rs.results || [];
}

async function getBooking(env, id) {
  const q = `SELECT id, created_at, site, name, email, phone, start_date, end_date, message, status, extras FROM bookings WHERE id = ?`;
  const r = await env.DB.prepare(q).bind(id).first();
  return r || null;
}

async function updateBooking(env, id, fields) {
  const sets = [];
  const args = [];
  for (const [k, v] of Object.entries(fields)) { sets.push(`${k} = ?`); args.push(v); }
  args.push(id);
  const q = `UPDATE bookings SET ${sets.join(', ')} WHERE id = ?`;
  await env.DB.prepare(q).bind(...args).run();
}

async function softDeleteBooking(env, id) {
  await env.DB.prepare(`UPDATE bookings SET status = 'deleted' WHERE id = ?`).bind(id).run();
}

function renderAdmin(rows) {
  const esc = (s='') => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const tr = r => `<tr>
    <td>${r.id}</td><td>${esc(r.created_at)}</td><td>${esc(r.site||'')}</td><td>${esc(r.name)}</td><td>${esc(r.email)}</td>
    <td>${esc(r.phone||'')}</td><td>${esc(r.start_date)} → ${esc(r.end_date)}</td>
    <td>${esc(r.status||'')}</td><td>${esc(r.message||'')}</td>
  </tr>`;
  return `<!doctype html><meta charset=\"utf-8\"><title>Bookings</title>
  <style>body{font:14px/1.5 system-ui,-apple-system,Segoe UI,Roboto,Arial;padding:20px;}table{border-collapse:collapse;width:100%}th,td{border:1px solid #eee;padding:6px 8px;text-align:left}th{background:#fafafa;}</style>
  <h1>Bookings</h1>
  <table><thead><tr>
  <th>ID</th><th>Created</th><th>Site</th><th>Name</th><th>Email</th><th>Phone</th><th>Dates</th><th>Status</th><th>Message</th>
  </tr></thead><tbody>${rows.map(tr).join('')}</tbody></table>`;
}

function unauthorized() {
  return new Response('Unauthorized', { status: 401, headers: { 'WWW-Authenticate': 'Basic realm=\"Admin\"' } });
}

async function isAuthorized(request, env) {
  // Allow Cloudflare Access if present
  if (request.headers.get('Cf-Access-Jwt-Assertion')) {
    return true;
  }
  // Basic Auth fallback when ADMIN_USER/PASS configured
  const user = env.ADMIN_USER || '';
  const pass = env.ADMIN_PASS || '';
  if (user && pass) {
    const hdr = request.headers.get('Authorization') || '';
    if (!hdr.startsWith('Basic ')) return false;
    try {
      const decoded = atob(hdr.slice(6));
      const [u, p] = decoded.split(':');
      return u === user && p === pass;
    } catch { return false; }
  }
  // Deny by default if neither Access nor Basic is configured
  return false;
}

async function handleCreateBooking(request, env, cors) {
  // Parse JSON with tolerant field names to support current frontend
  let body; try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400, cors); }

  const name = (body.name || '').trim();
  const email = (body.email || '').trim();
  const phone = (body.phone || '').trim();
  const startDate = (body.startDate || body.checkIn || '').trim();
  const endDate = (body.endDate || body.checkOut || '').trim();
  const message = (body.message || '').trim();
  const turnstileToken = (body.turnstileToken || '').trim();
  const siteRaw = (body.site || body.propertySlug || body.property || '').trim();
  const site = siteRaw ? slugify(siteRaw) : '';

  const missing = [];
  if (!site) missing.push('site');
  if (!name) missing.push('name');
  if (!email) missing.push('email');
  if (!startDate) missing.push('startDate');
  if (!endDate) missing.push('endDate');
  if (!turnstileToken) missing.push('turnstileToken');
  if (missing.length) return json({ error: 'Missing required fields', fields: missing }, 400, cors);
  if (!validEmail(email)) return json({ error: 'Invalid email' }, 400, cors);

  // Turnstile verification
  const ip = request.headers.get('CF-Connecting-IP') || undefined;
  const ok = await verifyTurnstile(turnstileToken, env.TURNSTILE_SECRET_KEY, ip);
  if (!ok) return json({ error: 'Turnstile validation failed' }, 403, cors);

  // Prepare extras blob for any additional fields
  const extras = JSON.stringify({
    guests: body.guests || null,
    flexibility: body.flexibility || null,
    property: body.property || null,
    honeypot: body.honeypot || null
  });

  // Insert booking into D1
  const ua = request.headers.get('User-Agent') || '';
  const stmt = `INSERT INTO bookings (site,name,email,phone,start_date,end_date,message,ip,ua,extras) VALUES (?,?,?,?,?,?,?,?,?,?)`;
  try {
    const res = await env.DB.prepare(stmt)
      .bind(site, name, email, phone || null, startDate, endDate, message || null, ip || null, ua, extras)
      .run();
    const id = (res && res.meta && typeof res.meta.last_row_id !== 'undefined')
      ? res.meta.last_row_id
      : undefined;
    return json({ ok: true, id }, 200, cors);
  } catch (e) {
    return json({ error: 'DB error' }, 500, cors);
  }
}

function slugify(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
}
