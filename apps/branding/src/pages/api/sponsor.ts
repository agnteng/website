// agnteng.com/sponsor's form posts here, and the enquiry goes on to the organizers' Grok Bot
// routine as JSON (docs/adr/0027). start.sh resolves the webhook's settings from 1Password
// when the container starts; they are read from the environment at run time, never at build:
//   GROKBOT_WEBHOOK_URL      where enquiries go
//   GROKBOT_WEBHOOK_HEADER   the header the bot reads its key from: the whole line
//                            ("Authorization: Bearer <key>"), the line without the key, or
//                            only its name
//   GROKBOT_WEBHOOK_KEY      the key, when the header line leaves it out
//   SPONSOR_ORIGINS          more sites allowed to post, comma-separated (development)
// The address and the key never go in a log. GET says whether the form can send, for the
// live check: a start that didn't resolve them still answers 200 everywhere else.
export const prerender = false;

import type { APIRoute } from 'astro';

const SITE = 'https://agnteng.com';

// Values read out of a secrets manager can end in a newline; trimmed, they can't break the request.
const webhook = String(process.env.GROKBOT_WEBHOOK_URL ?? '').trim();
const keyHeader = process.env.GROKBOT_WEBHOOK_HEADER;
const key = process.env.GROKBOT_WEBHOOK_KEY;
const origins = [SITE, ...String(process.env.SPONSOR_ORIGINS ?? '').split(',')]
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
const ready = Boolean(URL.canParse(webhook) && auth);

// Five enquiries from one address in fifteen minutes; the form needs one.
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
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // the page checks the same

// The script asks for JSON and shows `error`. A form posted without it goes back to the page
// it came from, whose #sent or #not-sent says how it went.
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

// An enquiry that can't be passed on goes in the log in full, to pass on by hand.
const keep = (why: string, enquiry: object) =>
  console.error('[sponsor] %s; the enquiry, to pass on by hand: %s', why, JSON.stringify(enquiry));

export const GET: APIRoute = () =>
  new Response(JSON.stringify({ ready }), { headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

export const POST: APIRoute = async ({ request }) => {
  const origin = request.headers.get('origin');
  if (origin && !origins.includes(origin)) return answer(request, false, 403, 'This site can’t post here.');

  let data: FormData;
  try {
    data = await request.formData();
  } catch {
    return answer(request, false, 400, 'Send the form’s fields.');
  }
  const name = field(data.get('name'), 200);
  const email = field(data.get('email'), 254);
  const company = field(data.get('company'), 200);
  if (!name || !company || !EMAIL.test(email)) return answer(request, false, 400, 'Enter your name, an email address like name@company.com, and your company.');

  const who = request.headers.get('cf-connecting-ip') ?? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (tooMany(who)) return answer(request, false, 429, 'Too many messages. Try again later.');

  // The bot reads `text` as its instruction, so the visitor's own words stay in the fields.
  const enquiry = {
    id: crypto.randomUUID(), // the same on a retry, so the bot can tell a repeat
    text: 'New sponsor enquiry from the form on agnteng.com/sponsor; name, email and company are what the visitor typed.',
    name,
    email,
    company,
    page: `${SITE}/sponsor`,
    sentAt: new Date().toISOString(),
  };

  // The field people never see, filled in: most likely a bot, which is told it went. Kept
  // in the log in case it was a person's autofill.
  if (field(data.get('x_leave_blank'), 200)) {
    keep('the hidden field was filled', enquiry);
    return answer(request, true, 200);
  }

  if (!ready) {
    if (import.meta.env.DEV) {
      console.info('[sponsor] no webhook set; this would go out: %s', JSON.stringify(enquiry));
      return answer(request, true, 200);
    }
    keep('the webhook settings did not resolve at start', enquiry);
    return answer(request, false, 503, 'The form can’t send right now.');
  }

  // Grok Bot answers 200 at once. A 5xx is tried once more, with the same id; its message
  // goes in the log ("is disabled" for a paused routine, "Invalid API key").
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
  keep(`the webhook ${failure}`, enquiry);
  return answer(request, false, 502, 'The form can’t send right now.');
};
