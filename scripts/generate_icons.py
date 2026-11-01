import os
from PIL import Image, ImageDraw, ImageOps

src_path = r"C:\Users\Ruth.A\.gemini\antigravity-ide\brain\9c52c6d0-ae25-4dc6-8ab5-49fb0037fce9\trackify_app_icon_1793197586243.jpg"
android_res = r"android\app\src\main\res"
public_dir = r"public"

img = Image.open(src_path).convert("RGBA")

# 1. Generate web assets
os.makedirs(public_dir, exist_ok=True)
img.resize((512, 512), Image.Resampling.LANCZOS).save(os.path.join(public_dir, "app-icon.png"))
img.resize((64, 64), Image.Resampling.LANCZOS).save(os.path.join(public_dir, "favicon.png"))
print("Saved web icons in public/")

# Helper for rounded corners or circle mask
def create_circle_icon(image, size):
    resized = image.resize((size, size), Image.Resampling.LANCZOS)
    mask = Image.new("L", (size * 4, size * 4), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0, size * 4, size * 4), fill=255)
    mask = mask.resize((size, size), Image.Resampling.LANCZOS)
    
    output = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    output.paste(resized, (0, 0), mask=mask)
    return output

# Helper for adaptive icon foreground:
# A 108dp canvas where the main artwork is placed within the central ~70% safe zone
def create_adaptive_foreground(image, fg_size):
    canvas = Image.new("RGBA", (fg_size, fg_size), (0, 0, 0, 0))
    # Artwork scaled to 72% of foreground size
    inner_size = int(fg_size * 0.72)
    inner_icon = image.resize((inner_size, inner_size), Image.Resampling.LANCZOS)
    
    # Optional squircle or rounded mask for the inner icon
    mask = Image.new("L", (inner_size * 4, inner_size * 4), 0)
    draw = ImageDraw.Draw(mask)
    corner_radius = int(inner_size * 4 * 0.22)
    draw.rounded_rectangle((0, 0, inner_size * 4, inner_size * 4), radius=corner_radius, fill=255)
    mask = mask.resize((inner_size, inner_size), Image.Resampling.LANCZOS)
    
    offset = (fg_size - inner_size) // 2
    canvas.paste(inner_icon, (offset, offset), mask=mask)
    return canvas

# Densities
densities = [
    ("mipmap-mdpi", 48, 108),
    ("mipmap-hdpi", 72, 162),
    ("mipmap-xhdpi", 96, 216),
    ("mipmap-xxhdpi", 144, 324),
    ("mipmap-xxxhdpi", 192, 432),
]

for folder, launcher_sz, fg_sz in densities:
    folder_path = os.path.join(android_res, folder)
    os.makedirs(folder_path, exist_ok=True)
    
    # 1. ic_launcher.png (standard square / rounded)
    launcher = img.resize((launcher_sz, launcher_sz), Image.Resampling.LANCZOS)
    launcher.save(os.path.join(folder_path, "ic_launcher.png"))
    
    # 2. ic_launcher_round.png (circle)
    round_launcher = create_circle_icon(img, launcher_sz)
    round_launcher.save(os.path.join(folder_path, "ic_launcher_round.png"))
    
    # 3. ic_launcher_foreground.png (for adaptive icons)
    fg = create_adaptive_foreground(img, fg_sz)
    fg.save(os.path.join(folder_path, "ic_launcher_foreground.png"))
    
    print(f"Generated icons for {folder}: {launcher_sz}x{launcher_sz}, fg: {fg_sz}x{fg_sz}")

# Update background color in values/ic_launcher_background.xml
bg_xml = os.path.join(android_res, "values", "ic_launcher_background.xml")
with open(bg_xml, "w", encoding="utf-8") as f:
    f.write('<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#1c2331</color>\n</resources>\n')
print("Updated values/ic_launcher_background.xml to match icon palette #1c2331")

# Remove leftover default robot vectors in drawable and drawable-v24 so adaptive icons pick up the new assets
old_fg = os.path.join(android_res, "drawable-v24", "ic_launcher_foreground.xml")
if os.path.exists(old_fg):
    os.remove(old_fg)
    print("Removed obsolete default robot drawable-v24/ic_launcher_foreground.xml")

old_bg = os.path.join(android_res, "drawable", "ic_launcher_background.xml")
if os.path.exists(old_bg):
    os.remove(old_bg)
    print("Removed obsolete drawable/ic_launcher_background.xml")

print("All app icons successfully replaced!")
