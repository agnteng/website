# 0026. Speakers from the best-known companies come first

- Status: Accepted
- Date: 2026-11-18
- Refines: 0001 (event data has one home)

## Context
The speakers page and the home page's speakers should lead with people from
the largest, best-known companies. Which companies those are is a judgement
about the site, not a fact about an event, so it doesn't belong in
`event.json`.

## Decision
`BEST_KNOWN` in `apps/site/src/lib/data.ts` names those companies, best known
first. A speaker's company ends their title in `event.json` ("Product
Engineer, PostHog" or "… at PostHog"). Speakers from the list lead, in its
order; everyone else keeps the order of their talks. The list holds company
names only, and `mise run fitness` fails when one no longer ends any speaker's
title.

## Consequences
A speaker who changes jobs, or whose title is reworded, fails fitness until
the list is updated. A speaker from another well-known company is added to
the list by hand. Five places are fixed, so a phone, which shows six speakers
on the home page, sees one other.
