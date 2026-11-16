# 0021. Everything on agnteng.com that isn't a page is in `/assets/`

- Status: Accepted
- Date: 2026-11-16
- Supersedes: 0019's folder (`/images/`); its names stand

## Context
After ADR 0019 the site published files from three places: `/assets/` (the
shared public folder), `/images/` (the build's images) and `/_astro/` (the
build's scripts, styles and fonts). One place for everything that isn't a
page is simpler to reason about and to cache.

## Decision
The build writes its images to `/assets/images/`, under the names ADR 0019
gives them, and its scripts, styles and fonts to `/assets/` itself
(`build.assets` and `assetFileNames` in `apps/site/astro.config.mjs`). The
shared public folders (`/assets/logo/`, `/assets/speakers/` and the rest) are
unchanged. nginx caches the build's files for good; they carry a hash in
their names, and the public folders' files don't.

## Consequences
A file directly in `/assets/`, or in `/assets/images/`, is build output; the
public folder must not put files there. `mise run fitness:live` checks the
home page serves nothing from `/_astro/`.
