# 0015. Search engines index agnteng.com only

- Status: Accepted; the sponsors host superseded by 0029
- Date: 2026-11-16

## Context
An audit on 2026-11-16 found that search engines could index the branding
site and the sponsor deck. The branding site holds mockups of agnteng.com,
which would compete with it for the meetup's name, and the sponsor deck is one
page at two addresses.

## Decision
agnteng.com is the only site search engines index. The branding app's one
layout sets `<meta name="robots" content="noindex">`, so every page of it
carries that, the sponsor deck included. A new app or host is not indexed
unless a later ADR says so. `mise run fitness:live` checks the tag is there.

## Consequences
The sponsor deck is reached only by its link, which is how sponsors get it. A
crawler has to fetch a page to read its `noindex`, so those hosts must not
also disallow crawling in `robots.txt`.
