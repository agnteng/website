// sponsors.agnteng.com: one private proposal per partner, each behind its own password
// (docs/adr/0029). No dependencies: node serves apps/site's build.
//
//   /            redirects to agnteng.com
//   /<partner>   the proposal, built at dist/partners/<partner>/, once the password from
//                PARTNER_<PARTNER>_PASSWORD has been entered; until then the form from
//                dist/partners/locked/. A partner with no password set stays locked.
//   /assets/…    the build's styles, fonts, scripts and images, and the site's root icons
//   anything else 404
//
// The right password sets a cookie scoped to that partner's path: an HMAC of the partner
// with its password, so changing the password signs everyone out.
import { createServer } from 'node:http';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';

const DIST = process.env.DIST ?? new URL('./dist', import.meta.url).pathname;
const PORT = Number(process.env.PORT ?? 80);
const HOME = 'https://agnteng.com';
const SLUG = /^[a-z0-9-]+$/;
const ROOT_FILES = new Set(['/favicon.ico', '/apple-touch-icon.png']);
const TYPES = {
  '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.avif': 'image/avif', '.gif': 'image/gif', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.txt': 'text/plain',
};

const password = (slug) => process.env[`PARTNER_${slug.toUpperCase().replaceAll('-', '_')}_PASSWORD`] || '';
const page = (slug) => join(DIST, 'partners', slug, 'index.html');
const isPartner = (slug) => SLUG.test(slug) && slug !== 'locked' && existsSync(page(slug));
const token = (slug) => createHmac('sha256', password(slug)).update(`partner:${slug}`).digest('hex');
const same = (a, b) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
const cookieName = (slug) => `partner_${slug.replaceAll('-', '_')}`;
const cookies = (req) => Object.fromEntries((req.headers.cookie ?? '').split(/;\s*/).filter(Boolean)
  .map((c) => [c.slice(0, c.indexOf('=')), c.slice(c.indexOf('=') + 1)]));
const signedIn = (req, slug) => !!password(slug) && same(cookies(req)[cookieName(slug)] ?? '', token(slug));

function send(res, status, body, headers = {}) {
  res.writeHead(status, { 'X-Robots-Tag': 'noindex, nofollow', 'Referrer-Policy': 'no-referrer', ...headers });
  res.end(body);
}
const html = (res, status, body) =>
  send(res, status, body, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
const locked = (res, wrong) => {
  let body = readFileSync(join(DIST, 'partners', 'locked', 'index.html'), 'utf8');
  if (wrong) body = body.replace('data-wrong hidden', 'data-wrong');
  html(res, wrong ? 401 : 200, body);
};

function readForm(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => { data += chunk; if (data.length > 4096) req.destroy(); });
    req.on('end', () => resolve(new URLSearchParams(data)));
    req.on('error', () => resolve(new URLSearchParams()));
  });
}

function file(res, path) {
  const full = normalize(join(DIST, path));
  if (!full.startsWith(DIST) || !existsSync(full) || !statSync(full).isFile()) return send(res, 404, 'Not found');
  const immutable = /^\/assets\/(images\/)?[^/]+\.[\w-]{8,}\.\w+$/.test(path);
  send(res, 200, readFileSync(full), {
    'Content-Type': TYPES[extname(full)] ?? 'application/octet-stream',
    'Cache-Control': immutable ? 'public, max-age=31536000, immutable' : 'public, max-age=3600',
  });
}

createServer(async (req, res) => {
  const { pathname } = new URL(req.url ?? '/', 'http://x');
  if (pathname === '/') return send(res, 301, '', { Location: HOME });
  if (pathname.startsWith('/assets/') || ROOT_FILES.has(pathname)) {
    return req.method === 'GET' || req.method === 'HEAD' ? file(res, pathname) : send(res, 405, '');
  }
  const slug = pathname.slice(1).replace(/\/$/, '');
  if (!isPartner(slug)) return send(res, 404, 'Not found', { 'Content-Type': 'text/plain' });
  // One address per page (docs/adr/0016).
  if (pathname.endsWith('/')) return send(res, 301, '', { Location: `/${slug}` });

  if (req.method === 'POST') {
    const given = (await readForm(req)).get('password') ?? '';
    const right = password(slug);
    if (right && same(createHmac('sha256', 'x').update(given).digest('hex'), createHmac('sha256', 'x').update(right).digest('hex'))) {
      return send(res, 303, '', {
        Location: `/${slug}`,
        'Set-Cookie': `${cookieName(slug)}=${token(slug)}; Path=/${slug}; Max-Age=7776000; HttpOnly; Secure; SameSite=Lax`,
      });
    }
    await new Promise((r) => setTimeout(r, 600)); // a guess costs a little time
    return locked(res, true);
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, '');
  if (signedIn(req, slug)) return html(res, 200, readFileSync(page(slug)));
  return locked(res, false);
}).listen(PORT, '0.0.0.0', () => {
  const partners = readdirSync(join(DIST, 'partners')).filter(isPartner);
  console.log(`sponsors on :${PORT}; partners with a password: ${partners.filter(password).join(', ') || 'none'}`);
});
