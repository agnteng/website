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
import html
import http.server
import json
import os
import pathlib
import re
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
    try:
        return json.load(urllib.request.urlopen(req, timeout=30))
    except (OSError, ValueError) as e:
        die(f"{site}/api/presets.json: {e}")


def set_path(scene: dict, path: str, value: str) -> None:
    """scene['layers'][0]['src'] = value, for path 'layers.0.src'. A value replacing text
    stays text ("2026" is a title, not a number); anything else is read as JSON if it is JSON."""
    *parents, last = path.split(".")
    node = scene
    try:
        for p in parents:
            node = node[int(p)] if isinstance(node, list) else node[p]
        key = int(last) if isinstance(node, list) else last
        old = node[key] if isinstance(node, list) else node.get(key)
        parsed = value
        if not isinstance(old, str):
            try:
                parsed = json.loads(value)
            except json.JSONDecodeError:
                pass
        node[key] = parsed
    except (KeyError, IndexError, ValueError, TypeError, AttributeError):
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
    # The brand's presets leave the background to the page's default field; name it, so
    # --set background.<field> has somewhere to land.
    scene.setdefault("background", {"kind": "field"})
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
            if isinstance(node, list):
                for v in node:
                    local(v)
            elif isinstance(node, dict):
                for k, v in node.items():
                    if k != "src" or not isinstance(v, str):
                        local(v)
                    elif v == "/your-image.jpg":
                        die("the scene still has /your-image.jpg, the builder's stand-in for an upload: put the real file there")
                    elif v and "://" not in v and not v.startswith("data:"):
                        f = pathlib.Path(v).expanduser()
                        if f.is_file():
                            n += 1
                            shutil.copy(f, root / f"{n}{f.suffix}")
                            node[k] = f"{base}/{n}{f.suffix}"
                        elif not v.startswith("/"):  # an absolute path that is no file is the site's own
                            die(f"{v}: no such file")
        local(scene)
        (root / "scene.json").write_text(json.dumps(scene))

        url = f"{site}/render?still&src={urllib.parse.quote(base + '/scene.json', safe='')}"
        shot = root / "shot.png"
        # The page is public and the scene is on this machine: Chrome asks a person before
        # letting one reach the other, and there is nobody to ask.
        flags = [chrome(), "--headless=new", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1",
                 "--disable-features=LocalNetworkAccessChecks", f"--window-size={frame['w']},{frame['h']}",
                 "--virtual-time-budget=9000"]
        try:
            # Once to ask the page how it went, once for the picture.
            dom = subprocess.run([*flags, "--dump-dom", url], capture_output=True, text=True, timeout=120).stdout
            state = re.search(r'<html[^>]*\sdata-render="([^"]*)"', dom)
            if not state:
                die(f"{site}/render did not draw: is that the branding site, with this change deployed?")
            if state.group(1) != "ok":
                die(html.unescape(state.group(1)))
            subprocess.run([*flags, f"--screenshot={shot}", url], capture_output=True, timeout=120)
        except subprocess.TimeoutExpired:
            die("Chrome did not finish within two minutes")
        finally:
            srv.shutdown()
            srv.server_close()
        if not shot.is_file():
            die(f"Chrome wrote no picture from {site}/render")
        shutil.move(shot, out)
    print(f"{out}  {frame['w']}x{frame['h']}")


if __name__ == "__main__":
    main()
