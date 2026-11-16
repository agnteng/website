# 0018. agnteng.com serves its own fonts

- Status: Accepted
- Date: 2026-11-16
- Refines: 0007 (the brand's tokens): agnteng.com names its own font families

## Context
Every page of agnteng.com fetched its stylesheet for Manrope and Kode Mono
from Google Fonts before it could draw text: two more hosts to connect to, and
about 0.85 s on a phone in the 2026-11-16 audit.

## Decision
`apps/site` takes both typefaces from the `@fontsource-variable` packages and
serves the files itself, one variable file per family and script, with the
Latin Manrope file preloaded. Its stylesheet points the brand's `--font-sans`
and `--font-mono` at the packages' family names. The branding app is not
changed: its pages are decks and tools, not pages people land on from search.

## Consequences
agnteng.com makes no request to another host for fonts. A new weight needs no
new file. Updating a typeface means updating its package. The two font tokens
are now defined twice, in `packages/brand` and in the site's stylesheet: a
change of typeface in the brand has to be made in both.
