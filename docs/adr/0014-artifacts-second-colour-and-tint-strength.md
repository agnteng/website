# 0014. Artifacts can take a second colour and a partial tint

- Status: Accepted
- Date: 2026-11-15
- Refines: 0011 (photos take artifacts): "cells in one colour" and an all-or-nothing tint

## Context
0011 gave a photo cells in one colour and a tint that was on or off. Some
pictures want a hint of a second brand colour where the cells break up, and
some photos should keep part of their own colour under the tint.

## Decision
`Artifacts` takes `edge`, a second colour. Only ragged cells take it, and few
of them, more often further from the solid block: the block and the tint stay
the first colour. `tint` also takes a number from 0 to 1, how far the photo
goes from its own colours to the tinted ones; `true` is 1. The builder's photo
background has both, as `edge` ('' for none) and `tintOpacity`.

## Consequences
A scene written before this reads as it did: no second colour, full tint.
The second colour is an accent chosen by the pattern's seed, not a setting
for how much of it shows. The builder's artifact layer (0013) and the tint
laid on by CSS on the site are unchanged. The builder also exports at one to
four times the frame; that is not part of a scene, so the render command
writes the frame's own size.
