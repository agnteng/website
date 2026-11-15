---
name: brand-image
description: Make a speaker announcement (JPG, GIF and MP4 for one to three speakers) or another brand image (event cover, social or sponsor banner, photo with artifacts) from the animation builder. Use when the user asks for speaker cards, an announcement image or video, a cover, a banner or other branded graphic.
---

# Brand images

## A speaker announcement

One command, for one to three speakers. It writes a JPG, a GIF and an MP4:

```sh
python3 scripts/speaker_cards.py --date "Lisbon · 27 Jan" \
  --speaker "Anna Lima|Staff Engineer, Acme|/path/to/anna.jpg" \
  --speaker "Rui Costa|Founder, Beta|/path/to/rui.jpg" \
  --out "$AGNTENG_MEDIA/<date>/speakers"
```

Or pass a JSON file: `{"date": "…", "speakers": [{"name", "title", "photo"}]}`.
Photos are files or URLs; a square crop of the face works best. Look at the
JPG before handing the set over: a face cropped by its slot, a long title
running into the next column. Done when all three files exist and the JPG
reads well. Needs Chrome, ffmpeg and the network.

## Anything else

`scripts/render_scene.py` draws a scene from the animation builder and writes a
PNG. Run it from this repository's root. It needs Chrome and the network.

1. **List the presets**: `python3 scripts/render_scene.py --presets`. Each
   line under a preset is one layer and its path (`layers.2  text  Speaker name`).
   Done when you know which preset fits and which layers to fill.
2. **Render**, changing values with `--set PATH=VALUE`:

   ```sh
   python3 scripts/render_scene.py --preset "Speaker card" \
     --set layers.0.src=/path/to/photo.jpg \
     --set "layers.2.text=Anna Lima" --set "layers.3.text=Staff Engineer, Acme" \
     "$AGNTENG_MEDIA/<date>/speaker-anna-lima.png"
   ```

   A `src` that is a file on this machine is served to the renderer for you.
   `background.*` and `frame.w` / `frame.h` are settable the same way.
3. **Look at the PNG** before handing it over: text that overflows, a face
   cropped by a photo slot, an empty slot. Fix with more `--set` values
   (`layers.N.size`, `.x`, `.y`, `.w`, `.h`).

For a design no preset covers, write the scene as JSON and render that file:
`python3 scripts/render_scene.py scene.json out.png`. Every field is documented
in `apps/branding/src/components/animation-builder/scene.ts`; anything left out
takes its default. The user can also build it in the builder
(`branding.agnteng.com/playground`) and paste the Code drawer's Scene tab.

Speaker photos are private until published: write outputs under
`$AGNTENG_MEDIA/<date>/`, never into the repository.
