# 0024. A merge to `main` deploys the sites; a deploy is done when the live check passes

- Status: Accepted
- Date: 2026-11-17
- Supersedes: workspace ADR 0005 (deploys triggered by hand), which bound only this repository

## Context
Deploys used to be triggered by hand after every merge. Since 2026-11-14 a push to `main` deploys every
site on its own. What stays true: a build that lost a build-time secret still answers HTTP 200 on every
page and reports its deployment as done, so neither says whether the site works.

## Decision
A merge to `main` deploys every site. A deploy is done only when the live fitness check
(`mise run fitness:live`) passes after it: each site answers, the sponsors host serves only the deck, and
`/api/audience.json` reports a non-zero `totalGuests`. A failing live check is fixed in the same session.

## Consequences
Merging is shipping: a branch is merged only when it is ready to be live. A deployment status is never
taken as proof; the live check is.
