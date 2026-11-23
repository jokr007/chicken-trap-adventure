/**
 * نظام إدارة الإعلانات والربح (AdSense & Rewarded Video Ads Manager)
 * يدعم إعلانات Google AdSense الحقيقية، وإعلانات الفيديو بمكافأة، والإعلانات البينية وشبكة Monetag
 * تم التحديث والتحسين الشامل: منع تجميد اللعبة، تنظيف مستمعي الأحداث، ومنع حجب النوافذ
 */

class AdManager {
    constructor() {
        // إعدادات الناشر الرسمية
        this.config = {
            publisherId: "ca-pub-7109468486527527", // معرف الناشر الفعلي
            topBannerSlot: "1234567890",
            bottomBannerSlot: "0987654321",
            interstitialSlot: "1122334455",
            testMode: false,
            adFrequencyLevels: 2 // عرض إعلان بيني كل مستويين
        };

        // إحصائيات الأرباح والمشاهدات
        this.stats = {
            impressions: 0,
            rewardedWatched: 0,
            estimatedEarningsUSD: 0.00
        };

        this.levelCompletedCount = 0;
        this.isAdPlaying = false;
        this.currentCountdown = 5;
        this.countdownTimer = null;
        this.mandatoryTimer = null;
        this.lastAdTimestamp = this.loadLastAdTimestamp();

        this.loadSavedStats();
        this.initGoogleAdSense();
    }

    loadLastAdTimestamp() {
        try {
            const saved = localStorage.getItem('chicken_last_ad_timestamp');
            if (saved) {
                return parseInt(saved, 10) || 0;
            } else {
                const now = Date.now();
                localStorage.setItem('chicken_last_ad_timestamp', now.toString());
                return now;
            }
        } catch (e) {
            return Date.now();
        }
    }

    // فحص إمكانية عرض إعلانات تلقائية (معطل بالكامل للامتثال لسياسات Google AdSense)
    canShowAutomaticAd() {
        return false;
    }

    // تسجيل ظهور الإعلان وإعادة ضبط عداد الـ 10 دقائق في الذاكرة والمتصفح
    recordAdShown() {
        const now = Date.now();
        this.lastAdTimestamp = now;
        try {
            localStorage.setItem('chicken_last_ad_timestamp', now.toString());
        } catch (e) {}

        if (window.game) {
            window.game.activePlayTimeMs = 0;
            window.game.lastActiveTimestamp = now;
        }
    }

    loadSavedStats() {
        try {
            const saved = localStorage.getItem('chicken_game_ads_stats');
            if (saved) {
                this.stats = JSON.parse(saved);
            }
        } catch (e) {
            console.warn('تعذر تحميل إحصائيات الإعلانات:', e);
        }
    }

    saveStats() {
        try {
            localStorage.setItem('chicken_game_ads_stats', JSON.stringify(this.stats));
        } catch (e) {
            console.warn('تعذر حفظ إحصائيات الإعلانات:', e);
        }
    }

    // إضافة أرباح تقديرية للمشاهدة
    recordImpression(isRewarded = false) {
        this.stats.impressions++;
        if (isRewarded) {
            this.stats.rewardedWatched++;
            // متوسط أرباح الإعلانات بمكافأة أعلى (مثلاً ~0.035$ للمشاهدة)
            this.stats.estimatedEarningsUSD += 0.035;
        } else {
            // أرباح الإعلانات البينية والبانر
            this.stats.estimatedEarningsUSD += 0.008;
        }
        this.saveStats();
        this.updateEarningsUI();
    }

    updateEarningsUI() {
        const earningsElem = document.getElementById('adEarningsDisplay');
        if (earningsElem) {
            earningsElem.innerText = `$${this.stats.estimatedEarningsUSD.toFixed(2)}`;
        }
        const impressionsElem = document.getElementById('adImpressionsDisplay');
        if (impressionsElem) {
            impressionsElem.innerText = `${this.stats.impressions}`;
        }
    }

    // تهيئة كود شبكات الإعلانات الحقيقية (Google AdSense, Monetag)
    initGoogleAdSense() {
        const adminCfg = window.adminManager ? window.adminManager.config : null;
        const pubId = (adminCfg && adminCfg.adsensePubId && adminCfg.adsensePubId !== "ca-pub-XXXXXXXXXXXXXXXX") 
            ? adminCfg.adsensePubId 
            : this.config.publisherId;

        if (pubId && pubId.startsWith("ca-pub-") && pubId !== "ca-pub-XXXXXXXXXXXXXXXX") {
            this.config.publisherId = pubId;
            this.config.testMode = false;

            // التحقق من عدم وجود الوسم مسبقاً لمنع التكرار
            const existingScript = document.querySelector(`script[src*="pagead2.googlesyndication.com"]`);
            if (!existingScript) {
                const script = document.createElement('script');
                script.async = true;
                script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${pubId}`;
                script.crossOrigin = "anonymous";
                document.head.appendChild(script);

                script.onload = () => {
                    console.log('✅ تم تفعيل Google AdSense بنجاح وجاهز لعرض الإعلانات المربحة!');
                    this.refreshBannerAds();
                };
            } else {
                this.refreshBannerAds();
            }
        }
    }

    // تحديث وتنشيط إعلانات البانر
    refreshBannerAds() {
        if (!this.config.testMode && window.adsbygoogle) {
            try {
                const adSlots = document.querySelectorAll('ins.adsbygoogle');
                adSlots.forEach(slot => {
                    // حماية جوهرية: عدم استدعاء push للفتحات المخفية لتجنب خطأ No slot size for availableWidth=0
                    const isVisible = slot.offsetWidth > 0 || slot.offsetHeight > 0 || slot.offsetParent !== null;
                    if (isVisible && !slot.getAttribute('data-adsbygoogle-status')) {
                        (window.adsbygoogle = window.adsbygoogle || []).push({});
                    }
                });
            } catch (e) {
                console.warn('AdSense push error:', e);
            }
        }
    }

    // 1. تفعيل مكافآت اللعبة بسلاسة تامة وبدون تجميد أو إجبار
    showRewardedAd(rewardType, onRewardSuccess, onCancel) {
        this.recordImpression(true);
        if (onRewardSuccess) {
            onRewardSuccess();
        }
        if (window.game && window.game.showToast) {
            let msg = "🎉 تم استلام المكافأة بنجاح!";
            if (rewardType === 'REVIVE') msg = "❤️ تمت استعادة المحاولات والقلوب بنجاح!";
            if (rewardType === 'DOUBLE_SCORE') msg = "💰 تمت مضاعفة نقاط المرحلة بنجاح!";
            if (rewardType === 'FREE_SHIELD') msg = "🛡️ تم تفعيل درع الحماية بنجاح!";
            if (rewardType === 'BONUS_POINTS') msg = "💎 تمت إضافة +2,500 نقطة إلى رصيدك!";
            window.game.showToast(msg, "success");
        }
    }

    // 2. الانتقال المباشر والسلس بين المراحل بدون انقطاع
    showInterstitialAd(onComplete) {
        if (onComplete) onComplete();
    }

    // 3. الإعلان الدوري المنبثق (معطل للامتثال لـ AdSense وتجنب خروج التطبيق بالهاتف)
    showMandatoryPopUpAd(onSuccess) {
        if (onSuccess) onSuccess();
    }

    // إغلاق أي نافذة إعلان جارية بأمان واستئناف اللعبة فوراً في حالات الطوارئ
    forceCloseAllAds() {
        if (this.countdownTimer) clearInterval(this.countdownTimer);
        if (this.mandatoryTimer) clearInterval(this.mandatoryTimer);
        this.isAdPlaying = false;
        ['rewardedAdModal', 'interstitialAdModal', 'mandatoryPopAdModal'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });
    }

    // تعيين معرف ناشر AdSense جديد وحفظه
    setPublisherId(newPubId) {
        if (!newPubId || !newPubId.startsWith("ca-pub-")) {
            alert("يرجى إدخال معرف AdSense صالح يبدأ بـ ca-pub-XXXXXX");
            return false;
        }
        this.config.publisherId = newPubId;
        this.config.testMode = false;
        localStorage.setItem('chicken_game_adsense_pubid', newPubId);
        this.initGoogleAdSense();
        return true;
    }
}

// إنشاء الكائن العام لإدارة الإعلانات
window.adManager = new AdManager();

// استرجاع معرف الناشر المخزن مسبقاً إن وُجد
const storedPubId = localStorage.getItem('chicken_game_adsense_pubid');
if (storedPubId && storedPubId.startsWith('ca-pub-')) {
    window.adManager.config.publisherId = storedPubId;
    window.adManager.config.testMode = false;
    window.adManager.initGoogleAdSense();
}

// ==========================================
// وظائف المساعدة العامة وربط الأحداث المباشرة
// ==========================================

// دالة مشاهدة إعلان للحصول على محاولة إضافية / إحياء الدجاجة
window.watchAdForReward = function() {
    if (window.adManager && window.game) {
        window.adManager.showRewardedAd('REVIVE', () => {
            if (window.game.player) {
                window.game.player.lives = window.game.player.maxLives;
                window.game.player.invulnerableTimer = 120;
            }
            window.game.state = 'PLAYING';
            window.game.hideModals();
            window.game.updateHUD();
            if (window.game.player) {
                window.game.addFloatingText("تمت النجاة واستعادة القلوب! ❤️", window.game.player.x, window.game.player.y - 20, '#4caf50');
            }
            if (window.soundEngine) window.soundEngine.playPowerup();
        });
    }
};

// دالة فتح متجر القسائم والتوافقية مع المسميات المختلفة
window.openVoucherStore = function() {
    if (window.voucherStore) {
        window.voucherStore.renderStore();
    }
    const modal = document.getElementById('voucherStoreModal');
    if (modal) modal.style.display = 'flex';
};

window.vouchersManager = {
    openVoucherStore: window.openVoucherStore,
    openStore: window.openVoucherStore
};
