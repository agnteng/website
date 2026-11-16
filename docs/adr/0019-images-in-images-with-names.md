# 0019. Images are published in `/images/` under names that say what they show

- Status: Accepted; folder superseded by 0021
- Date: 2026-11-16

## Context
Every image a page showed was served from Astro's build folder under its
source file's name and a hash: `/_astro/01.DgiJZihE_Z1kWUi3.webp`. Gallery
photos are numbered, so the address said nothing about the picture, to a
person or to an image search.

## Decision
`apps/site` publishes images in `/images/`, named for what they show
(`apps/site/image-names.mjs`): a gallery photo by its meetup
(`agentic-engineering-lisbon-5-ai-meetup-15`), a talk's still by its title and
speaker, a headshot by the speaker's name. The hash stays in the name, so the
files can be cached for good; nginx does that for `/images/` as for
`/_astro/`.

## Consequences
An image's address changes when its file or its name's source (a talk's
title, an event's number) changes. A name is built from the city, the
meetup's number, a talk's title and speaker or a speaker's name, never the
venue; `mise run fitness` checks that. Logos, speaker masks and the share
image stay in `/assets/`, which both apps serve as it is (ADR 0007).
