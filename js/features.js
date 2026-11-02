/**
 * ميزات الموقع الإضافية:
 * 1. القائمة الرئيسية وشريط التنقل العلوي (Main Navbar)
 * 2. نافذة "من نحن" التعريفية (About Us Modal)
 * 3. نافذة وروابط مواقع التواصل الاجتماعي (Social Media Modal)
 * 4. شرط الاشتراك الإلزامي في القناة للعب (Mandatory Subscription Gate)
 * 5. نظام منع وكشف حاجب الإعلانات (Anti-AdBlock System)
 */

class FeaturesManager {
    constructor() {
        this.isAdblockActive = false;
        this.adblockCheckInterval = null;
        this.step1Done = false;
        this.verifyCountdown = null;
        this.countdownTimer = null;

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        this.initNavbar();
        this.initModals();
        this.initMandatorySub();
        this.initAntiAdblock();
    }

    // ==========================================
    // 1. القائمة الرئيسية (Main Navbar)
    // ==========================================
    initNavbar() {
        const navBrand = document.getElementById('navBrandHome');
        const navBtnHome = document.getElementById('navBtnHome');
        const navBtnAbout = document.getElementById('navBtnAbout');
        const navBtnSocial = document.getElementById('navBtnSocial');
        const navBtnVouchers = document.getElementById('navBtnVouchers');
        const navBtnReferral = document.getElementById('navBtnReferral');
        const navBtnWithdraw = document.getElementById('navBtnWithdraw');
        const navBtnSubscribe = document.getElementById('navBtnSubscribe');
        const navBtnAdmin = document.getElementById('navBtnAdmin');
        const navToggle = document.getElementById('navToggleBtn');
        const navbarMenu = document.getElementById('navbarMenu');

        // النقر على الشعار يعود للبداية
        const goHome = () => {
            this.closeMobileMenu();
            if (window.game) {
                window.game.showStartMenu();
            }
        };

        navBrand?.addEventListener('click', goHome);
        navBtnHome?.addEventListener('click', goHome);

        // فتح نافذة من نحن
        navBtnAbout?.addEventListener('click', () => {
            this.closeMobileMenu();
            this.showAboutModal();
        });

        // فتح نافذة مواقع التواصل
        navBtnSocial?.addEventListener('click', () => {
            this.closeMobileMenu();
            this.showSocialModal();
        });

        // فتح متجر القسائم
        navBtnVouchers?.addEventListener('click', () => {
            this.closeMobileMenu();
            if (window.voucherStore) {
                window.voucherStore.openStore();
            }
        });

        // فتح نافذة نظام الإحالة ودعوة الأصدقاء
        navBtnReferral?.addEventListener('click', () => {
            this.closeMobileMenu();
            if (window.referralManager) {
                window.referralManager.openModal();
            }
        });

        // فتح نافذة سحب الأرباح والأموال الحقيقي (Mastercard / PayPal / Bank)
        navBtnWithdraw?.addEventListener('click', () => {
            this.closeMobileMenu();
            if (window.withdrawalManager) {
                window.withdrawalManager.openModal();
            }
        });

        // فتح نافذة الاشتراك بالقناة
        navBtnSubscribe?.addEventListener('click', () => {
            this.closeMobileMenu();
            this.showMandatorySubModal(null, true);
        });

        // فتح لوحة المدير
        navBtnAdmin?.addEventListener('click', () => {
            this.closeMobileMenu();
            const adminPinInp = document.getElementById('adminPinInput');
            if (adminPinInp) adminPinInp.value = '';
            const pinModal = document.getElementById('adminPinModal');
            if (pinModal) pinModal.style.display = 'flex';
        });

        // قائمة الهاتف (Hamburger Menu)
        navToggle?.addEventListener('click', () => {
            navbarMenu?.classList.toggle('active');
        });

        // إغلاق قائمة الهاتف عند النقر خارجها
        document.addEventListener('click', (e) => {
            if (navbarMenu && navbarMenu.classList.contains('active')) {
                if (!navbarMenu.contains(e.target) && !navToggle?.contains(e.target)) {
                    navbarMenu.classList.remove('active');
                }
            }
        });
    }

    closeMobileMenu() {
        const navbarMenu = document.getElementById('navbarMenu');
        navbarMenu?.classList.remove('active');
    }

    // ==========================================
    // 2. نافذة "من نحن" (About Us Modal)
    // ==========================================
    initModals() {
        const btnOpenAbout = document.getElementById('btnStartAbout');
        btnOpenAbout?.addEventListener('click', () => this.showAboutModal());

        const btnCloseAbout = document.getElementById('btnCloseAboutModal');
        btnCloseAbout?.addEventListener('click', () => {
            const modal = document.getElementById('aboutUsModal');
            if (modal) modal.style.display = 'none';
        });

        // أزرار مواقع التواصل في شاشة البداية
        const btnStartSocial = document.getElementById('btnStartSocial');
        btnStartSocial?.addEventListener('click', () => this.showSocialModal());

        const btnCloseSocial = document.getElementById('btnCloseSocialModal');
        btnCloseSocial?.addEventListener('click', () => {
            const modal = document.getElementById('socialMediaModal');
            if (modal) modal.style.display = 'none';
        });

        // زر القناة في شاشة البداية
        const btnStartSubscribe = document.getElementById('btnStartSubscribe');
        btnStartSubscribe?.addEventListener('click', () => this.showMandatorySubModal(null, true));

        // زر دعوة الأصدقاء في شاشة البداية والمتجر
        const btnStartReferral = document.getElementById('btnStartReferral');
        btnStartReferral?.addEventListener('click', () => {
            if (window.referralManager) window.referralManager.openModal();
        });

        const btnStoreOpenReferral = document.getElementById('btnStoreOpenReferral');
        btnStoreOpenReferral?.addEventListener('click', () => {
            if (window.referralManager) window.referralManager.openModal();
        });

        // زر لوحة تحكم الإدارة في شاشة البداية
        const btnStartAdmin = document.getElementById('btnStartAdmin');
        btnStartAdmin?.addEventListener('click', () => {
            const adminPinInp = document.getElementById('adminPinInput');
            if (adminPinInp) adminPinInp.value = '';

            if (window.adminManager && window.adminManager.isLoggedIn) {
                const adminPanel = document.getElementById('adminPanelModal');
                if (adminPanel) adminPanel.style.display = 'flex';
                window.adminManager.renderOrders();
                window.adminManager.renderVault();
                this.populateAdminForm();
            } else {
                const pinModal = document.getElementById('adminPinModal');
                if (pinModal) pinModal.style.display = 'flex';
            }
        });

        // زر إعادة تعيين اشتراك المدير للتجربة
        const btnResetAdminSub = document.getElementById('btnResetAdminSub');
        btnResetAdminSub?.addEventListener('click', () => this.resetMySubscription());
    }

    showAboutModal() {
        const modal = document.getElementById('aboutUsModal');
        if (modal) modal.style.display = 'flex';
    }

    // ==========================================
    // 3. نافذة مواقع التواصل (Social Media Modal)
    // ==========================================
    showSocialModal() {
        this.updateSocialLinks();
        const modal = document.getElementById('socialMediaModal');
        if (modal) modal.style.display = 'flex';
    }

    updateSocialLinks() {
        const cfg = window.adminManager?.config?.socialLinks || {};
        const links = {
            socialLinkYoutube: (cfg.youtube && cfg.youtube !== 'https://www.youtube.com' && cfg.youtube !== 'https://www.youtube.com/@ChickenGameOfficial') ? cfg.youtube : 'https://www.youtube.com/c/FORJAmoutawakil',
            socialLinkTelegram: cfg.telegram || 'https://t.me',
            socialLinkTiktok: cfg.tiktok || 'https://www.tiktok.com',
            socialLinkFacebook: cfg.facebook || 'https://www.facebook.com',
            socialLinkInstagram: cfg.instagram || 'https://www.instagram.com',
            socialLinkDiscord: cfg.discord || 'https://discord.com'
        };

        for (const [id, url] of Object.entries(links)) {
            const el = document.getElementById(id);
            if (el) el.href = url;
        }
    }

    // ==========================================
    // 4. شرط الاشتراك الإلزامي في القناة (Mandatory Sub)
    // ==========================================
    initMandatorySub() {
        const btnMandatoryGoSub = document.getElementById('btnMandatoryGoSub');
        const btnMandatoryVerify = document.getElementById('btnMandatoryVerify');
        const mandatorySubProgress = document.getElementById('mandatorySubProgress');
        const mandatoryProgressBar = document.getElementById('mandatoryProgressBar');
        const mandatoryStatusText = document.getElementById('mandatoryStatusText');
        const mandatorySubModal = document.getElementById('mandatorySubModal');
        const btnCloseMandatorySub = document.getElementById('btnCloseMandatorySub');

        // تحديث بيانات القناة المعروضة فور تحميل الصفحة
        this.updateChannelDisplay();

        // التأكد من وجود الأزرار في الصفحة
        if (!btnMandatoryGoSub || !btnMandatoryVerify) {
            return;
        }

        // إخفاء النافذة مبدئياً
        if (mandatorySubModal) {
            mandatorySubModal.style.display = 'none';
        }

        // 1. عند النقر على الزر الأول (#btnMandatoryGoSub):
        btnMandatoryGoSub.addEventListener('click', () => {
            let cfg = window.adminManager?.config || window.adminConfig;
            if (!cfg) {
                try {
                    const saved = localStorage.getItem('chicken_admin_config');
                    if (saved) cfg = JSON.parse(saved);
                } catch (e) {}
            }
            if (cfg?.channelUrl === 'https://www.youtube.com/@ChickenGameOfficial') {
                cfg.channelUrl = 'https://www.youtube.com/c/FORJAmoutawakil';
            }
            let channelUrl = cfg?.channelUrl || 'https://www.youtube.com/c/FORJAmoutawakil';
            if (!/^https?:\/\//i.test(channelUrl)) {
                channelUrl = 'https://' + channelUrl;
            }

            // فتح رابط القناة في نافذة جديدة
            window.open(channelUrl, '_blank');

            // تعطيل الزر الأول
            btnMandatoryGoSub.disabled = true;

            // إظهار صندوق التحقق
            if (mandatorySubProgress) {
                mandatorySubProgress.style.display = 'block';
            }

            // تعطيل زر التحقق أثناء العد التنازلي
            btnMandatoryVerify.disabled = true;
            btnMandatoryVerify.setAttribute('disabled', 'true');
            btnMandatoryVerify.style.cursor = 'not-allowed';
            btnMandatoryVerify.style.opacity = '0.6';

            // عداد 10 ثوانٍ للتحقق من الاشتراك
            let timeLeft = 10;
            const totalTime = 10;

            if (mandatoryProgressBar) {
                mandatoryProgressBar.style.width = '0%';
                mandatoryProgressBar.style.transition = 'width 0.4s ease';
            }
            if (mandatoryStatusText) {
                mandatoryStatusText.innerText = `جاري التحقق من الاشتراك في القناة... (${timeLeft} ثوانٍ متبقية) ⏳`;
            }

            if (this.countdownTimer) {
                clearInterval(this.countdownTimer);
                this.countdownTimer = null;
            }

            this.countdownTimer = setInterval(() => {
                timeLeft--;
                const percent = Math.min(100, Math.round(((totalTime - timeLeft) / totalTime) * 100));

                if (mandatoryProgressBar) {
                    mandatoryProgressBar.style.width = `${percent}%`;
                }

                if (timeLeft > 0) {
                    if (mandatoryStatusText) {
                        mandatoryStatusText.innerText = `جاري التحقق من الاشتراك في القناة... (${timeLeft} ثوانٍ متبقية) ⏳`;
                    }
                } else {
                    clearInterval(this.countdownTimer);
                    this.countdownTimer = null;

                    if (mandatoryStatusText) {
                        mandatoryStatusText.innerText = 'تم التحقق بنجاح! اضغط على الزر أدناه لتفعيل اللعبة ✅';
                    }
                    if (mandatoryProgressBar) {
                        mandatoryProgressBar.style.width = '100%';
                    }

                    btnMandatoryVerify.disabled = false;
                    btnMandatoryVerify.removeAttribute('disabled');
                    btnMandatoryVerify.style.cursor = 'pointer';
                    btnMandatoryVerify.style.opacity = '1';
                }
            }, 1000);
        });

        // 2. عند النقر على الزر الثاني (#btnMandatoryVerify):
        btnMandatoryVerify.addEventListener('click', () => {
            if (this.countdownTimer) {
                clearInterval(this.countdownTimer);
                this.countdownTimer = null;
            }

            // إخفاء نافذة الاشتراك
            if (mandatorySubModal) {
                mandatorySubModal.style.display = 'none';
            }

            // حفظ حالة الاشتراك الدائم
            localStorage.setItem('hasSubscribed', 'true');
            localStorage.setItem('chicken_mandatory_subscribed', 'true');

            if (window.soundEngine && window.soundEngine.playItemPickup) {
                window.soundEngine.playItemPickup();
            }

            // تفعيل اللعبة والبدء فوراً
            if (this.onSubSuccessCallback) {
                const cb = this.onSubSuccessCallback;
                this.onSubSuccessCallback = null;
                cb();
            } else if (window.game) {
                if (window.game.state === 'START_MENU') {
                    window.game.startLevel(0);
                } else if (window.game.state === 'PAUSED') {
                    window.game.togglePause();
                } else if (window.game.state !== 'PLAYING') {
                    window.game.startLevel(window.game.currentLevelIndex || 0);
                }
            }
        });

        // زر إغلاق نافذة الاشتراك
        if (btnCloseMandatorySub) {
            btnCloseMandatorySub.addEventListener('click', () => {
                if (this.countdownTimer) {
                    clearInterval(this.countdownTimer);
                    this.countdownTimer = null;
                }
                if (mandatorySubModal) {
                    mandatorySubModal.style.display = 'none';
                }
            });
        }
    }

    // هل اللاعب مستوفٍ لشرط الاشتراك الإلزامي؟
    canPlay() {
        if (window.adminManager?.config && window.adminManager.config.mandatorySubEnabled === false) {
            return true;
        }
        return localStorage.getItem('hasSubscribed') === 'true' || 
               localStorage.getItem('chicken_mandatory_subscribed') === 'true';
    }

    // تحديث بطاقة ومعلومات القناة المعروضة للجمهور
    updateChannelDisplay() {
        let cfg = window.adminManager?.config || window.adminConfig;
        if (!cfg) {
            try {
                const saved = localStorage.getItem('chicken_admin_config');
                if (saved) cfg = JSON.parse(saved);
            } catch (e) {}
        }
        if (cfg?.channelUrl === 'https://www.youtube.com/@ChickenGameOfficial') {
            cfg.channelUrl = 'https://www.youtube.com/c/FORJAmoutawakil';
        }
        const channelName = cfg?.channelName || 'القناة الرسمية للعبة كوكو والأفخاخ 🐔';
        const channelType = cfg?.channelType || 'youtube';
        let channelUrl = cfg?.channelUrl || 'https://www.youtube.com/c/FORJAmoutawakil';
        if (!/^https?:\/\//i.test(channelUrl)) {
            channelUrl = 'https://' + channelUrl;
        }

        const nameEl = document.getElementById('mandatoryChannelName');
        const badgeEl = document.getElementById('mandatoryChannelBadge');
        const iconEl = document.getElementById('mandatoryChannelIcon');
        const urlEl = document.getElementById('mandatoryChannelUrlDisplay');

        if (nameEl) nameEl.innerText = channelName;
        if (badgeEl) {
            badgeEl.innerText = channelType === 'telegram' ? 'قناة التليجرام الرسمية ✈️' : 'قناة اليوتيوب الرسمية 🔴';
        }
        if (iconEl) {
            iconEl.innerText = channelType === 'telegram' ? '✈️' : '📺';
        }
        if (urlEl) {
            urlEl.href = channelUrl;
            urlEl.innerText = channelUrl;
        }
    }

    showMandatorySubModal(onSuccessCallback = null, forceOpen = false) {
        this.onSubSuccessCallback = onSuccessCallback;

        // إذا كان الاستدعاء من محاولة بدء اللعب واللاعب مشترك مسبقاً، نسمح له باللعب فوراً
        if (!forceOpen && this.canPlay()) {
            if (onSuccessCallback) onSuccessCallback();
            return;
        }

        const btnMandatoryGoSub = document.getElementById('btnMandatoryGoSub');
        const btnMandatoryVerify = document.getElementById('btnMandatoryVerify');
        const mandatorySubProgress = document.getElementById('mandatorySubProgress');
        const mandatoryProgressBar = document.getElementById('mandatoryProgressBar');
        const mandatoryStatusText = document.getElementById('mandatoryStatusText');
        const mandatorySubModal = document.getElementById('mandatorySubModal');

        // تحديث معلومات ورابط القناة من الإعدادات المحفوظة
        this.updateChannelDisplay();

        const isAlreadySub = localStorage.getItem('hasSubscribed') === 'true' || 
                             localStorage.getItem('chicken_mandatory_subscribed') === 'true';

        if (isAlreadySub && forceOpen) {
            // إذا فتح المستخدم النافذة يدوياً وهو مشترك بالفعل
            if (btnMandatoryGoSub) {
                btnMandatoryGoSub.disabled = false;
                btnMandatoryGoSub.innerText = '🔗 فتح وزيارة قناتنا 🔔';
            }
            if (btnMandatoryVerify) {
                btnMandatoryVerify.disabled = false;
                btnMandatoryVerify.removeAttribute('disabled');
                btnMandatoryVerify.style.cursor = 'pointer';
                btnMandatoryVerify.style.opacity = '1';
                btnMandatoryVerify.innerText = '✅ اشتراكك مفعل بالفعل! انقر للبدء باللعب';
            }
            if (mandatorySubProgress) {
                mandatorySubProgress.style.display = 'block';
            }
            if (mandatoryProgressBar) {
                mandatoryProgressBar.style.width = '100%';
            }
            if (mandatoryStatusText) {
                mandatoryStatusText.innerText = 'أنت مشترك بالفعل وتم التحقق من الشرط الإلزامي بنجاح! 🎉';
            }
        } else {
            // إعادة ضبط الأزرار للحالة الأساسية للتحقق
            if (btnMandatoryGoSub) {
                btnMandatoryGoSub.disabled = false;
                btnMandatoryGoSub.innerText = '1️⃣ اضغط هنا للاشتراك في القناة الرسمية 🔔';
            }
            if (btnMandatoryVerify) {
                btnMandatoryVerify.disabled = true;
                btnMandatoryVerify.setAttribute('disabled', 'true');
                btnMandatoryVerify.style.cursor = 'not-allowed';
                btnMandatoryVerify.style.opacity = '0.6';
                btnMandatoryVerify.innerText = '2️⃣ اضغط هنا للتحقق وتفعيل اللعبة فوراً (بعد الاشتراك) ✅';
            }
            if (mandatorySubProgress) {
                mandatorySubProgress.style.display = 'none';
            }
            if (mandatoryProgressBar) {
                mandatoryProgressBar.style.width = '0%';
            }
            if (mandatoryStatusText) {
                mandatoryStatusText.innerText = 'جاري التحقق من الاشتراك... ⏳';
            }
        }

        if (mandatorySubModal) {
            mandatorySubModal.style.display = 'flex';
        }
    }

    // ==========================================
    // 5. نظام منع حاجب الإعلانات (Anti-AdBlock)
    // ==========================================
    initAntiAdblock() {
        const btnRecheck = document.getElementById('btnAdblockRecheck');
        btnRecheck?.addEventListener('click', async () => {
            btnRecheck.innerText = 'جاري الفحص... ⏳';
            btnRecheck.disabled = true;
            const blocked = await this.detectAdblock();
            btnRecheck.disabled = false;

            if (!blocked) {
                const modal = document.getElementById('adblockModal');
                if (modal) modal.style.display = 'none';
                this.isAdblockActive = false;
                alert('✅ شكراً لك! تم تعطيل مانع الإعلانات بنجاح. استمتع باللعبة!');
            } else {
                btnRecheck.innerText = '🔄 إعادة فحص مانع الإعلانات';
                alert('⚠️ مانع الإعلانات ما زال مفعلاً! يرجى تعطيله على هذا الموقع ثم المحاولة مجدداً.');
            }
        });

        // الفحص الأولي بعد تحميل الصفحة
        setTimeout(() => {
            this.checkAndEnforceAdblock();
        }, 1500);

        // فحص دوري خفيف كل 4 ثوانٍ
        this.adblockCheckInterval = setInterval(() => {
            this.checkAndEnforceAdblock();
        }, 4000);
    }

    async detectAdblock() {
        // فحص إذا كان معطلاً في لوحة المشرف
        if (window.adminManager?.config && window.adminManager.config.antiAdblockEnabled === false) {
            return false;
        }

        let isBlocked = false;

        // الطريقة الأولى: عنصر طُعم (Bait HTML Element)
        const bait = document.createElement('div');
        bait.innerHTML = '&nbsp;';
        bait.className = 'adsbox pub_300x250 pub_300x250m pub_728x90 text-ad textAd text_ad text_ads text-ads text-ad-links ad-banner ad-unit banner-ad advertisement';
        bait.style.cssText = 'position: absolute !important; left: -9999px !important; top: -9999px !important; width: 1px !important; height: 1px !important; pointer-events: none !important;';
        document.body.appendChild(bait);

        const isHidden = (
            bait.offsetParent === null ||
            bait.offsetHeight === 0 ||
            bait.offsetLeft === 0 ||
            bait.offsetTop === 0 ||
            bait.offsetWidth === 0 ||
            bait.clientHeight === 0 ||
            bait.clientWidth === 0
        );

        const computed = window.getComputedStyle(bait);
        if (isHidden || computed.display === 'none' || computed.visibility === 'hidden') {
            isBlocked = true;
        }

        if (bait.parentNode) {
            bait.parentNode.removeChild(bait);
        }

        // الطريقة الثانية: محاولة جلب رابط إعلان نموذجي
        if (!isBlocked) {
            try {
                const testUrl = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
                await fetch(new Request(testUrl, { mode: 'no-cors' }));
            } catch (err) {
                // مانع الإعلانات يقطع الاتصال ويولد خطأ Failed to fetch
                isBlocked = true;
            }
        }

        return isBlocked;
    }

    async checkAndEnforceAdblock() {
        const isBlocked = await this.detectAdblock();
        this.isAdblockActive = isBlocked;
        const modal = document.getElementById('adblockModal');

        if (modal) {
            if (isBlocked) {
                modal.style.display = 'flex';
                // إيقاف مؤقت للعبة إذا كانت نشطة
                if (window.game && window.game.state === 'PLAYING') {
                    window.game.state = 'PAUSED';
                }
            } else if (modal.style.display === 'flex' && !isBlocked) {
                modal.style.display = 'none';
            }
        }
    }

    // ==========================================
    // إدارة لوحة تحكم المشرف (Admin Helpers)
    // ==========================================
    populateAdminForm() {
        let cfg = window.adminManager?.config || window.adminConfig;
        if (!cfg) {
            try {
                const saved = localStorage.getItem('chicken_admin_config');
                if (saved) cfg = JSON.parse(saved);
            } catch (e) {}
        }
        cfg = cfg || {};

        const chkMandatory = document.getElementById('adminMandatorySubChk');
        const inpChannelName = document.getElementById('adminChannelNameInp');
        const inpChannelUrl = document.getElementById('adminChannelUrlInp');
        const selChannelType = document.getElementById('adminChannelTypeSel');
        const chkAntiAdblock = document.getElementById('adminAntiAdblockChk');

        const inpYt = document.getElementById('adminSocialYoutube');
        const inpTg = document.getElementById('adminSocialTelegram');
        const inpTt = document.getElementById('adminSocialTiktok');
        const inpFb = document.getElementById('adminSocialFacebook');
        const inpIg = document.getElementById('adminSocialInstagram');
        const inpDc = document.getElementById('adminSocialDiscord');

        if (chkMandatory) chkMandatory.checked = (cfg.mandatorySubEnabled !== false);
        if (inpChannelName) inpChannelName.value = cfg.channelName || 'القناة الرسمية للعبة كوكو والأفخاخ 🐔';
        if (cfg?.channelUrl === 'https://www.youtube.com/@ChickenGameOfficial') {
            cfg.channelUrl = 'https://www.youtube.com/c/FORJAmoutawakil';
        }
        if (inpChannelUrl) inpChannelUrl.value = cfg.channelUrl || 'https://www.youtube.com/c/FORJAmoutawakil';
        if (selChannelType) selChannelType.value = cfg.channelType || 'youtube';
        if (chkAntiAdblock) chkAntiAdblock.checked = (cfg.antiAdblockEnabled !== false);

        const s = cfg.socialLinks || {};
        if (inpYt) inpYt.value = (s.youtube && s.youtube !== 'https://www.youtube.com' && s.youtube !== 'https://www.youtube.com/@ChickenGameOfficial') ? s.youtube : 'https://www.youtube.com/c/FORJAmoutawakil';
        if (inpTg) inpTg.value = s.telegram || 'https://t.me';
        if (inpTt) inpTt.value = s.tiktok || 'https://www.tiktok.com';
        if (inpFb) inpFb.value = s.facebook || 'https://www.facebook.com';
        if (inpIg) inpIg.value = s.instagram || 'https://www.instagram.com';
        if (inpDc) inpDc.value = s.discord || 'https://discord.com';
    }

    saveAdminForm() {
        let admin = window.adminManager;
        let cfg = admin ? admin.config : (window.adminConfig || {});

        const chkMandatory = document.getElementById('adminMandatorySubChk');
        const inpChannelName = document.getElementById('adminChannelNameInp');
        const inpChannelUrl = document.getElementById('adminChannelUrlInp');
        const selChannelType = document.getElementById('adminChannelTypeSel');
        const chkAntiAdblock = document.getElementById('adminAntiAdblockChk');

        const inpYt = document.getElementById('adminSocialYoutube');
        const inpTg = document.getElementById('adminSocialTelegram');
        const inpTt = document.getElementById('adminSocialTiktok');
        const inpFb = document.getElementById('adminSocialFacebook');
        const inpIg = document.getElementById('adminSocialInstagram');
        const inpDc = document.getElementById('adminSocialDiscord');

        if (chkMandatory) cfg.mandatorySubEnabled = chkMandatory.checked;
        if (inpChannelName) cfg.channelName = inpChannelName.value.trim() || 'القناة الرسمية للعبة كوكو والأفخاخ 🐔';

        let url = inpChannelUrl ? inpChannelUrl.value.trim() : '';
        if (url) {
            // تصحيح الرابط تلقائياً إذا أدخل المستخدم @username أو رابط بدون https://
            if (url.startsWith('@')) {
                url = (selChannelType && selChannelType.value === 'telegram')
                    ? `https://t.me/${url.substring(1)}`
                    : `https://www.youtube.com/${url}`;
            } else if (!/^https?:\/\//i.test(url)) {
                url = 'https://' + url;
            }
            cfg.channelUrl = url;
            if (inpChannelUrl) inpChannelUrl.value = url;
        } else {
            cfg.channelUrl = (selChannelType && selChannelType.value === 'telegram')
                ? 'https://t.me/ChickenGameOfficial'
                : 'https://www.youtube.com/c/FORJAmoutawakil';
        }

        if (selChannelType) cfg.channelType = selChannelType.value;
        if (chkAntiAdblock) cfg.antiAdblockEnabled = chkAntiAdblock.checked;

        cfg.socialLinks = {
            youtube: inpYt?.value.trim() || '',
            telegram: inpTg?.value.trim() || '',
            tiktok: inpTt?.value.trim() || '',
            facebook: inpFb?.value.trim() || '',
            instagram: inpIg?.value.trim() || '',
            discord: inpDc?.value.trim() || ''
        };

        if (admin) {
            admin.config = cfg;
            admin.saveAdminConfig(cfg);
            admin.saveData();
        } else {
            try {
                localStorage.setItem('chicken_admin_config', JSON.stringify(cfg));
            } catch (e) {}
            window.adminConfig = cfg;
        }

        this.updateSocialLinks();
        this.updateChannelDisplay();

        const alertEl = document.getElementById('adminSocialSaveAlert');
        if (alertEl) {
            alertEl.innerText = '✅ تم حفظ رابط وإعدادات القناة الإلزامية ومواقع التواصل بنجاح!';
            alertEl.style.display = 'block';
            setTimeout(() => { if (alertEl) alertEl.style.display = 'none'; }, 4000);
        }

        alert('✅ تم حفظ رابط وإعدادات القناة الإلزامية ومواقع التواصل بنجاح!\nالقناة: ' + cfg.channelName + '\nالرابط: ' + cfg.channelUrl);
    }

    // دوال للتوافق مع أي استدعاءات سابقة في الكود
    saveAdminConfig() {
        return this.saveAdminForm();
    }

    resetSubscriptionForTesting() {
        return this.resetMySubscription();
    }

    resetMySubscription() {
        if (this.countdownTimer) {
            clearInterval(this.countdownTimer);
            this.countdownTimer = null;
        }
        localStorage.removeItem('hasSubscribed');
        localStorage.removeItem('chicken_mandatory_subscribed');

        const mandatorySubModal = document.getElementById('mandatorySubModal');
        if (mandatorySubModal) {
            mandatorySubModal.style.display = 'none';
        }

        const alertEl = document.getElementById('adminSocialSaveAlert');
        if (alertEl) {
            alertEl.innerText = '🔄 تم إعادة تعيين اشتراكك بنجاح للتجربة!';
            alertEl.style.display = 'block';
            setTimeout(() => { if (alertEl) alertEl.style.display = 'none'; }, 4000);
        }

        alert('🔄 تم إلغاء حالة اشتراكك بنجاح!\nيمكنك الآن تجربة نافذة شرط الاشتراك الإلزامي من جديد كما يراها أي زائر جديد للعبة.');
    }

}

// إنشاء الكائن العام
window.featuresManager = new FeaturesManager();
