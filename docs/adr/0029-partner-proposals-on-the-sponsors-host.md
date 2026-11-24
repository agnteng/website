# 0029. Partner proposals live on the sponsors host, each behind a password

- Status: Accepted
- Date: 2026-11-24
- Refines: 0015, 0024

## Context
Sponsors used to get one public deck at sponsors.agnteng.com. Now a company we
are talking to gets a proposal written for it: who we are, who they are, what
the partnership includes with mockups of it, and the price. A proposal is for
that company only. It should look like agnteng.com, not like a slide deck, and
open with a simple password sent with the link. agnteng.com stops pointing at
the deck: the site's sponsor page and its form replace it.

## Decision
A proposal is a page of `apps/site`, at `src/pages/partners/<partner>.astro`,
built with the rest of the site so it has the site's components, photos and
fonts. agnteng.com refuses `/partners/` (nginx). sponsors.agnteng.com runs
`apps/site/sponsors.mjs`, a node server with no dependencies, over the same
build:

- `/` redirects to agnteng.com.
- `/<partner>` shows a password form (`partners/locked`) until the password is
  entered, then the proposal. The password is the service's
  `PARTNER_<PARTNER>_PASSWORD` variable, read at run time; a partner without one
  stays locked. The right password sets an HMAC cookie scoped to that path.
- The build's assets are served; every other path is 404. Every response says
  `noindex`.

The sponsor deck stays on branding.agnteng.com. The sponsors service keeps its
Dockerfile path, `apps/branding/Dockerfile.sponsors`, which now builds the site.

## Consequences
- A proposal's text, prices and mockups are in this public repository. The
  password keeps the page from being found and read in passing, not the
  source: anything that must stay secret does not go in a proposal.
- The mockup images are served by agnteng.com too, under hashed names nothing
  links to.
- A new proposal is a page and a variable on the sponsors service. When there
  are several, the common parts can become components.
- `mise run fitness` checks that partner pages are `noindex` and that
  agnteng.com refuses them; `fitness:live` checks the redirect, the password
  form and the 404s.
