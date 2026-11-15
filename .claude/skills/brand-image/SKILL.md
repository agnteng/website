---
name: brand-image
description: Render a brand image (speaker card or trio, event cover, social or sponsor banner, photo with artifacts) to a PNG from the animation builder's presets. Use when the user asks for a speaker card, announcement image, cover, banner or other branded graphic.
---

# Brand images

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
