# 0025. Company logos are part of the site's source, in one colour

- Status: Accepted
- Date: 2026-11-18
- Refines: 0007 (the brand's own logos stay in `apps/branding/public`)

## Context
The home page shows where community members work: fifteen company logos in a
strip under the speakers. They take the page's text colour, are sized against
each other, and repeat in every copy of a moving strip. A file in the shared
public folder (0007) is served as it is, and an `<img>` can't take the text
colour.

## Decision
Company logos live in `apps/site/src/companies/`, one SVG per company: the
company's artwork reduced to paths with no colour of their own, white parts
cut out, at a height of 100. `apps/site/src/lib/companies.ts` lists them in
order with the size each is drawn at. The page inlines each logo once and the
strip's copies reuse it. `mise run fitness` refuses a logo that carries a
colour or another element, and a list that doesn't match the files.

## Consequences
Adding a company is an SVG and a line. The branding app can't use these logos
from here; when it needs them they move to `packages/` (0004).
