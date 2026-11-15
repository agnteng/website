# 0011. Photos take artifacts, not the dither

- Status: Accepted
- Date: 2026-11-15

## Context
The brand's dither turns a photo into an animated field of cells. Over real
photos of people it rarely looked good: faces broke up and the picture read as
an effect. The home page's hero found something that did work: the photo left
whole, with cells in one colour covering part of it and breaking up along a
ragged edge, so the photo dissolves into a block of that colour.

## Decision
A photo that should carry the brand's pixels takes artifacts: the `Artifacts`
component in `packages/brand`. Each artifact grows from an edge, a corner or
the centre; cells are whole near it and thin out to nothing. The photo may be
tinted into the artifacts' colour. A seed fixes the pattern, so the same seed
draws the same cells, and an optional animation lets a few cells along the
edge blink slowly.

The animation builder has an Artifacts treatment for a loaded photo and
writes the component's JSX; a look is designed there and pasted where it is
used. The hero and the photos of The meetup use it. Speaker tiles keep their
own treatment (0009, 0010), which is a dither behind a cut-out person, not
over a photo.

## Consequences
On a page built with Astro's images, `Artifacts` is laid over the image with
no `src`, and the image is tinted by CSS (`BlueTone.astro` for the brand
blue). With `src` the component draws the photo itself on its canvas, which is
what the builder exports. Tinting on the canvas needs a photo the browser may
read: one from the same site, or an upload.
