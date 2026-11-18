# Architecture decision records

Decisions that affect only this repository. Decisions that bind more than one
repository live in the workspace's `adr/`; a decision here that turns out to
apply everywhere is promoted there and marked `Superseded by org ADR NNNN`.

- One decision per file, `NNNN-short-title.md`, numbered in order.
- **An accepted ADR is never edited.** A new ADR supersedes it; only the old
  one's status line changes.
- Read the ADRs that cover a change before making it. A change that
  contradicts one needs a new ADR in the same pull request.
- This repository is public: an ADR names no internal infrastructure. The
  reasoning that needs it goes in the workspace.

Template: `# NNNN. Title`, then `Status`, `Date`, and the sections Context,
Decision, Consequences.

| ADR | Decision | Status |
|---|---|---|
| [0001](0001-event-data-has-one-home.md) | Event data has one home: `content/<date>/event.json` | Accepted |
| [0002](0002-luma-key-inlined-at-build.md) | `LUMA_API_KEY` is inlined at build time | Accepted |
| [0003](0003-youtube-text-generated.md) | `youtube.md` is generated from `description.md` | Superseded by 0006 |
| [0004](0004-pnpm-workspace.md) | pnpm workspace; `packages/` only for code two apps share | Accepted |
| [0005](0005-fitness-checks.md) | Every past failure becomes a fitness check | Accepted |
| [0006](0006-production-is-its-own-repository.md) | Video, write-ups and event tooling live in `agnteng/production` | Accepted |
| [0007](0007-brand-package-and-shared-public.md) | The brand is `packages/brand`; logos and photos stay in `apps/branding/public` | Accepted; event photos superseded by 0008 |
| [0008](0008-event-galleries-in-content.md) | Each event's gallery lives in `content/<date>/photos/` | Accepted |
| [0009](0009-speakers-tinted-in-brand-colours.md) | Speakers are tinted in a brand colour | Accepted; palettes superseded by 0010 |
| [0010](0010-speaker-animation-presets.md) | Speaker tiles use the brand's animation presets | Accepted |
| [0011](0011-photos-take-artifacts.md) | Photos take artifacts, not the dither | Accepted |
| [0012](0012-builder-edits-a-scene.md) | The animation builder edits a scene; templates are presets | Accepted |
| [0013](0013-builder-has-an-artifact-layer.md) | The builder has an artifact layer, for lower thirds | Accepted |
| [0014](0014-artifacts-second-colour-and-tint-strength.md) | Artifacts can take a second colour and a partial tint | Accepted |
| [0015](0015-search-engines-index-agnteng-com-only.md) | Search engines index agnteng.com only | Accepted |
| [0016](0016-one-address-per-page.md) | A page of agnteng.com has one address | Accepted |
| [0017](0017-every-event-has-a-page.md) | Every event has a page; registration stays on Luma | Accepted; what /events lists superseded by 0022 |
| [0018](0018-fonts-served-by-the-site.md) | agnteng.com serves its own fonts | Accepted |
| [0019](0019-images-in-images-with-names.md) | Images are published in `/images/` under names that say what they show | Accepted; folder superseded by 0021 |
| [0020](0020-pages-take-resized-headshots.md) | agnteng.com's pages take resized copies of speaker headshots | Accepted |
| [0021](0021-build-files-in-assets.md) | Everything on agnteng.com that isn't a page is in `/assets/` | Accepted |
| [0022](0022-events-page-is-lisbon.md) | `/events` is the Lisbon meetups | Accepted |
| [0023](0023-repeated-ui-is-a-component.md) | What the site repeats is a component; each meetup owns a colour | Accepted |
| [0024](0024-deploys-on-push-verified-live.md) | A merge to `main` deploys the sites; a deploy is done when the live check passes | Accepted |
| [0025](0025-company-logos-in-the-site.md) | Company logos are part of the site's source, in one colour | Accepted |
| [0026](0026-best-known-companies-speakers-first.md) | Speakers from the best-known companies come first | Accepted |
| [0027](0027-sponsor-form-posts-to-branding.md) | The sponsor form posts to the branding app, which emails it | Accepted |
