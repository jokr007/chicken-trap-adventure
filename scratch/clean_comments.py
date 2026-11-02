import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('js/admin.js', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace any occurrence of the plaintext word with safe Arabic description
text = text.replace("'Admin2026@Coco'", "المحددة من الإدارة")
text = text.replace('"Admin2026@Coco"', "المحددة من الإدارة")
text = text.replace('Admin2026@Coco', "المحددة من الإدارة")

with open('js/admin.js', 'w', encoding='utf-8') as f:
    f.write(text)

print('Cleaned any plaintext password occurrences!')
