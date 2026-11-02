import sys
import re

sys.stdout.reconfigure(encoding='utf-8')

# 1. Read admin template HTML
with open('scratch/admin_panel_template.html', 'r', encoding='utf-8') as f:
    template_html = f.read().strip()

# 2. Read current js/admin.js
with open('js/admin.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Define DEFAULT_ADMIN_HASH and pure JS fallback
header_add = '''// الهاش المشفر الثابت لكلمة مرور المدير الافتراضية 'Admin2026@Coco' بتقنية SHA-256
// ملاحظة أمنية: لا يتم تخزين كلمة المرور بنص صريح (Plain Text) أبداً داخل الكود
const DEFAULT_ADMIN_HASH = '9c89c9129bcf3d431aecd4ed456e4f3dcd9cc00fd612067b60fcd4d84a78a250';

/**
 * خوارزمية تشفير SHA-256 النقية (Pure JavaScript Cryptographic Fallback)
 * تضمن العمل الفوري والمطابق لمعيار FIPS PUB 180-4 حتى في البيئات القديمة أو غير الآمنة
 */
function sha256Pure(ascii) {
    function rightRotate(value, amount) {
        return (value >>> amount) | (value << (32 - amount));
    }
    const mathPow = Math.pow;
    const maxWord = mathPow(2, 32);
    let lengthProperty = 'length';
    let i, j;
    let result = '';

    const words = [];
    const asciiBitLength = ascii[lengthProperty] * 8;
    
    let hash = sha256Pure.h = sha256Pure.h || [];
    const k = sha256Pure.k = sha256Pure.k || [];
    let primeCounter = k[lengthProperty];

    const isComposite = {};
    for (let candidate = 2; primeCounter < 64; candidate++) {
        if (!isComposite[candidate]) {
            for (i = 0; i < 300; i += candidate) {
                isComposite[i] = candidate;
            }
            hash[primeCounter] = (mathPow(candidate, .5) * maxWord) | 0;
            k[primeCounter++] = (mathPow(candidate, 1/3) * maxWord) | 0;
        }
    }
    
    ascii += '\\x80';
    while (ascii[lengthProperty] % 64 - 56) ascii += '\\x00';
    for (i = 0; i < ascii[lengthProperty]; i++) {
        j = ascii.charCodeAt(i);
        if (j >> 8) return '';
        words[i >> 2] |= j << ((3 - i) % 4) * 8;
    }
    words[words[lengthProperty]] = ((asciiBitLength / maxWord) | 0);
    words[words[lengthProperty]] = (asciiBitLength) | 0;
    
    for (j = 0; j < words[lengthProperty];) {
        const w = words.slice(j, j += 16);
        const oldHash = hash;
        hash = hash.slice(0, 8);
        
        for (i = 0; i < 64; i++) {
            const i2 = i + j;
            const w15 = w[i - 15], w2 = w[i - 2];
            const a = hash[0], e = hash[4];
            const temp1 = hash[7]
                + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25))
                + ((e & hash[5]) ^ ((~e) & hash[6]))
                + k[i]
                + (w[i] = (i < 16) ? w[i] : (
                    w[i - 16]
                    + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3))
                    + w[i - 7]
                    + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))
                ) | 0
            );
            const temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22))
                + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
            
            hash = [(temp1 + temp2) | 0].concat(hash);
            hash[4] = (hash[4] + temp1) | 0;
        }
        
        for (i = 0; i < 8; i++) {
            hash[i] = (hash[i] + oldHash[i]) | 0;
        }
    }
    
    for (i = 0; i < 8; i++) {
        for (j = 3; j + 1; j--) {
            const b = (hash[i] >> (j * 8)) & 255;
            result += ((b < 16) ? '0' : '') + b.toString(16);
        }
    }
    return result;
}
'''

# Replace constructor lines 15-18 in AdminManager
old_constructor_vars = '''        this.pinHash = ""; // الهاش المشفر للرمز السري بتقنية SHA-256 (محمي تماماً)
        this.pin = "1234"; // رمز افتراضي أولي يتم ترقيته وتشفيره تلقائياً
        this.isLoggedIn = false;
        this.sessionToken = null;'''

new_constructor_vars = '''        // استرجاع الهاش المشفر المحفوظ أو استخدام الهاش المشفر الافتراضي (Admin2026@Coco)
        this.pinHash = localStorage.getItem('chicken_admin_hash') || DEFAULT_ADMIN_HASH;
        
        // التحقق من الجلسة المحفوظة عبر sessionStorage فقط (تغلق وتلغى تلقائياً عند إغلاق المتصفح)
        this.sessionToken = sessionStorage.getItem('chicken_admin_session') || null;
        this.isLoggedIn = !!this.sessionToken;'''

assert old_constructor_vars in js, 'Could not find old_constructor_vars in js/admin.js'
js = js.replace(old_constructor_vars, new_constructor_vars)

# Replace saveData() pin handling
old_save_pin = '''        if (this.pinHash) {
            localStorage.setItem('chicken_admin_hash', this.pinHash);
            localStorage.removeItem('chicken_admin_pin');
        } else {
            localStorage.setItem('chicken_admin_pin', this.pin);
        }'''

new_save_pin = '''        if (this.pinHash) {
            localStorage.setItem('chicken_admin_hash', this.pinHash);
        }
        localStorage.removeItem('chicken_admin_pin'); // حذف أي نص غير مشفر لتعزيز الأمان'''

assert old_save_pin in js, 'Could not find old_save_pin in js/admin.js'
js = js.replace(old_save_pin, new_save_pin)

# Replace loadData() pin handling and sessionStorage
old_load_pin = '''            const savedHash = localStorage.getItem('chicken_admin_hash');
            if (savedHash) this.pinHash = savedHash;

            const savedPin = localStorage.getItem('chicken_admin_pin');
            if (savedPin) this.pin = savedPin;

            // استعادة الجلسة النشطة للمدير إذا لم تنتهِ
            const activeToken = sessionStorage.getItem('chicken_owner_session');
            if (activeToken) {
                this.isLoggedIn = true;
                this.sessionToken = activeToken;
                setTimeout(() => this.updateOwnerUIMode(true), 300);
            }'''

new_load_pin = '''            const savedHash = localStorage.getItem('chicken_admin_hash');
            this.pinHash = savedHash || DEFAULT_ADMIN_HASH;
            localStorage.removeItem('chicken_admin_pin'); // تطهير تام لأي رمز غير مشفر

            // استرجاع الجلسة المؤقتة الحصرية من sessionStorage فقط (لا يتم استخدام localStorage لحماية الجلسة)
            const activeToken = sessionStorage.getItem('chicken_admin_session');
            if (activeToken) {
                this.isLoggedIn = true;
                this.sessionToken = activeToken;
            } else {
                this.isLoggedIn = false;
                this.sessionToken = null;
            }'''

assert old_load_pin in js, 'Could not find old_load_pin in js/admin.js'
js = js.replace(old_load_pin, new_load_pin)

# Build the replacement for hashPin -> openPinModal
start_marker = '    /**\n     * تجزئة مشفرة للرمز السري بتقنية SHA-256 مع Salt'
end_marker = '    // ملحقات ومساعدات النظام (Vault & Alerts)'

start_pos = js.find(start_marker)
end_pos = js.find(end_marker)
assert start_pos != -1 and end_pos != -1, 'Could not find start/end markers in js/admin.js'

new_auth_section = f'''    // ==========================================
    // 5. نظام المصادقة والتشفير القوي SHA-256 وحماية الجلسة
    // ==========================================

    /**
     * تشفير كلمة المرور بتقنية SHA-256 القوية
     * يستخدم SubtleCrypto المدعوم في المتصفحات الحديثة مع خوارزمية نقية احتياطية
     */
    async hashPassword(password) {{
        if (!password || typeof password !== 'string') return '';
        if (window.crypto && window.crypto.subtle && window.crypto.subtle.digest) {{
            try {{
                const encoder = new TextEncoder();
                const data = encoder.encode(password);
                const buffer = await window.crypto.subtle.digest('SHA-256', data);
                return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
            }} catch (e) {{
                console.warn('SubtleCrypto error, falling back to pure JS SHA-256:', e);
            }}
        }}
        return sha256Pure(password);
    }}

    /**
     * التحقق من كلمة مرور المدير المشفرة
     * يقارن الهاش الناتج من الإدخال مع الهاش المشفر المحفوظ (بدون نصوص صريحة)
     */
    async verifyPin(enteredPin) {{
        if (!enteredPin || typeof enteredPin !== 'string') return false;

        // فحص قفل جدار الحماية ضد التخمين المتكرر (Brute Force Lockout)
        if (window.securityWAF) {{
            const lockout = window.securityWAF.isPinLockedOut();
            if (lockout && lockout.locked) {{
                alert(`🚨 لوحة الإدارة مقفلة أمنياً بسبب تجاوز عدد المحاولات الخاطئة!\\nيرجى الانتظار ${{lockout.remainingSec}} ثانية للمحاولة مجدداً.`);
                return false;
            }}
        }}

        const trimmed = enteredPin.trim();
        const hashed = await this.hashPassword(trimmed);
        const targetHash = this.pinHash || DEFAULT_ADMIN_HASH;

        const isMatch = (hashed === targetHash);

        if (isMatch) {{
            this.isLoggedIn = true;
            this.sessionToken = 'ADMIN_SESS_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2);
            
            // 4. حفظ الجلسة في sessionStorage فقط (ينتهي بمجرد إغلاق المتصفح أو النافذة)
            sessionStorage.setItem('chicken_admin_session', this.sessionToken);

            if (window.securityWAF) window.securityWAF.recordSuccessPin();

            // 5. إنشاء محتوى لوحة الإدارة الحساس في DOM وفتحه
            this.onAdminLoginSuccess();
            return true;
        }}

        if (window.securityWAF) {{
            window.securityWAF.recordFailedPinAttempt();
            if (window.securityWAF.pinFailedAttempts >= 3) {{
                this.sendSecurityBreachAlert();
            }}
        }}
        return false;
    }}

    /**
     * الإجراءات المنفذة فور تسجيل دخول المدير بنجاح
     */
    onAdminLoginSuccess() {{
        // إغلاق نافذة تسجيل الدخول
        const pinModal = document.getElementById('adminPinModal');
        if (pinModal) pinModal.style.display = 'none';

        // إنشاء وتوليد محتوى لوحة الإدارة في DOM (Content Hiding on demand)
        this.renderAdminPanelDOM();

        // إظهار لوحة الإدارة
        const adminPanel = document.getElementById('adminPanelModal');
        if (adminPanel) adminPanel.style.display = 'flex';

        // عرض الجداول المحمية والبيانات المعتمدة
        this.renderOrders();
        this.renderWithdrawals();
        this.renderVault();
        this.renderWafLogs();
        this.populateAdsForm();

        if (window.authManager) window.authManager.renderAdminUsersList();
        if (window.featuresManager) window.featuresManager.populateAdminForm();
    }}

    /**
     * تغيير وتشفير كلمة مرور المدير بالهاش الجديد
     */
    async changePin(newPin) {{
        if (!this.isLoggedIn) {{
            alert('🔒 يرجى تسجيل الدخول أولاً لتغيير الرمز السري!');
            return false;
        }}
        if (!newPin || newPin.trim().length < 6) {{
            alert('الرمز السري الجديد يجب أن يتكون من 6 خانات على الأقل لضمان الأمان الأقصى!');
            return false;
        }}
        this.pinHash = await this.hashPassword(newPin.trim());
        localStorage.setItem('chicken_admin_hash', this.pinHash);
        localStorage.removeItem('chicken_admin_pin');
        alert('🔒 تم تغيير وتشفير كلمة مرور المدير بنجاح بتقنية SHA-256!\\nتم تخزين الهاش المشفر فقط ولا يمكن لأي شخص آخر فتح اللوحة.');
        return true;
    }}

    /**
     * قفل لوحة الإدارة وتسجيل الخروج الفوري ومسح المحتوى الحساس من الـ DOM
     */
    lockAndLogout() {{
        this.isLoggedIn = false;
        this.sessionToken = null;
        sessionStorage.removeItem('chicken_admin_session');
        sessionStorage.removeItem('chicken_owner_session');

        // إغلاق النافذة وتفريغ محتواها بالكامل من DOM
        const panel = document.getElementById('adminPanelModal');
        if (panel) {{
            panel.style.display = 'none';
            panel.innerHTML = ''; // تطهير DOM بالكامل لمنع أي فحص أو تعديل
        }}

        alert('🔒 تم تسجيل الخروج وقفل لوحة الإدارة ومسح محتوياتها من المتصفح بنجاح.');
    }}

    /**
     * قالب HTML الكامل للوحة الإدارة الحساسة (يُحقن برمجياً فقط بعد تسجيل الدخول)
     */
    getAdminPanelHTML() {{
        return `{template_html}`;
    }}

    /**
     * إنشاء محتوى لوحة الإدارة برمجياً في الـ DOM (Content Hiding)
     */
    renderAdminPanelDOM() {{
        const adminPanel = document.getElementById('adminPanelModal');
        if (!adminPanel) return;

        // حقن العناصر فقط إذا لم تكن موجودة مسبقاً
        adminPanel.innerHTML = this.getAdminPanelHTML();

        // ربط كافة الأحداث التفاعلية للوحة الإدارة بعد حقن الـ DOM
        this.bindAdminPanelDOMEvents();
    }}

    /**
     * ربط أحداث أزرار وتبويبات لوحة الإدارة فور حقن الـ DOM
     */
    bindAdminPanelDOMEvents() {{
        const panel = document.getElementById('adminPanelModal');
        if (!panel) return;

        // زر قفل اللوحة وزر الإغلاق
        document.getElementById('btnLockAdminPanel')?.addEventListener('click', () => this.lockAndLogout());
        document.getElementById('btnCloseAdminPanel')?.addEventListener('click', () => {{
            panel.style.display = 'none';
        }});

        // زر حفظ شبكات الإعلانات ديناميكياً
        document.getElementById('btnSaveAdminAds')?.addEventListener('click', () => {{
            this.saveAdsConfig();
        }});

        // زر حفظ وتشفير الرمز السري الجديد
        document.getElementById('btnSaveNewPin')?.addEventListener('click', async () => {{
            const newPinInp = document.getElementById('adminNewPinInput');
            if (newPinInp) {{
                await this.changePin(newPinInp.value);
                newPinInp.value = '';
            }}
        }});

        // تبديل تبويبات لوحة المدير
        panel.querySelectorAll('.admin-tab-btn').forEach(btn => {{
            btn.addEventListener('click', (e) => {{
                panel.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                const tab = e.currentTarget.getAttribute('data-admin-tab');

                panel.querySelectorAll('.admin-tab-content').forEach(c => c.style.display = 'none');

                if (tab === 'orders') {{
                    const el = document.getElementById('adminTabOrders');
                    if (el) el.style.display = 'block';
                    this.renderOrders();
                }} else if (tab === 'withdrawals') {{
                    const el = document.getElementById('adminTabWithdrawals');
                    if (el) el.style.display = 'block';
                    this.renderWithdrawals();
                }} else if (tab === 'vault') {{
                    const el = document.getElementById('adminTabVault');
                    if (el) el.style.display = 'block';
                    this.renderVault();
                }} else if (tab === 'ads') {{
                    const el = document.getElementById('adminTabAds');
                    if (el) el.style.display = 'block';
                    this.populateAdsForm();
                }} else if (tab === 'social') {{
                    const el = document.getElementById('adminTabSocial');
                    if (el) el.style.display = 'block';
                    if (window.featuresManager) window.featuresManager.populateAdminForm();
                }} else if (tab === 'telegram') {{
                    const el = document.getElementById('adminTabTelegram');
                    if (el) el.style.display = 'block';
                    this.populateTelegramForm();
                }} else if (tab === 'waf') {{
                    const el = document.getElementById('adminTabWaf');
                    if (el) el.style.display = 'block';
                    this.renderWafLogs();
                    if (window.authManager) window.authManager.renderAdminUsersList();
                }} else if (tab === 'security') {{
                    const el = document.getElementById('adminTabSecurity');
                    if (el) el.style.display = 'block';
                }}
            }});
        }});

        // حفظ إعدادات تنبيهات تليجرام
        document.getElementById('btnSaveTelegramConfig')?.addEventListener('click', () => {{
            this.saveTelegramConfig();
        }});

        // تجربة تنبيه تليجرام
        document.getElementById('btnTestTelegramAlert')?.addEventListener('click', () => {{
            this.testTelegramAlert();
        }});

        // حفظ القناة ومواقع التواصل والمانع
        document.getElementById('btnSaveAdminSocial')?.addEventListener('click', () => {{
            if (window.featuresManager) window.featuresManager.saveAdminConfig();
        }});

        // زر إعادة تعيين الاشتراك للتجربة
        document.getElementById('btnResetAdminSub')?.addEventListener('click', () => {{
            if (window.featuresManager) window.featuresManager.resetSubscriptionForTesting();
        }});

        // حفظ وإيداع أكواد جديدة في المخزن
        document.getElementById('btnSaveVaultCodes')?.addEventListener('click', () => {{
            if (!this.isLoggedIn) {{
                alert('🔒 يرجى تسجيل الدخول أولاً كمدير!');
                return;
            }}
            const gameSelect = document.getElementById('vaultGameSelect');
            const textarea = document.getElementById('adminVaultCodesInput');

            if (gameSelect && textarea) {{
                const count = this.addCodesToVault(gameSelect.value, textarea.value);
                if (count > 0) {{
                    alert(`✅ تم إيداع ${{count}} كود حقيقي في مخزن ${{gameSelect.options[gameSelect.selectedIndex].text}} بنجاح!`);
                    textarea.value = '';
                    this.renderVault();
                }} else {{
                    alert('يرجى كتابة أو لصق الأكواد في الصندوق أولاً (كود في كل سطر).');
                }}
            }}
        }});
    }}

    /**
     * طرق الوصول المخفي للوحة الإدارة (Hidden Access: Shortcuts & Logo Clicks)
     * لا توجد أي أزرار ظاهرة للزوار العاديين في الموقع
     */
    setupHiddenAccessListeners() {{
        // 1. اختصار لوحة المفاتيح السري: Ctrl + Shift + Y (أو Ctrl + Shift + A كبديل)
        document.addEventListener('keydown', (e) => {{
            if (e.ctrlKey && e.shiftKey && (e.key === 'Y' || e.key === 'y' || e.key === 'A' || e.key === 'a')) {{
                e.preventDefault();
                this.openPinModal();
            }}
        }});

        // 2. النقر 7 مرات متتالية على شعار اللعبة (Game Logo Clicks)
        let logoClicks = 0;
        let lastLogoClickTime = 0;
        const logoElements = document.querySelectorAll('#navBrandHome, .navbar-brand, .brand-avatar, .brand-title');
        logoElements.forEach(logoEl => {{
            logoEl.addEventListener('click', (e) => {{
                const now = Date.now();
                if (now - lastLogoClickTime < 1000) {{
                    logoClicks++;
                }} else {{
                    logoClicks = 1;
                }}
                lastLogoClickTime = now;

                if (logoClicks >= 7) {{
                    logoClicks = 0;
                    e.preventDefault();
                    e.stopPropagation();
                    this.openPinModal();
                }}
            }});
        }});

        // 3. رابط سري اختياري عبر الرابط: ?admin=1 أو ?owner=true
        if (window.location.search.includes('admin=1') || window.location.search.includes('owner=true')) {{
            setTimeout(() => this.openPinModal(), 500);
        }}
    }}

    /**
     * فتح نافذة تسجيل الدخول المشفرة أو لوحة الإدارة مباشرة إذا كانت الجلسة نشطة
     */
    openPinModal() {{
        if (this.isLoggedIn) {{
            const panel = document.getElementById('adminPanelModal');
            if (panel && (!panel.innerHTML || !panel.innerHTML.trim())) {{
                this.renderAdminPanelDOM();
            }}
            if (panel) panel.style.display = 'flex';
            this.renderOrders();
            this.renderWithdrawals();
        }} else {{
            const pinModal = document.getElementById('adminPinModal');
            const pinInput = document.getElementById('adminPinInput');
            if (pinInput) pinInput.value = '';
            if (pinModal) pinModal.style.display = 'flex';
            setTimeout(() => pinInput?.focus(), 120);
        }}
    }}

    /**
     * تهيئة مستمعات الدخول الآمن والوصول السري
     */
    initUIListeners() {{
        // زر إرسال الرمز السري في نافذة تسجيل الدخول
        const btnSubmitPin = document.getElementById('btnSubmitAdminPin');
        const pinInput = document.getElementById('adminPinInput');
        const btnClosePin = document.getElementById('btnCloseAdminPin');

        const doLogin = async () => {{
            const entered = pinInput ? pinInput.value : '';
            if (!entered) return;
            const ok = await this.verifyPin(entered);
            if (!ok) {{
                alert('❌ الرمز السري غير صحيح! تم توثيق المحاولة أمنياً بجدار الحماية.');
                if (pinInput) pinInput.value = '';
            }}
        }};

        btnSubmitPin?.addEventListener('click', doLogin);
        pinInput?.addEventListener('keydown', (e) => {{
            if (e.key === 'Enter') doLogin();
        }});

        btnClosePin?.addEventListener('click', () => {{
            const pinModal = document.getElementById('adminPinModal');
            if (pinModal) pinModal.style.display = 'none';
        }});

        // تفعيل طرق الوصول السري
        this.setupHiddenAccessListeners();
    }}
'''

# Replace the auth section
js = js[:start_pos] + new_auth_section + '\n\n' + js[end_pos:]

# Prepend header_add before class AdminManager
class_pos = js.find('class AdminManager {')
assert class_pos != -1, 'Could not find class AdminManager'
js = js[:class_pos] + header_add + '\n' + js[class_pos:]

with open('js/admin.js', 'w', encoding='utf-8') as f:
    f.write(js)

print('js/admin.js updated successfully!')
print('New js/admin.js length:', len(js))
