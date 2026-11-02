import re

for filename in ["js/entities.js", "js/levels.js"]:
    with open(filename, "r", encoding="utf-8") as f:
        content = f.read()
    print(f"{filename}: {len(content)} bytes, lines: {content.count(chr(10))}")
    # Check classes defined
    classes = re.findall(r'class\s+([A-Za-z0-9_]+)', content)
    print(f"  Classes: {classes}")
