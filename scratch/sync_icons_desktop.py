import os
import shutil

src_dir = r"C:\Users\no\Downloads\gemes"
dst_dir = r"C:\Users\no\Desktop\Chicken_Game_Fixed"

files = [
    "manifest.json",
    "sw.js",
    "index.html",
    "server.py",
    "icon-192.png",
    "icon-512.png",
    "icon-maskable-192.png",
    "icon-maskable-512.png",
    "icon.svg"
]

for f in files:
    s = os.path.join(src_dir, f)
    d = os.path.join(dst_dir, f)
    if os.path.exists(s):
        shutil.copy2(s, d)
        print("Synced:", f)

print("Desktop folder synced successfully!")
