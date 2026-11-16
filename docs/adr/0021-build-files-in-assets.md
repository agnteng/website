# 0021. Everything on agnteng.com that isn't a page is in `/assets/`

- Status: Accepted
- Date: 2026-11-16
- Supersedes: 0019's folder (`/images/`); its names stand
- Refines: 0007 (the shared public folder): its `assets/` holds only subfolders

## Context
After ADR 0019 non-page files came from `/assets/`, `/images/` and `/_astro/`.
One folder is simpler to reason about and to cache.

## Decision
The build writes images to `/assets/images/` (named per ADR 0019) and scripts,
styles and fonts to `/assets/` (`build.assets`, `assetFileNames` in
`apps/site/astro.config.mjs`). Public subfolders (`/assets/logo/`,
`/assets/speakers/`, …) are unchanged. nginx caches the hashed build files for
good.

## Consequences
Files directly in `/assets/` or `/assets/images/` are build output; the public
folder must not put files there. `mise run fitness:live` fails if the home
page serves anything from `/_astro/`.
