/**
 * =========================================================================
 * نظام الإحالة ودعوة الأصدقاء (Referral & Invite Friends System)
 * لعبة مغامرة كوكو والأفخاخ (Chicken Trap Adventure)
 * =========================================================================
 * 1. توليد كود ورابط إحالة فريد ودائم لكل لاعب (?ref=COCO-XXXXX)
 * 2. واجهة نافذة تفاعلية منسقة لنسخ الرابط بضغطة زر مع أزرار مشاركة سريعة
 * 3. منح مكافأة 500 نقطة للاعب الجديد المنضم، و500 نقطة للاعب الداعي
 * 4. مزامنة فورية ومحلية عبر localStorage و BroadcastChannel
 * 5. إمكانية إدخال كود صديق يدوياً داخل النافذة
 */

class ReferralManager {
    constructor() {
        this.rewardPerInvite = 500;
        this.welcomeBonus = 500;
        this.playerId = this.getOrCreatePlayerId();
        this.stats = this.loadStats();
        this.broadcastChannel = null;
        this.toastTimer = null;

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        this.initBroadcastChannel();
        this.initEventListeners();
        this.checkUrlReferral();
        this.syncPendingRewards();
    }

    /**
     * استرجاع أو توليد كود إحالة فريد خاص باللاعب
     */
    getOrCreatePlayerId() {
        let id = localStorage.getItem('chicken_referral_player_id');
        if (!id) {
            const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
            let randomPart = '';
            for (let i = 0; i < 5; i++) {
                randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            id = `COCO-${randomPart}`;
            localStorage.setItem('chicken_referral_player_id', id);
        }
        return id;
    }

    /**
     * توليد رابط الإحالة الكامل الصالح للمشاركة
     */
    getReferralLink() {
        try {
            const origin = window.location.origin;
            const pathname = window.location.pathname;
            if (origin && origin !== 'null') {
                return `${origin}${pathname}?ref=${this.playerId}`;
            }
            return `${window.location.href.split('?')[0]}?ref=${this.playerId}`;
        } catch (e) {
            return `?ref=${this.playerId}`;
        }
    }

    /**
     * استرجاع إحصائيات الإحالة الخاصة باللاعب من الذاكرة المحلية
     */
    loadStats() {
        const defaults = {
            invitedCount: 0,
            totalPointsEarned: 0,
            friends: [],
            claimedWelcomeBonus: false,
            referredBy: null
        };
        try {
            const saved = localStorage.getItem('chicken_referral_stats');
            return saved ? Object.assign(defaults, JSON.parse(saved)) : defaults;
        } catch (e) {
            return defaults;
        }
    }

    /**
     * حفظ الإحصائيات في الذاكرة المحلية
     */
    saveStats() {
        try {
            localStorage.setItem('chicken_referral_stats', JSON.stringify(this.stats));
        } catch (e) {
            console.warn('تعذر حفظ إحصائيات الإحالة:', e);
        }
    }

    /**
     * قناة البث المباشر بين التبويبات والمزامنة اللحظية
     */
    initBroadcastChannel() {
        if ('BroadcastChannel' in window) {
            try {
                this.broadcastChannel = new BroadcastChannel('chicken_referral_sync');
                this.broadcastChannel.onmessage = (event) => {
                    const data = event.data;
                    if (data && data.type === 'NEW_REFERRAL' && data.referrerId === this.playerId) {
                        this.stats.invitedCount += 1;
                        this.stats.totalPointsEarned += data.points;
                        if (!this.stats.friends) this.stats.friends = [];
                        this.stats.friends.push({ id: data.friendId, date: new Date().toISOString() });
                        this.saveStats();
                        this.grantPoints(data.points, 'مكافأة فورية لدعوة صديق جديد!');
                        this.showToast(`🎉 رائع! انضم صديق جديد للتو عبر رابطك وحصلت على ${data.points} نقطة فوراً! ⭐`, 'success');
                        this.updateUI();
                    }
                };
            } catch (e) {}
        }
    }

    /**
     * فحص رابط الصفحة إذا كان الزائر قد دخل عبر رابط إحالة ?ref=...
     */
    checkUrlReferral() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const refParam = urlParams.get('ref');
            if (!refParam) return;

            const refCode = refParam.trim().toUpperCase();

            // منع الإحالة الذاتية
            if (refCode === this.playerId.toUpperCase()) {
                console.log('ℹ️ لقد قمت بفتح رابط الإحالة الخاص بك.');
                this.cleanUrlParam();
                return;
            }

            // فحص هل استفاد اللاعب من مكافأة ترحيبية مسبقاً
            if (this.stats.claimedWelcomeBonus || this.stats.referredBy) {
                console.log('ℹ️ تم تسجيل كود دعوة مسبقاً لهذا اللاعب.');
                this.cleanUrlParam();
                return;
            }

            // تفعيل المكافأة فوراً
            this.applyReferral(refCode, 'URL_LINK');
            this.cleanUrlParam();
        } catch (e) {
            console.warn('خطأ أثناء معالجة رابط الإحالة:', e);
        }
    }

    /**
     * إزالة وسام ?ref= من شريط العنوان بعد المعالجة دون إعادة تحميل الصفحة
     */
    cleanUrlParam() {
        try {
            if (window.history && window.history.replaceState) {
                const cleanUrl = window.location.origin + window.location.pathname;
                window.history.replaceState({}, document.title, cleanUrl);
            }
        } catch (e) {}
    }

    /**
     * تطبيق المكافأة للطرفين (اللاعب الجديد + اللاعب الداعي)
     */
    applyReferral(refCode, source = 'URL_LINK') {
        // 1. تسجيل حالة اللاعب الجديد
        this.stats.claimedWelcomeBonus = true;
        this.stats.referredBy = refCode;
        this.saveStats();

        // 2. منح اللاعب الجديد مكافأة ترحيبية 500 نقطة
        this.grantPoints(this.welcomeBonus, `هدية ترحيبية لدعوة الصديق (${refCode})`);

        // 3. قيد المكافأة في سجل الإحالات المشترك للاعب الداعي
        let ledger = {};
        try {
            const saved = localStorage.getItem('chicken_referral_ledger');
            if (saved) ledger = JSON.parse(saved);
        } catch (e) {}

        if (!ledger[refCode]) {
            ledger[refCode] = { count: 0, points: 0, pendingPoints: 0, history: [] };
        }
        ledger[refCode].count = (ledger[refCode].count || 0) + 1;
        ledger[refCode].points = (ledger[refCode].points || 0) + this.rewardPerInvite;
        ledger[refCode].pendingPoints = (ledger[refCode].pendingPoints || 0) + this.rewardPerInvite;
        ledger[refCode].history.push({
            friendId: this.playerId,
            date: new Date().toISOString(),
            source: source
        });
        localStorage.setItem('chicken_referral_ledger', JSON.stringify(ledger));

        // 4. إشعار مباشر عبر BroadcastChannel إذا كان الداعي يفتح اللعبة في تبويب آخر
        if (this.broadcastChannel) {
            try {
                this.broadcastChannel.postMessage({
                    type: 'NEW_REFERRAL',
                    referrerId: refCode,
                    friendId: this.playerId,
                    points: this.rewardPerInvite
                });
            } catch (e) {}
        }

        // 5. إشعار ترحيبي للاعب الجديد
        setTimeout(() => {
            this.showToast(`🎉 مرحباً بك يا بطل! انضممت عبر دعوة صديقك (${refCode}) وحصلت على ${this.welcomeBonus} نقطة هدية ترحيبية! 🎁`, 'success');
        }, 800);

        this.updateUI();
    }

    /**
     * مزامنة مكافآت الإحالة المعلقة لصاحب الكود عند فتحه اللعبة
     */
    syncPendingRewards() {
        try {
            let ledger = {};
            const saved = localStorage.getItem('chicken_referral_ledger');
            if (saved) ledger = JSON.parse(saved);

            const myData = ledger[this.playerId];
            if (myData && myData.pendingPoints > 0) {
                const earned = myData.pendingPoints;
                const newFriends = Math.max(1, Math.round(earned / this.rewardPerInvite));

                this.stats.invitedCount += newFriends;
                this.stats.totalPointsEarned += earned;
                this.saveStats();

                myData.pendingPoints = 0;
                localStorage.setItem('chicken_referral_ledger', JSON.stringify(ledger));

                this.grantPoints(earned, `مكافأة دعوة ${newFriends} صديق جديد!`);

                setTimeout(() => {
                    this.showToast(`🎉 رائع! انضم ${newFriends} صديق عبر رابط إحالتك وحصلت على ${earned} نقطة إضافية! 🎁`, 'success');
                }, 1200);

                this.updateUI();
            }
        } catch (e) {
            console.warn('خطأ أثناء مزامنة الإحالات:', e);
        }
    }

    /**
     * تفعيل كود صديق يدوياً عبر النافذة
     */
    claimFriendCode(inputCode) {
        if (!inputCode) {
            this.showClaimStatus('⚠️ يرجى إدخال كود الدعوة أولاً.', false);
            return;
        }

        const code = inputCode.trim().toUpperCase();

        if (code === this.playerId.toUpperCase()) {
            this.showClaimStatus('❌ لا يمكنك إدخال كود الدعوة الخاص بك!', false);
            return;
        }

        if (this.stats.claimedWelcomeBonus || this.stats.referredBy) {
            this.showClaimStatus(`ℹ️ لقد قمت بتفعيل كود دعوة مسبقاً (${this.stats.referredBy}).`, false);
            return;
        }

        if (!/^COCO-[A-Z0-9]{3,8}$/i.test(code)) {
            this.showClaimStatus('⚠️ صيغة الكود غير صحيحة، مثال: COCO-XXXXX', false);
            return;
        }

        // تطبيق المكافأة
        this.applyReferral(code, 'MANUAL_CODE');
        this.showClaimStatus(`✅ تم تفعيل الكود بنجاح وحصلت على ${this.welcomeBonus} نقطة هدية! 🎉`, true);
    }

    showClaimStatus(msg, isSuccess) {
        const el = document.getElementById('refClaimStatusMsg');
        if (el) {
            el.innerText = msg;
            el.style.color = isSuccess ? '#81c784' : '#ef5350';
            el.style.display = 'block';
            if (isSuccess) {
                const inp = document.getElementById('refFriendCodeInput');
                const btn = document.getElementById('btnClaimFriendCode');
                if (inp) inp.disabled = true;
                if (btn) btn.disabled = true;
            }
        }
    }

    /**
     * إضافة النقاط لرصيد اللاعب وحفظها وتحديث الـ HUD والـ WAF
     */
    grantPoints(amount, reason = '') {
        const doGrant = () => {
            if (window.game) {
                window.game.score = (window.game.score || 0) + amount;

                // تحديث وتأمين النقاط مع جدار الحماية WAF
                if (window.securityWAF) {
                    window.securityWAF.lastValidScore = window.game.score;
                    window.securityWAF.lastScoreHash = window.securityWAF.generateScoreHash(window.game.score);
                }

                // حفظ النقاط في تقدم اللعبة
                if (typeof window.game.saveProgress === 'function') {
                    window.game.saveProgress();
                }

                // تحديث عدادات النقاط على الشاشة
                const hudScore = document.getElementById('hudScore');
                if (hudScore) hudScore.innerText = window.game.score.toLocaleString();

                const storeScore = document.getElementById('voucherStorePlayerScore');
                if (storeScore) storeScore.innerText = window.game.score.toLocaleString();

                // تحديث لوحة الفائزين والمكافآت بنقاط الإحالة الجديدة
                if (window.winnersBoardManager && typeof window.winnersBoardManager.updatePlayerScore === 'function') {
                    window.winnersBoardManager.updatePlayerScore(window.game.score, true);
                }

                // صوت استلام المكافأة
                if (window.soundEngine && typeof window.soundEngine.playItemPickup === 'function') {
                    window.soundEngine.playItemPickup();
                }
            } else {
                // حفظ النقاط في التقدم إن لم يكن الكائن جاهزاً
                try {
                    const saved = localStorage.getItem('chicken_game_progress');
                    let data = saved ? JSON.parse(saved) : {};
                    data.score = (data.score || 0) + amount;
                    localStorage.setItem('chicken_game_progress', JSON.stringify(data));
                } catch (e) {}
            }
        };

        if (window.game) {
            doGrant();
        } else {
            window.addEventListener('DOMContentLoaded', () => setTimeout(doGrant, 150));
        }
    }

    /**
     * فتح نافذة نظام الإحالة
     */
    openModal() {
        this.updateUI();
        const modal = document.getElementById('referralModal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    /**
     * إغلاق نافذة نظام الإحالة
     */
    closeModal() {
        const modal = document.getElementById('referralModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    /**
     * تحديث بيانات واجهة النافذة
     */
    updateUI() {
        const codeDisplay = document.getElementById('refPlayerCodeDisplay');
        if (codeDisplay) codeDisplay.innerText = this.playerId;

        const linkInput = document.getElementById('refLinkInput');
        if (linkInput) linkInput.value = this.getReferralLink();

        const countDisplay = document.getElementById('refStatsFriendsCount');
        if (countDisplay) countDisplay.innerText = (this.stats.invitedCount || 0).toLocaleString();

        const pointsDisplay = document.getElementById('refStatsTotalPoints');
        if (pointsDisplay) pointsDisplay.innerText = (this.stats.totalPointsEarned || 0).toLocaleString();

        // حالة إدخال كود الصديق
        const friendInp = document.getElementById('refFriendCodeInput');
        const claimBtn = document.getElementById('btnClaimFriendCode');
        const claimMsg = document.getElementById('refClaimStatusMsg');

        if (this.stats.claimedWelcomeBonus || this.stats.referredBy) {
            if (friendInp) {
                friendInp.value = this.stats.referredBy || 'تم التفعيل';
                friendInp.disabled = true;
            }
            if (claimBtn) {
                claimBtn.disabled = true;
                claimBtn.innerText = 'مفعل مسبقاً ✅';
                claimBtn.style.opacity = '0.7';
            }
            if (claimMsg) {
                claimMsg.innerText = `✅ تم تفعيل مكافأة الانضمام عبر الصديق (${this.stats.referredBy || ''})`;
                claimMsg.style.color = '#81c784';
                claimMsg.style.display = 'block';
            }
        }
    }

    /**
     * نسخ رابط الإحالة بضغطة زر واحدة (One-Click Copy Link)
     */
    copyLink() {
        const link = this.getReferralLink();
        const btn = document.getElementById('btnCopyRefLink');

        const onSuccess = () => {
            if (btn) {
                const oldText = btn.innerHTML;
                btn.innerHTML = '✅ تم النسخ!';
                btn.style.background = 'linear-gradient(135deg, #00c853, #2e7d32)';
                setTimeout(() => {
                    btn.innerHTML = oldText;
                    btn.style.background = 'linear-gradient(135deg, #ab47bc, #7b1fa2)';
                }, 2200);
            }
            this.showToast('📋 تم نسخ رابط الإحالة الخاص بك بنجاح! شاركه الآن مع أصدقائك.', 'success');
            if (window.soundEngine && typeof window.soundEngine.playItemPickup === 'function') {
                window.soundEngine.playItemPickup();
            }
        };

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(link).then(onSuccess).catch(() => {
                this.fallbackCopy(link, onSuccess);
            });
        } else {
            this.fallbackCopy(link, onSuccess);
        }
    }

    fallbackCopy(text, callback) {
        const inp = document.getElementById('refLinkInput');
        if (inp) {
            inp.select();
            inp.setSelectionRange(0, 99999);
            try {
                document.execCommand('copy');
                if (callback) callback();
                return;
            } catch (e) {}
        }
        prompt('انسخ رابط الإحالة الخاص بك:', text);
    }

    /**
     * مشاركة الرابط عبر واتساب
     */
    shareWhatsApp() {
        const link = this.getReferralLink();
        const msg = `🐔 انضم معي إلى لعبة 'كوكو والأفخاخ' الرائعة واشحن جواهر وشدات مجاناً! ادخل عبر رابقي واحصل على 500 نقطة هدية ترحيبية فوراً للبدء:\n${link}`;
        const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
        window.open(url, '_blank');
    }

    /**
     * مشاركة الرابط عبر تليجرام
     */
    shareTelegram() {
        const link = this.getReferralLink();
        const msg = `🐔 انضم معي إلى لعبة 'كوكو والأفخاخ' واشحن مجاناً! احصل على 500 نقطة هدية فوراً:`;
        const url = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(msg)}`;
        window.open(url, '_blank');
    }

    /**
     * مشاركة سريعة عبر واجهة المتصفح Native Web Share API
     */
    shareNative() {
        const link = this.getReferralLink();
        if (navigator.share) {
            navigator.share({
                title: 'لعبة كوكو والأفخاخ 🐔',
                text: 'ادخل عبر رابطي واحصل على 500 نقطة هدية فوراً في لعبة كوكو والأفخاخ! 🎁',
                url: link
            }).catch(() => {});
        } else {
            this.copyLink();
        }
    }

    /**
     * إظهار رسالة عائمة (Toast Notification)
     */
    showToast(message, type = 'success') {
        let toast = document.getElementById('referralToast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'referralToast';
            toast.className = 'referral-toast';
            document.body.appendChild(toast);
        }

        toast.innerText = message;
        toast.className = `referral-toast show ${type}`;

        if (this.toastTimer) {
            clearTimeout(this.toastTimer);
        }

        this.toastTimer = setTimeout(() => {
            toast.className = 'referral-toast';
        }, 4000);
    }

    /**
     * ربط أحداث العناصر التفاعلية
     */
    initEventListeners() {
        // زر فتح النافذة من القائمة العلوية
        document.getElementById('navBtnReferral')?.addEventListener('click', () => {
            if (window.featuresManager) window.featuresManager.closeMobileMenu();
            this.openModal();
        });

        // زر فتح النافذة من شاشة البداية
        document.getElementById('btnStartReferral')?.addEventListener('click', () => {
            this.openModal();
        });

        // زر فتح النافذة من متجر القسائم
        document.getElementById('btnStoreOpenReferral')?.addEventListener('click', () => {
            this.openModal();
        });

        // زر إغلاق النافذة
        document.getElementById('btnCloseReferralModal')?.addEventListener('click', () => {
            this.closeModal();
        });

        // إغلاق عند النقر خارج المحتوى
        document.getElementById('referralModal')?.addEventListener('click', (e) => {
            if (e.target.id === 'referralModal') {
                this.closeModal();
            }
        });

        // زر نسخ الرابط بضغطة واحدة
        document.getElementById('btnCopyRefLink')?.addEventListener('click', () => {
            this.copyLink();
        });

        // أزرار المشاركة
        document.getElementById('btnShareRefWhatsapp')?.addEventListener('click', () => {
            this.shareWhatsApp();
        });

        document.getElementById('btnShareRefTelegram')?.addEventListener('click', () => {
            this.shareTelegram();
        });

        document.getElementById('btnShareRefNative')?.addEventListener('click', () => {
            this.shareNative();
        });

        // زر تفعيل كود الصديق يدوياً
        document.getElementById('btnClaimFriendCode')?.addEventListener('click', () => {
            const inp = document.getElementById('refFriendCodeInput');
            if (inp) this.claimFriendCode(inp.value);
        });

        document.getElementById('refFriendCodeInput')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const inp = document.getElementById('refFriendCodeInput');
                if (inp) this.claimFriendCode(inp.value);
            }
        });
    }
}

// إنشاء الكائن العام لنظام الإحالة
window.referralManager = new ReferralManager();
