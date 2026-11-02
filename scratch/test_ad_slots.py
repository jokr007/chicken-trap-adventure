import sys
import re

sys.stdout.reconfigure(encoding='utf-8')

# 1. Test index.html
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

assert 'id="leftSidebarAd"' in html, 'Missing leftSidebarAd in index.html'
assert 'id="rightSidebarAd"' in html, 'Missing rightSidebarAd in index.html'
assert 'id="mobileBottomAd"' in html, 'Missing mobileBottomAd in index.html'

pos_left = html.find('leftSidebarAd')
pos_right = html.find('rightSidebarAd')
pos_mobile = html.find('mobileBottomAd')
pos_dpad = html.find('mobile-controls')
pos_canvas = html.find('gameCanvas')

assert pos_right < pos_canvas < pos_left, 'Sidebar ads must flank gameCanvas outside its frame'
assert pos_dpad < pos_mobile, 'mobileBottomAd must be placed after mobile-controls (D-pad)'

print('✅ index.html checks passed!')

# 2. Test css/style.css
with open('css/style.css', 'r', encoding='utf-8') as f:
    css = f.read()

assert '.sidebar-ad-slot' in css, 'Missing .sidebar-ad-slot in css'
assert '.mobile-bottom-ad-slot' in css, 'Missing .mobile-bottom-ad-slot in css'
assert '.game-layout-wrapper' in css, 'Missing .game-layout-wrapper in css'

# Check safety margin >= 15px
slot_start = css.find('.mobile-bottom-ad-slot')
slot_block = css[slot_start:slot_start+400]
margin_match = re.search(r'margin-top:\s*(\d+)px', slot_block)
assert margin_match, 'margin-top not found in .mobile-bottom-ad-slot'
margin_val = int(margin_match.group(1))
assert margin_val >= 15, f'Safety margin must be >= 15px, found {margin_val}px'
print(f'✅ Safety margin verified: {margin_val}px (>= 15px AdSense safe distance)')

# Check mobile hiding of sidebar and showing mobile ad in media queries
found_sidebar_hide = False
found_mobile_show = False
for match in re.finditer(r'@media\s*\([^)]*max-width:\s*820px[^)]*\)\s*\{([^}]*\{[^}]*\}[^}]*)+', css):
    block = match.group(0)
    if 'sidebar-ad-slot' in block and 'display: none !important' in block:
        found_sidebar_hide = True
    if 'mobile-bottom-ad-slot' in block and 'display: flex' in block:
        found_mobile_show = True

assert found_sidebar_hide, 'Sidebar ads must have display: none !important under mobile media query'
assert found_mobile_show, 'mobile-bottom-ad-slot must have display: flex under mobile media query'

print('✅ CSS rules and responsive media queries verified!')

# 3. Test js/admin.js
with open('js/admin.js', 'r', encoding='utf-8') as f:
    js = f.read()

assert 'leftSidebarAd' in js, 'Missing leftSidebarAd reference in admin.js'
assert 'rightSidebarAd' in js, 'Missing rightSidebarAd reference in admin.js'
assert 'mobileBottomAd' in js, 'Missing mobileBottomAd reference in admin.js'
assert 'injectAds' in js, 'Missing injectAds in admin.js'

print('✅ admin.js injectAds integration verified!')
print('🎉 ALL TESTS PASSED SUCCESSFULLY!')
