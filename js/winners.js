/**
 * =========================================================================
 * لوحة قائمة الفائزين والمكافآت (Winners & Rewards Board)
 * لعبة مغامرة كوكو والأفخاخ (Chicken Trap Adventure)
 * =========================================================================
 * 1. شريط متحرك (Live Ticker) يُظهر الفائزين وجوائزهم بشكل مستمر أثناء اللعب
 * 2. لوحة متصدرين كاملة تفاعلية مع عرض المراكز والجوائز المستحقة
 * 3. دمج اللاعب الحالي تلقائياً ومزامنة نقاطه مع تقدم اللعبة
 * 4. تحديث فوري وتلقائي عند تحقيق أرقام قياسية أو ربح نقاط الإعلانات والإحالات
 * 5. حفظ البيانات في الذاكرة المحلية (localStorage)
 */

class WinnersBoardManager {
    constructor() {
        this.storageKey = 'chicken_winners_board_v1';
        this.playerNameKey = 'chicken_player_display_name';
        this.highestRankKey = 'chicken_player_highest_rank';
        
        // البيانات الافتراضية الأولية للفائزين
        this.defaultWinners = [
            { id: 'w1', name: 'صقر_الميدان 🦅', score: 32500, prize: '🥇 بطاقة Google Play بقيمة 10$', date: 'منذ 10 دقائق', avatar: '👑' },
            { id: 'w2', name: 'كوكو_المفترس 🐔', score: 28400, prize: '🥈 660 شدة ببجي موبايل', date: 'منذ 25 دقيقة', avatar: '🔥' },
            { id: 'w3', name: 'أمير_الألعاب 🎮', score: 24900, prize: '🥉 530 جوهرة فري فاير', date: 'منذ 40 دقيقة', avatar: '⚡' },
            { id: 'w4', name: 'نور_الهدى 🌟', score: 19800, prize: '🎁 كود شحن فوري 5$', date: 'منذ ساعة', avatar: '💎' },
            { id: 'w5', name: 'فارس_الظلام ⚔️', score: 16500, prize: '💰 سحب كاش 3$ فودافون/باي بال', date: 'منذ ساعتين', avatar: '🛡️' },
            { id: 'w6', name: 'مغامر_الصحراء 🏜️', score: 13200, prize: '⭐ مكافأة دعوة الأصدقاء (+2,500)', date: 'منذ 3 ساعات', avatar: '🎯' },
            { id: 'w7', name: 'ياسين_البطل 🏆', score: 10500, prize: '🍗 باقة دروع حماية مضاعفة', date: 'منذ 4 ساعات', avatar: '🚀' },
            { id: 'w8', name: 'أحمد_الأسطورة 🦁', score: 8200, prize: '🎁 قسيمة ألعاب مجانية', date: 'منذ 5 ساعات', avatar: '✨' },
            { id: 'w9', name: 'سيف_النصر ⚔️', score: 6100, prize: '💎 شحن 100 جوهرة إضافية', date: 'منذ 6 ساعات', avatar: '🎖️' }
        ];

        this.winners = this.loadWinners();
        this.playerName = this.loadPlayerName();
        this.playerScore = this.getCurrentGameScore();
        this.lastReportedRank = parseInt(localStorage.getItem(this.highestRankKey) || '999', 10);

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        this.initEventListeners();
        this.updatePlayerScore(this.playerScore, false);
        this.renderTicker();
        
        // محاكاة حيوية خفيفة كل دقيقة لتحديث التوقيت
        setInterval(() => {
            this.simulateLiveActivity();
        }, 60000);
    }

    /**
     * استرجاع قائمة الفائزين من localStorage أو إنشاء الافتراضية
     */
    loadWinners() {
        try {
            const raw = localStorage.getItem(this.storageKey);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return parsed;
                }
            }
        } catch (e) {
            console.warn('تعذر قراءة قائمة الفائزين من التخزين:', e);
        }
        return JSON.parse(JSON.stringify(this.defaultWinners));
    }

    saveWinners() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.winners));
        } catch (e) {
            console.warn('تعذر حفظ قائمة الفائزين:', e);
        }
    }

    /**
     * اسم اللاعب الحالي
     */
    loadPlayerName() {
        return localStorage.getItem(this.playerNameKey) || 'أنت (البطل) 🌟';
    }

    setPlayerName(newName) {
        if (!newName || !newName.trim()) return;
        this.playerName = newName.trim();
        localStorage.setItem(this.playerNameKey, this.playerName);
        this.updatePlayerScore(this.playerScore, false);
        this.renderModal();
        this.renderTicker();
        if (window.game && typeof window.game.showToast === 'function') {
            window.game.showToast(`✅ تم حفظ اسمك في لوحة الفائزين: ${this.playerName}`, 'success');
        }
    }

    /**
     * جلب الرصيد الحالي للنقاط من اللعبة
     */
    getCurrentGameScore() {
        if (window.game && typeof window.game.score === 'number') {
            return window.game.score;
        }
        try {
            const progress = localStorage.getItem('chicken_game_progress');
            if (progress) {
                const parsed = JSON.parse(progress);
                if (typeof parsed.score === 'number') return parsed.score;
            }
        } catch (e) {}
        return 0;
    }

    /**
     * تحديد الجائزة المناسبة بحسب النقاط
     */
    calculatePrize(score) {
        if (score >= 30000) return '🥇 بطاقة Google Play بقيمة 10$ + باقة الجواهر الكبرى';
        if (score >= 25000) return '🥈 باقة 660 شدة PUBG Mobile أو 530 جوهرة Free Fire';
        if (score >= 20000) return '🥉 قسيمة شحن فوري 5$ أو سحب كاش بنكي';
        if (score >= 15000) return '🎁 كود متجر قسائم الألعاب 2,500 نقطة';
        if (score >= 10000) return '💰 رصيد محفظة وسحب أرباح متاح';
        if (score >= 5000) return '⭐ حزمة مكافآت الإحالات والإعلانات المجانية';
        if (score >= 2000) return '🍗 مكافأة المرحلة واجتياز الأفخاخ';
        return '🌱 في طريقك للوصول إلى قائمة المتصدرين!';
    }

    /**
     * توليد القائمة المدمجة للاعبين متضمنة اللاعب الحالي مرتبة تنازلياً
     */
    getRankedList() {
        // تصفية أي إدخال قديم للاعب الحالي لتجنب التكرار
        const list = this.winners.filter(w => w.id !== 'current_player');

        // إضافة اللاعب الحالي
        list.push({
            id: 'current_player',
            isCurrentPlayer: true,
            name: this.playerName,
            score: this.playerScore,
            prize: this.calculatePrize(this.playerScore),
            date: 'الآن (مباشر)',
            avatar: '🐣'
        });

        // الترتيب من الأعلى نقاطاً إلى الأقل
        list.sort((a, b) => b.score - a.score);

        // ترقيم المراكز
        return list.map((item, index) => ({
            ...item,
            rank: index + 1
        }));
    }

    /**
     * تحديث رصيد اللاعب تلقائياً عند كسب النقاط
     */
    updatePlayerScore(newScore, notify = true) {
        if (typeof newScore !== 'number') return;
        this.playerScore = Math.max(0, Math.floor(newScore));

        const ranked = this.getRankedList();
        const myEntry = ranked.find(r => r.isCurrentPlayer);
        const myRank = myEntry ? myEntry.rank : 999;

        // فحص ما إذا ارتقى اللاعب لمركز متقدم جديد
        if (notify && myRank < this.lastReportedRank && this.playerScore > 0) {
            this.lastReportedRank = myRank;
            localStorage.setItem(this.highestRankKey, `${myRank}`);

            const medal = myRank === 1 ? '🥇 المركز الأول' : (myRank === 2 ? '🥈 المركز الثاني' : (myRank === 3 ? '🥉 المركز الثالث' : `المركز #${myRank}`));
            const congratsMsg = `🎉 رائع! تقدمت في قائمة الفائزين إلى ${medal} برصيد ${this.playerScore.toLocaleString()} نقطة! 🏆`;
            
            if (window.game && typeof window.game.showToast === 'function') {
                window.game.showToast(congratsMsg, 'success');
            }
            if (window.soundEngine && typeof window.soundEngine.playPowerup === 'function') {
                window.soundEngine.playPowerup();
            }
        }

        this.renderTicker();
        this.renderModal();
    }

    /**
     * رسم وتحديث شريط البث التفاعلي المتحرك (Ticker)
     */
    renderTicker() {
        const container = document.getElementById('winnersTickerContent');
        if (!container) return;

        const ranked = this.getRankedList();
        const topSlice = ranked.slice(0, 10);

        let html = '';
        topSlice.forEach((w) => {
            let rankBadge = `#${w.rank}`;
            let itemClass = 'ticker-item';
            if (w.rank === 1) {
                rankBadge = '🥇 #1';
                itemClass += ' rank-gold';
            } else if (w.rank === 2) {
                rankBadge = '🥈 #2';
                itemClass += ' rank-silver';
            } else if (w.rank === 3) {
                rankBadge = '🥉 #3';
                itemClass += ' rank-bronze';
            }

            if (w.isCurrentPlayer) {
                itemClass += ' is-me';
            }

            html += `
                <div class="${itemClass}">
                    <span class="ticker-rank">${rankBadge}</span>
                    <span class="ticker-name">${w.name}</span>
                    <span class="ticker-score">${w.score.toLocaleString()} نقطة</span>
                    <span class="ticker-prize">${w.prize}</span>
                </div>
                <span class="ticker-separator">✦</span>
            `;
        });

        // تكرار المحتوى لضمان انسيابية الحركة الدائرية المستمرة في الشريط
        container.innerHTML = html + html;
    }

    /**
     * رسم وتحديث محتويات النافذة المنبثقة للوحة الفائزين
     */
    renderModal() {
        const listContainer = document.getElementById('winnersListContainer');
        const myRankBadge = document.getElementById('myRankBadge');
        const myScoreDisplay = document.getElementById('myPlayerScoreDisplay');
        const myNameDisplay = document.getElementById('myPlayerNameDisplay');
        const myPrizeDisplay = document.getElementById('myEligiblePrizeDisplay');

        const ranked = this.getRankedList();
        const myEntry = ranked.find(r => r.isCurrentPlayer);

        if (myEntry) {
            if (myRankBadge) {
                myRankBadge.innerText = myEntry.rank <= 3 ? (myEntry.rank === 1 ? '🥇 #1' : (myEntry.rank === 2 ? '🥈 #2' : '🥉 #3')) : `#${myEntry.rank}`;
            }
            if (myScoreDisplay) myScoreDisplay.innerText = `${myEntry.score.toLocaleString()} نقطة`;
            if (myNameDisplay) myNameDisplay.innerText = myEntry.name;
            if (myPrizeDisplay) myPrizeDisplay.innerText = `🎁 الجائزة المؤهلة: ${myEntry.prize}`;
        }

        if (!listContainer) return;

        let html = '';
        ranked.forEach((w) => {
            let rankClass = '';
            let medalIcon = `#${w.rank}`;
            if (w.rank === 1) {
                rankClass = 'top-rank rank-1';
                medalIcon = '🥇 1';
            } else if (w.rank === 2) {
                rankClass = 'top-rank rank-2';
                medalIcon = '🥈 2';
            } else if (w.rank === 3) {
                rankClass = 'top-rank rank-3';
                medalIcon = '🥉 3';
            }

            const meClass = w.isCurrentPlayer ? 'winner-card-me' : '';

            html += `
                <div class="winner-row-card ${rankClass} ${meClass}">
                    <div class="winner-row-rank">
                        <span class="rank-number">${medalIcon}</span>
                    </div>
                    <div class="winner-row-avatar">${w.avatar || '🎮'}</div>
                    <div class="winner-row-details">
                        <div class="winner-row-name">
                            ${w.name}
                            ${w.isCurrentPlayer ? '<span class="you-badge">أنت 🌟</span>' : ''}
                        </div>
                        <div class="winner-row-time">${w.date}</div>
                    </div>
                    <div class="winner-row-prize-box">
                        <div class="winner-prize-tag">${w.prize}</div>
                        <div class="winner-points-tag">${w.score.toLocaleString()} نقطة</div>
                    </div>
                </div>
            `;
        });

        listContainer.innerHTML = html;
    }

    /**
     * نشاط دوري وهمي لإبقاء اللائحة متفاعلة
     */
    simulateLiveActivity() {
        const timeOptions = ['منذ دقيقة', 'منذ 3 دقائق', 'منذ 7 دقائق', 'منذ 15 دقيقة'];
        // اختيار لاعب عشوائي من غير اللاعب الحالي وتحديث وقته
        const eligible = this.winners.filter(w => w.id !== 'current_player');
        if (eligible.length > 0) {
            const randomWinner = eligible[Math.floor(Math.random() * eligible.length)];
            randomWinner.date = timeOptions[Math.floor(Math.random() * timeOptions.length)];
            this.saveWinners();
            this.renderTicker();
        }
    }

    /**
     * فتح وإغلاق النافذة
     */
    openModal() {
        this.updatePlayerScore(this.getCurrentGameScore(), false);
        const modal = document.getElementById('winnersBoardModal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    closeModal() {
        const modal = document.getElementById('winnersBoardModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    /**
     * ربط الأحداث والأزرار
     */
    initEventListeners() {
        // فتح اللوحة من شريط التيكر
        document.getElementById('btnTickerOpenBoard')?.addEventListener('click', () => this.openModal());
        
        // فتح اللوحة من شريط الرأس HUD
        document.getElementById('btnOpenWinnersBoard')?.addEventListener('click', () => this.openModal());

        // فتح اللوحة من شريط القائمة العلوية Navbar
        document.getElementById('navBtnWinners')?.addEventListener('click', () => this.openModal());

        // فتح اللوحة من قائمة البداية Start Menu
        document.getElementById('btnStartWinners')?.addEventListener('click', () => this.openModal());

        // إغلاق اللوحة
        document.getElementById('btnCloseWinnersBoard')?.addEventListener('click', () => this.closeModal());
        document.getElementById('btnCloseWinnersBoardHeader')?.addEventListener('click', () => this.closeModal());

        // تغيير اسم اللاعب
        document.getElementById('btnChangePlayerName')?.addEventListener('click', () => {
            const current = this.playerName.replace(' 🌟', '');
            const newName = prompt('أدخل اسمك أو لقبك الذي تريده أن يظهر في قائمة الفائزين والمكافآت:', current);
            if (newName && newName.trim()) {
                this.setPlayerName(newName.trim());
            }
        });

        // إغلاق عند النقر على الخلفية المعتمة
        const modal = document.getElementById('winnersBoardModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeModal();
            });
        }
    }
}

// تهيئة الكائن العام لإدارة لوحة الفائزين والمكافآت
window.winnersBoardManager = new WinnersBoardManager();
