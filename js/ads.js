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

        this.loadSavedStats();
        this.initGoogleAdSense();
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

        // فحص تفعيل شبكة Monetag إن وُجدت
        const monetagZone = (adminCfg && adminCfg.monetagZoneId) ? adminCfg.monetagZoneId : "12130138";
        if (monetagZone && !document.getElementById('monetag-injected-script')) {
            try {
                const monetagScript = document.createElement('script');
                monetagScript.id = 'monetag-injected-script';
                monetagScript.src = `https://alwingulla.com/88/tag.min.js`;
                monetagScript.setAttribute('data-zone', monetagZone);
                monetagScript.async = true;
                document.head.appendChild(monetagScript);
                console.log('✅ تم تفعيل شبكة إعلانات Monetag Zone ID:', monetagZone);
            } catch (e) {
                console.warn('Monetag script injection error:', e);
            }
        }
    }

    // تحديث وتنشيط إعلانات البانر
    refreshBannerAds() {
        if (!this.config.testMode && window.adsbygoogle) {
            try {
                const adSlots = document.querySelectorAll('ins.adsbygoogle');
                adSlots.forEach(slot => {
                    if (!slot.getAttribute('data-adsbygoogle-status')) {
                        (window.adsbygoogle = window.adsbygoogle || []).push({});
                    }
                });
            } catch (e) {
                console.warn('AdSense push error:', e);
            }
        }
    }

    // 1. عرض إعلان فيديو بمكافأة (Rewarded Video Ad)
    // المكافآت المتاحة: 'REVIVE' (إحياء الدجاجة), 'DOUBLE_SCORE' (مضاعفة النقاط), 'FREE_SHIELD' (درع مجاني)
    showRewardedAd(rewardType, onRewardSuccess, onCancel) {
        if (this.isAdPlaying) {
            // حماية من التجميد: إذا كان هناك إعلان نشط بالفعل نلغي بهدوء
            if (onCancel) onCancel();
            return;
        }
        this.isAdPlaying = true;

        const modal = document.getElementById('rewardedAdModal');
        const countdownElem = document.getElementById('adTimerCount');
        const rewardDescElem = document.getElementById('adRewardDescription');
        const closeBtn = document.getElementById('btnCloseAd');
        const progressBar = document.getElementById('adProgressBar');

        // تحديد نص المكافأة
        let rewardText = "مكافأة خاصة";
        if (rewardType === 'REVIVE') rewardText = "❤️ استعادة كامل القلوب والنجاة من الموت!";
        if (rewardType === 'DOUBLE_SCORE') rewardText = "💰 مضاعفة نقاط المرحلة x2!";
        if (rewardType === 'FREE_SHIELD') rewardText = "🛡️ الحصول على درع حماية خارق مجاناً!";
        if (rewardType === 'BONUS_POINTS') rewardText = "💎 الحصول على +2,500 نقطة مجانية لشحن الألعاب!";

        if (rewardDescElem) rewardDescElem.innerText = rewardText;

        if (closeBtn) {
            closeBtn.disabled = true;
            closeBtn.style.opacity = '0.5';
            closeBtn.innerText = "انتظر 5 ثوانٍ...";
            closeBtn.onclick = null; // تنظيف المستمعين السابقين لمنع التسريب والتكرار
        }

        if (modal) modal.style.display = 'flex';

        this.currentCountdown = 5;
        if (countdownElem) countdownElem.innerText = `${this.currentCountdown}`;
        if (progressBar) progressBar.style.width = '0%';

        if (this.countdownTimer) clearInterval(this.countdownTimer);

        let progressStep = 0;
        this.countdownTimer = setInterval(() => {
            progressStep += 20;
            if (progressBar) progressBar.style.width = `${progressStep}%`;

            this.currentCountdown--;
            if (countdownElem) countdownElem.innerText = `${Math.max(0, this.currentCountdown)}`;

            if (this.currentCountdown <= 0) {
                clearInterval(this.countdownTimer);
                this.countdownTimer = null;

                if (closeBtn) {
                    closeBtn.disabled = false;
                    closeBtn.style.opacity = '1';
                    closeBtn.innerText = "✅ تم استلام المكافأة (إغلاق)";
                }

                // تسجيل الأرباح والمشاهدة
                this.recordImpression(true);

                // إتمام المكافأة بأمان بنقرة واحدة نظيفة
                if (closeBtn) {
                    closeBtn.onclick = () => {
                        closeBtn.onclick = null;
                        if (modal) modal.style.display = 'none';
                        this.isAdPlaying = false;
                        if (onRewardSuccess) onRewardSuccess();
                    };
                }
            }
        }, 1000);
    }

    // 2. عرض إعلان بيني (Interstitial Ad) بين المراحل
    showInterstitialAd(onComplete) {
        this.levelCompletedCount++;

        // إظهار الإعلان كل عدد معين من المراحل (حسب الإعدادات)
        if (this.levelCompletedCount % this.config.adFrequencyLevels !== 0) {
            if (onComplete) onComplete();
            return;
        }

        if (this.isAdPlaying) {
            if (onComplete) onComplete();
            return;
        }

        this.isAdPlaying = true;
        const modal = document.getElementById('interstitialAdModal');
        const countdownElem = document.getElementById('interstitialTimer');
        const skipBtn = document.getElementById('btnSkipInterstitial');

        if (skipBtn) {
            skipBtn.disabled = true;
            skipBtn.style.opacity = '0.5';
            skipBtn.innerText = "يمكن التخطي بعد 3...";
            skipBtn.onclick = null;
        }

        if (modal) modal.style.display = 'flex';

        let timer = 3;
        if (countdownElem) countdownElem.innerText = `${timer}`;

        const interval = setInterval(() => {
            timer--;
            if (countdownElem) countdownElem.innerText = `${Math.max(0, timer)}`;
            if (skipBtn) skipBtn.innerText = timer > 0 ? `يمكن التخطي بعد ${timer}...` : "تخطي الإعلان ⏩";

            if (timer <= 0) {
                clearInterval(interval);
                if (skipBtn) {
                    skipBtn.disabled = false;
                    skipBtn.style.opacity = '1';
                }

                // تسجيل أرباح الإعلان
                this.recordImpression(false);

                if (skipBtn) {
                    skipBtn.onclick = () => {
                        skipBtn.onclick = null;
                        if (modal) modal.style.display = 'none';
                        this.isAdPlaying = false;
                        if (onComplete) onComplete();
                    };
                }
            }
        }, 1000);
    }

    // 3. عرض إعلان منبثق إلزامي دوري كل دقيقة (Mandatory Pop-up Ad) مع مكافأة 500 نقطة
    showMandatoryPopUpAd(onSuccess) {
        if (this.isAdPlaying) {
            // حماية جوهرية: عدم تجميد اللعبة إطلاقاً في حال كان إعلان آخر قيد التشغيل
            if (onSuccess) onSuccess();
            return;
        }
        this.isAdPlaying = true;

        const modal = document.getElementById('mandatoryPopAdModal');
        const countElem = document.getElementById('mandatoryAdCount');
        const closeBtn = document.getElementById('btnClaimMandatoryAd');
        const progressBar = document.getElementById('mandatoryAdProgressBar');

        let timer = 5;
        if (countElem) countElem.innerText = `${timer}`;
        if (progressBar) progressBar.style.width = '0%';
        if (closeBtn) {
            closeBtn.disabled = true;
            closeBtn.style.opacity = '0.6';
            closeBtn.style.background = '#64748b';
            closeBtn.style.cursor = 'not-allowed';
            closeBtn.innerText = `⏳ يرجى الانتظار (${timer} ثوانٍ)...`;
            closeBtn.onclick = null;
        }

        if (modal) modal.style.display = 'flex';

        // محاولة تنشيط إعلان AdSense إن وُجد
        this.refreshBannerAds();

        if (this.mandatoryTimer) clearInterval(this.mandatoryTimer);

        let elapsed = 0;
        this.mandatoryTimer = setInterval(() => {
            timer--;
            elapsed++;
            if (countElem) countElem.innerText = `${Math.max(0, timer)}`;
            const progress = (elapsed / 5) * 100;
            if (progressBar) progressBar.style.width = `${Math.min(100, progress)}%`;
            if (closeBtn && timer > 0) {
                closeBtn.innerText = `⏳ يرجى الانتظار (${timer} ثوانٍ)...`;
            }

            if (timer <= 0) {
                clearInterval(this.mandatoryTimer);
                this.mandatoryTimer = null;

                if (closeBtn) {
                    closeBtn.disabled = false;
                    closeBtn.style.opacity = '1';
                    closeBtn.style.background = 'linear-gradient(135deg, #4caf50, #2e7d32)';
                    closeBtn.style.cursor = 'pointer';
                    closeBtn.innerText = '🎁 استلم المكافأة (+500 نقطة) واستأنف اللعب 🚀';
                }

                // تسجيل الأرباح والمشاهدة للإعلان الإلزامي
                this.recordImpression(true);

                if (closeBtn) {
                    closeBtn.onclick = () => {
                        closeBtn.onclick = null;
                        if (modal) modal.style.display = 'none';
                        this.isAdPlaying = false;
                        if (onSuccess) onSuccess();
                    };
                }
            }
        }, 1000);
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
