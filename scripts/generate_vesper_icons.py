"""
Generate Vesper icon assets from the botanical mark image.
Output: public/favicon.png, public/app-icon.png, public/icon-192.png, public/icon-512.png
        Android mipmap: ic_launcher.png, ic_launcher_round.png, ic_launcher_foreground.png
"""
import os
from PIL import Image, ImageDraw

SRC = r"C:/Users/Ruth.A/Desktop/Projects/Recovery Tracker/public/vesper-mark.jpg"
ANDROID_RES = r"android/app/src/main/res"
PUBLIC = r"public"

img = Image.open(SRC).convert("RGBA")
W, H = img.size  # 1024 x 1024

# ------------------------------------------------------------------
# 1. Crop the circular medallion tightly from the white background
# ------------------------------------------------------------------
# Center of circle at ~(512, 513.5), radius ~386
cx, cy, r = 512, 513, 386
box = (cx - r, cy - r, cx + r, cy + r)
cropped = img.crop(box)
cw, ch = cropped.size  # ~772 x 772

# ------------------------------------------------------------------
# 2. Apply a clean circle mask at 4x then downsample (anti-alias)
# ------------------------------------------------------------------
def circle_masked(image, out_size):
    """Return a square RGBA image with the source shown inside a crisp circle."""
    scale = 4
    big = image.resize((out_size * scale, out_size * scale), Image.Resampling.LANCZOS)
    mask = Image.new("L", (out_size * scale, out_size * scale), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0, out_size * scale - 1, out_size * scale - 1), fill=255)
    mask = mask.resize((out_size, out_size), Image.Resampling.LANCZOS)
    result = Image.new("RGBA", (out_size, out_size), (0, 0, 0, 0))
    result.paste(big.resize((out_size, out_size), Image.Resampling.LANCZOS), mask=mask)
    return result

# ------------------------------------------------------------------
# 3. Helper: full square (no circle mask) for ic_launcher (Android clips it)
# ------------------------------------------------------------------
def square_icon(image, out_size):
    return image.resize((out_size, out_size), Image.Resampling.LANCZOS)

# ------------------------------------------------------------------
# 4. Helper: adaptive foreground – artwork in the central 72% safe zone
# ------------------------------------------------------------------
def adaptive_foreground(image, fg_size):
    canvas = Image.new("RGBA", (fg_size, fg_size), (0, 0, 0, 0))
    inner_size = int(fg_size * 0.72)
    inner = image.resize((inner_size, inner_size), Image.Resampling.LANCZOS)
    offset = (fg_size - inner_size) // 2
    canvas.paste(inner, (offset, offset))
    return canvas

# ------------------------------------------------------------------
# 5. Web / PWA icons
# ------------------------------------------------------------------
os.makedirs(PUBLIC, exist_ok=True)

# favicon – 64 px circle
favicon = circle_masked(cropped, 64)
favicon.save(os.path.join(PUBLIC, "favicon.png"))
print("OK public/favicon.png (64x64)")

# apple-touch-icon / web app icon – 512 px circle
app_icon = circle_masked(cropped, 512)
app_icon.save(os.path.join(PUBLIC, "app-icon.png"))
print("OK public/app-icon.png (512x512)")

# PWA icons
icon_192 = circle_masked(cropped, 192)
icon_192.save(os.path.join(PUBLIC, "icon-192.png"))
print("OK public/icon-192.png (192x192)")

icon_512 = circle_masked(cropped, 512)
icon_512.save(os.path.join(PUBLIC, "icon-512.png"))
print("OK public/icon-512.png (512x512)")

# ------------------------------------------------------------------
# 6. Android launcher icons
# ------------------------------------------------------------------
densities = [
    ("mipmap-mdpi",    48,  108),
    ("mipmap-hdpi",    72,  162),
    ("mipmap-xhdpi",   96,  216),
    ("mipmap-xxhdpi",  144, 324),
    ("mipmap-xxxhdpi", 192, 432),
]

for folder, sz, fg_sz in densities:
    folder_path = os.path.join(ANDROID_RES, folder)
    os.makedirs(folder_path, exist_ok=True)

    # ic_launcher.png – square (Android system clips to shape)
    sq = square_icon(cropped, sz)
    sq.save(os.path.join(folder_path, "ic_launcher.png"))

    # ic_launcher_round.png – circle
    rnd = circle_masked(cropped, sz)
    rnd.save(os.path.join(folder_path, "ic_launcher_round.png"))

    # ic_launcher_foreground.png – adaptive foreground with safe-zone padding
    fg = adaptive_foreground(cropped, fg_sz)
    fg.save(os.path.join(folder_path, "ic_launcher_foreground.png"))

    print(f"OK {folder}: {sz}x{sz} launcher, {fg_sz}x{fg_sz} foreground")

# ------------------------------------------------------------------
# 7. Update adaptive icon background color to Vesper terracotta
# ------------------------------------------------------------------
bg_xml = os.path.join(ANDROID_RES, "values", "ic_launcher_background.xml")
with open(bg_xml, "w", encoding="utf-8") as f:
    f.write(
        '<?xml version="1.0" encoding="utf-8"?>\n'
        '<resources>\n'
        '    <color name="ic_launcher_background">#D47A55</color>\n'
        '</resources>\n'
    )
print("OK values/ic_launcher_background.xml -> #D47A55 (Vesper terracotta)")

print("\nAll Vesper icon assets generated successfully.")
