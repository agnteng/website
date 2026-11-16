# 0020. agnteng.com's pages take resized copies of speaker headshots

- Status: Accepted
- Date: 2026-11-16
- Refines: 0007, 0008 (speaker photos stay in `apps/branding/public`, served as they are)

## Context
A speaker's headshot is one 800px JPEG in `apps/branding/public/assets/speakers/`.
agnteng.com showed that file wherever the speaker appeared: in a tile a quarter
of its size, and in avatars 28 and 48 pixels wide. A talk page fetched 100 KB
for a 48px circle.

## Decision
The headshots stay where they are, and the decks keep using them from there.
On agnteng.com, `speakerImage()` in `apps/site/src/lib/data.ts` hands the same
files to the build, which makes the copies a page needs: three widths for a
speaker tile, one small file for an avatar.

## Consequences
A page no longer links to `/assets/speakers/`, though the folder is still
served. A headshot named in `event.json` that isn't in that folder fails the
build. The masks are laid over the copies by proportion, so they still fit.
