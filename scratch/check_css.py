with open("css/style.css", "r", encoding="utf-8") as f:
    css = f.read()

import re

# Remove comments
clean_css = re.sub(r'/\*.*?\*/', '', css, flags=re.DOTALL)
open_b = clean_css.count('{')
close_b = clean_css.count('}')
print(f"CSS open braces: {open_b}, close braces: {close_b}, diff: {open_b - close_b}")

# Check for font or vendor prefix issues, z-index stacking issues
print(f"Total CSS lines: {css.count(chr(10))}")
