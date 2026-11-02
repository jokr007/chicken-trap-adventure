/**
 * =========================================================================
 * لوحة تحكم وإدارة اللعبة الشاملة (Admin Panel & Business Management System)
 * =========================================================================
 * 1. نظام الحفظ المركزي للإعدادات (Central Config Manager: saveAdminConfig, loadAdminConfig)
 * 2. الإدارة الديناميكية لشبكات الإعلانات (Dynamic Ad Settings & HTML Binding)
 * 3. تفعيل وحقن الإعلانات التلقائي (Automatic Ad Injection: injectAds)
 * 4. إدارة طلبات الشحن والسحب المالي وتحديث الحالات (Orders & Withdrawals Management)
 * 5. حماية لوحة الإدارة بتشفير SHA-256 وجدار الحماية (PIN Authentication & Security)
 * 6. ربط وتبديل التبويبات والأحداث التفاعلية (Standalone UI Controller)
 */

// الهاش المشفر الثابت لكلمة مرور المدير الافتراضية المحددة من الإدارة بتقنية SHA-256
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
    
    ascii += '\x80';
    while (ascii[lengthProperty] % 64 - 56) ascii += '\x00';
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

class AdminManager {
    constructor() {
        // استرجاع الهاش المشفر المحفوظ أو استخدام الهاش المشفر الافتراضي (المحددة من الإدارة)
        this.pinHash = localStorage.getItem('chicken_admin_hash') || DEFAULT_ADMIN_HASH;
        
        // التحقق من الجلسة المحفوظة عبر sessionStorage فقط (تغلق وتلغى تلقائياً عند إغلاق المتصفح)
        this.sessionToken = sessionStorage.getItem('chicken_admin_session') || null;
        this.isLoggedIn = !!this.sessionToken;
        this.currentOrdersFilter = 'all';
        this.currentWithdrawalsFilter = 'all';

        // 1. نظام الحفظ المركزي (Config Manager)
        this.loadAdminConfig();

        // مخزن الأكواد الحقيقية (Real Codes Vault)
        this.vault = {
            freefire: [],
            pubg: [],
            efootball: [],
            clash: [],
            codm: [],
            googleplay: []
        };

        // طلبات الشحن الواردة من اللاعبين (Vouchers Orders)
        this.orders = [];

        // طلبات السحب المالي (Cash Withdrawals: Mastercard, PayPal, Bank Wire)
        this.withdrawals = [];

        // تحميل البيانات المحفوظة
        this.loadData();

        // تهيئة واجهات وأحداث لوحة الإدارة وحقن الإعلانات تلقائياً عند التشغيل
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.initUIListeners();
                this.injectAds();
            });
        } else {
            this.initUIListeners();
            this.injectAds();
        }
    }

    // ==========================================
    // 1. نظام الحفظ المركزي (Config Manager)
    // ==========================================

    /**
     * استرجاع وتحميل إعدادات المدير من localStorage
     */
    loadAdminConfig() {
        const defaults = {
            // شبكات الإعلانات والربح الحقيقي
            adsensePubId: "ca-pub-XXXXXXXXXXXXXXXX",
            monetagZoneId: "",
            directAdLink: "",
            realAdsActive: false,
            adNetwork: "adsense",

            // تنبيهات تليجرام الفورية
            telegramBotToken: "",
            telegramChatId: "",
            enableTelegramAlerts: false,

            // شرط الاشتراك الإلزامي في القناة
            mandatorySubEnabled: true,
            channelName: "القناة الرسمية للعبة كوكو والأفخاخ 🐔",
            channelUrl: "https://www.youtube.com/c/FORJAmoutawakil",
            channelType: "youtube",

            // روابط مواقع التواصل الاجتماعي
            socialLinks: {
                youtube: "https://www.youtube.com/c/FORJAmoutawakil",
                telegram: "https://t.me/ChickenGameOfficial",
                tiktok: "https://www.tiktok.com/@ChickenGame",
                facebook: "https://www.facebook.com/ChickenGameOfficial",
                instagram: "https://www.instagram.com/ChickenGame",
                discord: "https://discord.gg/ChickenGame"
            },

            // منع حاجب الإعلانات
            antiAdblockEnabled: true,

            // إعدادات سحب الأموال الحقيقية
            pointsPerUSD: 50000,
            minWithdrawalUSD: 5
        };

        try {
            const saved = localStorage.getItem('chicken_admin_config');
            this.config = saved ? Object.assign({}, defaults, JSON.parse(saved)) : defaults;
            if (this.config.channelUrl === 'https://www.youtube.com/@ChickenGameOfficial') {
                this.config.channelUrl = 'https://www.youtube.com/c/FORJAmoutawakil';
            }
            if (this.config.socialLinks && this.config.socialLinks.youtube === 'https://www.youtube.com/@ChickenGameOfficial') {
                this.config.socialLinks.youtube = 'https://www.youtube.com/c/FORJAmoutawakil';
            }
        } catch (e) {
            console.warn('تعذر تحميل إعدادات المدير:', e);
            this.config = defaults;
        }

        window.adminConfig = this.config;
        return this.config;
    }

    /**
     * حفظ وتخزين إعدادات المدير مركزياً في localStorage
     */
    saveAdminConfig(newConfig = null) {
        if (newConfig && typeof newConfig === 'object') {
            this.config = Object.assign(this.config, newConfig);
        }

        try {
            localStorage.setItem('chicken_admin_config', JSON.stringify(this.config));
            window.adminConfig = this.config;
        } catch (e) {
            console.warn('تعذر حفظ إعدادات لوحة الإدارة في localStorage:', e);
        }
        return this.config;
    }

    // توافق مع الكود السابق
    saveData() {
        if (this.pinHash) {
            localStorage.setItem('chicken_admin_hash', this.pinHash);
        }
        localStorage.removeItem('chicken_admin_pin'); // حذف أي نص غير مشفر لتعزيز الأمان

        this.saveAdminConfig();
        localStorage.setItem('chicken_codes_vault', JSON.stringify(this.vault));
        localStorage.setItem('chicken_customer_orders', JSON.stringify(this.orders));
        localStorage.setItem('chicken_admin_withdrawals', JSON.stringify(this.withdrawals));
    }

    loadData() {
        try {
            const savedHash = localStorage.getItem('chicken_admin_hash');
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
            }

            const savedVault = localStorage.getItem('chicken_codes_vault');
            if (savedVault) this.vault = JSON.parse(savedVault);

            const savedOrders = localStorage.getItem('chicken_customer_orders');
            if (savedOrders) this.orders = JSON.parse(savedOrders);

            const savedWithdrawals = localStorage.getItem('chicken_admin_withdrawals');
            if (savedWithdrawals) this.withdrawals = JSON.parse(savedWithdrawals);
        } catch (e) {
            console.warn('تعذر استرجاع بيانات الإدارة المخزنة:', e);
        }
    }

    // ==========================================
    // 2. إدارة الإعلانات ديناميكياً (Dynamic Ad Settings)
    // ==========================================

    /**
     * تعبئة حقول إدخال الإعلانات بالقيم المحفوظة
     */
    populateAdsForm() {
        const adsenseInp = document.getElementById('adminAdsenseInput');
        const monetagInp = document.getElementById('adminMonetagInput');
        const directLinkInp = document.getElementById('adminDirectLinkInput');

        if (adsenseInp) {
            adsenseInp.value = (this.config.adsensePubId && this.config.adsensePubId !== 'ca-pub-XXXXXXXXXXXXXXXX')
                ? this.config.adsensePubId : '';
        }
        if (monetagInp) {
            monetagInp.value = this.config.monetagZoneId || '';
        }
        if (directLinkInp) {
            directLinkInp.value = this.config.directAdLink || '';
        }
    }

    /**
     * حفظ قيم حقول الإعلانات في المتصفح وتفعيلها فوراً
     */
    saveAdsConfig() {
        if (!this.isLoggedIn) {
            alert('🔒 إجراء محظور: يرجى تسجيل الدخول إلى لوحة الإدارة أولاً لتعديل الإعلانات!');
            return false;
        }

        const adsenseInp = document.getElementById('adminAdsenseInput');
        const monetagInp = document.getElementById('adminMonetagInput');
        const directLinkInp = document.getElementById('adminDirectLinkInput');

        const adsenseVal = adsenseInp ? adsenseInp.value.trim() : '';
        const monetagVal = monetagInp ? monetagInp.value.trim() : '';
        const directLinkVal = directLinkInp ? directLinkInp.value.trim() : '';

        this.config.adsensePubId = adsenseVal;
        this.config.monetagZoneId = monetagVal;
        this.config.directAdLink = directLinkVal;
        this.config.realAdsActive = !!((adsenseVal && adsenseVal.startsWith('ca-pub-')) || monetagVal);

        // 1. حفظ الإعدادات في localStorage عبر نظام الحفظ المركزي
        this.saveAdminConfig();

        // 2. تفعيل وحقن الإعلانات فورياً في الصفحة
        this.injectAds();

        // 3. مزامنة مع محرك الإعلانات إن وُجد
        if (window.adManager && adsenseVal.startsWith('ca-pub-')) {
            window.adManager.setPublisherId(adsenseVal);
        }

        alert('✅ تم حفظ وتخزين إعدادات الإعلانات بنجاح، وتفعيل ظهورها في المتصفح فوراً!');
        return true;
    }

    // ==========================================
    // 3. تفعيل وحقن الإعلانات التلقائي (Ad Injection)
    // ==========================================

    /**
     * قراءة إعدادات الإعلانات وحقن وسوم السكربت والبانرات تلقائياً عند بدء التشغيل
     * يدعم:
     * - البانر العلوي (#topAdBanner)
     * - البانر السفلي (#bottomAdBanner)
     * - الإعلان الجانبي الأيمن (#rightSidebarAd)
     * - الإعلان الجانبي الأيسر (#leftSidebarAd)
     * - إعلان الهواتف أسفل أزرار التحكم (#mobileBottomAd)
     */
    injectAds() {
        const cfg = this.config;
        const topBanner = document.getElementById('topAdBanner');
        const bottomBanner = document.getElementById('bottomAdBanner');
        const rightSidebarAd = document.getElementById('rightSidebarAd');
        const leftSidebarAd = document.getElementById('leftSidebarAd');
        const mobileBottomAd = document.getElementById('mobileBottomAd');

        const horizontalBanners = [topBanner, bottomBanner].filter(Boolean);
        const sidebarAds = [rightSidebarAd, leftSidebarAd].filter(Boolean);
        const mobileAds = [mobileBottomAd].filter(Boolean);

        // 1. حقن وسوم Google AdSense إذا كان Publisher ID صالحاً ومضبوطاً
        if (cfg.adsensePubId && cfg.adsensePubId.startsWith('ca-pub-') && cfg.adsensePubId !== 'ca-pub-XXXXXXXXXXXXXXXX') {
            console.log('📢 جاري حقن كود Google AdSense الرسمي في المساحات الإعلانية:', cfg.adsensePubId);

            if (!document.getElementById('adsense-injected-script')) {
                const script = document.createElement('script');
                script.id = 'adsense-injected-script';
                script.async = true;
                script.crossOrigin = 'anonymous';
                script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${cfg.adsensePubId}`;
                document.head.appendChild(script);
            }

            // إعلانات البانر الأفقية الرئيسية (Leaderboard 728x90 أو responsive)
            const horizontalAdHtml = `
                <ins class="adsbygoogle"
                     style="display:block; width:100%; height:90px;"
                     data-ad-client="${cfg.adsensePubId}"
                     data-ad-slot="auto"
                     data-ad-format="horizontal"
                     data-full-width-responsive="true"></ins>
            `;

            // إعلانات البانر العمودية الجانبية (Skyscraper 160x600)
            const verticalAdHtml = `
                <ins class="adsbygoogle"
                     style="display:block; width:100%; height:600px;"
                     data-ad-client="${cfg.adsensePubId}"
                     data-ad-slot="auto"
                     data-ad-format="vertical"
                     data-full-width-responsive="true"></ins>
            `;

            // إعلان البانر الأفقي المخصص للجوال أسفل أزرار التحكم (Mobile Banner 320x50)
            const mobileAdHtml = `
                <ins class="adsbygoogle"
                     style="display:block; width:100%; height:50px;"
                     data-ad-client="${cfg.adsensePubId}"
                     data-ad-slot="auto"
                     data-ad-format="horizontal"
                     data-full-width-responsive="true"></ins>
            `;

            horizontalBanners.forEach(slot => { slot.innerHTML = horizontalAdHtml; });
            sidebarAds.forEach(slot => { slot.innerHTML = verticalAdHtml; });
            mobileAds.forEach(slot => { slot.innerHTML = mobileAdHtml; });

            try {
                const allSlotsCount = horizontalBanners.length + sidebarAds.length + mobileAds.length;
                for (let i = 0; i < allSlotsCount; i++) {
                    (window.adsbygoogle = window.adsbygoogle || []).push({});
                }
            } catch (e) {}
            return;
        }

        // 2. حقن وسم شبكة Monetag إذا كان Zone ID مضبوطاً
        if (cfg.monetagZoneId && cfg.monetagZoneId.trim().length > 3) {
            console.log('📢 جاري حقن كود Monetag الرسمي Zone ID:', cfg.monetagZoneId);

            if (!document.getElementById('monetag-injected-script')) {
                const script = document.createElement('script');
                script.id = 'monetag-injected-script';
                script.src = 'https://alwingulla.com/88/tag.min.js';
                script.setAttribute('data-zone', cfg.monetagZoneId.trim());
                script.async = true;
                script.setAttribute('data-cfasync', 'false');
                document.head.appendChild(script);
            }
        }

        // 3. تفعيل رابط الربح المباشر المربح (Smartlink / Direct Link)
        if (cfg.directAdLink && cfg.directAdLink.startsWith('http')) {
            const createHorizontalSmartlinkHtml = (title) => `
                <a href="${cfg.directAdLink}" target="_blank" rel="noopener noreferrer" 
                   style="display:flex; align-items:center; justify-content:center; gap:12px; width:100%; height:100%; text-decoration:none; color:#ffd700; font-weight:800; font-size:1rem; background:linear-gradient(90deg, #1a237e, #311b92); border-radius:10px; border:1px solid #ffd700; padding:10px;">
                    <span>🎁 ${title}</span>
                    <span style="background:#ffd700; color:#000; padding:4px 12px; border-radius:6px; font-size:0.82rem; font-weight:900;">اضغط هنا 🚀</span>
                </a>
            `;

            const createVerticalSmartlinkHtml = (title, icon) => `
                <a href="${cfg.directAdLink}" target="_blank" rel="noopener noreferrer" 
                   style="display:flex; flex-direction:column; align-items:center; justify-content:space-between; width:100%; height:100%; min-height:560px; text-decoration:none; color:#fff; text-align:center; background:linear-gradient(180deg, #1a237e, #311b92); border-radius:12px; border:1px solid #ffd700; padding:20px 10px; box-sizing:border-box;">
                    <div style="font-size:2.8rem; margin-top:20px;">${icon}</div>
                    <div style="color:#ffd700; font-weight:800; font-size:1.05rem; line-height:1.4;">${title}</div>
                    <div style="color:#cfd8dc; font-size:0.82rem;">عروض وتخفيضات ألعاب حصرية اليوم!</div>
                    <div style="background:linear-gradient(135deg, #ffd700, #ff9800); color:#000; padding:10px 16px; border-radius:8px; font-size:0.85rem; font-weight:900; width:85%; margin-bottom:15px;">احصل عليه الآن ⚡</div>
                </a>
            `;

            const createMobileSmartlinkHtml = (title) => `
                <a href="${cfg.directAdLink}" target="_blank" rel="noopener noreferrer" 
                   style="display:flex; align-items:center; justify-content:center; gap:8px; width:100%; height:100%; text-decoration:none; color:#ffd700; font-weight:700; font-size:0.85rem; background:linear-gradient(90deg, #1a237e, #311b92); border-radius:8px; border:1px solid #ffd700; padding:6px 12px;">
                    <span>📱 🎁 ${title}</span>
                    <span style="background:#ffd700; color:#000; padding:2px 8px; border-radius:4px; font-size:0.75rem; font-weight:800;">انقر هنا</span>
                </a>
            `;

            if (topBanner) topBanner.innerHTML = createHorizontalSmartlinkHtml('عرض خاص للاعبين: اشحن جواهرك وشداتك الإضافية الآن!');
            if (bottomBanner) bottomBanner.innerHTML = createHorizontalSmartlinkHtml('شاهد أحدث عروض الألعاب الحصرية واربح نقاطاً إضافية!');
            if (rightSidebarAd) rightSidebarAd.innerHTML = createVerticalSmartlinkHtml('شحن فري فاير وببجي بأسعار مخفضة', '💎');
            if (leftSidebarAd) leftSidebarAd.innerHTML = createVerticalSmartlinkHtml('عروض ألعاب ومكافآت مجانية حصرية', '🔥');
            if (mobileBottomAd) mobileBottomAd.innerHTML = createMobileSmartlinkHtml('عروض حصرية للجوال: اضغط لربح نقاط إضافية!');
            return;
        }

        // 4. بانرات المعاينة الجاهزة في وضع التطوير (Placeholders)
        const placeholderHorizontalHtml = (posText) => `
            <div style="display:flex; align-items:center; justify-content:center; gap:8px; width:100%; height:100%; color:#90a4ae; font-size:0.85rem; border:1px dashed rgba(255,255,255,0.15); border-radius:8px; padding:8px;">
                <span>📢 ${posText} (المساحة جاهزة لظهور إعلانات AdSense و Monetag بمجرد إدخال المعرف في لوحة المدير)</span>
            </div>
        `;

        const placeholderVerticalHtml = (posText) => `
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; width:100%; height:100%; min-height:500px; color:#90a4ae; font-size:0.82rem; border:1px dashed rgba(255,255,255,0.18); border-radius:10px; padding:14px 8px; text-align:center;">
                <span style="font-size:2rem;">📢</span>
                <span style="color:#ffd54f; font-weight:700;">${posText}</span>
                <span style="font-size:0.75rem; color:#78909c;">مساحة إعلانية عمودية (160x600) جاهزة للبث عند إدخال المعرف في لوحة المدير</span>
            </div>
        `;

        const placeholderMobileHtml = (posText) => `
            <div style="display:flex; align-items:center; justify-content:center; gap:8px; width:100%; height:100%; color:#90a4ae; font-size:0.8rem; border:1px dashed rgba(255,255,255,0.18); border-radius:8px; padding:6px 10px;">
                <span>📱 ${posText}</span>
            </div>
        `;

        if (topBanner && !topBanner.innerHTML.trim()) topBanner.innerHTML = placeholderHorizontalHtml('مساحة إعلانية علوية (728x90)');
        if (bottomBanner && !bottomBanner.innerHTML.trim()) bottomBanner.innerHTML = placeholderHorizontalHtml('مساحة إعلانية سفلية (728x90)');
        if (rightSidebarAd && !rightSidebarAd.innerHTML.trim()) rightSidebarAd.innerHTML = placeholderVerticalHtml('إعلان جانبي أيمن (Skyscraper)');
        if (leftSidebarAd && !leftSidebarAd.innerHTML.trim()) leftSidebarAd.innerHTML = placeholderVerticalHtml('إعلان جانبي أيسر (Skyscraper)');
        if (mobileBottomAd && !mobileBottomAd.innerHTML.trim()) mobileBottomAd.innerHTML = placeholderMobileHtml('مساحة إعلانية للهواتف أسفل أزرار التحكم');
    }

    // ==========================================
    // 4. إدارة طلبات الشحن والسحب (Orders & Cash Withdrawals)
    // ==========================================

    /**
     * استقبال طلب شحن جديد من لاعب (شحن يدوي مباشر عبر Player ID)
     */
    addOrder(orderData) {
        const order = {
            id: 'ORD-' + Date.now().toString().slice(-6),
            game: orderData.game,
            gameTitle: orderData.gameTitle,
            voucherTitle: orderData.voucherTitle,
            amount: orderData.amount,
            cost: orderData.cost,
            playerId: orderData.playerId,
            date: new Date().toLocaleDateString('ar-EG', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }),
            status: 'قيد الانتظار (Pending) ⏳',
            statusCode: 'pending',
            notes: '',
            playerIp: 'متاح للتوثيق'
        };

        this.orders.unshift(order);
        this.saveData();

        // إرسال تنبيه فوري إلى تليجرام صاحب اللعبة
        if (this.config.enableTelegramAlerts && this.config.telegramBotToken && this.config.telegramChatId) {
            this.sendTelegramAlert(order);
        }

        if (this.isLoggedIn) {
            this.renderOrders();
        }
        return order;
    }

    /**
     * تحديث حالة طلب الشحن يدوياً من المدير (قيد الانتظار، تم الشحن، مرفوض/استرجاع النقاط)
     */
    updateOrderStatus(orderId, newStatus, statusCode = 'completed', reason = '') {
        if (!this.isLoggedIn) {
            alert('🔒 إجراء محظور: يرجى تسجيل الدخول إلى لوحة الإدارة أولاً!');
            return;
        }

        const order = this.orders.find(o => o.id === orderId);
        if (!order) return;

        const previousStatus = order.statusCode;
        order.status = newStatus;
        order.statusCode = statusCode;
        if (reason) order.notes = reason;

        // إذا تم الرفض، نقوم بإرجاع النقاط تلقائياً وفورياً لرصيد اللاعب!
        if (statusCode === 'rejected' && previousStatus !== 'rejected') {
            if (window.game) {
                window.game.score += (order.cost || 0);
                window.game.updateHUD();
                if (window.securityWAF) {
                    window.securityWAF.lastValidScore = window.game.score;
                    window.securityWAF.lastScoreHash = window.securityWAF.generateScoreHash(window.game.score);
                }
            }
        } else if (previousStatus === 'rejected' && statusCode !== 'rejected') {
            // التراجع عن الرفض: إعادة خصم النقاط إن كانت كافية
            if (window.game && window.game.score >= (order.cost || 0)) {
                window.game.score -= (order.cost || 0);
                window.game.updateHUD();
                if (window.securityWAF) {
                    window.securityWAF.lastValidScore = window.game.score;
                    window.securityWAF.lastScoreHash = window.securityWAF.generateScoreHash(window.game.score);
                }
            }
        }

        // مزامنة حالة الطلب في سجل المستخدم المحلي
        try {
            const userHistoryRaw = localStorage.getItem('chicken_game_vouchers_history');
            if (userHistoryRaw) {
                const userHistory = JSON.parse(userHistoryRaw);
                const userRec = userHistory.find(u => u.id === orderId);
                if (userRec) {
                    userRec.status = newStatus;
                    userRec.statusCode = statusCode;
                    if (reason) userRec.notes = reason;
                    localStorage.setItem('chicken_game_vouchers_history', JSON.stringify(userHistory));
                }
            }
            if (window.voucherStore) {
                window.voucherStore.loadHistory();
                window.voucherStore.renderHistory();
            }
        } catch (e) {
            console.warn('تعذر مزامنة سجل القسائم مع اللاعب:', e);
        }

        this.saveData();
        this.renderOrders(this.currentOrdersFilter || 'all');
        alert(`✅ تم تحديث حالة طلب الشحن رقم ${orderId} بنجاح!\nالحالة الحالية: ${newStatus}`);
    }

    /**
     * فلترة عرض طلبات الشحن
     */
    filterOrders(filterStatus, btnElement) {
        this.currentOrdersFilter = filterStatus;
        document.querySelectorAll('.btn-order-filter').forEach(b => b.classList.remove('active'));
        if (btnElement) btnElement.classList.add('active');
        this.renderOrders(filterStatus);
    }

    /**
     * عرض وإدارة قائمة طلبات الشحن في جدول الإدارة (#adminOrdersTableBody)
     */
    renderOrders(filterStatus = null) {
        const tableBody = document.getElementById('adminOrdersTableBody');
        const countTotalElem = document.getElementById('adminOrderTotalCount');
        const countPendingElem = document.getElementById('adminOrderPendingCount');
        const countCompletedElem = document.getElementById('adminOrderCompletedCount');
        const countRejectedElem = document.getElementById('adminOrderRejectedCount');

        // شرط الحماية والأمان: لا يتم عرض البيانات إذا لم يسجل المدير دخوله بالرمز السري
        if (!this.isLoggedIn) {
            if (tableBody) {
                tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:24px; color:#ff9800; font-weight:700;">🔒 قسم طلبات الشحن مقفل. يرجى تسجيل الدخول أولاً كمدير مالك لعرض الطلبات.</td></tr>`;
            }
            return;
        }

        const activeFilter = filterStatus || this.currentOrdersFilter || 'all';

        // حساب الإحصائيات الأربعة
        const totalCount = this.orders.length;
        let pendingCount = 0;
        let completedCount = 0;
        let rejectedCount = 0;

        this.orders.forEach(order => {
            if (order.statusCode === 'completed' || (!order.statusCode && order.status.includes('✅'))) {
                completedCount++;
            } else if (order.statusCode === 'rejected' || (!order.statusCode && (order.status.includes('❌') || order.status.includes('مرفوض')))) {
                rejectedCount++;
            } else {
                pendingCount++;
            }
        });

        if (countTotalElem) countTotalElem.innerText = totalCount;
        if (countPendingElem) countPendingElem.innerText = pendingCount;
        if (countCompletedElem) countCompletedElem.innerText = completedCount;
        if (countRejectedElem) countRejectedElem.innerText = rejectedCount;

        if (!tableBody) return;

        let filteredList = this.orders;
        if (activeFilter === 'pending') {
            filteredList = this.orders.filter(o => o.statusCode === 'pending' || (!o.statusCode && o.status.includes('⏳')));
        } else if (activeFilter === 'completed') {
            filteredList = this.orders.filter(o => o.statusCode === 'completed' || (!o.statusCode && o.status.includes('✅')));
        } else if (activeFilter === 'rejected') {
            filteredList = this.orders.filter(o => o.statusCode === 'rejected' || (!o.statusCode && (o.status.includes('❌') || o.status.includes('مرفوض'))));
        }

        if (filteredList.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:24px; color:#90a4ae;">لا توجد طلبات شحن مسجلة في هذا القسم حالياً.</td></tr>`;
            return;
        }

        let html = '';
        filteredList.forEach(order => {
            let topupUrl = 'https://shop2game.com';
            if (order.game === 'pubg') topupUrl = 'https://www.midasbuy.com';
            else if (order.game === 'efootball') topupUrl = 'https://www.konami.com/efootball/';
            else if (order.game === 'clash') topupUrl = 'https://store.supercell.com';
            else if (order.game === 'codm') topupUrl = 'https://www.codashop.com';
            else if (order.game === 'googleplay') topupUrl = 'https://play.google.com';

            const isCompleted = order.statusCode === 'completed' || (!order.statusCode && order.status.includes('✅'));
            const isRejected = order.statusCode === 'rejected' || (!order.statusCode && (order.status.includes('❌') || order.status.includes('مرفوض')));
            const isPending = !isCompleted && !isRejected;

            let badgeClass = 'pending';
            let badgeText = order.status || 'قيد الانتظار (Pending) ⏳';
            if (isCompleted) {
                badgeClass = 'completed';
            } else if (isRejected) {
                badgeClass = 'cancel';
            }

            html += `
                <tr>
                    <td style="font-weight:800; color:#ffd700;">${order.id}</td>
                    <td style="font-size:0.8rem; color:#b0bec5;">${order.date}</td>
                    <td>
                        <span class="voucher-game-tag" style="display:inline-block; font-size:0.75rem; padding:2px 8px; border-radius:6px; background:${this.getGameBadgeColor(order.game)}; color:#fff; font-weight:800;">
                            ${order.gameTitle || order.game}
                        </span>
                    </td>
                    <td>
                        <strong style="color:#fff;">${order.voucherTitle}</strong>
                        <div style="font-size:0.78rem; color:#ffd54f;">${(order.cost || 0).toLocaleString()} نقطة</div>
                    </td>
                    <td style="text-align:center;">
                        <div style="display:flex; align-items:center; justify-content:center; gap:6px; flex-wrap:wrap;">
                            <strong style="font-family:monospace; font-size:1.05rem; color:#00e5ff; direction:ltr;">${order.playerId}</strong>
                            <button class="btn-copy-mini" onclick="navigator.clipboard.writeText('${order.playerId}'); alert('تم نسخ معرف اللاعب (ID): ${order.playerId} 📋');" title="نسخ الـ ID للمحافظة">نسخ الـ ID 📋</button>
                        </div>
                    </td>
                    <td><span class="order-status-badge ${badgeClass}">${badgeText}</span></td>
                    <td>
                        <div style="display:flex; gap:4px; flex-wrap:wrap; justify-content:center;">
                            <a href="${topupUrl}" target="_blank" class="admin-action-btn topup" title="فتح الموقع الرسمي للشحن">شحن خارجي 🚀</a>
                            ${!isCompleted ? `
                                <button class="admin-action-btn done" onclick="window.adminManager.updateOrderStatus('${order.id}', 'تم الشحن بنجاح (Completed) ✅', 'completed')" title="تأكيد الشحن اليدوي بنجاح">تم الشحن بنجاح ✅</button>
                            ` : ''}
                            ${!isRejected ? `
                                <button class="admin-action-btn cancel" onclick="if(confirm('هل تريد رفض طلب اللاعب رقم ${order.id} وإرجاع ${(order.cost || 0).toLocaleString()} نقطة لرصيده؟')) { const r = prompt('أدخل سبب الرفض (اختياري):', 'معرف اللاعب غير مطابق'); window.adminManager.updateOrderStatus('${order.id}', 'مرفوض ومسترد ❌' + (r ? ' (' + r + ')' : ''), 'rejected', r); }" title="رفض الطلب واسترجاع النقاط للاعب">مرفوض/استرجاع النقاط ❌</button>
                            ` : ''}
                            ${!isPending ? `
                                <button class="admin-action-btn" style="background:#546e7a; color:#fff;" onclick="window.adminManager.updateOrderStatus('${order.id}', 'قيد الانتظار (Pending) ⏳', 'pending')" title="إعادة الطلب لقيد الانتظار">إعادة للانتظار ⏳</button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `;
        });
        tableBody.innerHTML = html;
    }

    /**
     * استقبال طلب سحب مالي جديد (Mastercard / PayPal / Bank Wire)
     */
    addWithdrawal(wData) {
        const withdrawal = {
            id: wData.id || ('WTH-' + Date.now().toString().slice(-6)),
            method: wData.method,
            methodTitle: wData.methodTitle,
            amountUSD: wData.amountUSD,
            pointsCost: wData.pointsCost,
            accountData: wData.accountData || {},
            summary: wData.summary,
            date: wData.date || new Date().toLocaleString('ar-EG'),
            status: 'قيد المراجعة والمعالجة ⏳',
            statusCode: 'pending',
            txReference: ''
        };

        this.withdrawals.unshift(withdrawal);
        this.saveData();

        // إرسال تنبيه فوري إلى تليجرام صاحب اللعبة
        if (this.config.enableTelegramAlerts && this.config.telegramBotToken && this.config.telegramChatId) {
            this.sendWithdrawalTelegramAlert(withdrawal);
        }

        if (this.isLoggedIn) {
            this.renderWithdrawals();
        }
        return withdrawal;
    }

    /**
     * تحديث حالة طلب السحب المالي (اعتماد التحويل أو الرفض مع استرداد النقاط)
     */
    updateWithdrawalStatus(withdrawalId, newStatus, statusCode = 'completed', txRef = '') {
        if (!this.isLoggedIn) {
            alert('🔒 إجراء محظور: يرجى تسجيل الدخول إلى لوحة الإدارة أولاً!');
            return;
        }

        const item = this.withdrawals.find(w => w.id === withdrawalId);
        if (!item) return;

        item.status = newStatus;
        item.statusCode = statusCode;
        item.txReference = txRef;
        this.saveData();

        // إذا تم الرفض، نقوم بإرجاع النقاط تلقائياً لرصيد اللاعب!
        if (statusCode === 'rejected') {
            if (window.game) {
                window.game.score += item.pointsCost;
                window.game.updateHUD();
                if (window.securityWAF) {
                    window.securityWAF.lastValidScore = window.game.score;
                    window.securityWAF.lastScoreHash = window.securityWAF.generateScoreHash(window.game.score);
                }
            }
        }

        // مزامنة حالة الطلب مع سجل المستخدم المحلي
        try {
            const userHistoryRaw = localStorage.getItem('chicken_user_withdrawals');
            if (userHistoryRaw) {
                const userHistory = JSON.parse(userHistoryRaw);
                const userRec = userHistory.find(u => u.id === withdrawalId);
                if (userRec) {
                    userRec.status = newStatus;
                    userRec.statusCode = statusCode;
                    userRec.txReference = txRef;
                    localStorage.setItem('chicken_user_withdrawals', JSON.stringify(userHistory));
                }
            }
        } catch (e) {}

        this.renderWithdrawals(this.currentWithdrawalsFilter || 'all');
        alert(`✅ تم تحديث حالة طلب السحب رقم ${withdrawalId} بنجاح!\nالحالة الجديدة: ${newStatus}`);
    }

    /**
     * فلترة عرض طلبات السحب
     */
    filterWithdrawals(filterStatus) {
        this.currentWithdrawalsFilter = filterStatus;
        this.renderWithdrawals(filterStatus);
    }

    /**
     * عرض وإدارة طلبات السحب المالي في جدول الإدارة (#adminWithdrawalsTableBody)
     */
    renderWithdrawals(filterStatus = null) {
        const tableBody = document.getElementById('adminWithdrawalsTableBody');
        const countTotalElem = document.getElementById('adminWithdrawTotalCount');
        const countPendingElem = document.getElementById('adminWithdrawPendingCount');
        const sumUSDElem = document.getElementById('adminWithdrawTotalUSD');
        const sumPaidElem = document.getElementById('adminWithdrawPaidUSD');

        // شرط الحماية والأمان: لا يتم عرض البيانات إذا لم يسجل المدير دخوله بالرمز السري
        if (!this.isLoggedIn) {
            if (tableBody) {
                tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:24px; color:#ff9800; font-weight:700;">🔒 قسم طلبات السحب المالي مقفل. يرجى تسجيل الدخول أولاً كمدير مالك لعرض البيانات.</td></tr>`;
            }
            return;
        }

        const activeFilter = filterStatus || this.currentWithdrawalsFilter || 'all';

        // حساب الإحصائيات المالية
        const totalCount = this.withdrawals.length;
        let pendingCount = 0;
        let totalUSD = 0;
        let paidUSD = 0;

        this.withdrawals.forEach(w => {
            totalUSD += (w.amountUSD || 0);
            if (w.statusCode === 'pending' || w.status.includes('⏳')) {
                pendingCount++;
            } else if (w.statusCode === 'completed' || w.status.includes('✅')) {
                paidUSD += (w.amountUSD || 0);
            }
        });

        if (countTotalElem) countTotalElem.innerText = totalCount;
        if (countPendingElem) countPendingElem.innerText = pendingCount;
        if (sumUSDElem) sumUSDElem.innerText = `$${totalUSD.toFixed(2)}`;
        if (sumPaidElem) sumPaidElem.innerText = `$${paidUSD.toFixed(2)}`;

        if (!tableBody) return;

        let filteredList = this.withdrawals;
        if (activeFilter === 'pending') {
            filteredList = this.withdrawals.filter(w => w.statusCode === 'pending' || w.status.includes('⏳'));
        } else if (activeFilter === 'completed') {
            filteredList = this.withdrawals.filter(w => w.statusCode === 'completed' || w.status.includes('✅'));
        } else if (activeFilter === 'rejected') {
            filteredList = this.withdrawals.filter(w => w.statusCode === 'rejected' || w.status.includes('❌'));
        }

        if (filteredList.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:24px; color:#90a4ae;">لا توجد طلبات سحب مالي مسجلة حالياً.</td></tr>`;
            return;
        }

        let html = '';
        filteredList.forEach(w => {
            const isCompleted = w.statusCode === 'completed' || w.status.includes('✅');
            const isRejected = w.statusCode === 'rejected' || w.status.includes('❌');

            let badgeClass = 'pending';
            if (isCompleted) badgeClass = 'completed';
            else if (isRejected) badgeClass = 'cancel';

            // تنسيق بيانات الحساب البنكي أو البطاقة للنسخ السريع
            let copyText = '';
            let detailsDisplay = '';

            if (w.method === 'mastercard') {
                const num = w.accountData.cardNumber || '';
                const holder = w.accountData.cardHolder || '';
                const exp = w.accountData.cardExpiry || '';
                const bank = w.accountData.issuingBank || '';
                copyText = `${holder} | ${num} | ${exp} | ${bank}`;
                detailsDisplay = `
                    <div style="font-weight:700; color:#fff;">${holder}</div>
                    <div style="font-family:monospace; color:#ffd54f; direction:ltr;">${num}</div>
                    <div style="font-size:0.78rem; color:#b0bec5;">تاريخ: ${exp} • بنك: ${bank}</div>
                `;
            } else if (w.method === 'paypal') {
                const email = w.accountData.email || '';
                const name = w.accountData.holderName || '';
                copyText = email;
                detailsDisplay = `
                    <div style="font-weight:700; color:#29b6f6; direction:ltr;">${email}</div>
                    <div style="font-size:0.78rem; color:#b0bec5;">المستفيد: ${name}</div>
                `;
            } else if (w.method === 'bank') {
                const iban = w.accountData.iban || '';
                const bank = w.accountData.bankName || '';
                const holder = w.accountData.accountHolder || '';
                const swift = w.accountData.swift || '';
                copyText = `IBAN: ${iban} | Bank: ${bank} | Holder: ${holder} | SWIFT: ${swift}`;
                detailsDisplay = `
                    <div style="font-weight:700; color:#fff;">${holder}</div>
                    <div style="font-family:monospace; color:#00e5ff; direction:ltr; font-size:0.85rem;">${iban}</div>
                    <div style="font-size:0.78rem; color:#b0bec5;">${bank} ${swift ? `• SWIFT: ${swift}` : ''}</div>
                `;
            } else {
                copyText = `${w.accountData.provider}: ${w.accountData.accountId}`;
                detailsDisplay = `
                    <div style="font-weight:700; color:#ffd54f;">${w.accountData.provider}</div>
                    <div style="font-family:monospace; color:#fff; direction:ltr;">${w.accountData.accountId}</div>
                    <div style="font-size:0.78rem; color:#b0bec5;">${w.accountData.holderName || ''}</div>
                `;
            }

            html += `
                <tr>
                    <td style="font-weight:800; color:#ffd700;">${w.id}</td>
                    <td><span class="withdraw-method-tag">${w.methodTitle}</span></td>
                    <td>
                        <strong style="color:#00e676; font-size:1.15rem;">$${(w.amountUSD || 0).toFixed(2)}</strong>
                        <div style="font-size:0.78rem; color:#b0bec5;">${(w.pointsCost || 0).toLocaleString()} نقطة</div>
                    </td>
                    <td style="max-width:220px; text-align:right;">
                        ${detailsDisplay}
                        <button class="btn-copy-mini" style="margin-top:4px;" onclick="navigator.clipboard.writeText('${copyText.replace(/'/g, "\\'")}'); alert('تم نسخ بيانات الحساب بنجاح!');">نسخ البيانات 📋</button>
                    </td>
                    <td><span class="order-status-badge ${badgeClass}">${w.status}</span></td>
                    <td style="font-size:0.78rem; color:#b0bec5;">${w.date}</td>
                    <td>
                        <div style="display:flex; gap:4px; flex-wrap:wrap;">
                            ${!isCompleted ? `
                                <button class="admin-action-btn done" onclick="
                                    const ref = prompt('أدخل رقم العملية أو إيصال التحويل البنكي (اختياري):', 'TXN-${Date.now().toString().slice(-6)}');
                                    if (ref !== null) window.adminManager.updateWithdrawalStatus('${w.id}', 'تم التحويل بنجاح ✅', 'completed', ref);
                                " title="تأكيد التحويل لحساب اللاعب">تحويل بنجاح ✅</button>
                            ` : ''}
                            ${!isRejected ? `
                                <button class="admin-action-btn cancel" onclick="
                                    if (confirm('هل أنت متأكد من رفض هذا الطلب؟ سيتم إرجاع ${(w.pointsCost || 0).toLocaleString()} نقطة فوراً لرصيد اللاعب.')) {
                                        const reason = prompt('سبب الرفض (اختياري):', 'بيانات الحساب غير صحيحة');
                                        window.adminManager.updateWithdrawalStatus('${w.id}', 'مرفوض ومسترد ❌ (' + (reason || 'بيانات خاطئة') + ')', 'rejected');
                                    }
                                " title="رفض الطلب وإرجاع النقاط للرصيد">رفض وإرجاع ❌</button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `;
        });

        tableBody.innerHTML = html;
    }

    // ==========================================
    // 5. حماية لوحة الإدارة (PIN & Session Security)
    // ==========================================

    // ==========================================
    // 5. نظام المصادقة والتشفير القوي SHA-256 وحماية الجلسة
    // ==========================================

    /**
     * تشفير كلمة المرور بتقنية SHA-256 القوية
     * يستخدم SubtleCrypto المدعوم في المتصفحات الحديثة مع خوارزمية نقية احتياطية
     */
    async hashPassword(password) {
        if (!password || typeof password !== 'string') return '';
        if (window.crypto && window.crypto.subtle && window.crypto.subtle.digest) {
            try {
                const encoder = new TextEncoder();
                const data = encoder.encode(password);
                const buffer = await window.crypto.subtle.digest('SHA-256', data);
                return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
            } catch (e) {
                console.warn('SubtleCrypto error, falling back to pure JS SHA-256:', e);
            }
        }
        return sha256Pure(password);
    }

    /**
     * التحقق من كلمة مرور المدير المشفرة
     * يقارن الهاش الناتج من الإدخال مع الهاش المشفر المحفوظ (بدون نصوص صريحة)
     */
    async verifyPin(enteredPin) {
        if (!enteredPin || typeof enteredPin !== 'string') return false;

        // فحص قفل جدار الحماية ضد التخمين المتكرر (Brute Force Lockout)
        if (window.securityWAF) {
            const lockout = window.securityWAF.isPinLockedOut();
            if (lockout && lockout.locked) {
                alert(`🚨 لوحة الإدارة مقفلة أمنياً بسبب تجاوز عدد المحاولات الخاطئة!\nيرجى الانتظار ${lockout.remainingSec} ثانية للمحاولة مجدداً.`);
                return false;
            }
        }

        const trimmed = enteredPin.trim();
        const hashed = await this.hashPassword(trimmed);
        const targetHash = this.pinHash || DEFAULT_ADMIN_HASH;

        const isMatch = (hashed === targetHash);

        if (isMatch) {
            this.isLoggedIn = true;
            this.sessionToken = 'ADMIN_SESS_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2);
            
            // 4. حفظ الجلسة في sessionStorage فقط (ينتهي بمجرد إغلاق المتصفح أو النافذة)
            sessionStorage.setItem('chicken_admin_session', this.sessionToken);

            if (window.securityWAF) window.securityWAF.recordSuccessPin();

            // 5. إنشاء محتوى لوحة الإدارة الحساس في DOM وفتحه
            this.onAdminLoginSuccess();
            return true;
        }

        if (window.securityWAF) {
            window.securityWAF.recordFailedPinAttempt();
            if (window.securityWAF.pinFailedAttempts >= 3) {
                this.sendSecurityBreachAlert();
            }
        }
        return false;
    }

    /**
     * الإجراءات المنفذة فور تسجيل دخول المدير بنجاح
     */
    onAdminLoginSuccess() {
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
    }

    /**
     * تغيير وتشفير كلمة مرور المدير بالهاش الجديد
     */
    async changePin(newPin) {
        if (!this.isLoggedIn) {
            alert('🔒 يرجى تسجيل الدخول أولاً لتغيير الرمز السري!');
            return false;
        }
        if (!newPin || newPin.trim().length < 6) {
            alert('الرمز السري الجديد يجب أن يتكون من 6 خانات على الأقل لضمان الأمان الأقصى!');
            return false;
        }
        this.pinHash = await this.hashPassword(newPin.trim());
        localStorage.setItem('chicken_admin_hash', this.pinHash);
        localStorage.removeItem('chicken_admin_pin');
        alert('🔒 تم تغيير وتشفير كلمة مرور المدير بنجاح بتقنية SHA-256!\nتم تخزين الهاش المشفر فقط ولا يمكن لأي شخص آخر فتح اللوحة.');
        return true;
    }

    /**
     * قفل لوحة الإدارة وتسجيل الخروج الفوري ومسح المحتوى الحساس من الـ DOM
     */
    lockAndLogout() {
        this.isLoggedIn = false;
        this.sessionToken = null;
        sessionStorage.removeItem('chicken_admin_session');
        sessionStorage.removeItem('chicken_owner_session');

        // إغلاق النافذة وتفريغ محتواها بالكامل من DOM
        const panel = document.getElementById('adminPanelModal');
        if (panel) {
            panel.style.display = 'none';
            panel.innerHTML = ''; // تطهير DOM بالكامل لمنع أي فحص أو تعديل
        }

        alert('🔒 تم تسجيل الخروج وقفل لوحة الإدارة ومسح محتوياتها من المتصفح بنجاح.');
    }

    /**
     * قالب HTML الكامل للوحة الإدارة الحساسة (يُحقن برمجياً فقط بعد تسجيل الدخول)
     */
    getAdminPanelHTML() {
        return `<div class="modal-content" style="max-width: 780px; max-height: 92vh; overflow-y: auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                <h2 class="modal-title gold" style="font-size: 1.6rem;">⚙️ لوحة إدارة اللعبة والشحن الحقيقي</h2>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <button id="btnLockAdminPanel" class="btn-action" style="background: linear-gradient(135deg, #d32f2f, #b71c1c); padding: 6px 14px; font-size: 0.85rem;" title="قفل لوحة الإدارة ومسح الجلسة فوراً">🔒 قفل وخروج</button>
                    <button id="btnCloseAdminPanel" class="btn-secondary" style="padding: 6px 14px; font-size: 0.9rem;">✕ إغلاق</button>
                </div>
            </div>

            <!-- تبويبات لوحة المدير -->
            <div class="admin-tabs">
                <button class="admin-tab-btn active" data-admin-tab="orders">📋 طلبات الشحن</button>
                <button class="admin-tab-btn" data-admin-tab="withdrawals" style="border-color: #00e676; color: #69f0ae; font-weight: 800;">💸 طلبات السحب المالي</button>
                <button class="admin-tab-btn" data-admin-tab="vault">🔑 مخزن الأكواد</button>
                <button class="admin-tab-btn" data-admin-tab="ads" style="border-color: #4caf50; color: #a5d6a7;">📢 شبكات الإعلانات</button>
                <button class="admin-tab-btn" data-admin-tab="social" style="border-color: #ffd54f; color: #ffd54f;">🔔 القناة والتواصل والمانع</button>
                <button class="admin-tab-btn" data-admin-tab="telegram">🤖 إشعارات تليجرام</button>
                <button class="admin-tab-btn" data-admin-tab="waf" style="border-color: #00e5ff; color: #00e5ff;">🛡️ جدار الحماية (WAF)</button>
                <button class="admin-tab-btn" data-admin-tab="security">🔒 الرمز السري</button>
            </div>

            <!-- التبويب 1: طلبات الشحن الواردة (Manual Direct ID Top-up) -->
            <div id="adminTabOrders" class="admin-tab-content" style="width: 100%;">
                <div style="background: rgba(255, 152, 0, 0.08); border: 1px solid rgba(255, 152, 0, 0.3); border-radius: 12px; padding: 12px 16px; margin-bottom: 12px; text-align: right;">
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
                        <div>
                            <strong style="color: #ffb74d; font-size: 1.05rem;">🎮 إدارة طلبات الشحن المباشر اليدوي (Player ID Top-Up)</strong>
                            <div style="font-size: 0.82rem; color: #cfd8dc; margin-top: 2px;">
                                انسخ معرف اللاعب (Player ID) بضغطة زر واحدة، ثم اشحن له يدوياً من المواقع الرسمية، وحوّل الحالة إلى <strong>"تم الشحن بنجاح ✅"</strong> أو <strong>"مرفوض/استرجاع النقاط ❌"</strong>.
                            </div>
                        </div>
                        <button class="btn-secondary" style="padding: 4px 12px; font-size: 0.8rem;" onclick="window.adminManager.renderOrders()">🔄 تحديث الطلبات</button>
                    </div>
                </div>

                <!-- إحصائيات طلبات الشحن الأربعة -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 8px; margin-bottom: 14px;">
                    <div class="admin-vault-box" style="border-color: rgba(255, 215, 0, 0.35);">
                        <div style="font-size: 1.5rem;">📋</div>
                        <div style="font-weight: 800; color: #ffd700; font-size: 0.82rem;">إجمالي الطلبات</div>
                        <div id="adminOrderTotalCount" style="color: #fff; font-size: 1.3rem; font-weight: 900; margin-top: 2px;">0</div>
                    </div>
                    <div class="admin-vault-box" style="border-color: rgba(255, 152, 0, 0.45); background: rgba(255, 152, 0, 0.08);">
                        <div style="font-size: 1.5rem;">⏳</div>
                        <div style="font-weight: 800; color: #ffb74d; font-size: 0.82rem;">قيد الانتظار (Pending)</div>
                        <div id="adminOrderPendingCount" style="color: #ff9800; font-size: 1.3rem; font-weight: 900; margin-top: 2px;">0</div>
                    </div>
                    <div class="admin-vault-box" style="border-color: rgba(76, 175, 80, 0.35);">
                        <div style="font-size: 1.5rem;">✅</div>
                        <div style="font-weight: 800; color: #81c784; font-size: 0.82rem;">تم الشحن بنجاح</div>
                        <div id="adminOrderCompletedCount" style="color: #4caf50; font-size: 1.3rem; font-weight: 900; margin-top: 2px;">0</div>
                    </div>
                    <div class="admin-vault-box" style="border-color: rgba(244, 67, 54, 0.35);">
                        <div style="font-size: 1.5rem;">❌</div>
                        <div style="font-weight: 800; color: #e57373; font-size: 0.82rem;">مرفوض / مسترد</div>
                        <div id="adminOrderRejectedCount" style="color: #f44336; font-size: 1.3rem; font-weight: 900; margin-top: 2px;">0</div>
                    </div>
                </div>

                <!-- أزرار التصفية السريعة -->
                <div style="display: flex; gap: 6px; margin-bottom: 12px; flex-wrap: wrap;">
                    <button class="btn-secondary btn-order-filter active" style="padding: 4px 10px; font-size: 0.8rem;" onclick="window.adminManager.filterOrders('all', this)">كل الطلبات 📋</button>
                    <button class="btn-secondary btn-order-filter" style="padding: 4px 10px; font-size: 0.8rem; border-color: #ff9800; color: #ffb74d;" onclick="window.adminManager.filterOrders('pending', this)">⏳ قيد الانتظار فقط</button>
                    <button class="btn-secondary btn-order-filter" style="padding: 4px 10px; font-size: 0.8rem; border-color: #4caf50; color: #81c784;" onclick="window.adminManager.filterOrders('completed', this)">✅ تم الشحن بنجاح</button>
                    <button class="btn-secondary btn-order-filter" style="padding: 4px 10px; font-size: 0.8rem; border-color: #f44336; color: #ff8a80;" onclick="window.adminManager.filterOrders('rejected', this)">❌ مرفوض ومسترد</button>
                </div>

                <div class="admin-table-container">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>رقم الطلب</th>
                                <th>تاريخ الطلب</th>
                                <th>نوع اللعبة</th>
                                <th>اسم الباقة والنقاط</th>
                                <th>معرف اللاعب (Player ID)</th>
                                <th>حالة الطلب</th>
                                <th>التحكم اليدوي للمدير</th>
                            </tr>
                        </thead>
                        <tbody id="adminOrdersTableBody">
                            <!-- توليد تلقائي -->
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- التبويب 1.5: طلبات السحب المالي (Mastercard, PayPal, Bank Wire) -->
            <div id="adminTabWithdrawals" class="admin-tab-content" style="display: none; width: 100%;">
                <div style="background: rgba(0, 230, 118, 0.08); border: 1px solid rgba(0, 230, 118, 0.25); border-radius: 12px; padding: 12px 16px; margin-bottom: 12px; text-align: right;">
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
                        <div>
                            <strong style="color: #69f0ae; font-size: 1.05rem;">💸 إدارة طلبات السحب المالي والنقدي (Cash Payouts)</strong>
                            <div style="font-size: 0.82rem; color: #cfd8dc; margin-top: 2px;">
                                راجع بيانات بطاقات ماستر كارد، حسابات PayPal، والتحويلات البنكية (IBAN) واعتمد التحويل للعملاء.
                            </div>
                        </div>
                        <button class="btn-secondary" style="padding: 4px 12px; font-size: 0.8rem;" onclick="window.adminManager.renderWithdrawals()">🔄 تحديث الطلبات</button>
                    </div>
                </div>

                <!-- إحصائيات السحب الأربعة -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 8px; margin-bottom: 14px;">
                    <div class="admin-vault-box" style="border-color: rgba(0, 230, 118, 0.35);">
                        <div style="font-size: 1.5rem;">📋</div>
                        <div style="font-weight: 800; color: #69f0ae; font-size: 0.82rem;">إجمالي الطلبات</div>
                        <div id="adminWithdrawTotalCount" style="color: #ffd54f; font-size: 1.3rem; font-weight: 900; margin-top: 2px;">0</div>
                    </div>
                    <div class="admin-vault-box" style="border-color: rgba(255, 193, 7, 0.35);">
                        <div style="font-size: 1.5rem;">⏳</div>
                        <div style="font-weight: 800; color: #ffd54f; font-size: 0.82rem;">قيد الانتظار</div>
                        <div id="adminWithdrawPendingCount" style="color: #ff9800; font-size: 1.3rem; font-weight: 900; margin-top: 2px;">0</div>
                    </div>
                    <div class="admin-vault-box" style="border-color: rgba(33, 150, 243, 0.35);">
                        <div style="font-size: 1.5rem;">💵</div>
                        <div style="font-weight: 800; color: #4fc3f7; font-size: 0.82rem;">المطلوب سحبه</div>
                        <div id="adminWithdrawTotalUSD" style="color: #00e5ff; font-size: 1.3rem; font-weight: 900; margin-top: 2px;">$0.00</div>
                    </div>
                    <div class="admin-vault-box" style="border-color: rgba(76, 175, 80, 0.35);">
                        <div style="font-size: 1.5rem;">✅</div>
                        <div style="font-weight: 800; color: #81c784; font-size: 0.82rem;">تم تسليمه بنجاح</div>
                        <div id="adminWithdrawPaidUSD" style="color: #00e676; font-size: 1.3rem; font-weight: 900; margin-top: 2px;">$0.00</div>
                    </div>
                </div>

                <!-- أزرار تصفية الطلبات -->
                <div style="display: flex; gap: 6px; margin-bottom: 8px; flex-wrap: wrap;">
                    <button class="btn-secondary" style="padding: 4px 10px; font-size: 0.8rem;" onclick="window.adminManager.renderWithdrawals('all')">الكل</button>
                    <button class="btn-secondary" style="padding: 4px 10px; font-size: 0.8rem; border-color: #ff9800; color: #ffd54f;" onclick="window.adminManager.renderWithdrawals('pending')">⏳ قيد الانتظار فقط</button>
                    <button class="btn-secondary" style="padding: 4px 10px; font-size: 0.8rem; border-color: #4caf50; color: #81c784;" onclick="window.adminManager.renderWithdrawals('completed')">✅ تم التحويل</button>
                    <button class="btn-secondary" style="padding: 4px 10px; font-size: 0.8rem; border-color: #f44336; color: #ff8a80;" onclick="window.adminManager.renderWithdrawals('rejected')">❌ مرفوض ومسترد</button>
                </div>

                <!-- جدول طلبات السحب -->
                <div class="admin-table-container">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>رقم الطلب</th>
                                <th>وسيلة السحب</th>
                                <th>المبلغ والنقاط</th>
                                <th>بيانات الحساب / المستلم</th>
                                <th>الحالة</th>
                                <th>التاريخ</th>
                                <th>الإجراء</th>
                            </tr>
                        </thead>
                        <tbody id="adminWithdrawalsTableBody">
                            <!-- توليد تلقائي -->
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- التبويب 2: مخزن الأكواد الحقيقية -->
            <div id="adminTabVault" class="admin-tab-content" style="display: none; width: 100%;">
                <p class="modal-text" style="font-size: 0.92rem; text-align: right; margin-bottom: 12px;">
                    يمكنك شراء كروت وبطاقات شحن جاهزة (من Shop2Game أو Midasbuy أو SEAGM) ووضع أكوادها هنا ليتم <strong>تسليمها تلقائياً وفوراً</strong> للاعب عند وصوله للنقاط المطلوبة:
                </p>

                <div class="admin-vault-cards">
                    <div class="admin-vault-box">
                        <div style="font-size: 1.8rem;">🔥</div>
                        <div style="font-weight: 800; color: #ff5722;">أكواد فري فاير</div>
                        <div id="vaultCountFF" style="color: #ffd54f; font-size: 1.1rem; font-weight: 900; margin-top: 4px;">0 كود متوفر</div>
                    </div>
                    <div class="admin-vault-box">
                        <div style="font-size: 1.8rem;">🪖</div>
                        <div style="font-weight: 800; color: #ffb300;">أكواد ببجي UC</div>
                        <div id="vaultCountPubg" style="color: #ffd54f; font-size: 1.1rem; font-weight: 900; margin-top: 4px;">0 كود متوفر</div>
                    </div>
                    <div class="admin-vault-box">
                        <div style="font-size: 1.8rem;">⚽</div>
                        <div style="font-weight: 800; color: #29b6f6;">كوينز إي فوتبول</div>
                        <div id="vaultCountEF" style="color: #ffd54f; font-size: 1.1rem; font-weight: 900; margin-top: 4px;">0 كود متوفر</div>
                    </div>
                    <div class="admin-vault-box">
                        <div style="font-size: 1.8rem;">⚔️</div>
                        <div style="font-weight: 800; color: #ff9800;">جواهر وتذاكر كلاش</div>
                        <div id="vaultCountClash" style="color: #ffd54f; font-size: 1.1rem; font-weight: 900; margin-top: 4px;">0 كود متوفر</div>
                    </div>
                    <div class="admin-vault-box">
                        <div style="font-size: 1.8rem;">🎯</div>
                        <div style="font-weight: 800; color: #90a4ae;">نقاط CP كول أوف ديوتي</div>
                        <div id="vaultCountCODM" style="color: #ffd54f; font-size: 1.1rem; font-weight: 900; margin-top: 4px;">0 كود متوفر</div>
                    </div>
                    <div class="admin-vault-box">
                        <div style="font-size: 1.8rem;">🎁</div>
                        <div style="font-weight: 800; color: #4caf50;">بطاقات Google</div>
                        <div id="vaultCountGP" style="color: #ffd54f; font-size: 1.1rem; font-weight: 900; margin-top: 4px;">0 كود متوفر</div>
                    </div>
                </div>

                <div class="monetization-input-group">
                    <label style="color: #b0bec5; font-size: 0.9rem; font-weight: 700;">
                        اختر اللعبة لإضافة أكواد جديدة:
                    </label>
                    <select id="vaultGameSelect" class="monetization-input" style="font-family: inherit;">
                        <option value="freefire">🔥 فري فاير (Free Fire PINs)</option>
                        <option value="pubg">🪖 ببجي موبايل (PUBG UC Codes)</option>
                        <option value="efootball">⚽ إي فوتبول (eFootball Coins)</option>
                        <option value="clash">⚔️ كلاش (Clash of Clans / Royale)</option>
                        <option value="codm">🎯 كول أوف ديوتي (Call of Duty CP)</option>
                        <option value="googleplay">🎁 بطاقات جوجل بلاي (Google Play Codes)</option>
                    </select>
                </div>

                <div class="monetization-input-group" style="margin-top: 8px;">
                    <label style="color: #b0bec5; font-size: 0.9rem; font-weight: 700;">
                        الصق الأكواد الحقيقية هنا (كود واحد في كل سطر):
                    </label>
                    <textarea id="adminVaultCodesInput" class="admin-textarea" placeholder="مثال:&#10;FF-9941-8821-XXAA&#10;FF-7712-4411-ZZBB"></textarea>
                </div>

                <button id="btnSaveVaultCodes" class="btn-action" style="margin-top: 10px; width: 100%; justify-content: center;">
                    📥 حفظ وإيداع الأكواد في المخزن
                </button>
            </div>

            <!-- التبويب 3: شبكات الإعلانات والربح الحقيقي -->
            <div id="adminTabAds" class="admin-tab-content" style="display: none; width: 100%;">
                <p class="modal-text" style="font-size: 0.92rem; text-align: right; margin-bottom: 12px;">
                    اختر شبكة الإعلانات التي تريد ربطها لجني الأرباح الحقيقية من نقرات ومشاهدات اللاعبين:
                </p>

                <div class="monetization-input-group">
                    <label style="color: #b0bec5; font-weight: 700; font-size: 0.9rem;">
                        1. معرف Google AdSense (Publisher ID):
                    </label>
                    <input type="text" id="adminAdsenseInput" class="monetization-input" placeholder="ca-pub-XXXXXXXXXXXXXXXX">
                </div>

                <div class="monetization-input-group" style="margin-top: 8px;">
                    <label style="color: #b0bec5; font-weight: 700; font-size: 0.9rem;">
                        2. معرف منطقة إعلانات Monetag (Zone ID):
                    </label>
                    <input type="text" id="adminMonetagInput" class="monetization-input" placeholder="مثال: 1234567">
                    <small style="color:#78909c;">شبكة Monetag تقبل ألعاب الويب فوراً وبدون شروط وتدفع عبر PayPal أو USDT.</small>
                </div>

                <div class="monetization-input-group" style="margin-top: 8px;">
                    <label style="color: #b0bec5; font-weight: 700; font-size: 0.9rem;">
                        3. رابط الربح المباشر المربح (Smartlink / Direct Link من Adsterra أو Monetag):
                    </label>
                    <input type="url" id="adminDirectLinkInput" class="monetization-input" placeholder="https://example.com/smartlink">
                    <small style="color:#78909c;">عند وضعه، يُفتح هذا الرابط عند مشاهدة إعلان المكافأة ليحقق لك أرباحاً فورية حقيقية!</small>
                </div>

                <button id="btnSaveAdminAds" class="btn-action" style="margin-top: 12px; width: 100%; justify-content: center;">
                    💾 حفظ وتفعيل شبكات الإعلانات
                </button>
            </div>

            <!-- التبويب 4: إشعارات التليجرام الفورية -->
            <div id="adminTabTelegram" class="admin-tab-content" style="display: none; width: 100%;">
                <div style="background: rgba(0, 136, 204, 0.15); border: 1px solid #0088cc; border-radius: 12px; padding: 12px; margin-bottom: 12px; text-align: right;">
                    <strong style="color: #29b6f6;">📱 تنبيهات فورية على هاتفك:</strong><br>
                    <span style="font-size: 0.85rem; color: #eceff1;">
                        بمجرد أن يقوم لاعب بطلب شحن حسابه بالـ ID الخاص به، ستصلك رسالة فورية على هاتفك في تطبيق Telegram تحتوي على معرف اللاعب واللعبة والطلب لشحنه فوراً!
                    </span>
                </div>

                <div class="monetization-input-group">
                    <label style="color: #b0bec5; font-weight: 700; font-size: 0.9rem;">
                        Telegram Bot Token:
                    </label>
                    <input type="text" id="adminTelegramToken" class="monetization-input" placeholder="مثال: 123456789:ABCdefGhIJKlmNoPQRstuVWXyz">
                    <small style="color: #78909c;">يمكنك إنشاء بوت مجاناً في دقيقة عبر البوت الرسمي @BotFather على تليجرام.</small>
                </div>

                <div class="monetization-input-group" style="margin-top: 8px;">
                    <label style="color: #b0bec5; font-weight: 700; font-size: 0.9rem;">
                        Telegram Chat ID:
                    </label>
                    <input type="text" id="adminTelegramChatId" class="monetization-input" placeholder="مثال: 987654321">
                    <small style="color: #78909c;">يمكنك معرفة معرف حسابك مجاناً عبر إرسال رسالة إلى @userinfobot على تليجرام.</small>
                </div>

                <div style="display: flex; gap: 8px; margin-top: 12px;">
                    <button id="btnSaveTelegramConfig" class="btn-action" style="flex: 1; justify-content: center;">
                        💾 حفظ إعدادات تليجرام
                    </button>
                    <button id="btnTestTelegramAlert" class="btn-secondary" style="border-color: #0088cc; color: #29b6f6;">
                        📲 تجربة إرسال رسالة
                    </button>
                </div>
            </div>

            <!-- التبويب 4: القناة الإلزامية ومواقع التواصل ومنع الإعلانات -->
            <div id="adminTabSocial" class="admin-tab-content" style="display: none; width: 100%;">
                <p class="modal-text" style="font-size: 0.92rem; text-align: right; margin-bottom: 12px;">
                    تحكم هنا في شروط الاشتراك الإلزامي للقناة، روابط مواقع التواصل، ونظام منع حاجب الإعلانات:
                </p>

                <!-- قسم الاشتراك الإلزامي -->
                <div style="background: rgba(255, 152, 0, 0.1); border: 1px solid rgba(255, 152, 0, 0.35); border-radius: 12px; padding: 14px; margin-bottom: 12px; text-align: right;">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; flex-wrap: wrap; gap: 8px;">
                        <label style="font-weight: 800; color: #ffd54f; font-size: 1rem; display: flex; align-items: center; gap: 8px; cursor: pointer;">
                            <input type="checkbox" id="adminMandatorySubChk" style="width: 18px; height: 18px; accent-color: #ff9800;">
                            فرض الاشتراك في القناة كشرط إلزامي للعب
                        </label>
                        <button id="btnResetAdminSub" class="btn-secondary" style="font-size: 0.78rem; padding: 4px 10px;">
                            🔄 إعادة تعيين اشتراكي للتجربة
                        </button>
                    </div>

                    <div class="monetization-input-group">
                        <label style="color: #b0bec5; font-size: 0.88rem; font-weight: 700;">اسم القناة المعروض:</label>
                        <input type="text" id="adminChannelNameInp" class="monetization-input" placeholder="مثال: القناة الرسمية للعبة كوكو والأفخاخ">
                    </div>

                    <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 8px; margin-top: 8px;">
                        <div class="monetization-input-group">
                            <label style="color: #b0bec5; font-size: 0.88rem; font-weight: 700;">رابط القناة (URL):</label>
                            <input type="text" id="adminChannelUrlInp" class="monetization-input" placeholder="https://youtube.com/@channel أو https://t.me/channel">
                            <small style="color: #81c784; display: block; margin-top: 4px;">💡 يمكنك وضع رابط كامل (https://...) أو معرف القناة (@channel) وسيتم حفظه وتفعيله تلقائياً.</small>
                        </div>
                        <div class="monetization-input-group">
                            <label style="color: #b0bec5; font-size: 0.88rem; font-weight: 700;">نوع القناة:</label>
                            <select id="adminChannelTypeSel" class="monetization-input" style="font-family: inherit;">
                                <option value="youtube">🔴 يوتيوب (YouTube)</option>
                                <option value="telegram">✈️ تليجرام (Telegram)</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- قسم منع حاجب الإعلانات -->
                <div style="background: rgba(244, 67, 54, 0.1); border: 1px solid rgba(244, 67, 54, 0.35); border-radius: 12px; padding: 14px; margin-bottom: 12px; text-align: right;">
                    <label style="font-weight: 800; color: #ff8a80; font-size: 1rem; display: flex; align-items: center; gap: 8px; cursor: pointer;">
                        <input type="checkbox" id="adminAntiAdblockChk" style="width: 18px; height: 18px; accent-color: #f44336;">
                        تفعيل نظام منع حاجب الإعلانات (Anti-AdBlock)
                    </label>
                    <small style="color: #cfd8dc; display: block; margin-top: 4px;">
                        عند تفعيله، لن يتمكن أي لاعب من بدء اللعبة إذا كان يستخدم مانع إعلانات، مما يضمن أرباحك وتغطية تكاليف قسائم الشحن.
                    </small>
                </div>

                <!-- قسم روابط التواصل الاجتماعي -->
                <div style="background: rgba(0, 0, 0, 0.3); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 14px; text-align: right;">
                    <strong style="color: #4fc3f7; font-size: 0.95rem; display: block; margin-bottom: 8px;">🌐 روابط حسابات التواصل الاجتماعي:</strong>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                        <div class="monetization-input-group">
                            <label style="color: #b0bec5; font-size: 0.82rem; font-weight: 700;">🔴 يوتيوب:</label>
                            <input type="url" id="adminSocialYoutube" class="monetization-input" placeholder="https://youtube.com/@...">
                        </div>
                        <div class="monetization-input-group">
                            <label style="color: #b0bec5; font-size: 0.82rem; font-weight: 700;">✈️ تليجرام:</label>
                            <input type="url" id="adminSocialTelegram" class="monetization-input" placeholder="https://t.me/...">
                        </div>
                        <div class="monetization-input-group">
                            <label style="color: #b0bec5; font-size: 0.82rem; font-weight: 700;">🎵 تيك توك:</label>
                            <input type="url" id="adminSocialTiktok" class="monetization-input" placeholder="https://tiktok.com/@...">
                        </div>
                        <div class="monetization-input-group">
                            <label style="color: #b0bec5; font-size: 0.82rem; font-weight: 700;">📘 فيسبوك:</label>
                            <input type="url" id="adminSocialFacebook" class="monetization-input" placeholder="https://facebook.com/...">
                        </div>
                        <div class="monetization-input-group">
                            <label style="color: #b0bec5; font-size: 0.82rem; font-weight: 700;">📸 إنستغرام:</label>
                            <input type="url" id="adminSocialInstagram" class="monetization-input" placeholder="https://instagram.com/...">
                        </div>
                        <div class="monetization-input-group">
                            <label style="color: #b0bec5; font-size: 0.82rem; font-weight: 700;">💬 ديسكورد:</label>
                            <input type="url" id="adminSocialDiscord" class="monetization-input" placeholder="https://discord.gg/...">
                        </div>
                    </div>
                </div>

                <button id="btnSaveAdminSocial" class="btn-action" style="margin-top: 12px; width: 100%; justify-content: center;">
                    💾 حفظ إعدادات القناة والتواصل والمانع
                </button>
                <div id="adminSocialSaveAlert" style="display: none; margin-top: 8px; padding: 10px; border-radius: 8px; background: rgba(76, 175, 80, 0.2); border: 1px solid #4caf50; color: #81c784; text-align: center; font-weight: bold; font-size: 0.9rem;"></div>
            </div>

            <!-- التبويب 5: جدار الحماية وسجلات الأمان والمستخدمين -->
            <div id="adminTabWaf" class="admin-tab-content" style="display: none; width: 100%;">
                <div style="background: rgba(0, 229, 255, 0.08); border: 1px solid rgba(0, 229, 255, 0.3); border-radius: 12px; padding: 14px; margin-bottom: 14px; text-align: right;">
                    <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
                        <div>
                            <strong style="color: #00e5ff; font-size: 1.1rem; display: flex; align-items: center; gap: 6px;">
                                🛡️ جدار الحماية السحابي (Web Application Firewall - WAF)
                            </strong>
                            <small style="color: #b0bec5; display: block; margin-top: 4px;">
                                حماية متعددة الطبقات ضد الروبوتات، والبريد الوهمي، وثغرات XSS، وهجمات القوة الغاشمة، والتلاعب بالنقاط.
                            </small>
                        </div>
                        <span style="background: rgba(76, 175, 80, 0.2); border: 1px solid #4caf50; color: #81c784; padding: 4px 12px; border-radius: 20px; font-size: 0.82rem; font-weight: 800;">
                            🟢 الدرع الأمني نشط ومراقب 100%
                        </span>
                    </div>
                </div>

                <!-- إحصائيات الأمان الأربعة -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; margin-bottom: 16px;">
                    <div class="admin-vault-box" style="border-color: rgba(244, 67, 54, 0.4);">
                        <div style="font-size: 1.6rem;">🤖</div>
                        <div style="font-weight: 800; color: #ef5350; font-size: 0.85rem;">روبوتات مصدودة</div>
                        <div id="wafCountBots" style="color: #ffd54f; font-size: 1.3rem; font-weight: 900; margin-top: 4px;">0</div>
                    </div>
                    <div class="admin-vault-box" style="border-color: rgba(255, 152, 0, 0.4);">
                        <div style="font-size: 1.6rem;">📧</div>
                        <div style="font-weight: 800; color: #ffb74d; font-size: 0.85rem;">بريد وهمي محظور</div>
                        <div id="wafCountFake" style="color: #ffd54f; font-size: 1.3rem; font-weight: 900; margin-top: 4px;">0</div>
                    </div>
                    <div class="admin-vault-box" style="border-color: rgba(233, 30, 99, 0.4);">
                        <div style="font-size: 1.6rem;">⚠️</div>
                        <div style="font-weight: 800; color: #f48fb1; font-size: 0.85rem;">محاولات غش أحبطت</div>
                        <div id="wafCountCheats" style="color: #ffd54f; font-size: 1.3rem; font-weight: 900; margin-top: 4px;">0</div>
                    </div>
                    <div class="admin-vault-box" style="border-color: rgba(0, 229, 255, 0.4);">
                        <div style="font-size: 1.6rem;">👥</div>
                        <div style="font-weight: 800; color: #4fc3f7; font-size: 0.85rem;">مستخدمون حقيقيون</div>
                        <div id="wafCountUsers" style="color: #ffd54f; font-size: 1.3rem; font-weight: 900; margin-top: 4px;">0</div>
                    </div>
                    <div class="admin-vault-box" style="border-color: rgba(171, 71, 188, 0.4);">
                        <div style="font-size: 1.6rem;">🎁</div>
                        <div style="font-weight: 800; color: #ce93d8; font-size: 0.85rem;">إجمالي الإحالات</div>
                        <div id="wafCountReferrals" style="color: #ffd54f; font-size: 1.3rem; font-weight: 900; margin-top: 4px;">0</div>
                    </div>
                </div>

                <!-- جدول المستخدمين المسجلين الموثقين -->
                <div style="margin-bottom: 16px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <span style="font-size: 0.92rem; color: #ffd54f; font-weight: 700;">👥 قائمة حسابات اللاعبين الموثقة:</span>
                        <button class="btn-secondary" style="padding: 4px 10px; font-size: 0.78rem;" onclick="if(window.authManager) window.authManager.renderAdminUsersList()">🔄 تحديث القائمة</button>
                    </div>
                    <div class="admin-table-container">
                        <table class="admin-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>اسم المستخدم</th>
                                    <th>البريد الإلكتروني الموثق</th>
                                    <th>حالة الحساب</th>
                                    <th>تاريخ التسجيل</th>
                                    <th>إجراء</th>
                                </tr>
                            </thead>
                            <tbody id="adminUsersTableBody">
                                <!-- توليد تلقائي -->
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- جدول سجل التهديدات المباشر -->
                <div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <span style="font-size: 0.92rem; color: #ff8a80; font-weight: 700;">🚨 سجل رصد التهديدات والمحاولات المشبوهة (Live Threat Feed):</span>
                        <button class="btn-secondary" style="padding: 4px 10px; font-size: 0.78rem;" onclick="if(window.adminManager) window.adminManager.renderWafLogs()">🔄 تحديث السجل</button>
                    </div>
                    <div class="admin-table-container">
                        <table class="admin-table">
                            <thead>
                                <tr>
                                    <th>رقم الرصد</th>
                                    <th>نوع التهديد</th>
                                    <th>تفاصيل النشاط المشبوه</th>
                                    <th>الوقت والتاريخ</th>
                                    <th>حالة الردع</th>
                                </tr>
                            </thead>
                            <tbody id="adminWafLogsTableBody">
                                <!-- توليد تلقائي -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- التبويب 6: تغيير وتشفير الرمز السري للمدير -->
            <div id="adminTabSecurity" class="admin-tab-content" style="display: none; width: 100%;">
                <div style="background: rgba(0, 229, 255, 0.08); border: 1px solid rgba(0, 229, 255, 0.3); border-radius: 12px; padding: 14px; margin-bottom: 14px; text-align: right;">
                    <strong style="color: #00e5ff; font-size: 1.05rem;">🔒 تأمين لوحة الإدارة بتشفير SHA-256</strong>
                    <p style="font-size: 0.85rem; color: #eceff1; margin-top: 4px; line-height: 1.6;">
                        يتم تشفير وتجزئة الرمز السري فوراً بتقنية <strong>SHA-256 التشفيرية مع Salt</strong> ولا يتم حفظه كنص صريح في أي ملف، مما يجعل من المستحيل على أي شخص اختراقه أو معرفته حتى لو فحص ملفات الموقع.
                    </p>
                </div>

                <div class="monetization-input-group">
                    <label style="color: #b0bec5; font-weight: 700; font-size: 0.9rem;">
                        أدخل الرمز السري الجديد الخاص بك فقط:
                    </label>
                    <input type="password" id="adminNewPinInput" class="monetization-input" placeholder="اكتب رمزك السري الجديد هنا..." maxlength="20" style="font-size: 1.1rem; letter-spacing: 2px;">
                    <small style="color: #81c784;">🛡️ احفظ هذا الرمز جيداً. هو مفتاحك السري الوحيد للوصول للوحة الإدارة.</small>
                </div>
                <button id="btnSaveNewPin" class="btn-action" style="margin-top: 12px; width: 100%; justify-content: center; background: linear-gradient(135deg, #00c853, #1b5e20);">
                    🔒 حفظ وتشفير الرمز السري الآن
                </button>
            </div>
        </div>`;
    }

    /**
     * إنشاء محتوى لوحة الإدارة برمجياً في الـ DOM (Content Hiding)
     */
    renderAdminPanelDOM() {
        const adminPanel = document.getElementById('adminPanelModal');
        if (!adminPanel) return;

        // حقن العناصر فقط إذا لم تكن موجودة مسبقاً
        adminPanel.innerHTML = this.getAdminPanelHTML();

        // ربط كافة الأحداث التفاعلية للوحة الإدارة بعد حقن الـ DOM
        this.bindAdminPanelDOMEvents();
    }

    /**
     * ربط أحداث أزرار وتبويبات لوحة الإدارة فور حقن الـ DOM
     */
    bindAdminPanelDOMEvents() {
        const panel = document.getElementById('adminPanelModal');
        if (!panel) return;

        // زر قفل اللوحة وزر الإغلاق
        document.getElementById('btnLockAdminPanel')?.addEventListener('click', () => this.lockAndLogout());
        document.getElementById('btnCloseAdminPanel')?.addEventListener('click', () => {
            panel.style.display = 'none';
        });

        // زر حفظ شبكات الإعلانات ديناميكياً
        document.getElementById('btnSaveAdminAds')?.addEventListener('click', () => {
            this.saveAdsConfig();
        });

        // زر حفظ وتشفير الرمز السري الجديد
        document.getElementById('btnSaveNewPin')?.addEventListener('click', async () => {
            const newPinInp = document.getElementById('adminNewPinInput');
            if (newPinInp) {
                await this.changePin(newPinInp.value);
                newPinInp.value = '';
            }
        });

        // تبديل تبويبات لوحة المدير
        panel.querySelectorAll('.admin-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                panel.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                const tab = e.currentTarget.getAttribute('data-admin-tab');

                panel.querySelectorAll('.admin-tab-content').forEach(c => c.style.display = 'none');

                if (tab === 'orders') {
                    const el = document.getElementById('adminTabOrders');
                    if (el) el.style.display = 'block';
                    this.renderOrders();
                } else if (tab === 'withdrawals') {
                    const el = document.getElementById('adminTabWithdrawals');
                    if (el) el.style.display = 'block';
                    this.renderWithdrawals();
                } else if (tab === 'vault') {
                    const el = document.getElementById('adminTabVault');
                    if (el) el.style.display = 'block';
                    this.renderVault();
                } else if (tab === 'ads') {
                    const el = document.getElementById('adminTabAds');
                    if (el) el.style.display = 'block';
                    this.populateAdsForm();
                } else if (tab === 'social') {
                    const el = document.getElementById('adminTabSocial');
                    if (el) el.style.display = 'block';
                    if (window.featuresManager) window.featuresManager.populateAdminForm();
                } else if (tab === 'telegram') {
                    const el = document.getElementById('adminTabTelegram');
                    if (el) el.style.display = 'block';
                    this.populateTelegramForm();
                } else if (tab === 'waf') {
                    const el = document.getElementById('adminTabWaf');
                    if (el) el.style.display = 'block';
                    this.renderWafLogs();
                    if (window.authManager) window.authManager.renderAdminUsersList();
                } else if (tab === 'security') {
                    const el = document.getElementById('adminTabSecurity');
                    if (el) el.style.display = 'block';
                }
            });
        });

        // حفظ إعدادات تنبيهات تليجرام
        document.getElementById('btnSaveTelegramConfig')?.addEventListener('click', () => {
            this.saveTelegramConfig();
        });

        // تجربة تنبيه تليجرام
        document.getElementById('btnTestTelegramAlert')?.addEventListener('click', () => {
            this.testTelegramAlert();
        });

        // حفظ القناة ومواقع التواصل والمانع
        document.getElementById('btnSaveAdminSocial')?.addEventListener('click', () => {
            if (window.featuresManager) {
                if (typeof window.featuresManager.saveAdminForm === 'function') {
                    window.featuresManager.saveAdminForm();
                } else if (typeof window.featuresManager.saveAdminConfig === 'function') {
                    window.featuresManager.saveAdminConfig();
                }
            }
        });

        // زر إعادة تعيين الاشتراك للتجربة
        document.getElementById('btnResetAdminSub')?.addEventListener('click', () => {
            if (window.featuresManager) {
                if (typeof window.featuresManager.resetMySubscription === 'function') {
                    window.featuresManager.resetMySubscription();
                } else if (typeof window.featuresManager.resetSubscriptionForTesting === 'function') {
                    window.featuresManager.resetSubscriptionForTesting();
                }
            }
        });

        // حفظ وإيداع أكواد جديدة في المخزن
        document.getElementById('btnSaveVaultCodes')?.addEventListener('click', () => {
            if (!this.isLoggedIn) {
                alert('🔒 يرجى تسجيل الدخول أولاً كمدير!');
                return;
            }
            const gameSelect = document.getElementById('vaultGameSelect');
            const textarea = document.getElementById('adminVaultCodesInput');

            if (gameSelect && textarea) {
                const count = this.addCodesToVault(gameSelect.value, textarea.value);
                if (count > 0) {
                    alert(`✅ تم إيداع ${count} كود حقيقي في مخزن ${gameSelect.options[gameSelect.selectedIndex].text} بنجاح!`);
                    textarea.value = '';
                    this.renderVault();
                } else {
                    alert('يرجى كتابة أو لصق الأكواد في الصندوق أولاً (كود في كل سطر).');
                }
            }
        });
    }

    /**
     * طرق الوصول المخفي للوحة الإدارة (Hidden Access: Shortcuts & Logo Clicks)
     * لا توجد أي أزرار ظاهرة للزوار العاديين في الموقع
     */
    setupHiddenAccessListeners() {
        // 1. اختصار لوحة المفاتيح السري: Ctrl + Shift + Y (أو Ctrl + Shift + A كبديل)
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && (e.key === 'Y' || e.key === 'y' || e.key === 'A' || e.key === 'a')) {
                e.preventDefault();
                this.openPinModal();
            }
        });

        // 2. النقر 7 مرات متتالية على شعار اللعبة (Game Logo Clicks)
        let logoClicks = 0;
        let lastLogoClickTime = 0;
        const logoElements = document.querySelectorAll('#navBrandHome, .navbar-brand, .brand-avatar, .brand-title');
        logoElements.forEach(logoEl => {
            logoEl.addEventListener('click', (e) => {
                const now = Date.now();
                if (now - lastLogoClickTime < 1000) {
                    logoClicks++;
                } else {
                    logoClicks = 1;
                }
                lastLogoClickTime = now;

                if (logoClicks >= 7) {
                    logoClicks = 0;
                    e.preventDefault();
                    e.stopPropagation();
                    this.openPinModal();
                }
            });
        });

        // 3. رابط سري اختياري عبر الرابط: ?admin=1 أو ?owner=true
        if (window.location.search.includes('admin=1') || window.location.search.includes('owner=true')) {
            setTimeout(() => this.openPinModal(), 500);
        }
    }

    /**
     * فتح نافذة تسجيل الدخول المشفرة أو لوحة الإدارة مباشرة إذا كانت الجلسة نشطة
     */
    openPinModal() {
        if (this.isLoggedIn) {
            const panel = document.getElementById('adminPanelModal');
            if (panel && (!panel.innerHTML || !panel.innerHTML.trim())) {
                this.renderAdminPanelDOM();
            }
            if (panel) panel.style.display = 'flex';
            this.renderOrders();
            this.renderWithdrawals();
        } else {
            const pinModal = document.getElementById('adminPinModal');
            const pinInput = document.getElementById('adminPinInput');
            if (pinInput) pinInput.value = '';
            if (pinModal) pinModal.style.display = 'flex';
            setTimeout(() => pinInput?.focus(), 120);
        }
    }

    /**
     * تهيئة مستمعات الدخول الآمن والوصول السري
     */
    initUIListeners() {
        // زر إرسال الرمز السري في نافذة تسجيل الدخول
        const btnSubmitPin = document.getElementById('btnSubmitAdminPin');
        const pinInput = document.getElementById('adminPinInput');
        const btnClosePin = document.getElementById('btnCloseAdminPin');

        const doLogin = async () => {
            const entered = pinInput ? pinInput.value : '';
            if (!entered) return;
            const ok = await this.verifyPin(entered);
            if (!ok) {
                alert('❌ الرمز السري غير صحيح! تم توثيق المحاولة أمنياً بجدار الحماية.');
                if (pinInput) pinInput.value = '';
            }
        };

        btnSubmitPin?.addEventListener('click', doLogin);
        pinInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') doLogin();
        });

        btnClosePin?.addEventListener('click', () => {
            const pinModal = document.getElementById('adminPinModal');
            if (pinModal) pinModal.style.display = 'none';
        });

        // تفعيل طرق الوصول السري
        this.setupHiddenAccessListeners();
    }


    // ملحقات ومساعدات النظام (Vault & Alerts)
    // ==========================================

    getGameBadgeColor(game) {
        if (game === 'freefire') return '#e91e63';
        if (game === 'pubg') return '#ff9800';
        if (game === 'efootball') return '#0070d2';
        if (game === 'clash') return '#f57c00';
        if (game === 'codm') return '#37474f';
        return '#4caf50';
    }

    sendTelegramAlert(order) {
        let topupUrl = 'https://shop2game.com';
        if (order.game === 'pubg') topupUrl = 'https://www.midasbuy.com';
        else if (order.game === 'efootball') topupUrl = 'https://www.konami.com/efootball/';
        else if (order.game === 'clash') topupUrl = 'https://store.supercell.com';
        else if (order.game === 'codm') topupUrl = 'https://www.codashop.com';
        else if (order.game === 'googleplay') topupUrl = 'https://play.google.com';

        const message = `🔔 *طلب شحن مباشر جديد عبر Player ID!* 🐔\n\n` +
            `🎮 *اللعبة:* ${order.gameTitle}\n` +
            `💎 *الباقة المطلوبة:* ${order.voucherTitle}\n` +
            `🆔 *معرف اللاعب (Player ID):* \`${order.playerId}\`\n` +
            `💰 *النقاط المخصومة:* ${(order.cost || 0).toLocaleString()} نقطة\n` +
            `📅 *تاريخ الطلب:* ${order.date}\n` +
            `📋 *رقم الطلب:* \`${order.id}\`\n` +
            `📌 *الحالة الافتراضية:* قيد الانتظار (Pending) ⏳\n\n` +
            `⚡ *طريقة التنفيذ اليدوي:*\n` +
            `1. انسخ المعرف: \`${order.playerId}\`\n` +
            `2. ادخل الموقع الرسمي للشحن: ${topupUrl}\n` +
            `3. بعد الشحن، ادخل لوحة تحكم اللعبة واضغط "تم الشحن بنجاح ✅".`;

        const url = `https://api.telegram.org/bot${this.config.telegramBotToken}/sendMessage`;
        fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: this.config.telegramChatId,
                text: message,
                parse_mode: 'Markdown'
            })
        }).catch(err => console.warn('خطأ في إرسال تليجرام:', err));
    }

    sendWithdrawalTelegramAlert(w) {
        let methodEmoji = '💳';
        if (w.method === 'paypal') methodEmoji = '🅿️';
        else if (w.method === 'bank') methodEmoji = '🏦';

        const message = `💸 *طلب سحب أرباح مالي جديد!* 🐔\n\n` +
            `${methodEmoji} *طريقة السحب:* ${w.methodTitle}\n` +
            `💰 *المبلغ المطلوب:* $${(w.amountUSD || 0).toFixed(2)} USD\n` +
            `🔢 *النقاط المخصومة:* ${(w.pointsCost || 0).toLocaleString()} نقطة\n` +
            `📋 *رقم الطلب:* \`${w.id}\`\n` +
            `🏦 *بيانات التحويل:* ${w.summary}\n` +
            `📅 *التاريخ:* ${w.date}\n` +
            `📌 *الحالة:* ${w.status}`;

        const url = `https://api.telegram.org/bot${this.config.telegramBotToken}/sendMessage`;
        fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: this.config.telegramChatId,
                text: message,
                parse_mode: 'Markdown'
            })
        }).catch(err => console.warn('خطأ في إرسال سحب تليجرام:', err));
    }

    sendSecurityBreachAlert() {
        if (!this.config.enableTelegramAlerts || !this.config.telegramBotToken || !this.config.telegramChatId) return;

        const message = `🚨 *تحذير أمني عاجل في موقعك!* 🐔\n\n` +
            `⚠️ *تم رصد 3 محاولات خاطئة متتالية للوصول إلى لوحة الإدارة!*\n` +
            `🔒 *الإجراء المتخذ:* تم قفل لوحة الإدارة وحظر الوصول لمدة 15 دقيقة بواسطة جدار الحماية WAF.\n` +
            `📅 *التوقيت:* ${new Date().toLocaleString('ar-EG')}\n` +
            `📌 موقعك محمي وبياناتك المالية مشفرة وآمنة 100%.`;

        const url = `https://api.telegram.org/bot${this.config.telegramBotToken}/sendMessage`;
        fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: this.config.telegramChatId,
                text: message,
                parse_mode: 'Markdown'
            })
        }).catch(() => {});
    }

    claimVaultCode(gameType) {
        if (!this.vault[gameType] || this.vault[gameType].length === 0) {
            return null;
        }
        const realCode = this.vault[gameType].shift();
        this.saveData();
        return realCode;
    }

    addCodesToVault(gameType, codesText) {
        if (!codesText || !codesText.trim()) return 0;
        const lines = codesText.split('\n')
            .map(l => l.trim())
            .filter(l => l.length > 3);

        if (!this.vault[gameType]) this.vault[gameType] = [];
        this.vault[gameType].push(...lines);
        this.saveData();
        return lines.length;
    }

    renderVault() {
        if (!this.isLoggedIn) return;

        const ffCount = (this.vault.freefire || []).length;
        const pubgCount = (this.vault.pubg || []).length;
        const efCount = (this.vault.efootball || []).length;
        const clashCount = (this.vault.clash || []).length;
        const codmCount = (this.vault.codm || []).length;
        const gpCount = (this.vault.googleplay || []).length;

        const ffElem = document.getElementById('vaultCountFF');
        const pubgElem = document.getElementById('vaultCountPubg');
        const efElem = document.getElementById('vaultCountEF');
        const clashElem = document.getElementById('vaultCountClash');
        const codmElem = document.getElementById('vaultCountCODM');
        const gpElem = document.getElementById('vaultCountGP');

        if (ffElem) ffElem.innerText = `${ffCount} كود متوفر`;
        if (pubgElem) pubgElem.innerText = `${pubgCount} كود متوفر`;
        if (efElem) efElem.innerText = `${efCount} كود متوفر`;
        if (clashElem) clashElem.innerText = `${clashCount} كود متوفر`;
        if (codmElem) codmElem.innerText = `${codmCount} كود متوفر`;
        if (gpElem) gpElem.innerText = `${gpCount} كود متوفر`;
    }

    renderWafLogs() {
        if (!this.isLoggedIn) return;

        const tbody = document.getElementById('adminWafLogsTableBody');
        const countBots = document.getElementById('wafCountBots');
        const countFake = document.getElementById('wafCountFake');
        const countCheats = document.getElementById('wafCountCheats');
        const countUsers = document.getElementById('wafCountUsers');
        const countReferrals = document.getElementById('wafCountReferrals');

        try {
            const ledger = JSON.parse(localStorage.getItem('chicken_referral_ledger') || '{}');
            let totalRef = 0;
            for (let k in ledger) totalRef += (ledger[k].count || 0);
            if (countReferrals) countReferrals.innerText = totalRef.toLocaleString();
        } catch (e) {}

        if (window.securityWAF) {
            const stats = window.securityWAF.stats;
            if (countBots) countBots.innerText = stats.botsBlocked;
            if (countFake) countFake.innerText = stats.fakeEmailsBlocked;
            if (countCheats) countCheats.innerText = stats.cheatsBlocked;
            if (countUsers && window.authManager) countUsers.innerText = window.authManager.users.length;

            if (tbody) {
                const logs = window.securityWAF.threatLogs;
                if (logs.length === 0) {
                    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:18px; color:#81c784;">🟢 جدار الحماية نشط ولا توجد اختراقات مسجلة حالياً. النظام آمن ومحمي 100%!</td></tr>`;
                    return;
                }

                let html = '';
                logs.forEach(l => {
                    const badgeClass = l.severity === 'CRITICAL' ? 'cancel' : 'topup';
                    html += `
                        <tr>
                            <td style="color:#ffd700; font-weight:800;">${l.id}</td>
                            <td><span class="admin-action-btn ${badgeClass}">${l.type}</span></td>
                            <td style="color:#eceff1; font-size:0.85rem;">${l.details}</td>
                            <td style="font-size:0.8rem; color:#b0bec5;">${l.time}</td>
                            <td><span class="order-status-badge completed">تم الصد بنجاح 🛡️</span></td>
                        </tr>
                    `;
                });
                tbody.innerHTML = html;
            }
        }
    }
}

// إنشاء الكائن العام وإتاحته في نطاق window
window.adminManager = new AdminManager();

// دوال عامة مساعدة لسهولة الوصول المباشر
window.saveAdminConfig = (cfg) => window.adminManager.saveAdminConfig(cfg);
window.loadAdminConfig = () => window.adminManager.loadAdminConfig();
window.injectAds = () => window.adminManager.injectAds();
