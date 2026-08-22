#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Build the 智学平台 app icon.
Design principles (from ardot-poster icon rules):
  - single strong focal mark  -> graduation cap (学士帽) = universal "learning" mark
  - legible at small sizes     -> bold blocky pixel shapes, high contrast
  - consistent brand grid      -> 32x32 pixel grid, nearest-neighbor scaled (true pixel art)
  - standard color values      -> exact brand palette (cream/ink/pink/yellow)
Output: AppIcon.icns (macOS) + app-icon.png (1024 reference)
"""
import os
from PIL import Image, ImageDraw

PROJECT = "/Users/chencchenyu/Developer/zhixue-platform" if False else "/Users/chenchengyu/Developer/zhixue-platform"
PALETTE = {
    "CREAM":  (244, 236, 216, 255),  # F4ECD8 background
    "INK":    (46, 42, 59, 255),     # 2E2A3B cap
    "PINK":   (255, 93, 143, 255),   # FF5D8F accent band / sparkle
    "YELLOW": (255, 200, 61, 255),   # FFC83D tassel
    "BLUE":   (77, 124, 254, 255),   # 4D7CFE tiny dot accent
}

S = 32  # logical pixel grid
img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
d = ImageDraw.Draw(img)

# 1) cream square background
d.rectangle([0, 0, S - 1, S - 1], fill=PALETTE["CREAM"])

# 2) mortarboard (wide flat diamond) centred at (16, 9)
d.polygon([(16, 4), (27, 9), (16, 14), (5, 9)], fill=PALETTE["INK"])
# cap button (small pink square at the top-centre of the board)
d.rectangle([15, 5, 16, 6], fill=PALETTE["PINK"])

# 3) head (the part that sits on the head) — narrower than board for overhang
d.rectangle([10, 15, 21, 27], fill=PALETTE["INK"])
# pink band near the top of the head
d.rectangle([10, 15, 21, 17], fill=PALETTE["PINK"])

# 4) tassel (yellow) hanging from the board's right tip
d.line([(27, 9), (29, 9)], fill=PALETTE["YELLOW"])   # nub at tip
d.line([(28, 9), (28, 22)], fill=PALETTE["YELLOW"])  # vertical strand
d.rectangle([27, 22, 29, 24], fill=PALETTE["YELLOW"])  # end knob

# 5) corner sparkle (pink plus) top-left, in the cream field
d.rectangle([5, 3, 5, 5], fill=PALETTE["PINK"])
d.rectangle([4, 4, 6, 4], fill=PALETTE["PINK"])

# 6) tiny blue dot accent bottom-right for brand energy
d.rectangle([24, 24, 25, 25], fill=PALETTE["BLUE"])

# ---- produce iconset at every size macOS expects (nearest-neighbor = crisp pixels) ----
ICONSET = "/tmp/zhixue_iconset.iconset"
os.makedirs(ICONSET, exist_ok=True)
sizes = [
    (16, "icon_16x16.png"),
    (32, "icon_16x16@2x.png"),
    (32, "icon_32x32.png"),
    (64, "icon_32x32@2x.png"),
    (128, "icon_128x128.png"),
    (256, "icon_128x128@2x.png"),
    (256, "icon_256x256.png"),
    (512, "icon_256x256@2x.png"),
    (512, "icon_512x512.png"),
    (1024, "icon_512x512@2x.png"),
]
for size, name in sizes:
    scaled = img.resize((size, size), Image.NEAREST)
    scaled.save(os.path.join(ICONSET, name))

# 1024 reference png in project assets
os.makedirs(os.path.join(PROJECT, "assets"), exist_ok=True)
img.resize((1024, 1024), Image.NEAREST).save(os.path.join(PROJECT, "assets", "app-icon.png"))

# ---- convert to .icns ----
OUT = "/tmp/AppIcon.icns"
if os.path.exists(OUT):
    os.remove(OUT)
os.system('iconutil --convert icns --output "%s" "%s"' % (OUT, ICONSET))
print("icns bytes:", os.path.getsize(OUT) if os.path.exists(OUT) else "MISSING")
print("reference png:", os.path.join(PROJECT, "assets", "app-icon.png"))
