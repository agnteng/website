# 0016. A page of agnteng.com has one address

- Status: Accepted
- Date: 2026-11-16

## Context
Every page answered at four addresses: `/talks`, `/talks/`,
`/talks/index.html` and `/talks/index`. A search engine treats those as
duplicates and picks one itself; the canonical link was only a hint.

## Decision
A page's address is the one its canonical link and `sitemap.xml` give: no
trailing slash, no `index.html`. nginx answers the other forms with a 301 to
it and no longer serves `<path>.html`. `mise run fitness:live` checks the
redirects.

## Consequences
An internal link in any other form costs the visitor a redirect. nginx matches
the decoded path, so only plain paths are redirected: a decoded `\` at the
start of a `Location` would send the visitor to another site.
