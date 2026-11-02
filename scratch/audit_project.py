import os
import re

files_to_check = [
    "index.html",
    "css/style.css",
    "js/audio.js",
    "js/entities.js",
    "js/levels.js",
    "js/security.js",
    "js/admin.js",
    "js/ads.js",
    "js/features.js",
    "js/vouchers.js",
    "js/withdraw.js",
    "js/referral.js",
    "js/winners.js",
    "js/dhikr.js",
    "js/game.js",
    "sw.js",
    "manifest.json"
]

print("=== CHECKING FILES EXISTENCE ===")
for f in files_to_check:
    exists = os.path.isfile(f)
    size = os.path.getsize(f) if exists else 0
    print(f"{f}: {'EXISTS' if exists else 'MISSING'} ({size} bytes)")

# Let's inspect index.html for all IDs referenced in JS files
with open("index.html", "r", encoding="utf-8") as f:
    html_content = f.read()

# Extract all IDs defined in index.html
html_ids = set(re.findall(r'id=["\']([^"\']+)["\']', html_content))
print(f"\nTotal IDs defined in index.html: {len(html_ids)}")

# Check getElementById in each JS file
print("\n=== CHECKING getElementById REFERENCES IN JS ===")
for js_file in [f for f in files_to_check if f.startswith("js/")]:
    if not os.path.isfile(js_file):
        continue
    with open(js_file, "r", encoding="utf-8") as f:
        js_content = f.read()
    
    # Find getElementById('...')
    ids_queried = set(re.findall(r'getElementById\(["\']([^"\']+)["\']\)', js_content))
    missing_ids = [id_name for id_name in ids_queried if id_name not in html_ids]
    
    # Also check if missing IDs are dynamically created in other scripts or template
    print(f"\nFile: {js_file} (queries {len(ids_queried)} unique IDs)")
    if missing_ids:
        print(f"  Potentially missing from index.html ({len(missing_ids)}): {missing_ids[:15]}...")
    else:
        print("  All queried IDs found in index.html!")
