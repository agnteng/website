# 0027. The sponsor form posts to the branding app, which passes it on by webhook

- Status: Accepted
- Date: 2026-11-18

## Context
agnteng.com/sponsor has a form (name, email, company) whose message has to
reach the organizers. agnteng.com is static files behind nginx. The branding
app is the one service with a server; it already answers `api/audience.json`.
Sending email would need a mail service, a verified domain and its DNS
records; the organizers already read a bot that takes webhooks.

## Decision
The form posts to `https://branding.agnteng.com/api/sponsor`, which passes the
enquiry on to the organizers' bot, a Grok Bot routine with a webhook trigger: a
JSON `POST` that becomes the routine's input, with an `id`, a line to read
(`text`) and the fields (`name`, `email`, `company`, `page`, `sentAt`). A server
error is tried once more with the same `id`; an enquiry that still doesn't
arrive is written to the service's log, so it can be passed on by hand.
With script, the page posts with `fetch` and shows the outcome in place.
Without it, the endpoint sends the browser back to `/sponsor#sent` or
`/sponsor#not-sent`.

Only agnteng.com may post; `SPONSOR_ORIGINS` adds others for development. A
field people never see catches bots, and one address can send five enquiries
in fifteen minutes.

The webhook's address, the header the bot reads its key from, and the key
(`GROKBOT_WEBHOOK_URL`, `GROKBOT_WEBHOOK_HEADER`, `GROKBOT_WEBHOOK_KEY`) resolve
from the project's 1Password vault, as on every app of the platform (org ADR
0025): `apps/branding/.env.schema` names the items, the service carries the
token, and `start.sh` resolves them with varlock when the container starts and
hands them to the server's environment. The endpoint reads them there, never
at build, so no secret is inlined into the image. If they don't resolve, the
server starts anyway and the form says it can't send. The header may be the
whole line (`Authorization: Bearer <key>`), the line without the key, or only
its name; the key fills in what it leaves out. None of the values appears in
this repository or in a log. `GET /api/sponsor` answers whether the form can
send, and `mise run fitness:live` fails when it can't.

Astro's built server refuses every cross-site form post, so the branding app
turns that check off (`security.checkOrigin`); `api/sponsor`, its only `POST`
endpoint, allows agnteng.com itself.

## Consequences
The site stays static and nothing sends email. One feature spans two apps: a
change to the form's fields changes both. A deploy that loses the webhook
fails the live check instead of passing silently, as a lost `LUMA_API_KEY`
once did. Rotating the key is a 1Password edit and a restart of the service.
