import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('scratch/admin_panel_template.html', 'r', encoding='utf-8') as f:
    text = f.read()

has_interp = ('$' + '{') in text
print('Does template have dollar-brace?', has_interp)
print('Template length:', len(text))
