# 0015. Search engines index agnteng.com only, one address per page

- Status: Accepted
- Date: 2026-11-16

## Context
An audit on 2026-11-16 found that search engines could index the branding
site and the sponsor deck. The branding site holds mockups of agnteng.com,
which would compete with it for the meetup's name, and the sponsor deck is one
page at two addresses. On agnteng.com every page answered at three addresses
(`/talks`, `/talks/`, `/talks/index.html`), no page said what it was in a form
a search engine reads, and the next meetup had no page of its own.

## Decision
- agnteng.com is the only site search engines index. The branding app's one
  layout sets `<meta name="robots" content="noindex">`, so every page of it
  carries that, the sponsor deck included.
- A page of agnteng.com has one address, the one its canonical link and
  `sitemap.xml` give: no trailing slash, no `index.html`. nginx redirects the
  others to it.
- Pages describe themselves in schema.org JSON-LD built from `content/`
  (`apps/site/src/lib/schema.ts`): the organisation on the home page, an Event
  for every meetup, a VideoObject for every talk whose video is public.
- Every event has a page, upcoming ones too. Registration stays on Luma; the
  page links there.
- `mise run fitness:live` checks the noindex, the redirects and a talk's
  VideoObject.

## Consequences
The sponsor deck is reached only by its link, which is how sponsors get it. A
talk's VideoObject needs the video's publish date, which production's
`publish_talks.py` writes once the video is public; until then the talk page
has none. A new app or host is not indexed unless a later ADR says so.
