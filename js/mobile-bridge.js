/**
 * جسر التواصل الأصلي لتطبيق الموبايل (Chicken Game Native Bridge)
 * متوافق مع نظام أندرويد (Android) وآي أو إس (iOS) عبر Capacitor
 * يدعم: الاهتزاز التفاعلي (Haptics)، زر الرجوع الفعلي (Back Button)، وضع ملء الشاشة، وإدارة دورة حياة التطبيق
 */

(function () {
    'use strict';

    const MobileBridge = {
        isCapacitor: false,
        plugins: {},
        isPausedBySystem: false,

        async init() {
            console.log('📱 تهيئة جسر تطبيق الموبايل الأصلي (Mobile Bridge)...');

            // التحقق مما إذا كان التطبيق يعمل داخل Capacitor
            this.isCapacitor = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());

            if (this.isCapacitor) {
                console.log('✅ تم اكتشاف بيئة تطبيق أصلي (Native Mobile App):', window.Capacitor.getPlatform());
                this.plugins = window.Capacitor.Plugins || {};
            } else {
                console.log('🌐 يعمل في بيئة متصفح أو معاينة تجريبية.');
            }

            this.setupImmersiveUI();
            this.setupHaptics();
            this.setupBackButton();
            this.setupAppStateListener();
            this.setupAudioUnlock();
            this.setupMobileActionButton();
            this.hideSplashScreen();
            this.createExitConfirmModal();
            this.setupAdMob();

            // إضافة فئة تمييزية للـ body
            document.body.classList.add('mobile-app-mode');
            if (this.isCapacitor) {
                document.body.classList.add('is-native-app');
                document.body.classList.add('platform-' + window.Capacitor.getPlatform());
            }
        },

        /**
         * ضبط الشاشة والواجهة للوضع الغامر (Immersive Fullscreen)
         */
        setupImmersiveUI() {
            // منع السحب والتكبير والتصغير وتحديد النصوص
            document.addEventListener('gesturestart', (e) => e.preventDefault(), { passive: false });
            document.addEventListener('dblclick', (e) => e.preventDefault(), { passive: false });
            
            // منع القائمة المنبثقة عند الضغط المطول
            window.addEventListener('contextmenu', (e) => {
                if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                    e.preventDefault();
                }
            });

            // ضبط شريط الحالة (StatusBar) في أندرويد و iOS
            if (this.isCapacitor && this.plugins.StatusBar) {
                try {
                    this.plugins.StatusBar.setStyle({ style: 'DARK' });
                    this.plugins.StatusBar.setBackgroundColor({ color: '#12141c' });
                    this.plugins.StatusBar.setOverlaysWebView({ overlay: false });
                } catch (err) {
                    console.warn('StatusBar config error:', err);
                }
            }
        },

        /**
         * إخفاء شاشة البداية (Splash Screen) بسلاسة
         */
        hideSplashScreen() {
            setTimeout(() => {
                if (this.isCapacitor && this.plugins.SplashScreen) {
                    try {
                        this.plugins.SplashScreen.hide({ fadeOutDuration: 400 });
                    } catch (e) {
                        console.warn('SplashScreen hide error:', e);
                    }
                }
            }, 600);
        },

        /**
         * الاهتزاز التفاعلي اللمسي (Haptic Feedback)
         */
        setupHaptics() {
            window.triggerHaptic = (type = 'light') => {
                try {
                    if (this.isCapacitor && this.plugins.Haptics) {
                        if (type === 'heavy') {
                            this.plugins.Haptics.impact({ style: 'HEAVY' });
                        } else if (type === 'medium') {
                            this.plugins.Haptics.impact({ style: 'MEDIUM' });
                        } else if (type === 'success') {
                            this.plugins.Haptics.notification({ type: 'SUCCESS' });
                        } else if (type === 'warning') {
                            this.plugins.Haptics.notification({ type: 'WARNING' });
                        } else {
                            this.plugins.Haptics.impact({ style: 'LIGHT' });
                        }
                        return;
                    }

                    // بديل للمتصفحات العادية التي تدعم Web Vibration API
                    if ('vibrate' in navigator) {
                        if (type === 'heavy') navigator.vibrate([80, 40, 80]);
                        else if (type === 'medium') navigator.vibrate(60);
                        else if (type === 'success') navigator.vibrate([40, 60, 40]);
                        else navigator.vibrate(25);
                    }
                } catch (e) {
                    // تجاهل بصمت إذا لم تكن الميزة مدعومة
                }
            };

            // ربط الاهتزاز بأزرار الـ D-pad اللمسية
            const dpadButtons = document.querySelectorAll('.dpad-btn, .mobile-action-btn');
            dpadButtons.forEach(btn => {
                btn.addEventListener('touchstart', () => window.triggerHaptic('light'), { passive: true });
            });
        },

        /**
         * إدارة زر الرجوع الحقيقي في هواتف أندرويد (Hardware Back Button)
         */
        setupBackButton() {
            if (!this.isCapacitor || !this.plugins.App) return;

            this.plugins.App.addListener('backButton', ({ canGoBack }) => {
                console.log('🔙 تم الضغط على زر الرجوع في الهاتف');

                const g = window.game || window.gameInstance;

                // 1. إذا كانت هناك نافذة منبثقة مفتوحة، أغلقها أولاً
                const openModals = Array.from(document.querySelectorAll('.modal-overlay')).filter(m => m.style.display !== 'none');
                if (openModals.length > 0) {
                    const exitModal = document.getElementById('mobileExitModal');
                    if (openModals.includes(exitModal)) {
                        MobileBridge.hideExitModal();
                        return;
                    }
                    if (g && typeof g.hideModals === 'function') {
                        g.hideModals();
                        return;
                    }
                }

                // 2. إذا كانت اللعبة قيد التشغيل، قم بإيقافها مؤقتاً
                if (g && g.state === 'PLAYING') {
                    g.togglePause();
                    return;
                }

                // 3. إذا كان في القائمة الرئيسية أو في وضع التوقف، اعرض نافذة تأكيد الخروج
                MobileBridge.showExitModal();
            });
        },

        /**
         * نافذة تأكيد الخروج من اللعبة على الموبايل
         */
        createExitConfirmModal() {
            if (document.getElementById('mobileExitModal')) return;

            const modal = document.createElement('div');
            modal.id = 'mobileExitModal';
            modal.className = 'modal-overlay';
            modal.style.display = 'none';
            modal.style.zIndex = '99999';
            modal.innerHTML = `
                <div class="modal-content" style="max-width: 360px; text-align: center; border: 2px solid #ff9800; border-radius: 20px; padding: 24px 20px; background: rgba(18, 20, 28, 0.98); box-shadow: 0 15px 40px rgba(0,0,0,0.85);">
                    <div style="font-size: 3rem; margin-bottom: 8px;">🐔👋</div>
                    <h2 class="modal-title" style="font-size: 1.4rem; color: #ffd54f; margin-bottom: 8px;">هل تريد الخروج من اللعبة؟</h2>
                    <p class="modal-text" style="font-size: 0.95rem; color: #cfd8dc; margin-bottom: 20px;">سيتم حفظ جميع نقاطك ومستوياتك التي حققتها تلقائياً.</p>
                    <div class="btn-group" style="display: flex; gap: 12px; justify-content: center;">
                        <button id="btnConfirmExitApp" class="btn-secondary" style="flex: 1; padding: 12px; font-weight: 700; border-color: #f44336; color: #ff8a80; border-radius: 12px;">
                            نعم، خروج 🚪
                        </button>
                        <button id="btnCancelExitApp" class="btn-action" style="flex: 1; padding: 12px; font-weight: 700; background: linear-gradient(135deg, #ff9800, #f57c00); border-radius: 12px;">
                            متابعة اللعب 🎮
                        </button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            document.getElementById('btnConfirmExitApp').addEventListener('click', () => {
                if (this.isCapacitor && this.plugins.App) {
                    this.plugins.App.exitApp();
                } else {
                    MobileBridge.hideExitModal();
                }
            });

            document.getElementById('btnCancelExitApp').addEventListener('click', () => {
                MobileBridge.hideExitModal();
            });
        },

        showExitModal() {
            const modal = document.getElementById('mobileExitModal');
            if (modal) modal.style.display = 'flex';
        },

        hideExitModal() {
            const modal = document.getElementById('mobileExitModal');
            if (modal) modal.style.display = 'none';
        },

        /**
         * متابعة حالة التطبيق (تصغير التطبيق / الرجوع إليه)
         */
        setupAppStateListener() {
            if (!this.isCapacitor || !this.plugins.App) return;

            this.plugins.App.addListener('appStateChange', (state) => {
                console.log('🔄 تغيرت حالة التطبيق:', state.isActive ? 'في المقدمة (Active)' : 'في الخلفية (Background)');
                const g = window.game || window.gameInstance;
                if (!state.isActive) {
                    // تم تصغير التطبيق أو قفل الشاشة: إيقاف اللعبة مؤقتاً لحفظ البطارية
                    if (g && g.state === 'PLAYING') {
                        g.togglePause();
                        this.isPausedBySystem = true;
                    }
                    if (window.soundEngine && typeof window.soundEngine.pauseBgm === 'function') {
                        window.soundEngine.pauseBgm();
                    }
                } else {
                    // عند العودة، لا نستأنف اللعبة تلقائياً بل نترك زر الاستئناف للاعب
                    this.isPausedBySystem = false;
                }
            });
        },

        /**
         * فك قفل الصوت تلقائياً عند أول لمسة للشاشة (تجنباً لقيود الهواتف)
         */
        setupAudioUnlock() {
            const unlockAudio = () => {
                if (window.soundEngine && typeof window.soundEngine.init === 'function') {
                    window.soundEngine.init();
                }
                document.removeEventListener('touchstart', unlockAudio);
                document.removeEventListener('click', unlockAudio);
            };

            document.addEventListener('touchstart', unlockAudio, { passive: true, once: true });
            document.addEventListener('click', unlockAudio, { passive: true, once: true });
        },

        /**
         * ربط زر التفاعل والنقنقة الخاص بالهاتف
         */
        setupMobileActionButton() {
            const btnJump = document.getElementById('btnMobileJump');
            if (!btnJump) return;

            const getGame = () => window.gameInstance || window.game;

            const onAction = (e) => {
                e.preventDefault();
                window.triggerHaptic('medium');
                if (window.soundEngine && typeof window.soundEngine.playCluck === 'function') {
                    window.soundEngine.playCluck();
                }
                const g = getGame();
                if (g && g.input) {
                    g.input.up = true;
                    setTimeout(() => {
                        if (g && g.input) g.input.up = false;
                    }, 180);
                }
            };

            btnJump.addEventListener('touchstart', onAction, { passive: false });
            btnJump.addEventListener('mousedown', onAction);
        },

        /**
         * إعدادات وتشغيل إعلانات Google AdMob داخل تطبيق الموبايل
         */
        admobConfig: {
            appId: "ca-app-pub-7109468486527527~4187178396",
            bannerAdId: "ca-app-pub-7109468486527527/5336734846",
            interstitialAdId: "ca-app-pub-7109468486527527/7691435445"
        },

        async setupAdMob() {
            if (!this.isCapacitor || !this.plugins.AdMob) {
                console.log('ℹ️ AdMob Plugin غير متصل أو يعمل في المتصفح.');
                return;
            }
            try {
                const { AdMob } = this.plugins;
                await AdMob.initialize({
                    requestTrackingAuthorization: true,
                    testingDevices: [],
                    initializeForTesting: false
                });
                console.log('✅ تم تفعيل Google AdMob بنجاح في تطبيق الموبايل!');
                
                // عرض إعلان البانر الرئيسي في أسفل الشاشة
                this.showAdMobBanner();
            } catch (err) {
                console.warn('⚠️ خطأ في تهيئة AdMob:', err);
            }
        },

        async showAdMobBanner() {
            if (!this.isCapacitor || !this.plugins.AdMob) return;
            try {
                const { AdMob, BannerAdSize, BannerAdPosition } = this.plugins;
                await AdMob.showBanner({
                    adId: this.admobConfig.bannerAdId,
                    adSize: BannerAdSize ? BannerAdSize.BANNER : 'BANNER',
                    position: BannerAdPosition ? BannerAdPosition.BOTTOM_CENTER : 'BOTTOM_CENTER',
                    margin: 0,
                    isTesting: false
                });
                console.log('✅ تم عرض بانر AdMob بنجاح');
            } catch (e) {
                console.warn('Banner show error:', e);
            }
        },

        async showAdMobInterstitial() {
            if (!this.isCapacitor || !this.plugins.AdMob) return;
            try {
                const { AdMob } = this.plugins;
                await AdMob.prepareInterstitial({
                    adId: this.admobConfig.interstitialAdId,
                    isTesting: false
                });
                await AdMob.showInterstitial();
                console.log('✅ تم عرض الإعلان البيني AdMob بنجاح');
            } catch (e) {
                console.warn('Interstitial show error:', e);
            }
        }
    };

    // تحميل الجسر فور جاهزية المستند
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => MobileBridge.init());
    } else {
        MobileBridge.init();
    }

    window.MobileBridge = MobileBridge;
})();
