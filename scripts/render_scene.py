#!/usr/bin/env python3
"""Render a scene from the animation builder to a PNG.

    python3 scripts/render_scene.py scene.json out.png
    python3 scripts/render_scene.py --preset "Speaker card" --set layers.0.src=anna.jpg \\
            --set "layers.2.text=Anna Lima" out.png
    python3 scripts/render_scene.py --presets              # list the presets

A scene is the JSON the builder's Code drawer shows (frame, background, layers;
apps/branding/src/components/animation-builder/scene.ts documents every field).
--preset starts from one of the builder's presets; each --set changes one value,
addressed by a dotted path into the scene. A value that names a file on this
machine (a photo, a logo) is served to the page for the length of the render.

The picture is drawn by the branding site's /render page in headless Chrome, so
it is the builder's own drawing. --site picks the site: the live one by
default, or a local `mise run dev` (http://127.0.0.1:4321).

Needs Chrome or Chromium (CHROME_BIN, else the usual places).
"""

from __future__ import annotations

import argparse
import functools
import http.server
import json
import os
import pathlib
import shutil
import subprocess
import sys
import tempfile
import threading
import urllib.parse
import urllib.request

SITE = "https://branding.agnteng.com"
CHROMES = ("google-chrome", "google-chrome-stable", "chromium", "chromium-browser",
           "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
           "/Applications/Chromium.app/Contents/MacOS/Chromium")


def die(msg: str) -> None:
    sys.exit(f"render_scene: {msg}")


def chrome() -> str:
    for c in (os.environ.get("CHROME_BIN"), *CHROMES):
        if c and (shutil.which(c) or pathlib.Path(c).is_file()):
            return shutil.which(c) or c
    die("no Chrome or Chromium found: install one or set CHROME_BIN")


def presets(site: str) -> list[dict]:
    req = urllib.request.Request(f"{site}/api/presets.json", headers={"User-Agent": "agnteng-render"})
    return json.load(urllib.request.urlopen(req, timeout=30))


def set_path(scene: dict, path: str, value: str) -> None:
    """scene['layers'][0]['src'] = value, for path 'layers.0.src'. Numbers and booleans are read as such."""
    try:
        parsed = json.loads(value)
    except json.JSONDecodeError:
        parsed = value
    *parents, last = path.split(".")
    node = scene
    try:
        for p in parents:
            node = node[int(p)] if isinstance(node, list) else node[p]
        if isinstance(node, list):
            node[int(last)] = parsed
        else:
            node[last] = parsed
    except (KeyError, IndexError, ValueError, TypeError):
        die(f"--set {path}: the scene has no such place")


class Quiet(http.server.SimpleHTTPRequestHandler):
    """Serves the scene and its local files to the render page, which is on another origin."""

    def end_headers(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        super().end_headers()

    def log_message(self, *args) -> None:
        pass


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("scene", nargs="?", help="a scene's JSON file (or use --preset)")
    ap.add_argument("out", nargs="?", help="the PNG to write")
    ap.add_argument("--preset", help="start from this builder preset")
    ap.add_argument("--set", action="append", default=[], metavar="PATH=VALUE", help="change one value of the scene")
    ap.add_argument("--presets", action="store_true", help="list the presets and stop")
    ap.add_argument("--site", default=os.environ.get("BRANDING_SITE", SITE))
    args = ap.parse_args()
    site = args.site.rstrip("/")

    if args.presets:
        for p in presets(site):
            f = p["scene"]["frame"]
            print(f"{p['name']:22} {f['w']}x{f['h']:<6} {p['group']}")
            for i, layer in enumerate(p["scene"]["layers"]):
                what = layer.get("text") or layer.get("label") or layer.get("form") or layer.get("shape") or ""
                print(f"    layers.{i}  {layer['type']:6} {what}")
        return

    # With --preset there is one positional, and it is the output.
    out = args.out or (args.scene if args.preset else None)
    if args.preset:
        found = [p for p in presets(site) if p["name"].lower() == args.preset.lower()]
        if not found:
            die(f"no preset called {args.preset!r}; --presets lists them")
        scene = found[0]["scene"]
    elif args.scene and args.out:
        scene = json.loads(pathlib.Path(args.scene).read_text())
    else:
        scene = None
    if scene is None or not out:
        ap.error("give a scene file and an output, or --preset NAME and an output")
    for s in args.set:
        if "=" not in s:
            die(f"--set {s}: write PATH=VALUE")
        set_path(scene, *s.split("=", 1))
    frame = scene.get("frame") or {"w": 1920, "h": 1080}

    with tempfile.TemporaryDirectory() as tmp:
        root = pathlib.Path(tmp)
        srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(Quiet, directory=tmp))
        base = f"http://127.0.0.1:{srv.server_address[1]}"
        threading.Thread(target=srv.serve_forever, daemon=True).start()

        # Any `src` that is a file here is copied next to the scene and served from there.
        n = 0
        def local(node):
            nonlocal n
            if isinstance(node, dict):
                for k, v in node.items():
                    if k == "src" and isinstance(v, str) and v and "://" not in v and not v.startswith(("/", "data:")) or (
                            k == "src" and isinstance(v, str) and pathlib.Path(v).expanduser().is_file()):
                        f = pathlib.Path(v).expanduser()
                        if not f.is_file():
                            die(f"{v}: no such file")
                        n += 1
                        name = f"{n}{f.suffix}"
                        shutil.copy(f, root / name)
                        node[k] = f"{base}/{name}"
                    else:
                        local(v)
            elif isinstance(node, list):
                for v in node:
                    local(v)
        local(scene)
        (root / "scene.json").write_text(json.dumps(scene))

        url = f"{site}/render?still&src={urllib.parse.quote(base + '/scene.json', safe='')}"
        shot = root / "shot.png"
        try:
            subprocess.run(
                [chrome(), "--headless=new", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1",
                 f"--window-size={frame['w']},{frame['h']}", "--virtual-time-budget=9000",
                 f"--screenshot={shot}", url],
                capture_output=True, timeout=120, check=False)
        except subprocess.TimeoutExpired:
            die("Chrome did not finish within two minutes")
        finally:
            srv.shutdown()
        if not shot.is_file():
            die(f"Chrome wrote no picture from {site}/render")
        shutil.move(shot, out)
    print(f"{out}  {frame['w']}x{frame['h']}")


if __name__ == "__main__":
    main()
