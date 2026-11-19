// agnteng.com's forms (sponsor, speaker) post to this app, and each one goes on to the
// organizers' Grok Bot routine as JSON (docs/adr/0027, 0028). start.sh resolves the
// webhook's settings from 1Password when the container starts; they are read from the
// environment at run time, never at build:
//   GROKBOT_WEBHOOK_URL      where the forms' posts go
//   GROKBOT_WEBHOOK_HEADER   the header the bot reads its key from: the whole line
//                            ("Authorization: Bearer <key>"), the line without the key, or
//                            only its name
//   GROKBOT_WEBHOOK_KEY      the key, when the header line leaves it out
//   FORM_ORIGINS             more sites allowed to post, comma-separated (development)
// The address and the key never go in a log.

const SITE = 'https://agnteng.com';

const webhook = String(process.env.GROKBOT_WEBHOOK_URL ?? '').trim();
const origins = [SITE, ...String(process.env.FORM_ORIGINS ?? '').split(',')]
  .map((o) => o.trim().replace(/\/+$/, ''))
  .filter(Boolean);
// The header to send, from the line and the key. Authorization takes the key as a bearer
// token; any other header takes the key as it is.
const auth = (() => {
  const line = String(process.env.GROKBOT_WEBHOOK_HEADER ?? '').trim();
  const k = String(process.env.GROKBOT_WEBHOOK_KEY ?? '').trim();
  const at = line.indexOf(':');
  const name = (at === -1 ? line : line.slice(0, at)).trim();
  let value = at === -1 ? '' : line.slice(at + 1).trim();
  if (/^authorization$/i.test(name)) {
    if (!value || /^bearer$/i.test(value)) value = /^bearer\s/i.test(k) ? k : k && `Bearer ${k}`;
  } else if (!value) value = k;
  return name && value ? { name, value } : null;
})();
const ready = Boolean(URL.canParse(webhook) && auth);

// GET on a form's endpoint says whether it can send, for the live check: a start that
// didn't resolve the settings still answers 200 everywhere else.
export const readiness = () =>
  new Response(JSON.stringify({ ready }), { headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

// One line of text: trimmed, inner whitespace collapsed, cut to `max`. `lines` keeps line
// breaks (at most one blank line in a row).
export const field = (v: FormDataEntryValue | null, max: number, lines = false) => {
  if (typeof v !== 'string') return '';
  const s = lines ? v.replace(/\r\n?/g, '\n').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n') : v.replace(/\s+/g, ' ');
  return s.trim().slice(0, max);
};
export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // the page checks the same

// Ten posts from one address in fifteen minutes, across the forms: people at an event
// share its network (docs/adr/0028).
const WINDOW = 15 * 60_000;
const recent = new Map<string, number[]>();
const tooMany = (who: string) => {
  const now = Date.now();
  const hits = (recent.get(who) ?? []).filter((t) => now - t < WINDOW);
  hits.push(now);
  if (recent.size > 10_000) recent.clear();
  recent.set(who, hits);
  return hits.length > 10;
};

// The script asks for JSON and shows `error`. A form posted without it goes back to its
// page, whose #sent or #not-sent says how it went.
function answer(request: Request, page: string, ok: boolean, status: number, error?: string) {
  const origin = request.headers.get('origin');
  const allowed = origin && origins.includes(origin) ? origin : null;
  const headers = new Headers({ 'cache-control': 'no-store', vary: 'Origin' });
  if (allowed) headers.set('access-control-allow-origin', allowed);
  if ((request.headers.get('accept') ?? '').includes('application/json')) {
    headers.set('content-type', 'application/json');
    return new Response(JSON.stringify(ok ? { ok } : { ok, error }), { status, headers });
  }
  headers.set('location', `${allowed ?? SITE}${page}#${ok ? 'sent' : 'not-sent'}`);
  return new Response(null, { status: 303, headers });
}

// A post that can't be passed on goes in the log in full, to pass on by hand.
const keep = (why: string, post: object) => console.error('[forms] %s; to pass on by hand: %s', why, JSON.stringify(post));

export interface Form {
  page: string; // where the form is, for the redirect without script
  name: string; // the form, as the bot reads it: "sponsor" or "speaker"
  text: string; // the bot's instruction; the visitor's own words stay in the fields
  read: (data: FormData) => Record<string, string> | string; // the fields, or why they're refused
}

// One form post: origin, fields, a rate limit, the hidden field, then the webhook.
export async function handle(request: Request, form: Form): Promise<Response> {
  const origin = request.headers.get('origin');
  if (origin && !origins.includes(origin)) return answer(request, form.page, false, 403, 'This site can’t post here.');

  let data: FormData;
  try {
    data = await request.formData();
  } catch {
    return answer(request, form.page, false, 400, 'Send the form’s fields.');
  }
  const fields = form.read(data);
  if (typeof fields === 'string') return answer(request, form.page, false, 400, fields);

  const who = request.headers.get('cf-connecting-ip') ?? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (tooMany(who)) return answer(request, form.page, false, 429, 'Too many messages. Try again later.');

  const post = {
    id: crypto.randomUUID(), // the same on a retry, so the bot can tell a repeat
    form: form.name,
    text: form.text,
    ...fields,
    page: `${SITE}${form.page}`,
    sentAt: new Date().toISOString(),
  };

  // The field people never see, filled in: most likely a bot, which is told it went. Kept
  // in the log in case it was a person's autofill.
  if (field(data.get('x_leave_blank'), 200)) {
    keep('the hidden field was filled', post);
    return answer(request, form.page, true, 200);
  }

  if (!ready) {
    if (import.meta.env.DEV) {
      console.info('[forms] no webhook set; this would go out: %s', JSON.stringify(post));
      return answer(request, form.page, true, 200);
    }
    keep('the webhook settings did not resolve at start', post);
    return answer(request, form.page, false, 503, 'The form can’t send right now.');
  }

  // Grok Bot answers 200 at once. A 5xx is tried once more, with the same id; its message
  // goes in the log ("is disabled" for a paused routine, "Invalid API key").
  let failure = '';
  for (const attempt of [1, 2]) {
    try {
      const res = await fetch(webhook, {
        method: 'POST',
        headers: { 'content-type': 'application/json', [auth!.name]: auth!.value },
        body: JSON.stringify(post),
        signal: AbortSignal.timeout(8_000),
      });
      if (res.ok) return answer(request, form.page, true, 200);
      const said = await res.text().catch(() => '');
      failure = `answered ${res.status} ${said.slice(0, 200)}`.trim();
      if (res.status < 500) break; // a wrong key or a paused routine won't fix itself
    } catch (e) {
      failure = `did not answer (${(e as Error).name})`;
    }
    if (attempt === 1) await new Promise((r) => setTimeout(r, 1_000));
  }
  keep(`the webhook ${failure}`, post);
  return answer(request, form.page, false, 502, 'The form can’t send right now.');
}
