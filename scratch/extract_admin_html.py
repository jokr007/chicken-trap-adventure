import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

start_idx = None
for i, line in enumerate(lines):
    if '<div id="adminPanelModal"' in line:
        start_idx = i
        break

print(f'start_idx is {start_idx+1}')

depth = 0
end_idx = None
for i in range(start_idx, len(lines)):
    line = lines[i]
    depth += line.count('<div')
    depth -= line.count('</div')
    if depth == 0:
        end_idx = i
        break

print(f'end_idx is {end_idx+1}')
print('Start line:', lines[start_idx].strip())
print('End line:', lines[end_idx].strip())
print('Line after end:', lines[end_idx+1].strip())

modal_content = ''.join(lines[start_idx+1:end_idx])
print('Inner content lines count:', len(lines[start_idx+1:end_idx]))
print('Inner content char count:', len(modal_content))

with open('scratch/admin_panel_template.html', 'w', encoding='utf-8') as out:
    out.write(modal_content)

print('Saved successfully!')
