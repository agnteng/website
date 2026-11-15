#!/usr/bin/env python3
"""Make a speaker announcement: one to three speakers on the brand's animated
background, as a JPG, a GIF and an MP4.

    python3 scripts/speaker_cards.py --date "Lisbon · 27 Jan" \\
        --speaker "Anna Lima|Staff Engineer, Acme|anna.jpg" \\
        --speaker "Rui Costa|Founder, Beta|rui.jpg" \\
        --out "$AGNTENG_MEDIA/2027-01-27/speakers"

    python3 scripts/speaker_cards.py speakers.json --out speakers
        speakers.json: {"date": "Lisbon · 27 Jan",
                        "speakers": [{"name": "…", "title": "…", "photo": "anna.jpg"}]}

Writes <out>.jpg, <out>.gif and <out>.mp4 (--formats picks among them). A photo
is a file on this machine or a URL; square crops of the face work best. The
picture is 1920x1080 for two or three speakers and 1080x1350 for one.

The drawing is the animation builder's (scripts/render_scene.py does the work),
so --site, Chrome and the network apply as there. GIF and MP4 also need ffmpeg.
"""

from __future__ import annotations

import argparse
import json
import os
import pathlib
import shutil
import subprocess
import tempfile

from render_scene import SITE, die, render

WHITE, PERIWINKLE = "#F4F5FF", "#B5A6FF"
BACKGROUND = {"kind": "field", "animation": "aurora", "color": "#1E2BE6", "edge": "#B5A6FF", "bg": "#05071E",
              "cell": 4, "gap": 0, "density": 0.6, "motion": 60, "fade": "none", "shape": "square"}


def text(value: str, x: float, y: float, size: float, **more) -> dict:
    return {"type": "text", "text": value, "x": x, "y": y, "size": size, "align": "left", **more}


def scene(date: str, speakers: list[dict]) -> dict:
    """One speaker gets a portrait card; two or three stand side by side on a wide one."""
    if len(speakers) == 1:
        s = speakers[0]
        return {"frame": {"w": 1080, "h": 1350}, "background": BACKGROUND, "layers": [
            {"type": "photo", "src": s["photo"], "x": 0, "y": 0, "w": 1, "h": 0.68, "radius": 0, "label": s["name"]},
            {"type": "rect", "x": 0, "y": 0.68, "w": 1, "h": 0.32, "color": "#0B0E2A"},
            text(date, 0.08, 0.745, 0.026, font="mono", weight=600, upper=True, spacing=0.12, color=PERIWINKLE),
            text(s["name"], 0.08, 0.815, 0.056, weight=800, color=WHITE),
            text(s["title"], 0.08, 0.872, 0.032, weight=500, color=WHITE),
            {"type": "logo", "form": "mark", "anchor": "bottom-right", "scale": 0.1, "dx": -0.03, "dy": -0.04},
        ]}
    col, gap = 0.2813, 0.033
    left = (1 - len(speakers) * col - (len(speakers) - 1) * gap) / 2
    layers: list[dict] = [
        {"type": "scrim", "shape": "bottom", "color": "#05071E", "opacity": 0.9},  # the names read over the field
        {"type": "logo", "form": "lockup", "anchor": "top-left", "scale": col, "dx": left - 0.045},
        {**text(date, 1 - left, 0.13, 0.049, weight=800, upper=True, color=WHITE), "align": "right"},
    ]
    for i, s in enumerate(speakers):
        x = left + i * (col + gap)
        layers += [
            {"type": "photo", "src": s["photo"], "x": x, "y": 0.32, "w": col, "h": 0.5, "radius": 0.04, "label": s["name"]},
            text(s["name"], x, 0.863, 0.0425, weight=800, color=WHITE),
            text(s["title"], x, 0.912, 0.036, weight=500, color=WHITE),
        ]
    return {"frame": {"w": 1920, "h": 1080}, "background": BACKGROUND, "layers": layers}


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("json", nargs="?", help="a file with the date and the speakers (or use --date and --speaker)")
    ap.add_argument("--date", help='the line beside the logo, e.g. "Lisbon · 27 Jan"')
    ap.add_argument("--speaker", action="append", default=[], metavar="NAME|TITLE|PHOTO")
    ap.add_argument("--out", required=True, help="where to write, without an extension")
    ap.add_argument("--formats", default="jpg,gif,mp4")
    ap.add_argument("--seconds", type=int, default=4, help="length of the GIF and MP4")
    ap.add_argument("--site", default=os.environ.get("BRANDING_SITE", SITE))
    args = ap.parse_args()

    given = json.loads(pathlib.Path(args.json).read_text()) if args.json else {}
    date = args.date or given.get("date") or ""
    speakers = list(given.get("speakers") or [])
    for s in args.speaker:
        parts = [p.strip() for p in s.split("|")]
        if len(parts) != 3:
            die(f'--speaker {s}: write "Name|Title|photo"')
        speakers.append(dict(zip(("name", "title", "photo"), parts)))
    if not 1 <= len(speakers) <= 3:
        die("give one to three speakers")
    for s in speakers:
        if not all(s.get(k) for k in ("name", "title", "photo")):
            die(f"a speaker needs a name, a title and a photo: {s}")
    formats = {f.strip().lower() for f in args.formats.split(",") if f.strip()}
    if formats - {"jpg", "gif", "mp4"}:
        die("--formats takes jpg, gif and mp4")
    moving = formats & {"gif", "mp4"}
    if moving and not shutil.which("ffmpeg"):
        die("GIF and MP4 need ffmpeg")

    fps = 15
    frames = render(scene(date, speakers), args.site.rstrip("/"), frames=args.seconds * fps if moving else 1, fps=fps)
    if not frames:
        die("the page returned no frames")
    out = pathlib.Path(args.out).expanduser()
    out.parent.mkdir(parents=True, exist_ok=True)
    if "jpg" in formats:
        out.with_suffix(".jpg").write_bytes(frames[0])
        print(out.with_suffix(".jpg"))
    if moving:
        with tempfile.TemporaryDirectory() as tmp:
            for i, f in enumerate(frames):
                (pathlib.Path(tmp) / f"{i:04}.jpg").write_bytes(f)
            src = ["ffmpeg", "-y", "-loglevel", "error", "-framerate", str(fps), "-i", f"{tmp}/%04d.jpg"]
            if "mp4" in formats:
                subprocess.run([*src, "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-movflags", "+faststart",
                                str(out.with_suffix(".mp4"))], check=True)
                print(out.with_suffix(".mp4"))
            if "gif" in formats:
                # Half size with its own palette: a full-size GIF of a moving field runs to tens of MB.
                subprocess.run([*src, "-vf", "fps=12,scale=iw/2:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128[p];[b][p]paletteuse=dither=bayer",
                                str(out.with_suffix(".gif"))], check=True)
                print(out.with_suffix(".gif"))


if __name__ == "__main__":
    main()
