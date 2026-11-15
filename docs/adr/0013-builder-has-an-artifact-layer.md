# 0013. The builder has an artifact layer, for lower thirds

- Status: Accepted
- Date: 2026-11-15
- Refines: 0012

## Context
0012 made the builder edit a scene of layers (logo, text, photo, box, scrim,
guide) and said a new format is a preset, not code. A talk video's lower
thirds (the speaker's name, where and when it was recorded, "Coming up…") are
meant to sit on the brand's artifacts: a block of cells in a corner that
breaks up along its edge. No layer draws that. Artifacts exist only as a
photo background (0011), which covers the whole frame and cannot sit under
text in a corner.

## Decision
A seventh layer, `artifact`: a box of the brand's cells grown from a corner
or edge, solid over a share of the frame (`w`, `h`), breaking up over
`reach`, optionally turned a few degrees about its middle. Text layers over
it stay level. It draws with the cell hash of `Artifacts` in
`packages/brand` rather than a copy of it.

The presets "Lower third" and "Coming up" (group Video) are built from it.

## Consequences
The scene JSON that scripts and agents write (0012) gains the `artifact`
layer. 0012's rule stands with one exception: a format may add a layer type
when no combination of the existing ones can draw it, and that addition is
recorded in an ADR like this one.

Production's talk videos take their lower thirds' look from these presets.
