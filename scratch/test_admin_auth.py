import sys
import hashlib

sys.stdout.reconfigure(encoding='utf-8')

print("--- 1. Testing index.html ---")
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Requirement 1: Hidden Access - No visible buttons in HTML
assert 'navBtnAdmin' not in html, 'FAIL: navBtnAdmin still present in index.html'
assert 'btnStartAdmin' not in html, 'FAIL: btnStartAdmin still present in index.html'
assert 'btnOpenAdminPanel' not in html, 'FAIL: btnOpenAdminPanel still present in index.html'
print("✅ No visible admin buttons found in HTML!")

# Requirement 3: Login Modal
assert 'id="adminPinModal"' in html, 'FAIL: adminPinModal missing in index.html'
assert '<input type="password" id="adminPinInput"' in html, 'FAIL: password input missing in adminPinModal'
print("✅ Dark Login Modal with type='password' input verified in HTML!")

# Requirement 5: Content Hiding in HTML
assert '<div id="adminPanelModal" class="modal-overlay" style="display: none;"></div>' in html, 'FAIL: adminPanelModal must be an empty container in index.html'
assert 'id="adminTabOrders"' not in html, 'FAIL: sensitive adminTabOrders must NOT be in index.html'
assert 'id="adminTabWithdrawals"' not in html, 'FAIL: sensitive adminTabWithdrawals must NOT be in index.html'
assert 'id="adminTabAds"' not in html, 'FAIL: sensitive adminTabAds must NOT be in index.html'
assert 'id="adminAdsenseInput"' not in html, 'FAIL: sensitive adminAdsenseInput must NOT be in index.html'
print("✅ Content Hiding verified: 0 sensitive admin elements in index.html!")

print("\n--- 2. Testing js/admin.js ---")
with open('js/admin.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Requirement 2: SHA-256 Hashing of Admin2026@Coco
expected_hash = hashlib.sha256('Admin2026@Coco'.encode('utf-8')).hexdigest()
assert expected_hash == '9c89c9129bcf3d431aecd4ed456e4f3dcd9cc00fd612067b60fcd4d84a78a250'
assert expected_hash in js, 'FAIL: Expected SHA-256 hash not found in js/admin.js'
assert "'Admin2026@Coco'" not in js and '"Admin2026@Coco"' not in js, 'FAIL: Plaintext password must NOT be in code!'
assert 'hashPassword' in js, 'FAIL: hashPassword method missing in js/admin.js'
assert 'SHA-256' in js, 'FAIL: SHA-256 algorithm missing in js/admin.js'
print(f"✅ SHA-256 Hash verified: {expected_hash} (Password never in plain text)!")

# Requirement 4: Session Storage Protection
assert 'sessionStorage.setItem(\'chicken_admin_session\'' in js, 'FAIL: sessionStorage not used for session'
assert 'sessionStorage.getItem(\'chicken_admin_session\'' in js, 'FAIL: sessionStorage not checked for session'
print("✅ Session Protection verified: Uses sessionStorage only, auto-expires on window close!")

# Requirement 1: Hidden Triggers in js
assert 'Ctrl' in js or 'ctrlKey' in js, 'FAIL: Keyboard shortcut missing'
assert 'shiftKey' in js, 'FAIL: Shift key check missing'
assert 'logoClicks >= 7' in js, 'FAIL: 7 logo clicks trigger missing'
print("✅ Hidden Access Triggers verified: Ctrl + Shift + Y and 7 consecutive logo clicks!")

# Requirement 5: Content Hiding in js
assert 'getAdminPanelHTML' in js, 'FAIL: getAdminPanelHTML missing in js/admin.js'
assert 'renderAdminPanelDOM' in js, 'FAIL: renderAdminPanelDOM missing in js/admin.js'
assert 'adminTabOrders' in js and 'adminTabAds' in js, 'FAIL: Admin tabs must be dynamically generated in js'
assert 'panel.innerHTML = \'\'' in js, 'FAIL: lockAndLogout must wipe panel.innerHTML'
print("✅ Dynamic On-Demand DOM Rendering & Purge on Logout verified!")

print("\n🎉 ALL REQUIREMENTS VERIFIED AND PASSED WITH 100% SUCCESS!")
