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
come from the service's environment (`GROKBOT_WEBHOOK_URL`,
`GROKBOT_WEBHOOK_HEADER`, `GROKBOT_WEBHOOK_KEY`, named like the items in the
secrets manager that hold them), read when the server runs before the values
inlined at build (0002). The header may be the whole line
(`Authorization: Bearer <key>`), the line without the key, or only its name;
the key fills in what it leaves out. None of them appears in this repository
or in a log. `GET /api/sponsor` answers whether the form can send, and
`mise run fitness:live` fails when it can't.

## Consequences
The site stays static and nothing sends email. One feature spans two apps: a
change to the form's fields changes both. A deploy that loses the webhook
fails the live check instead of passing silently, as a lost `LUMA_API_KEY`
once did.
