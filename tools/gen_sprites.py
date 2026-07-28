"""Generate pixel-art sprites (dino + kaiju) as compact JS pixel-grids.

Draws each creature from primitives at low resolution with EXACT palette
colors (PIL ImageDraw is aliased, so fills stay exact). Then maps every
pixel back to its palette index -> a char grid. Emits docs/sprites.gen.js
and a scaled-up preview PNG for visual inspection.
"""
from PIL import Image, ImageDraw

CHARS = "0123456789abcdefghijklmnopqrstuvwxyz"

# ---- palettes -------------------------------------------------------------
DINO_PAL = {
    "o": (27, 58, 16),    # outline / dark green
    "g": (60, 138, 46),   # body green
    "l": (103, 184, 63),  # belly highlight
    "s": (36, 74, 22),    # back stripe / shadow
    "e": (242, 216, 63),  # eye
    "p": (16, 21, 16),    # pupil
    "w": (244, 240, 220), # tooth
    "m": (154, 43, 37),   # mouth
}
KAIJU_PAL = {
    "o": (18, 26, 30),    # outline near-black
    "g": (52, 70, 78),    # charcoal body
    "l": (86, 108, 116),  # slate highlight
    "s": (30, 42, 48),    # shadow
    "p": (150, 196, 210), # dorsal plates (bone/ice)
    "e": (122, 226, 240), # eye (atomic cyan)
    "k": (16, 20, 22),    # pupil
    "w": (230, 236, 238), # tooth
    "m": (122, 40, 60),   # mouth
    "a": (132, 226, 240), # atomic accent
}

W, H = 44, 42  # grid size (shared by both creatures)


def new_img():
    return Image.new("RGBA", (W, H), (0, 0, 0, 0))


# ---- DINO (T-Rex), facing right -------------------------------------------
def draw_dino(open_mouth):
    img = new_img()
    d = ImageDraw.Draw(img)
    O = DINO_PAL["o"]; G = DINO_PAL["g"]; L = DINO_PAL["l"]
    S = DINO_PAL["s"]; E = DINO_PAL["e"]; P = DINO_PAL["p"]
    Wt = DINO_PAL["w"]; M = DINO_PAL["m"]

    # tail (down-left sweep)
    d.polygon([(11, 22), (1, 34), (4, 37), (15, 27)], fill=G, outline=O)
    # back legs / foot
    d.rectangle([15, 30, 20, 38], fill=S, outline=O)
    d.ellipse([12, 36, 23, 41], fill=G, outline=O)
    # body
    d.ellipse([7, 15, 31, 34], fill=G, outline=O)
    # belly highlight
    d.ellipse([12, 24, 27, 34], fill=L)
    # front leg / foot
    d.rectangle([22, 31, 27, 39], fill=G, outline=O)
    d.ellipse([20, 37, 31, 42], fill=G, outline=O)
    # neck
    d.polygon([(22, 17), (26, 6), (33, 7), (30, 20)], fill=G, outline=O)
    # head
    d.ellipse([26, 3, 43, 18], fill=G, outline=O)
    # tiny arm
    d.line([(27, 20), (31, 24)], fill=S, width=2)
    # back stripes
    for sx in (16, 20, 24):
        d.line([(sx, 16), (sx + 1, 24)], fill=S, width=1)
    # eye
    d.ellipse([33, 7, 38, 12], fill=E, outline=O)
    d.rectangle([35, 9, 36, 11], fill=P)

    if open_mouth:
        # open jaw: red mouth wedge + teeth
        d.polygon([(30, 12), (43, 11), (43, 17), (31, 16)], fill=M, outline=O)
        for tx in range(31, 42, 3):
            d.polygon([(tx, 12), (tx + 1, 14), (tx + 2, 12)], fill=Wt)   # upper
            d.polygon([(tx, 16), (tx + 1, 14), (tx + 2, 16)], fill=Wt)   # lower
    else:
        # closed mouth line + small teeth
        d.line([(30, 14), (42, 14)], fill=O, width=1)
        for tx in range(31, 41, 3):
            d.polygon([(tx, 14), (tx + 1, 16), (tx + 2, 14)], fill=Wt)
    return img


# ---- KAIJU (Godzilla-ish), facing right -----------------------------------
def draw_kaiju(open_mouth):
    img = new_img()
    d = ImageDraw.Draw(img)
    O = KAIJU_PAL["o"]; G = KAIJU_PAL["g"]; L = KAIJU_PAL["l"]
    S = KAIJU_PAL["s"]; Pl = KAIJU_PAL["p"]; E = KAIJU_PAL["e"]
    K = KAIJU_PAL["k"]; Wt = KAIJU_PAL["w"]; M = KAIJU_PAL["m"]

    # thick tail sweeping down-left
    d.polygon([(12, 24), (0, 36), (3, 40), (16, 30)], fill=G, outline=O)
    # legs (stocky)
    d.rectangle([14, 28, 20, 40], fill=G, outline=O)
    d.ellipse([11, 38, 23, 42], fill=G, outline=O)
    d.rectangle([22, 29, 28, 40], fill=S, outline=O)
    d.ellipse([20, 38, 31, 42], fill=G, outline=O)
    # upright body (tall torso)
    d.ellipse([10, 12, 30, 34], fill=G, outline=O)
    d.ellipse([14, 20, 26, 33], fill=L)  # chest highlight
    # arm
    d.line([(26, 20), (31, 25)], fill=S, width=2)
    # neck + head (upright, head top-right)
    d.polygon([(20, 14), (24, 4), (31, 5), (28, 16)], fill=G, outline=O)
    d.ellipse([26, 1, 42, 15], fill=G, outline=O)
    # dorsal plates down back + tail (the kaiju signature)
    plates = [(9, 30), (7, 26), (8, 21), (11, 16), (15, 11), (20, 8)]
    for (px, py) in plates:
        d.polygon([(px, py + 4), (px + 3, py - 2), (px + 6, py + 4)], fill=Pl, outline=O)
    # eye (glowing)
    d.ellipse([32, 5, 37, 10], fill=E, outline=O)
    d.rectangle([34, 7, 35, 9], fill=K)

    if open_mouth:
        d.polygon([(30, 9), (42, 8), (42, 14), (31, 13)], fill=M, outline=O)
        for tx in range(31, 41, 3):
            d.polygon([(tx, 9), (tx + 1, 11), (tx + 2, 9)], fill=Wt)
            d.polygon([(tx, 13), (tx + 1, 11), (tx + 2, 13)], fill=Wt)
    else:
        d.line([(30, 11), (41, 11)], fill=O, width=1)
        for tx in range(31, 40, 3):
            d.polygon([(tx, 11), (tx + 1, 13), (tx + 2, 11)], fill=Wt)
    return img


def to_grid(img, pal):
    rgb2ch = {v: k for k, v in pal.items()}
    rows = []
    px = img.load()
    for y in range(H):
        row = []
        for x in range(W):
            r, g, b, a = px[x, y]
            if a == 0:
                row.append(".")
            else:
                row.append(rgb2ch.get((r, g, b), "."))
        rows.append("".join(row))
    return rows


def emit_js():
    sprites = {
        "dino_stand": (draw_dino(False), DINO_PAL),
        "dino_open":  (draw_dino(True),  DINO_PAL),
        "kaiju_stand": (draw_kaiju(False), KAIJU_PAL),
        "kaiju_open":  (draw_kaiju(True),  KAIJU_PAL),
    }
    lines = ["'use strict';", "// AUTO-GENERATED by tools/gen_sprites.py — do not hand-edit.", "const SPRITES = {"]
    for name, (img, pal) in sprites.items():
        rows = to_grid(img, pal)
        paljs = ",".join(f'"{k}":"#{r:02x}{g:02x}{b:02x}"' for k, (r, g, b) in pal.items())
        rowsjs = ",".join(f'"{r}"' for r in rows)
        lines.append(f'  {name}: {{ w:{W}, h:{H}, pal:{{{paljs}}}, rows:[{rowsjs}] }},')
    lines.append("};")
    lines.append("if (typeof module !== 'undefined') module.exports = { SPRITES };")
    return "\n".join(lines)


def preview():
    """Scaled-up side-by-side preview for visual inspection."""
    scale = 8
    names = ["dino_stand", "dino_open", "kaiju_stand", "kaiju_open"]
    imgs = {
        "dino_stand": draw_dino(False), "dino_open": draw_dino(True),
        "kaiju_stand": draw_kaiju(False), "kaiju_open": draw_kaiju(True),
    }
    pad = 8
    out = Image.new("RGBA", ((W * scale + pad) * len(names) + pad, H * scale + 2 * pad), (24, 24, 28, 255))
    for i, n in enumerate(names):
        big = imgs[n].resize((W * scale, H * scale), Image.NEAREST)
        out.alpha_composite(big, (pad + i * (W * scale + pad), pad))
    out.save("tools/sprites_preview.png")


if __name__ == "__main__":
    preview()
    js = emit_js()
    with open("docs/sprites.gen.js", "w", encoding="utf-8") as f:
        f.write(js + "\n")
    print("wrote docs/sprites.gen.js and tools/sprites_preview.png")
