# 0022. `/events` is the Lisbon meetups

- Status: Accepted
- Date: 2026-11-16
- Supersedes: 0017's "`/events` lists every event"; every event still has a page

## Context
`/events` is the page meant to rank for "AI events in Lisbon". Listing Berlin #1
on it, under that title, mixed in a city the page isn't about. No other city has
enough meetups yet for a page of its own.

## Decision
`/events` lists only Lisbon meetups: the next one in the hero, then every one
before it, and its structured data names only those. Meetups in other cities
keep their own pages at `/events/<city>-<n>`.

## Consequences
A meetup outside Lisbon is reached from the home page, its talks and the
sitemap, not from `/events`. When another city has enough meetups, it gets its
own page and a new ADR.
