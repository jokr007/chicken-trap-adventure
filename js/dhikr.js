/**
 * =========================================================================
 * شريط الأذكار والأدعية الإسلامية (Islamic Dhikr & Dua System)
 * لعبة مغامرة كوكو والأفخاخ (Chicken Trap Adventure)
 * =========================================================================
 * 1. مصفوفة أذكار وأدعية مأثورة ومختارة بعناية بتشكيل واضح وجميل
 * 2. تبديل تلقائي سلس كل 3 دقائق (180 ثانية) بشكل هادئ لا يقطع تركيز اللاعب
 * 3. شريط تقدم زمني انسيابي يعكس وقت الذكر الحالي
 * 4. أزرار تحكم خفيفة: الانتقال للذكر التالي ⏭️، نسخ الذكر 📋، وتصغير/تكبير الشريط 👁️
 * 5. كود نظيف ومستقل تماماً عن حلقة اللعبة لضمان سرعة وأداء 60 FPS
 */

class IslamicDhikrManager {
    constructor() {
        this.intervalSeconds = 180; // 3 دقائق (180 ثانية)
        this.timer = null;
        this.progressTimer = null;
        this.currentIndex = 0;
        this.isMinimized = localStorage.getItem('chicken_dhikr_minimized') === 'true';

        // قائمة الأدعية والأذكار الإسلامية المختصرة والمأثورة
        this.adhkar = [
            { text: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، سُبْحَانَ اللَّهِ الْعَظِيمِ", type: "تسبيح" },
            { text: "لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ", type: "توحيد" },
            { text: "أَسْتَغْفِرُ اللَّهَ الْعَظِيمَ الَّذِي لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ وَأَتُوبُ إِلَيْهِ", type: "استغفار" },
            { text: "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ الْعَلِيِّ الْعَظِيمِ", type: "توكل" },
            { text: "اللَّهُمَّ صَلِّ وَسَلِّمْ وَبَارِكْ عَلَى نَبِيِّنَا مُحَمَّدٍ ﷺ", type: "صلاة على النبي" },
            { text: "اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَالآخِرَةِ", type: "دعاء" },
            { text: "حَسْبِيَ اللَّهُ لَا إِلَهَ إِلَّا هُوَ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ", type: "كفاية" },
            { text: "سُبْحَانَ اللَّهِ، وَالْحَمْدُ لِلَّهِ، وَلَا إِلَهَ إِلَّا اللَّهُ، وَاللَّهُ أَكْبَرُ", type: "الباقيات الصالحات" },
            { text: "رَضِيتُ بِاللَّهِ رَبّاً، وَبِالإِسْلامِ دِيناً، وَبِمُحَمَّدٍ ﷺ نَبِيّاً وَرَسُولاً", type: "رضا" },
            { text: "يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ، أَصْلِحْ لِي شَأْنِي كُلَّهُ وَلَا تَكِلْنِي إِلَى نَفْسِي طَرْفَةَ عَيْنٍ", type: "دعاء" },
            { text: "لَا إِلَهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ", type: "دعاء ذي النون" },
            { text: "اللَّهُمَّ آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ", type: "دعاء شامل" },
            { text: "اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْماً نَافِعاً، وَرِزْقاً طَيِّباً، وَعَمَلاً مُتَقَبَّلاً", type: "دعاء الرزق" },
            { text: "سُبْحَانَ اللَّهِ عَدَدَ خَلْقِهِ، وَرِضَا نَفْسِهِ، وَزِنَةَ عَرْشِهِ، وَمِدَادَ كَلِمَاتِهِ", type: "تسبيح مضاعف" },
            { text: "اللَّهُمَّ اكْفِنِي بِحَلَالِكَ عَنْ حَرَامِكَ، وَأَغْنِنِي بِفَضْلِكَ عَمَّنْ سِوَاكَ", type: "دعاء الكفاية" },
            { text: "اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ", type: "دعاء الشكر" },
            { text: "بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ", type: "حفظ وتحصين" },
            { text: "أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ", type: "استعاذة" }
        ];

        // اختيار ذكر عشوائي في البداية
        this.currentIndex = Math.floor(Math.random() * this.adhkar.length);

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        this.renderInitial();
        this.initEventListeners();
        this.applyMinimizedState();
        this.startCycle();
    }

    /**
     * عرض الذكر الحالي في الواجهة
     */
    renderInitial() {
        const textEl = document.getElementById('dhikrTextDisplay');
        const badgeEl = document.getElementById('dhikrTypeBadge');
        if (!textEl) return;

        const current = this.adhkar[this.currentIndex];
        textEl.innerText = current.text;
        if (badgeEl) badgeEl.innerText = current.type || 'ذكر طيب';
    }

    /**
     * بدء دورة التبديل كل 3 دقائق (180 ثانية)
     */
    startCycle() {
        if (this.timer) clearInterval(this.timer);
        if (this.progressTimer) clearInterval(this.progressTimer);

        // شريط التقدم الانسيابي
        const progressFill = document.getElementById('dhikrProgressFill');
        let elapsed = 0;
        const totalMs = this.intervalSeconds * 1000;
        const tickMs = 500; // تحديث كل نصف ثانية

        if (progressFill) progressFill.style.width = '0%';

        this.progressTimer = setInterval(() => {
            elapsed += tickMs;
            const pct = Math.min(100, (elapsed / totalMs) * 100);
            if (progressFill) {
                progressFill.style.width = `${pct}%`;
            }
        }, tickMs);

        // تبديل الذكر بعد انقضاء 180 ثانية
        this.timer = setInterval(() => {
            this.nextDhikr();
        }, totalMs);
    }

    /**
     * الانتقال للذكر التالي بتأثير تلاشي هادئ
     */
    nextDhikr() {
        const textEl = document.getElementById('dhikrTextDisplay');
        const badgeEl = document.getElementById('dhikrTypeBadge');
        if (!textEl) return;

        // تأثير التلاشي التدريجي Fade-out
        textEl.classList.add('dhikr-fade-out');

        setTimeout(() => {
            this.currentIndex = (this.currentIndex + 1) % this.adhkar.length;
            const nextItem = this.adhkar[this.currentIndex];

            textEl.innerText = nextItem.text;
            if (badgeEl) badgeEl.innerText = nextItem.type || 'ذكر طيب';

            // تأثير الظهور التدريجي Fade-in
            textEl.classList.remove('dhikr-fade-out');
            textEl.classList.add('dhikr-fade-in');

            setTimeout(() => {
                textEl.classList.remove('dhikr-fade-in');
            }, 500);

            // إعادة ضبط شريط التقدم
            this.startCycle();
        }, 350);
    }

    /**
     * نسخ الذكر الحالي للحافظة
     */
    copyCurrentDhikr() {
        const current = this.adhkar[this.currentIndex];
        if (!current) return;

        const textToCopy = `${current.text} 🌿 (لعبة مغامرة كوكو والأفخاخ)`;
        navigator.clipboard?.writeText(textToCopy).then(() => {
            this.showCopyFeedback("تم نسخ الذكر بنجاح! جزاك الله خيراً 🌿");
        }).catch(() => {
            // حل بديل في حال عدم دعم clipboard API
            const ta = document.createElement('textarea');
            ta.value = textToCopy;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            this.showCopyFeedback("تم نسخ الذكر بنجاح! 🌿");
        });
    }

    /**
     * إظهار تنبيه نسخ سريع
     */
    showCopyFeedback(message) {
        if (window.game && typeof window.game.showToast === 'function') {
            window.game.showToast(message, 'success');
        } else {
            alert(message);
        }
    }

    /**
     * تبديل حالة تصغير / تكبير الشريط
     */
    toggleMinimize() {
        this.isMinimized = !this.isMinimized;
        localStorage.setItem('chicken_dhikr_minimized', `${this.isMinimized}`);
        this.applyMinimizedState();
    }

    applyMinimizedState() {
        const bar = document.getElementById('islamicDhikrBar');
        const toggleBtn = document.getElementById('btnToggleDhikr');
        if (!bar) return;

        if (this.isMinimized) {
            bar.classList.add('minimized');
            if (toggleBtn) {
                toggleBtn.innerText = '📿';
                toggleBtn.title = 'إظهار شريط الأذكار والأدعية';
            }
        } else {
            bar.classList.remove('minimized');
            if (toggleBtn) {
                toggleBtn.innerText = '👁️';
                toggleBtn.title = 'تصغير الشريط';
            }
        }
    }

    /**
     * ربط الأحداث والأزرار
     */
    initEventListeners() {
        document.getElementById('btnNextDhikr')?.addEventListener('click', () => {
            this.nextDhikr();
        });

        document.getElementById('btnCopyDhikr')?.addEventListener('click', () => {
            this.copyCurrentDhikr();
        });

        document.getElementById('btnToggleDhikr')?.addEventListener('click', () => {
            this.toggleMinimize();
        });

        document.getElementById('dhikrMiniPill')?.addEventListener('click', () => {
            this.toggleMinimize();
        });
    }
}

// إنشاء الكائن العام لإدارة الأذكار
window.islamicDhikrManager = new IslamicDhikrManager();
