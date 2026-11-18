// The sponsor form on agnteng.com/sponsor posts here (docs/adr/0027): that site is static,
// and this app is the one with a server. An enquiry is emailed to the partners address
// through the transactional email service (Plunk), with the sponsor's address to reply to.
//
// Its settings come from the service's environment, never from this repository:
//   PLUNK_API_URL, PLUNK_API_KEY   the email service, and this site's key for it
//   SPONSOR_MAIL_TO                where enquiries go; partners@agnteng.com if unset
//   SPONSOR_ORIGINS                more sites allowed to post, comma-separated (development)
// Each is read when the server runs, else as inlined at build (docs/adr/0002).
//
// GET answers whether the form can send, so the live check catches a deploy that lost
// the key: everything else would still answer 200.
export const prerender = false;

import type { APIRoute } from 'astro';

const SITE = 'https://agnteng.com';
const FROM = { address: 'partners@agnteng.com', name: 'Agentic Engineering' };

const plunkUrl = process.env.PLUNK_API_URL || import.meta.env.PLUNK_API_URL;
const plunkKey = process.env.PLUNK_API_KEY || import.meta.env.PLUNK_API_KEY;
const mailTo = process.env.SPONSOR_MAIL_TO || import.meta.env.SPONSOR_MAIL_TO || 'partners@agnteng.com';
const origins = [SITE, ...String(process.env.SPONSOR_ORIGINS || import.meta.env.SPONSOR_ORIGINS || '').split(',')]
  .map((o) => o.trim().replace(/\/+$/, ''))
  .filter(Boolean);
const ready = Boolean(plunkUrl && plunkKey);

// At most five enquiries from one address in fifteen minutes; the form needs one.
const WINDOW = 15 * 60_000;
const recent = new Map<string, number[]>();
const tooMany = (who: string) => {
  const now = Date.now();
  const hits = (recent.get(who) ?? []).filter((t) => now - t < WINDOW);
  hits.push(now);
  if (recent.size > 10_000) recent.clear();
  recent.set(who, hits);
  return hits.length > 5;
};

const field = (v: FormDataEntryValue | null, max: number) => (typeof v === 'string' ? v.trim().replace(/\s+/g, ' ').slice(0, max) : '');
const html = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// The script asks for JSON. A form posted without it goes back to the page it came from,
// whose #sent or #not-sent says how it went.
function answer(request: Request, ok: boolean, status: number, error?: string) {
  const origin = request.headers.get('origin');
  const allowed = origin && origins.includes(origin) ? origin : null;
  const headers = new Headers({ 'cache-control': 'no-store', vary: 'Origin' });
  if (allowed) headers.set('access-control-allow-origin', allowed);
  if ((request.headers.get('accept') ?? '').includes('application/json')) {
    headers.set('content-type', 'application/json');
    return new Response(JSON.stringify(ok ? { ok } : { ok, error }), { status, headers });
  }
  headers.set('location', `${allowed ?? SITE}/sponsor#${ok ? 'sent' : 'not-sent'}`);
  return new Response(null, { status: 303, headers });
}

export const GET: APIRoute = () =>
  new Response(JSON.stringify({ ready }), { headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

export const OPTIONS: APIRoute = ({ request }) => {
  const origin = request.headers.get('origin');
  const headers = new Headers({ vary: 'Origin', 'access-control-allow-methods': 'POST', 'access-control-allow-headers': 'content-type, accept', 'access-control-max-age': '86400' });
  if (origin && origins.includes(origin)) headers.set('access-control-allow-origin', origin);
  return new Response(null, { status: 204, headers });
};

export const POST: APIRoute = async ({ request }) => {
  const origin = request.headers.get('origin');
  if (origin && !origins.includes(origin)) return answer(request, false, 403, 'This site can’t post here.');

  let data: FormData;
  try {
    data = await request.formData();
  } catch {
    return answer(request, false, 400, 'Send the form’s fields.');
  }
  // The field people never see: a bot filled it in. It is told the message went.
  if (field(data.get('website'), 200)) return answer(request, true, 200);

  const who = request.headers.get('cf-connecting-ip') ?? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (tooMany(who)) return answer(request, false, 429, 'Too many messages. Try again later.');

  const name = field(data.get('name'), 200);
  const email = field(data.get('email'), 254);
  const company = field(data.get('company'), 200);
  if (!name || !company || !EMAIL.test(email)) return answer(request, false, 400, 'A name, an email address and a company are needed.');

  const subject = `Sponsor enquiry: ${company}`;
  const body = [
    `<p><strong>${html(name)}</strong> from <strong>${html(company)}</strong> would like to talk about sponsoring an event.</p>`,
    `<p>Email: <a href="mailto:${html(email)}">${html(email)}</a></p>`,
    `<p style="color:#666">Sent from the form on agnteng.com/sponsor. Reply to this email to answer them.</p>`,
  ].join('\n');

  if (!ready) {
    if (import.meta.env.DEV) {
      console.info('[sponsor] no email service set up; this would go to %s: %s (%s, %s)', mailTo, subject, name, email);
      return answer(request, true, 200);
    }
    console.error('[sponsor] PLUNK_API_URL or PLUNK_API_KEY is not set');
    return answer(request, false, 503, 'The form can’t send right now.');
  }

  try {
    const res = await fetch(`${String(plunkUrl).replace(/\/+$/, '')}/v1/send`, {
      method: 'POST',
      headers: { authorization: `Bearer ${plunkKey}`, 'content-type': 'application/json' },
      // subscribed: false, or every sender would become a newsletter contact.
      body: JSON.stringify({ to: mailTo, from: FROM.address, name: FROM.name, subject, body, reply: email, subscribed: false }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      console.error('[sponsor] the email service answered %d', res.status);
      return answer(request, false, 502, 'The form can’t send right now.');
    }
  } catch (e) {
    console.error('[sponsor] the email service did not answer: %s', (e as Error).message);
    return answer(request, false, 502, 'The form can’t send right now.');
  }
  return answer(request, true, 200);
};
