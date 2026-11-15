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
A photo that should carry the brand's pixels takes artifacts (`Artifacts` in
`packages/brand`), not the dither. A look is designed in the animation
builder's Artifacts treatment, which writes the component's JSX, and pasted
where it is used. The hero and the photos of The meetup use it. Speaker tiles
keep their own treatment (0009 and 0010 here): a dither behind a cut-out
person, not over a photo.

## Consequences
On a page built with Astro's images, `Artifacts` is laid over the image with
no `src`, and the image is tinted by CSS (`BlueTone.astro` for the brand
blue). With `src` the component draws the photo itself on its canvas, which is
what the builder exports. Tinting on the canvas needs a photo the browser may
read: one from the same site, or an upload.

A seed fixes the pattern for one frame size and cell size, since cells sit
on a grid: the same JSX in a frame of another size draws another pattern.
