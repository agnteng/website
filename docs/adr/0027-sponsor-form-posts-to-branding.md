# 0027. The sponsor form posts to the branding app, which passes it on by webhook

- Status: Accepted
- Date: 2026-11-19

## Context
agnteng.com/sponsor has a form (name, email, company) whose message has to
reach the organizers. agnteng.com is static files behind nginx; the branding
app is the one service with a server. The organizers read a Grok Bot routine
that takes webhooks, so no mail service, sending domain or DNS is needed.

## Decision
The form posts to `https://branding.agnteng.com/api/sponsor`, which posts the
enquiry to the routine's webhook as JSON: an `id` (kept on a retry), a fixed
line for the bot to read (`text`), and the visitor's fields as data (`name`,
`email`, `company`, `page`, `sentAt`). A server error is tried once more; an
enquiry that can't be passed on, for any reason, is written to the service's
log to pass on by hand. With script, the page shows the outcome in place;
without, the endpoint sends the browser back to `/sponsor#sent` or
`#not-sent`. Only agnteng.com may post, a field people never see catches bots,
and one address can send five enquiries in fifteen minutes.

The webhook's address, header and key resolve from the project's 1Password
vault (org ADR 0025): `apps/branding/.env.schema` names the items, the service
carries the token, and `start.sh` resolves them when the container starts and
starts the server with them, or without them so the decks never wait on
1Password. The endpoint reads them at run time, never at build.

Astro's built server refuses every cross-site form post, so the branding app
turns that check off (`security.checkOrigin`); `api/sponsor` is its only
`POST` endpoint and checks the origin itself. `mise run fitness:live` checks
both halves: `GET /api/sponsor` must say it can send, and an empty post from
agnteng.com must reach the endpoint (400, not Astro's 403).

## Consequences
The site stays static and nothing sends email. One feature spans two apps: a
change to the form's fields changes both. Rotating the key is a 1Password edit
and a restart of the service.
