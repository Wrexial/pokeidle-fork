#!/usr/bin/env python
"""Draw the game's generated region nodes on top of the reference map so the
hand-measured REGION_MAP_LAYOUTS coordinates can be checked and corrected.

For each region it writes tools/map-compare/out/<region>-overlay.png: the
reference image with a dot and label at each location's re-projected position.
Where the layout's reference frame matches the reference image the dots should
sit on the matching place names.

Usage:
    .venv/Scripts/python.exe tools/map-compare/overlay-region-maps.py
"""
import json
import os
import re

from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
MAP_DIR = os.path.join(ROOT, "public", "data", "map-data")
REF_DIR = os.path.join(HERE, "refs")
OUT_DIR = os.path.join(HERE, "out")
GENERATOR = os.path.join(ROOT, "tools", "generate-regions.cjs")

# Regions with a REGION_MAP_LAYOUTS frame measured against a matching reference
# image. Alola is deliberately absent: its layout is hand-laid as four islands
# in a square 100x100 world (not a projection of the real map), so an overlay
# would be meaningless. Paldea is absent for now: its frame is portrait
# (1300x1368) but Bulbapedia only has landscape Paldea artwork (1280x905), so a
# stretch would distort it.
REGIONS = ["johto", "hoenn", "sinnoh", "unova", "kalos", "galar"]
OUTPUT_HEIGHT = 1200


def layout_frames():
    """Parse `width`/`height` for each REGION_MAP_LAYOUTS entry."""
    with open(GENERATOR, encoding="utf-8") as handle:
        source = handle.read()
    frames = {}
    for region in REGIONS:
        match = re.search(
            r"\n  " + region + r": \{\s*width: (\d+),\s*height: (\d+),", source
        )
        if match:
            frames[region] = (int(match.group(1)), int(match.group(2)))
    return frames


def load_font(size):
    for name in ("arialbd.ttf", "arial.ttf", "segoeui.ttf"):
        path = os.path.join(os.environ.get("WINDIR", r"C:\Windows"), "Fonts", name)
        if os.path.exists(path):
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def project_to_reference(location, frame, ref_size):
    """world (0-100) -> reference-image pixels, stretching the layout frame."""
    layout_w, layout_h = frame
    scale = 100 / max(layout_w, layout_h)
    offset_x = (100 - layout_w * scale) / 2
    offset_y = (100 - layout_h * scale) / 2
    px = (location["position"]["x"] - offset_x) / scale
    py = (location["position"]["y"] - offset_y) / scale
    return (px * ref_size[0] / layout_w, py * ref_size[1] / layout_h)


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    frames = layout_frames()
    font = load_font(16)
    for region in REGIONS:
        ref_path = os.path.join(REF_DIR, f"{region}.png")
        if not os.path.exists(ref_path) or region not in frames:
            print(f"{region}: skipped (no reference/frame)")
            continue
        with open(os.path.join(MAP_DIR, f"{region}.json"), encoding="utf-8") as handle:
            locations = json.load(handle)
        reference = Image.open(ref_path).convert("RGB")
        scale = OUTPUT_HEIGHT / reference.height
        reference = reference.resize(
            (max(1, int(reference.width * scale)), OUTPUT_HEIGHT), Image.LANCZOS
        )
        draw = ImageDraw.Draw(reference)
        for location in locations.values():
            x, y = project_to_reference(location, frames[region], reference.size)
            color = (255, 230, 0) if location["type"] == "town" else (120, 220, 255)
            radius = 7 if location["type"] == "town" else 5
            draw.ellipse([x - radius, y - radius, x + radius, y + radius], outline=(200, 0, 0), width=2)
            draw.text((x + radius + 2, y - 8), location["name"], fill=color, font=font,
                      stroke_width=2, stroke_fill=(0, 0, 0))
        dest = os.path.join(OUT_DIR, f"{region}-overlay.png")
        reference.save(dest)
        print(f"{region.ljust(7)} overlay -> {os.path.relpath(dest, ROOT)}")


if __name__ == "__main__":
    main()
