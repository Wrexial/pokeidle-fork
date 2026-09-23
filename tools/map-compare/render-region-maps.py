#!/usr/bin/env python
"""Render the game's generated region maps and compare them with reference
region-map images downloaded by fetch-refs.cjs.

For each region it draws the locations/roads from public/data/map-data/<region>.json
and puts that next to the Bulbapedia reference, writing
tools/map-compare/out/<region>.png.

Usage:
    .venv/Scripts/python.exe tools/map-compare/render-region-maps.py
"""
import json
import os

from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
MAP_DIR = os.path.join(ROOT, "public", "data", "map-data")
REF_DIR = os.path.join(HERE, "refs")
OUT_DIR = os.path.join(HERE, "out")
REGIONS = ["kanto", "johto", "hoenn", "sinnoh", "unova", "kalos", "alola", "galar", "paldea"]

PAPER = (246, 241, 227)
INK = (40, 34, 26)
ROAD = (176, 164, 142)
NODE_COLORS = {"town": (44, 96, 176), "route": (56, 148, 66), "zone": (58, 120, 200), "raid": (150, 62, 178)}

CANVAS = 900
MARGIN = 46


def load_font(size):
    for name in ("arialbd.ttf", "arial.ttf", "segoeui.ttf"):
        path = os.path.join(os.environ.get("WINDIR", r"C:\\Windows"), "Fonts", name)
        if os.path.exists(path):
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


FONT = load_font(13)
TITLE_FONT = load_font(26)


def load_region(region):
    with open(os.path.join(MAP_DIR, f"{region}.json"), encoding="utf-8") as handle:
        return json.load(handle)


def project(position):
    return (
        MARGIN + position["x"] / 100 * (CANVAS - 2 * MARGIN),
        MARGIN + position["y"] / 100 * (CANVAS - 2 * MARGIN),
    )


def draw_ours(region, locations):
    locations = {k: v for k, v in locations.items() if not v.get("hidden")}
    image = Image.new("RGB", (CANVAS, CANVAS), PAPER)
    draw = ImageDraw.Draw(image)

    # Roads first, elbow style (matches createRoads in progression.js).
    drawn = set()
    for location in locations.values():
        for other_id in location.get("connections", []):
            if other_id not in locations:
                continue
            key = tuple(sorted((location["id"], other_id)))
            if key in drawn:
                continue
            drawn.add(key)
            a = project(location["position"])
            b = project(locations[other_id]["position"])
            mid = (b[0], a[1]) if abs(a[0] - b[0]) >= abs(a[1] - b[1]) else (a[0], b[1])
            draw.line([a, mid], fill=ROAD, width=4)
            draw.line([mid, b], fill=ROAD, width=4)

    # Nodes and labels.
    for location in locations.values():
        x, y = project(location["position"])
        color = NODE_COLORS.get(location["type"], (110, 110, 110))
        radius = 11 if location["type"] == "zone" else 10 if location["type"] == "town" else 8
        draw.ellipse([x - radius, y - radius, x + radius, y + radius], fill=color, outline=INK)
        label = location["name"]
        draw.text((x + radius + 3, y - 7), label, fill=INK, font=FONT,
                  stroke_width=2, stroke_fill=PAPER)

    draw.text((MARGIN, 12), f"{region.upper()} - generated game map", fill=INK, font=TITLE_FONT)
    return image


def load_reference(region):
    path = os.path.join(REF_DIR, f"{region}.png")
    if not os.path.exists(path):
        return None
    reference = Image.open(path).convert("RGB")
    if reference.width < 600:  # tiny pixel-art town maps -> scale up crisply
        reference = reference.resize(
            (reference.width * 4, reference.height * 4), Image.NEAREST
        )
    scale = CANVAS / reference.height
    return reference.resize((max(1, int(reference.width * scale)), CANVAS), Image.LANCZOS)


def compose(region, ours, reference):
    gap = 30
    ref_width = reference.width if reference else CANVAS
    width = CANVAS + gap + ref_width
    image = Image.new("RGB", (width, CANVAS + 40), (255, 255, 255))
    image.paste(ours, (0, 40))
    if reference:
        image.paste(reference, (CANVAS + gap, 40))
    draw = ImageDraw.Draw(image)
    draw.text((CANVAS + gap, 8), f"{region.upper()} - reference (Bulbapedia)", fill=INK,
              font=TITLE_FONT)
    return image


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    for region in REGIONS:
        locations = load_region(region)
        ours = draw_ours(region, locations)
        reference = load_reference(region)
        composite = compose(region, ours, reference)
        dest = os.path.join(OUT_DIR, f"{region}.png")
        composite.save(dest)
        print(f"{region.ljust(7)} {len(locations):3d} locations -> {os.path.relpath(dest, ROOT)}")


if __name__ == "__main__":
    main()
