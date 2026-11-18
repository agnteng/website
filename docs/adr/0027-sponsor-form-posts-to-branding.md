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
enquiry on to the organizers' bot: a JSON `POST` to a webhook, with a line to
read (`text`) and the fields (`name`, `email`, `company`, `page`, `sentAt`).
With script, the page posts with `fetch` and shows the outcome in place.
Without it, the endpoint sends the browser back to `/sponsor#sent` or
`/sponsor#not-sent`.

Only agnteng.com may post; `SPONSOR_ORIGINS` adds others for development. A
field people never see catches bots, and one address can send five enquiries
in fifteen minutes.

The webhook's address is a credential: it comes from the service's
environment (`SPONSOR_WEBHOOK_URL`), read when the server runs before the
value inlined at build (0002), and never appears in this repository or in a
log. `GET /api/sponsor` answers whether the form can send, and
`mise run fitness:live` fails when it can't.

## Consequences
The site stays static and nothing sends email. One feature spans two apps: a
change to the form's fields changes both. A deploy that loses the webhook
fails the live check instead of passing silently, as a lost `LUMA_API_KEY`
once did.
