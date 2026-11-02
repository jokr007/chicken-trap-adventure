import glob

def check_js_syntax(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        src = f.read()

    i = 0
    n = len(src)
    stack = []
    pairs = {')': '(', '}': '{', ']': '['}

    while i < n:
        c = src[i]

        # Single-line comment
        if c == '/' and i + 1 < n and src[i+1] == '/':
            i += 2
            while i < n and src[i] not in '\r\n':
                i += 1
            continue

        # Multi-line comment
        if c == '/' and i + 1 < n and src[i+1] == '*':
            i += 2
            while i + 1 < n and not (src[i] == '*' and src[i+1] == '/'):
                i += 1
            i += 2
            continue

        # String literals ' or "
        if c in ("'", '"'):
            quote = c
            i += 1
            while i < n:
                if src[i] == '\\':
                    i += 2
                    continue
                if src[i] == quote:
                    i += 1
                    break
                if src[i] in '\r\n':
                    # unescaped newline in normal string
                    break
                i += 1
            continue

        # Template literal `
        if c == '`':
            i += 1
            while i < n:
                if src[i] == '\\':
                    i += 2
                    continue
                if src[i] == '`':
                    i += 1
                    break
                if src[i] == '$' and i + 1 < n and src[i+1] == '{':
                    # Embedded expression in template literal
                    stack.append(('`', i))
                    stack.append(('{', i+1))
                    i += 2
                    break
                i += 1
            continue

        if c in '({[':
            stack.append((c, i))
            i += 1
            continue

        if c in ')}]':
            if not stack:
                line = src.count('\n', 0, i) + 1
                return f"Unexpected closing '{c}' at line {line}"
            top_char, top_idx = stack.pop()
            if top_char != pairs[c]:
                top_line = src.count('\n', 0, top_idx) + 1
                line = src.count('\n', 0, i) + 1
                return f"Mismatched: opened '{top_char}' at line {top_line}, closed with '{c}' at line {line}"
            
            # Check if we just closed a template literal ${...}
            if c == '}' and stack and stack[-1][0] == '`':
                stack.pop() # pop the template literal mark
                # resume scanning template literal
                i += 1
                while i < n:
                    if src[i] == '\\':
                        i += 2
                        continue
                    if src[i] == '`':
                        i += 1
                        break
                    if src[i] == '$' and i + 1 < n and src[i+1] == '{':
                        stack.append(('`', i))
                        stack.append(('{', i+1))
                        i += 2
                        break
                    i += 1
                continue
            i += 1
            continue

        i += 1

    if stack:
        top_char, top_idx = stack[-1]
        line = src.count('\n', 0, top_idx) + 1
        return f"Unclosed '{top_char}' at line {line}"

    return "OK (No bracket/paren/quote mismatches)"

for f in sorted(glob.glob("js/*.js") + ["sw.js"]):
    res = check_js_syntax(f)
    print(f"{f}: {res}")
