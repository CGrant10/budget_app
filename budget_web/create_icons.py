"""Generate PWA icons (192x192 and 512x512) for the Budget app."""
from PIL import Image, ImageDraw, ImageFont
import os

OUT = os.path.join(os.path.dirname(__file__), "static")

def make_icon(size):
    img = Image.new("RGBA", (size, size), "#0f0f14")
    draw = ImageDraw.Draw(img)

    # Rounded rect background in accent color
    pad = size // 8
    r = size // 5
    draw.rounded_rectangle([pad, pad, size - pad, size - pad], radius=r, fill="#7c6af7")

    # ₿ character centered
    font_size = size // 2
    try:
        font = ImageFont.truetype("arial.ttf", font_size)
    except Exception:
        font = ImageFont.load_default()

    char = "B"
    bbox = draw.textbbox((0, 0), char, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    tx = (size - tw) // 2 - bbox[0]
    ty = (size - th) // 2 - bbox[1]
    draw.text((tx, ty), char, fill="white", font=font)

    path = os.path.join(OUT, f"icon-{size}.png")
    img.save(path)
    print(f"Saved {path}")

make_icon(192)
make_icon(512)
