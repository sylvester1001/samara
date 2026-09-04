from PIL import Image
import numpy as np
import os

size = 1024

# 1. 1024x1024 Full-bleed solid white canvas (edge-to-edge opaque for macOS native auto-masking)
canvas = Image.new("RGBA", (size, size), (255, 255, 255, 255))

# 2. Load user logo
script_dir = os.path.dirname(os.path.abspath(__file__))
logo_src = os.path.join(script_dir, "assets", "source-logo.png")
if not os.path.exists(logo_src):
    logo_src = "/Users/sylvestershi/.gemini/antigravity-ide/brain/1be75b8b-1fac-46d5-8309-22a16ba8b293/.user_uploaded/media_1788501172861.png"

logo = Image.open(logo_src)
arr = np.array(logo)

# 3. Filter out stray transparent noise to obtain true visible bounding box
visible = arr[:, :, 3] > 5
rows = np.where(np.any(visible, axis=1))[0]
cols = np.where(np.any(visible, axis=0))[0]
true_bbox = (cols[0], rows[0], cols[-1] + 1, rows[-1] + 1)
cropped = logo.crop(true_bbox)
vw, vh = cropped.size

# 4. Scale logo to 640px width (fills center safe zone with balanced breathing room)
target_w = 640
target_h = int(vh * (target_w / vw))
resized = cropped.resize((target_w, target_h), Image.Resampling.LANCZOS)

# 5. Place exactly at mathematical and optical center of 1024x1024 canvas
pos_x = (size - target_w) // 2
pos_y = (size - target_h) // 2

layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
layer.paste(resized, (pos_x, pos_y))
final_canvas = Image.alpha_composite(canvas, layer)

# Verify 100% full-bleed opacity across all pixels
final_arr = np.array(final_canvas)
assert np.all(final_arr[:, :, 3] == 255), "Error: Canvas must be 100% opaque full-bleed for macOS native squircle masking!"

# 6. Save full-bleed asset
project_root = os.path.dirname(script_dir)
output_path = os.path.join(project_root, "app-icon.png")
final_canvas.save(output_path)
print(f"app-icon.png generated at {output_path}! 1024x1024 Full-Bleed Solid White. Logo at ({pos_x}, {pos_y}), size: {target_w}x{target_h}")
