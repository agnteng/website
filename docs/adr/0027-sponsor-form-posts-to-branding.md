# 0027. The sponsor form posts to the branding app, which emails it

- Status: Accepted
- Date: 2026-11-18

## Context
agnteng.com/sponsor has a form (name, email, company) whose message has to
reach the organizers. agnteng.com is static files behind nginx. The branding
app is the one service with a server; it already answers `api/audience.json`.

## Decision
The form posts to `https://branding.agnteng.com/api/sponsor`, which emails the
enquiry through the transactional email service (Plunk), with the sender's
address to reply to. With script, the page posts with `fetch` and shows the
outcome in place. Without it, the endpoint sends the browser back to
`/sponsor#sent` or `/sponsor#not-sent`.

Only agnteng.com may post; `SPONSOR_ORIGINS` adds others for development. A
field people never see catches bots, and one address can send five enquiries
in fifteen minutes.

The email service's address and key, and where enquiries go, come from the
service's environment (`PLUNK_API_URL`, `PLUNK_API_KEY`, `SPONSOR_MAIL_TO`),
read when the server runs before the values inlined at build (0002). None of
them is in this repository. `GET /api/sponsor` answers whether the form can
send, and `mise run fitness:live` fails when it can't.

## Consequences
The site stays static. One feature spans two apps: a change to the form's
fields changes both. A deploy that loses the key fails the live check instead
of passing silently, as a lost `LUMA_API_KEY` once did.
