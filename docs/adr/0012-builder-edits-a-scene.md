# 0012. The animation builder edits a scene; templates are presets

- Status: Accepted
- Date: 2026-11-15

## Context
The builder had a fixed list of templates, each a function that drew its own
design from a few inputs. A template could not be changed, only filled in, and
a design that was not on the list could not be made. Agents had no way to make
a brand image short of driving the page by hand.

## Decision
Everything the builder shows is one scene: a frame, a background (an animated
field, a photo with artifacts, or a colour) and a list of layers (logo, text,
photo, box, scrim, guide), all plain JSON
(`apps/branding/src/components/animation-builder/scene.ts`). Positions and
sizes are fractions of the frame.

A template is a saved scene. The brand's presets are data in that file; the
builder keeps a user's own in the browser. Applying one fills the scene in,
and every value stays editable.

The same JSON is the interface for scripts and agents: the branding site's
`/render` page draws a scene with nothing around it, `/api/presets.json` lists
the presets, and `scripts/render_scene.py` photographs `/render` in headless
Chrome to make a PNG.

## Consequences
A new format is a preset, not code. The old per-template drawing functions for
speaker cards, the trio and the sponsor banner are gone; their designs are
presets built from layers, so they differ in detail from before. The decks'
title slides still call the older overlay code directly.

Rendering needs a browser, because the picture is the builder's own canvas
drawing; there is no second renderer to keep in step.
