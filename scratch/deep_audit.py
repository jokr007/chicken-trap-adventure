import os
import re
import glob

print("=== CHECKING BRACKETS / PARENTHESES BALANCE IN JS FILES ===")
js_files = glob.glob("js/*.js") + ["sw.js"]

for js_path in js_files:
    with open(js_path, "r", encoding="utf-8") as f:
        code = f.read()
    
    # Remove strings and comments to check bracket balance
    # Simple cleaner
    clean = re.sub(r'//.*', '', code)
    clean = re.sub(r'/\*.*?\*/', '', clean, flags=re.DOTALL)
    # Check braces, brackets, parens
    stack = []
    pairs = {')': '(', '}': '{', ']': '['}
    balanced = True
    for i, char in enumerate(clean):
        if char in '({[':
            stack.append((char, i))
        elif char in ')}]':
            if not stack:
                balanced = False
                print(f"[{js_path}] Unmatched closing '{char}' at clean char {i}")
                break
            top, _ = stack.pop()
            if top != pairs[char]:
                balanced = False
                print(f"[{js_path}] Mismatched '{top}' and '{char}' at clean char {i}")
                break
    if balanced and not stack:
        print(f"[{js_path}] Syntax Brackets: BALANCED ({len(code)} bytes)")
    elif balanced and stack:
        print(f"[{js_path}] Unclosed opening: {len(stack)} items, e.g. {stack[-1]}")

print("\n=== CHECKING HTML TAG BALANCE ===")
with open("index.html", "r", encoding="utf-8") as f:
    html = f.read()

# Let's check common unclosed tags like <div>, <button>, <section>, <modal>
for tag in ['div', 'button', 'section', 'nav', 'main', 'header', 'footer', 'aside', 'span', 'p']:
    opens = len(re.findall(rf'<{tag}\b[^>]*>', html, re.IGNORECASE))
    closes = len(re.findall(rf'</{tag}>', html, re.IGNORECASE))
    if opens != closes:
        print(f"Tag <{tag}> mismatch: opens={opens}, closes={closes} (diff: {opens - closes})")
    else:
        print(f"Tag <{tag}> balanced: {opens}")
