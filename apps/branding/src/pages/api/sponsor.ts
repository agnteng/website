// The sponsor form on agnteng.com/sponsor posts here (docs/adr/0027): that site is static,
// and this app is the one with a server. An enquiry is passed on to the organizers' bot (a
// Grok Bot routine with a webhook trigger) as a JSON object, which becomes the routine's
// input: an id, a line to read, then the fields. Grok Bot answers 200 at once with the run's
// id; it has had outages, so a server error is tried once more with the same id, and an
// enquiry that still doesn't arrive goes in this service's log so it isn't lost.
//
// Its settings come from the service's environment, never from this repository; the three
// webhook values are named like the items that hold them:
//   GROKBOT_WEBHOOK_URL      where enquiries go
//   GROKBOT_WEBHOOK_HEADER   the header the bot reads its key from: the whole line
//                            ("Authorization: Bearer <key>"), the line without the key, or
//                            only the header's name
//   GROKBOT_WEBHOOK_KEY      the key, when the header line leaves it out
// The key is a credential: it stays out of the code and the logs.
//   SPONSOR_ORIGINS          more sites allowed to post, comma-separated (development)
// Each is read when the server runs, else as inlined at build (docs/adr/0002).
//
// GET answers whether the form can send, so the live check catches a deploy that lost
// the webhook: everything else would still answer 200.
export const prerender = false;

import type { APIRoute } from 'astro';

const SITE = 'https://agnteng.com';

// Values read out of a secrets manager can end in a newline; trimmed, they can't break the request.
const webhook = String(process.env.GROKBOT_WEBHOOK_URL || import.meta.env.GROKBOT_WEBHOOK_URL || '').trim();
const keyHeader = process.env.GROKBOT_WEBHOOK_HEADER || import.meta.env.GROKBOT_WEBHOOK_HEADER;
const key = process.env.GROKBOT_WEBHOOK_KEY || import.meta.env.GROKBOT_WEBHOOK_KEY;
const origins = [SITE, ...String(process.env.SPONSOR_ORIGINS || import.meta.env.SPONSOR_ORIGINS || '').split(',')]
  .map((o) => o.trim().replace(/\/+$/, ''))
  .filter(Boolean);
// The header to send, from the line and the key. Authorization takes the key as a bearer
// token; any other header takes the key as it is.
const auth = (() => {
  const line = String(keyHeader ?? '').trim();
  const k = String(key ?? '').trim();
  const at = line.indexOf(':');
  const name = (at === -1 ? line : line.slice(0, at)).trim();
  let value = at === -1 ? '' : line.slice(at + 1).trim();
  if (/^authorization$/i.test(name)) {
    if (!value || /^bearer$/i.test(value)) value = /^bearer\s/i.test(k) ? k : k && `Bearer ${k}`;
  } else if (!value) value = k;
  return name && value ? { name, value } : null;
})();
const ready = Boolean(webhook && auth);

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
    id: crypto.randomUUID(), // the same on a retry, so the bot can tell a repeat
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
    console.error('[sponsor] GROKBOT_WEBHOOK_URL or the key (GROKBOT_WEBHOOK_HEADER, GROKBOT_WEBHOOK_KEY) is not set');
    return answer(request, false, 503, 'The form can’t send right now.');
  }

  // The address and the key never go in the log; the answer's own message does (Grok Bot
  // says "is disabled" for a paused routine, "Invalid API key" for a wrong key).
  let failure = '';
  for (const attempt of [1, 2]) {
    try {
      const res = await fetch(webhook, {
        method: 'POST',
        headers: { 'content-type': 'application/json', [auth!.name]: auth!.value },
        body: JSON.stringify(enquiry),
        signal: AbortSignal.timeout(8_000),
      });
      if (res.ok) return answer(request, true, 200);
      const said = await res.text().catch(() => '');
      failure = `answered ${res.status} ${said.slice(0, 200)}`.trim();
      if (res.status < 500) break; // a wrong key or a paused routine won't fix itself
    } catch (e) {
      failure = `did not answer (${(e as Error).name})`;
    }
    if (attempt === 1) await new Promise((r) => setTimeout(r, 1_000));
  }
  console.error('[sponsor] the webhook %s; the enquiry, to pass on by hand: %s', failure, JSON.stringify(enquiry));
  return answer(request, false, 502, 'The form can’t send right now.');
};
