# Agentic Engineering

The Agentic Engineering website: the brand, the decks, the sponsor deck and
each event's identity (`content/<date>/event.json`). Recordings, talk
write-ups and the video pipeline live in
[agnteng/production](https://github.com/agnteng/production), which reads that
event data from here.

What must not be public (Luma numbers, attendee and supporter lists, sponsor
terms) lives in the private workspace repository. Partner proposals are the
exception: their source is here, and only the page is behind a password
(`docs/adr/0029`). Video and audio live
in no repository.

This repository is public. Credentials live in `.env` (ignored) or come from a
secrets manager at runtime; never commit one. Every push and pull request is
scanned by gitleaks, and GitHub push protection is on. For the same scan
locally before each commit, run once per clone:

```sh
git config core.hooksPath .githooks   # needs: brew install gitleaks
```

## Layout

| Path | What |
|---|---|
| `apps/branding/` | [branding.agnteng.com](https://branding.agnteng.com) (Astro): brand guidelines, playground, website mockups, the `slides/<city>-<date>` decks, `sponsorship`, `api/audience.json` (live Luma numbers for tonight's deck), and `api/sponsor` and `api/speak`, which pass agnteng.com's sponsor and talk forms on by webhook (`docs/adr/0027`, `0028`). Its secrets resolve from 1Password when it starts (`.env.schema`, `start.sh`). |
| `apps/branding/src/components/slides/` | The deck engine and primitives; `slides/meetup/` holds the slides every meetup deck shares, `slides-<date>/` one meetup's own. |
| `apps/branding/src/lib/luma.ts` | Server-only Luma client. Import it only from `.astro` frontmatter or `src/pages/api/`, so `LUMA_API_KEY` stays out of the browser bundle. |
| `apps/site/` | [agnteng.com](https://agnteng.com) (Astro, static): the next event, every talk with its video and transcript, the speakers, past events with their Q&A, the newsletter's latest posts, `/sponsor` for companies and `/speak` to apply for a talk. Also builds the partner proposals in `src/pages/partners/`, which only [sponsors.agnteng.com](https://sponsors.agnteng.com) serves, each behind its password (`sponsors.mjs`, `docs/adr/0029`). |
| `apps/site/src/companies/` | The logos of the companies community members work at, in one colour; `apps/site/src/lib/companies.ts` lists them with their sizes (`docs/adr/0025`). |
| `packages/brand/` | The brand, shared by both apps as raw source: tokens (`styles.css`), components, the pixel icons and the dither (`Animation`, `DuotoneField`). The brand's logos and the photos stay in `apps/branding/public/`, which the site serves too. |
| `content/<date>/event.json` | One event's identity: city, venue, Luma ids, speakers. The decks import it as `@content/<date>/event.json`; production reads it for the write-ups. |
| `content/<date>/talks/`, `questions.json`, `takeaways.json` | Each talk, the Q&A and the event's main takeaways, written by production's `publish_talks.py` (org ADRs 0007, 0020). Never edited here. |
| `scripts/fitness.py` | The fitness checks (`docs/adr/0005`). |
| `scripts/render_scene.py` | A brand image or animation from the animation builder's presets, as PNG, JPG, GIF or MP4 (`docs/adr/0012`; the `brand-image` skill). |
| `docs/adr/` | Decisions about this repository, and why. Org-wide decisions live in the workspace. |
| `tests/snapshots/` | What every page renders (without Luma data); `mise run fitness:render` compares against it. |

## A new meetup

1. `content/<date>/event.json`: in production, run
   `python3 scripts/luma_event.py ae-<city>-<n> --write` (Luma slugs are always
   `ae-<city>-<n>`), then add speaker photos by hand.
2. `apps/branding/src/components/slides-<date>/`: copy the last deck's
   `content.ts` and `SlideDeck.tsx` (point the `@content` import at the new
   date), plus `apps/branding/src/pages/slides/<city>-<date>.astro`. Point
   `src/pages/api/audience.json.ts` at the new deck's `content.ts`, so the live
   audience slide polls tonight's event.
3. After the event, production's `meetup-video` skill turns the recording into
   published talks.

## Develop

Tool versions are pinned in `mise.toml`; tasks run the same locally and in CI.

```sh
mise install            # node, pnpm, python, gitleaks
mise run install        # dependencies, from the repository root
mise run dev            # branding site on 127.0.0.1:4321
mise run dev:site       # agnteng.com on 127.0.0.1:4330
# a partner proposal as sponsors.agnteng.com serves it, on 127.0.0.1:4340/<partner>:
pnpm --filter site build && PORT=4340 PARTNER_TRIBE_PASSWORD=pick-one node apps/site/sponsors.mjs
mise run fitness        # the repository checks CI runs
mise tasks              # everything else
```

The deck pages and `api/audience.json` render on demand. `LUMA_API_KEY` is read
from `.env` at the repository root and inlined at build time
(`docs/adr/0002`); without it they render with no Luma data.

The forms' endpoints send only with their secrets from 1Password (`docs/adr/0027`): put
`OP_TOKEN=varlock(prompt)` in `apps/branding/.env.local`, run
`pnpm --filter branding exec varlock load` there once to enter the token, then start
the app with `pnpm --filter branding exec varlock run -- astro dev`.

## Deploy

Dokploy services build from `main`, with the repository root as build
context: `branding` (`apps/branding/Dockerfile`, a node server), `sponsors`
(`apps/branding/Dockerfile.sponsors`, a node server for the partner proposals; each
partner's password is its `PARTNER_<PARTNER>_PASSWORD` variable) and
`site` (`apps/site/Dockerfile`, nginx serving agnteng.com; the service and its
domain are not set up yet). The site reads the
newsletter feed at build time, so a new Substack post appears on the next deploy.
After every deploy, `mise run fitness:live` checks production.
