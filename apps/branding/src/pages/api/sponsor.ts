// The sponsor form on agnteng.com/sponsor posts here (docs/adr/0027): that site is static,
// and this app is the one with a server. An enquiry is passed on to the organizers' bot by
// webhook, as JSON: a line to read, then the fields.
//
// Its settings come from the service's environment, never from this repository:
//   SPONSOR_WEBHOOK_URL   where enquiries go; it is a credential, so it stays out of the code
//   SPONSOR_ORIGINS       more sites allowed to post, comma-separated (development)
// Each is read when the server runs, else as inlined at build (docs/adr/0002).
//
// GET answers whether the form can send, so the live check catches a deploy that lost
// the webhook: everything else would still answer 200.
export const prerender = false;

import type { APIRoute } from 'astro';

const SITE = 'https://agnteng.com';

const webhook = process.env.SPONSOR_WEBHOOK_URL || import.meta.env.SPONSOR_WEBHOOK_URL;
const origins = [SITE, ...String(process.env.SPONSOR_ORIGINS || import.meta.env.SPONSOR_ORIGINS || '').split(',')]
  .map((o) => o.trim().replace(/\/+$/, ''))
  .filter(Boolean);
const ready = Boolean(webhook);

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

  const enquiry = {
    text: `New sponsor enquiry: ${name} (${email}) from ${company}, via agnteng.com/sponsor`,
    name,
    email,
    company,
    page: `${SITE}/sponsor`,
    sentAt: new Date().toISOString(),
  };

  if (!ready) {
    if (import.meta.env.DEV) {
      console.info('[sponsor] no webhook set; this would go out: %s', enquiry.text);
      return answer(request, true, 200);
    }
    console.error('[sponsor] SPONSOR_WEBHOOK_URL is not set');
    return answer(request, false, 503, 'The form can’t send right now.');
  }

  try {
    const res = await fetch(String(webhook), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(enquiry),
      signal: AbortSignal.timeout(10_000),
    });
    // Its address is a credential: only the status goes in the log.
    if (!res.ok) {
      console.error('[sponsor] the webhook answered %d', res.status);
      return answer(request, false, 502, 'The form can’t send right now.');
    }
  } catch (e) {
    console.error('[sponsor] the webhook did not answer: %s', (e as Error).name);
    return answer(request, false, 502, 'The form can’t send right now.');
  }
  return answer(request, true, 200);
};
