/**
 * محرك اللعبة الرئيسي، إدارة الحالات، الرسوميات، والتصادمات
 */

class ChickenGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        // أبعاد مساحة اللعب
        this.mapWidth = 860;
        this.mapHeight = 560;

        // حالة اللعبة الحالية
        this.state = 'START_MENU'; // 'START_MENU', 'LEVEL_SELECT', 'PLAYING', 'PAUSED', 'LEVEL_WIN', 'GAME_OVER', 'GAME_COMPLETE'

        this.currentLevelIndex = 0;
        this.score = 0;
        this.levelScore = 0;
        this.levelTime = 0;
        this.eggsCollected = 0;
        this.requiredEggs = 0;
        this.hasKey = false;
        this.freezeTimer = 0;
        this.screenShake = 0; // اهتزاز الشاشة عند هجوم الثعلب والمؤثرات

        // تقدم اللاعب المخزن محلياً
        this.unlockedLevels = 1;
        this.levelStars = {};
        this.loadProgress();

        // كائنات اللعبة
        this.player = null;
        this.coop = null;
        this.walls = [];
        this.spikes = [];
        this.saws = [];
        this.bearTraps = [];
        this.crumbling = [];
        this.mud = [];
        this.dartShooters = [];
        this.darts = [];
        this.foxes = [];
        this.hiddenPits = [];
        this.spikedBalls = [];
        this.ambushFoxes = [];
        this.collectibles = [];
        this.particles = [];
        this.floatingTexts = [];

        // مدخلات التحكم
        this.input = {
            up: false,
            down: false,
            left: false,
            right: false
        };

        // تتبع وقت اللعب الفعلي للإعلانات المنبثقة الإلزامية كل 60 ثانية
        this.activePlayTimeMs = 0;
        this.lastActiveTimestamp = null;
        this.wasBgmPlayingBeforeAd = false;

        this.lastTime = 0;
        this.initInputListeners();
        this.initUI();

        // مزامنة لوحة الفائزين والمكافآت بالنقاط المحفوظة
        if (window.winnersBoardManager && typeof window.winnersBoardManager.updatePlayerScore === 'function') {
            window.winnersBoardManager.updatePlayerScore(this.score, false);
        }

        // بدء حلقة التحديث والرسم
        requestAnimationFrame((timestamp) => this.loop(timestamp));
    }

    loadProgress() {
        try {
            const saved = localStorage.getItem('chicken_game_progress');
            if (saved) {
                const data = JSON.parse(saved);
                this.unlockedLevels = data.unlockedLevels || 1;
                this.levelStars = data.levelStars || {};
                if (typeof data.score === 'number' && data.score >= 0) {
                    this.score = data.score;
                    if (window.securityWAF) {
                        window.securityWAF.lastValidScore = this.score;
                        window.securityWAF.lastScoreHash = window.securityWAF.generateScoreHash(this.score);
                    }
                }
            }
        } catch (e) {
            console.warn('تعذر تحميل التقدم من الذاكرة المحلية:', e);
        }
    }

    saveProgress() {
        try {
            const data = {
                unlockedLevels: this.unlockedLevels,
                levelStars: this.levelStars,
                score: this.score
            };
            localStorage.setItem('chicken_game_progress', JSON.stringify(data));
        } catch (e) {
            console.warn('تعذر حفظ التقدم:', e);
        }
    }

    initInputListeners() {
        // لوحة المفاتيح
        window.addEventListener('keydown', (e) => {
            // منع تحريك أو تمرير الصفحة (Scrolling) عند الضغط على الأسهم ومفتاح المسافة
            const scrollPreventKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'];
            const isTyping = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName);
            if ((scrollPreventKeys.includes(e.code) || ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) && !isTyping) {
                e.preventDefault();
            }

            if (['ArrowUp', 'KeyW'].includes(e.code)) this.input.up = true;
            if (['ArrowDown', 'KeyS'].includes(e.code)) this.input.down = true;
            if (['ArrowLeft', 'KeyA'].includes(e.code)) this.input.left = true;
            if (['ArrowRight', 'KeyD'].includes(e.code)) this.input.right = true;

            if (e.code === 'KeyP' || e.code === 'Escape') {
                this.togglePause();
            }

            // تفعيل الصوت عند أول تفاعل
            if (window.soundEngine) window.soundEngine.init();
        });

        window.addEventListener('keyup', (e) => {
            // منع السلوك الافتراضي أيضاً في keyup
            const scrollPreventKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'];
            const isTyping = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName);
            if ((scrollPreventKeys.includes(e.code) || ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) && !isTyping) {
                e.preventDefault();
            }

            if (['ArrowUp', 'KeyW'].includes(e.code)) this.input.up = false;
            if (['ArrowDown', 'KeyS'].includes(e.code)) this.input.down = false;
            if (['ArrowLeft', 'KeyA'].includes(e.code)) this.input.left = false;
            if (['ArrowRight', 'KeyD'].includes(e.code)) this.input.right = false;
        });

        // إعداد أزرار الشاشة اللمسية للهواتف والأجهزة الذكية
        const btnUp = document.getElementById('btnUp');
        const btnDown = document.getElementById('btnDown');
        const btnLeft = document.getElementById('btnLeft');
        const btnRight = document.getElementById('btnRight');

        const bindTouch = (btn, direction) => {
            if (!btn) return;
            const onStart = (e) => {
                e.preventDefault();
                this.input[direction] = true;
                btn.classList.add('active');
                if (window.soundEngine) window.soundEngine.init();
            };
            const onEnd = (e) => {
                e.preventDefault();
                this.input[direction] = false;
                btn.classList.remove('active');
            };

            btn.addEventListener('touchstart', onStart, { passive: false });
            btn.addEventListener('touchend', onEnd, { passive: false });
            btn.addEventListener('touchcancel', onEnd, { passive: false });
            btn.addEventListener('mousedown', onStart);
            btn.addEventListener('mouseup', onEnd);
            btn.addEventListener('mouseleave', onEnd);
        };

        bindTouch(btnUp, 'up');
        bindTouch(btnDown, 'down');
        bindTouch(btnLeft, 'left');
        bindTouch(btnRight, 'right');
    }

    initUI() {
        // زر الصوت
        const btnMute = document.getElementById('btnMute');
        if (btnMute) {
            btnMute.addEventListener('click', () => {
                const muted = window.soundEngine.toggleMute();
                btnMute.innerHTML = muted ? '🔇' : '🔊';
            });
        }

        // زر إعادة المرحلة
        const btnRestart = document.getElementById('btnRestart');
        if (btnRestart) {
            btnRestart.addEventListener('click', () => {
                if (this.state === 'PLAYING' || this.state === 'PAUSED') {
                    this.startLevel(this.currentLevelIndex);
                }
            });
        }

        // زر الإيقاف المؤقت
        const btnPause = document.getElementById('btnPause');
        if (btnPause) {
            btnPause.addEventListener('click', () => this.togglePause());
        }

        // نقرة نقنقة ممتعة للدجاجة بمجرد النقر على مساحة اللعب
        this.canvas.addEventListener('click', () => {
            if (this.state === 'PLAYING' && window.soundEngine) {
                window.soundEngine.playCluck();
            }
        });
    }

    togglePause() {
        // حماية أمنية: منع التخطي أو التلاعب بحالة اللعبة أثناء عرض الإعلانات
        if (window.adManager && window.adManager.isAdPlaying) {
            return;
        }
        if (this.state === 'PLAYING') {
            this.state = 'PAUSED';
            this.lastActiveTimestamp = null;
            this.showModal('pauseModal');
        } else if (this.state === 'PAUSED') {
            this.state = 'PLAYING';
            this.lastActiveTimestamp = Date.now();
            this.hideModals();
        }
    }

    startLevel(index) {
        // فحص شرط الاشتراك الإلزامي في القناة للعب
        if (window.featuresManager && !window.featuresManager.canPlay()) {
            window.featuresManager.showMandatorySubModal(() => {
                this.startLevel(index);
            });
            return;
        }

        if (index < 0 || index >= window.GAME_LEVELS.length) return;
        this.currentLevelIndex = index;
        const levelData = window.GAME_LEVELS[index];

        this.levelScore = 0;
        this.levelTime = 0;
        this.eggsCollected = 0;
        this.requiredEggs = levelData.requiredEggs;
        this.hasKey = false;
        this.freezeTimer = 0;
        this.particles = [];
        this.floatingTexts = [];
        this.darts = [];

        // إنشاء اللاعب
        this.player = new ChickenPlayer(levelData.playerStart.x, levelData.playerStart.y);

        // إنشاء القن
        this.coop = new ChickenCoop(levelData.coop.x, levelData.coop.y, levelData.coop.w, levelData.coop.h);

        // نسخ الجدران والحواجز
        this.walls = JSON.parse(JSON.stringify(levelData.walls));

        // إنشاء الأفخاخ
        this.spikes = (levelData.spikes || []).map(s =>
            new SpikeTrap(s.x, s.y, s.w, s.h, s.isTimed, s.offset, s.cycleTime)
        );

        this.saws = (levelData.saws || []).map(s =>
            new SawTrap(s.startX, s.startY, s.endX, s.endY, s.speed, s.radius)
        );

        this.bearTraps = (levelData.bearTraps || []).map(b =>
            new BearTrap(b.x, b.y, b.radius)
        );

        this.crumbling = (levelData.crumbling || []).map(c =>
            new CrumblingFloor(c.x, c.y, c.w, c.h)
        );

        this.mud = (levelData.mud || []).map(m =>
            new MudPuddle(m.x, m.y, m.w, m.h)
        );

        this.dartShooters = (levelData.dartShooters || []).map(d =>
            new DartShooter(d.x, d.y, d.dirX, d.dirY, d.interval, d.offset)
        );

        this.foxes = (levelData.foxes || []).map(f =>
            new FoxEnemy(f.startX, f.startY, f.endX, f.endY, f.speed, f.isChaser)
        );

        // الحفر السحيقة المخفية والمموهة
        this.hiddenPits = (levelData.hiddenPits || []).map(p =>
            new HiddenPitTrap(p.x, p.y, p.w, p.h)
        );

        // الكرات الحديدية المشوكة الدوارة والمتأرجحة
        this.spikedBalls = (levelData.spikedBalls || []).map(b =>
            new SpikedIronBall(b)
        );

        // ثعالب الكمائن المتخفية في الشجيرات
        this.ambushFoxes = (levelData.ambushFoxes || []).map(a =>
            new AmbushFox(a.x, a.y, a.speed)
        );

        // العناصر القابلة للجمع
        this.collectibles = (levelData.collectibles || []).map(c =>
            new Collectible(c.x, c.y, c.type)
        );

        this.state = 'PLAYING';
        this.lastActiveTimestamp = Date.now();
        this.hideModals();
        this.updateHUD();

        // إعادة تهيئة أزرار الإعلانات للمرحلة الجديدة
        window.scoreAlreadyDoubled = false;
        const btnDouble = document.getElementById('btnDoubleScoreWithAd');
        if (btnDouble) {
            btnDouble.disabled = false;
            btnDouble.style.opacity = '1';
            btnDouble.innerText = '📺 شاهد إعلاناً لمضاعفة نقاطك x2 💰';
        }
        if (window.adManager) {
            window.adManager.updateEarningsUI();
        }

        if (window.soundEngine) {
            window.soundEngine.startBGM();
            window.soundEngine.playCluck();
        }
    }

    addFloatingText(text, x, y, color = '#ffeb3b') {
        this.floatingTexts.push({
            text: text,
            x: x,
            y: y,
            color: color,
            alpha: 1,
            life: 45
        });
    }

    update() {
        if (this.state !== 'PLAYING') {
            this.lastActiveTimestamp = null;
            return;
        }

        // حساب وقت اللعب الفعلي للإعلان المنبثق الإلزامي كل دقيقة (60 ثانية)
        const now = Date.now();
        if (!this.lastActiveTimestamp) {
            this.lastActiveTimestamp = now;
        }
        const delta = Math.min(now - this.lastActiveTimestamp, 500);
        this.lastActiveTimestamp = now;
        this.activePlayTimeMs += delta;

        if (this.activePlayTimeMs >= 60000) { // 60 ثانية لعب فعلي
            this.activePlayTimeMs = 0;
            this.lastActiveTimestamp = null;
            this.triggerMandatoryPopAd();
            return;
        }

        // تلاشي اهتزاز الشاشة تدريجياً
        if (this.screenShake > 0) {
            this.screenShake *= 0.86;
            if (this.screenShake < 0.2) this.screenShake = 0;
        }

        this.levelTime++;
        const isFrozen = (this.freezeTimer > 0);
        if (isFrozen) {
            this.freezeTimer--;
        }

        // فحص وجود الدجاجة في بركة طين
        let inMud = false;
        for (let mud of this.mud) {
            if (mud.checkOverlap(this.player)) {
                inMud = true;
                break;
            }
        }
        if (inMud) {
            this.player.speed = this.player.baseSpeed * 0.45;
        }

        // تحديث الدجاجة
        this.player.update(this.input, this.mapWidth, this.mapHeight, this.walls, isFrozen, this.particles);

        // تحديث الأرضيات المتداعية
        for (let cr of this.crumbling) {
            cr.update(this.player, isFrozen, this.particles);
            if (cr.checkFall(this.player)) {
                const isDead = this.player.takeDamage(this.particles);
                this.addFloatingText("سقوط في الهاوية!", this.player.x, this.player.y - 15, '#ff5252');
                this.player.resetPosition();
                if (isDead && this.player.lives <= 0) {
                    this.handleGameOver();
                    return;
                }
            }
        }

        // تحديث الحفر السحيقة المخفية والمموهة
        for (let pit of this.hiddenPits) {
            pit.update(this.player, isFrozen, this.particles);
            if (pit.checkFall(this.player)) {
                const isDead = this.player.takeDamage(this.particles);
                this.screenShake = 16;
                this.addFloatingText("سقوط في حفرة مخفية مشوكة!", this.player.x, this.player.y - 18, '#ff5252');
                this.player.resetPosition();
                this.updateHUD();
                if (isDead && this.player.lives <= 0) {
                    this.handleGameOver();
                    return;
                }
            }
        }

        // تحديث الأشواك
        for (let spike of this.spikes) {
            spike.update(isFrozen);
            if (spike.checkCollision(this.player)) {
                const isDead = this.player.takeDamage(this.particles);
                this.addFloatingText("أشواك حادة!", this.player.x, this.player.y - 15, '#ff5252');
                if (isDead) {
                    this.player.resetPosition();
                    if (this.player.lives <= 0) {
                        this.handleGameOver();
                        return;
                    }
                }
            }
        }

        // تحديث المناشير الدوارة
        for (let saw of this.saws) {
            saw.update(isFrozen, this.particles);
            if (saw.checkCollision(this.player)) {
                const isDead = this.player.takeDamage(this.particles);
                this.addFloatingText("منشار فولاذي!", this.player.x, this.player.y - 15, '#ff5252');
                if (isDead) {
                    this.player.resetPosition();
                    if (this.player.lives <= 0) {
                        this.handleGameOver();
                        return;
                    }
                }
            }
        }

        // تحديث الكرات الحديدية المشوكة الدوارة والمتأرجحة
        for (let ball of this.spikedBalls) {
            ball.update(isFrozen, this.particles);
            if (ball.checkCollision(this.player)) {
                if (this.player.invulnerableTimer > 0) {
                    // فترة حماية وميضية
                } else if (this.player.hasShield) {
                    this.player.hasShield = false;
                    this.player.invulnerableTimer = 60;
                    this.screenShake = 18;
                    if (window.soundEngine) {
                        window.soundEngine.playShieldBreak();
                        window.soundEngine.playSpikedBallImpact();
                    }
                    for (let i = 0; i < 22; i++) {
                        const angle = Math.random() * Math.PI * 2;
                        const spd = 2 + Math.random() * 4;
                        this.particles.push(new Particle(this.player.x, this.player.y, '#00e5ff', 3.5, Math.cos(angle) * spd, Math.sin(angle) * spd, 35));
                    }
                    this.addFloatingText("🛡️ تكسر الدرع وحماك من الكرة المشوكة!", this.player.x, this.player.y - 20, '#00e5ff');
                    this.updateHUD();
                } else {
                    const isDead = this.player.takeDamage(this.particles);
                    this.screenShake = 22;
                    if (window.soundEngine) {
                        window.soundEngine.playSpikedBallImpact();
                    }
                    this.addFloatingText("ضربة كرة حديدية مشوكة! -1 ❤️", this.player.x, this.player.y - 20, '#ff1744');
                    this.updateHUD();
                    if (isDead) {
                        this.player.resetPosition();
                        if (this.player.lives <= 0) {
                            this.handleGameOver();
                            return;
                        }
                    }
                }
            }
        }

        // تحديث مصائد الدببة
        for (let b of this.bearTraps) {
            b.update(isFrozen);
            if (b.checkCollision(this.player, this.particles)) {
                const isDead = this.player.takeDamage(this.particles);
                this.addFloatingText("فخ الدببة!", this.player.x, this.player.y - 15, '#ff5252');
                if (isDead) {
                    this.player.resetPosition();
                    if (this.player.lives <= 0) {
                        this.handleGameOver();
                        return;
                    }
                }
            }
        }

        // تحديث رماة السهام
        for (let shooter of this.dartShooters) {
            shooter.update(isFrozen, this.darts);
        }

        // تحديث السهام المقذوفة
        for (let i = this.darts.length - 1; i >= 0; i--) {
            const dart = this.darts[i];
            dart.update(isFrozen, this.walls, this.mapWidth, this.mapHeight, this.particles);

            if (dart.checkCollision(this.player)) {
                dart.isDead = true;
                const isDead = this.player.takeDamage(this.particles);
                this.addFloatingText("سهم طائش!", this.player.x, this.player.y - 15, '#ff5252');
                if (isDead) {
                    this.player.resetPosition();
                    if (this.player.lives <= 0) {
                        this.handleGameOver();
                        return;
                    }
                }
            }

            if (dart.isDead) {
                this.darts.splice(i, 1);
            }
        }

        // تحديث الثعالب الماكرة والمتتبعة الصيادة
        for (let fox of this.foxes) {
            fox.update(this.player, isFrozen, this.walls, this.particles);

            if (fox.checkCollision(this.player)) {
                if (this.player.invulnerableTimer > 0) {
                    // اللاعب في فترة حماية وميضية
                } else if (this.player.hasShield) {
                    // درع الحماية يمتص الهجمة ويتكسر مع صعق الثعلب
                    this.player.hasShield = false;
                    this.player.invulnerableTimer = 60;
                    fox.stunTimer = 60;
                    this.screenShake = 14;
                    if (window.soundEngine) window.soundEngine.playShieldBreak();
                    for (let i = 0; i < 22; i++) {
                        const angle = Math.random() * Math.PI * 2;
                        const spd = 2 + Math.random() * 4;
                        this.particles.push(new Particle(this.player.x, this.player.y, '#00e5ff', 3.5, Math.cos(angle) * spd, Math.sin(angle) * spd, 35));
                    }
                    this.addFloatingText("🛡️ تكسر الدرع وأنقذك من فكي الثعلب!", this.player.x, this.player.y - 20, '#00e5ff');
                    this.updateHUD();
                } else if (fox.isChaser) {
                    // الثعلب المتتبع الصياد يقصي الدجاجة فوراً لتعيد اللعب من جديد
                    this.player.lives = 0;
                    this.screenShake = 26;
                    if (window.soundEngine) {
                        window.soundEngine.playHit();
                    }
                    for (let i = 0; i < 35; i++) {
                        const angle = Math.random() * Math.PI * 2;
                        const spd = 2 + Math.random() * 5;
                        const color = (i % 2 === 0) ? '#ffeb3b' : '#ff1744';
                        this.particles.push(new Particle(this.player.x, this.player.y, color, 3.5, Math.cos(angle) * spd, Math.sin(angle) * spd, 45));
                    }
                    this.addFloatingText("🦊 افتراس الثعلب! تم إقصاؤك من اللعبة!", this.player.x, this.player.y - 25, '#ff1744');
                    this.updateHUD();
                    this.handleGameOver("FOX_ELIMINATED");
                    return;
                } else {
                    // الثعلب العادي يسبب ضرراً
                    const isDead = this.player.takeDamage(this.particles);
                    this.screenShake = 8;
                    this.addFloatingText("عضة ثعلب ماكر! -1 ❤️", this.player.x, this.player.y - 15, '#ff5252');
                    this.updateHUD();
                    if (isDead) {
                        this.player.resetPosition();
                        if (this.player.lives <= 0) {
                            this.handleGameOver();
                            return;
                        }
                    }
                }
            }
        }

        // تحديث ثعالب الكمائن المخفية في الشجيرات
        for (let ambush of this.ambushFoxes) {
            ambush.update(this.player, isFrozen, this.walls, this.particles);
            if (ambush.checkCollision(this.player)) {
                if (this.player.invulnerableTimer > 0) {
                    // فترة حماية وميضية
                } else if (this.player.hasShield) {
                    this.player.hasShield = false;
                    this.player.invulnerableTimer = 60;
                    ambush.foxEntity.stunTimer = 60;
                    this.screenShake = 14;
                    if (window.soundEngine) window.soundEngine.playShieldBreak();
                    for (let i = 0; i < 22; i++) {
                        const angle = Math.random() * Math.PI * 2;
                        const spd = 2 + Math.random() * 4;
                        this.particles.push(new Particle(this.player.x, this.player.y, '#00e5ff', 3.5, Math.cos(angle) * spd, Math.sin(angle) * spd, 35));
                    }
                    this.addFloatingText("🛡️ انكسر الدرع وأنقذك من كمين الثعلب!", this.player.x, this.player.y - 20, '#00e5ff');
                    this.updateHUD();
                } else {
                    this.player.lives = 0;
                    this.screenShake = 26;
                    if (window.soundEngine) {
                        window.soundEngine.playHit();
                    }
                    for (let i = 0; i < 35; i++) {
                        const angle = Math.random() * Math.PI * 2;
                        const spd = 2 + Math.random() * 5;
                        const color = (i % 2 === 0) ? '#ffeb3b' : '#ff1744';
                        this.particles.push(new Particle(this.player.x, this.player.y, color, 3.5, Math.cos(angle) * spd, Math.sin(angle) * spd, 45));
                    }
                    this.addFloatingText("🦊 وثوب كمين الثعلب! تم الإقصاء!", this.player.x, this.player.y - 25, '#ff1744');
                    this.updateHUD();
                    this.handleGameOver("FOX_ELIMINATED");
                    return;
                }
            }
        }

        // التقاط العناصر
        for (let i = this.collectibles.length - 1; i >= 0; i--) {
            const item = this.collectibles[i];
            item.update();

            if (item.checkCollision(this.player)) {
                this.handleItemPickup(item);
                this.collectibles.splice(i, 1);
            }
        }

        // تحديث حالة قن الدجاج
        const allEggsCollected = (this.eggsCollected >= this.requiredEggs);
        this.coop.update(allEggsCollected);

        // فحص الفوز بالوصول إلى القن
        if (this.coop.checkWin(this.player)) {
            this.handleLevelWin();
            return;
        }

        // تحديث الجسيمات
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update();
            if (this.particles[i].life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        // تحديث النصوص العائمة
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.y -= 0.8;
            ft.life--;
            ft.alpha = ft.life / 45;
            if (ft.life <= 0) {
                this.floatingTexts.splice(i, 1);
            }
        }

        this.updateHUD();
    }

    handleItemPickup(item) {
        if (item.type === 'EGG') {
            this.eggsCollected++;
            this.score += 500;
            this.levelScore += 500;
            if (window.soundEngine) window.soundEngine.playCollectEgg();
            this.addFloatingText("+500 بيضة ذهبية!", item.x, item.y, '#ffd700');

            // نجوم ذهبية متطايرة
            for (let i = 0; i < 14; i++) {
                const a = Math.random() * Math.PI * 2;
                const spd = 2 + Math.random() * 3;
                this.particles.push(new Particle(item.x, item.y, '#ffeb3b', 4, Math.cos(a) * spd, Math.sin(a) * spd, 35, 'star'));
            }
        } else if (item.type === 'CORN') {
            this.score += 100;
            this.levelScore += 100;
            if (window.soundEngine) window.soundEngine.playCollectCorn();
            this.addFloatingText("+100", item.x, item.y, '#ffc107');
        } else if (item.type === 'SHIELD') {
            this.player.hasShield = true;
            if (window.soundEngine) window.soundEngine.playPowerup();
            this.addFloatingText("درع واقٍ!", item.x, item.y, '#00e5ff');
        } else if (item.type === 'SPEED') {
            this.player.speedBoostTimer = 480; // 8 ثوانٍ
            if (window.soundEngine) window.soundEngine.playPowerup();
            this.addFloatingText("سرعة خارقة!", item.x, item.y, '#ffd600');
        } else if (item.type === 'FREEZE') {
            this.freezeTimer = 300; // 5 ثوانٍ
            if (window.soundEngine) window.soundEngine.playPowerup();
            this.addFloatingText("تجميد الزمن!", item.x, item.y, '#80d8ff');
        } else if (item.type === 'HEART') {
            if (this.player.lives < this.player.maxLives) {
                this.player.lives++;
            }
            if (window.soundEngine) window.soundEngine.playPowerup();
            this.addFloatingText("+1 قلب!", item.x, item.y, '#ff5252');
        } else if (item.type === 'KEY') {
            this.hasKey = true;
            if (window.soundEngine) window.soundEngine.playPowerup();
            this.addFloatingText("المفتاح الذهبي!", item.x, item.y, '#ffd700');

            // فتح البوابات المقفلة في المرحلة
            for (let w of this.walls) {
                if (w.isGate) {
                    w.isOpen = true;
                }
            }
        }
    }

    handleLevelWin() {
        this.state = 'LEVEL_WIN';
        if (window.soundEngine) window.soundEngine.playWinLevel();

        // حساب عدد النجوم بناء على الوقت وجمع البيض
        let stars = 1;
        if (this.eggsCollected >= this.requiredEggs) stars = 2;
        if (this.levelTime < 1800 && this.eggsCollected >= this.requiredEggs) stars = 3;

        this.levelStars[this.currentLevelIndex + 1] = Math.max(this.levelStars[this.currentLevelIndex + 1] || 0, stars);

        // مكافأة إتمام المرحلة بالنقاط لشحن الألعاب
        this.score += 2000;
        this.levelScore += 2000;

        // فتح المستوى التالي
        if (this.currentLevelIndex + 2 > this.unlockedLevels) {
            this.unlockedLevels = Math.min(window.GAME_LEVELS.length, this.currentLevelIndex + 2);
        }
        this.saveProgress();

        // مؤثرات الاحتفال (Confetti)
        for (let i = 0; i < 70; i++) {
            const colors = ['#f44336', '#e91e63', '#9c27b0', '#2196f3', '#4caf50', '#ffeb3b', '#ff9800'];
            const col = colors[Math.floor(Math.random() * colors.length)];
            const x = Math.random() * this.mapWidth;
            const y = Math.random() * (this.mapHeight * 0.4);
            this.particles.push(new Particle(x, y, col, 4, (Math.random() - 0.5) * 4, Math.random() * 3 + 1, 90));
        }

        // التحقق إن كانت المرحلة الأخيرة
        if (this.currentLevelIndex >= window.GAME_LEVELS.length - 1) {
            this.showGameComplete();
        } else {
            this.showLevelWinModal(stars);
        }
    }

    handleGameOver(reason = 'NORMAL') {
        this.state = 'GAME_OVER';
        if (window.soundEngine) window.soundEngine.playGameOver();
        this.showGameOverModal(reason);
    }

    updateHUD() {
        const heartsContainer = document.getElementById('hudHearts');
        if (heartsContainer && this.player) {
            let heartsHtml = '';
            for (let i = 0; i < this.player.maxLives; i++) {
                if (i < this.player.lives) {
                    heartsHtml += '<span class="heart full">❤️</span>';
                } else {
                    heartsHtml += '<span class="heart empty">🖤</span>';
                }
            }
            heartsContainer.innerHTML = heartsHtml;
        }

        const eggsText = document.getElementById('hudEggs');
        if (eggsText) {
            eggsText.innerText = `${this.eggsCollected} / ${this.requiredEggs}`;
        }

        // حماية النقاط من التلاعب والقرصنة عبر جدار الحماية WAF
        if (window.securityWAF && !window.securityWAF.verifyScoreIntegrity(this.score)) {
            this.score = window.securityWAF.lastValidScore;
            alert('🚨 تم كشف تلاعب غير شرعي بالنقاط! تم استعادة الرصيد الأصلي وتأمين الحساب.');
        }

        const scoreText = document.getElementById('hudScore');
        if (scoreText) {
            scoreText.innerText = `${this.score.toLocaleString()}`;
        }

        // تحديث لوحة الفائزين والمكافآت وشريط التيكر المباشر تلقائياً
        if (window.winnersBoardManager && typeof window.winnersBoardManager.updatePlayerScore === 'function') {
            window.winnersBoardManager.updatePlayerScore(this.score, true);
        }

        const levelTitle = document.getElementById('hudLevelTitle');
        if (levelTitle) {
            const curLvl = window.GAME_LEVELS[this.currentLevelIndex];
            levelTitle.innerText = curLvl ? curLvl.title : '';
        }
    }

    draw() {
        this.ctx.save();
        if (this.screenShake > 0) {
            const sx = (Math.random() - 0.5) * this.screenShake;
            const sy = (Math.random() - 0.5) * this.screenShake;
            this.ctx.translate(sx, sy);
        }

        this.ctx.clearRect(-20, -20, this.mapWidth + 40, this.mapHeight + 40);

        // رسم خلفية الخريطة
        this.drawBackground();

        // رسم برك الطين أولاً لتكون أسفل العناصر
        for (let m of this.mud) {
            m.draw(this.ctx);
        }

        // رسم الأرضيات المتداعية
        for (let cr of this.crumbling) {
            cr.draw(this.ctx);
        }

        // رسم الحفر السحيقة المخفية والمموهة
        for (let pit of this.hiddenPits) {
            pit.draw(this.ctx);
        }

        // رسم الجدران والبوابات
        this.drawWalls();

        // رسم الأفخاخ
        for (let spike of this.spikes) {
            spike.draw(this.ctx);
        }

        for (let saw of this.saws) {
            saw.draw(this.ctx);
        }

        // رسم الكرات الحديدية المشوكة المتأرجحة والمتدحرجة
        for (let ball of this.spikedBalls) {
            ball.draw(this.ctx);
        }

        for (let b of this.bearTraps) {
            b.draw(this.ctx);
        }

        for (let shooter of this.dartShooters) {
            shooter.draw(this.ctx);
        }

        // رسم السهام المقذوفة
        for (let dart of this.darts) {
            dart.draw(this.ctx);
        }

        // رسم القن
        if (this.coop) {
            this.coop.draw(this.ctx);
        }

        // رسم العناصر القابلة للجمع
        for (let item of this.collectibles) {
            item.draw(this.ctx);
        }

        // رسم ثعالب الكمائن المشبوهة
        for (let ambush of this.ambushFoxes) {
            ambush.draw(this.ctx);
        }

        // رسم الثعالب
        for (let fox of this.foxes) {
            fox.draw(this.ctx);
        }

        // رسم الدجاجة
        if (this.player) {
            this.player.draw(this.ctx);
        }

        // رسم الجسيمات
        for (let p of this.particles) {
            p.draw(this.ctx);
        }

        // رسم النصوص العائمة (+200، تنبيهات)
        this.drawFloatingTexts();

        // تأثير تجمد الزمن على الشاشة بأكملها
        if (this.freezeTimer > 0) {
            this.ctx.save();
            this.ctx.fillStyle = 'rgba(0, 229, 255, 0.12)';
            this.ctx.fillRect(0, 0, this.mapWidth, this.mapHeight);

            this.ctx.strokeStyle = '#00e5ff';
            this.ctx.lineWidth = 4;
            this.ctx.strokeRect(0, 0, this.mapWidth, this.mapHeight);

            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = 'bold 18px Tajawal, Cairo, sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`⏱️ تجميد الزمن: ${Math.ceil(this.freezeTimer / 60)} ثوانٍ`, this.mapWidth / 2, 35);
            this.ctx.restore();
        }

        this.ctx.restore();
    }

    drawBackground() {
        const curLvl = window.GAME_LEVELS[this.currentLevelIndex];
        const theme = curLvl ? curLvl.theme : 'grass';

        if (theme === 'grass') {
            // عشب أخضر مزهر
            this.ctx.fillStyle = '#7cb342';
            this.ctx.fillRect(0, 0, this.mapWidth, this.mapHeight);

            // مربعات عشب خفيفة
            this.ctx.fillStyle = '#689f38';
            for (let x = 0; x < this.mapWidth; x += 60) {
                for (let y = 0; y < this.mapHeight; y += 60) {
                    if ((x / 60 + y / 60) % 2 === 0) {
                        this.ctx.fillRect(x, y, 60, 60);
                    }
                }
            }
        } else if (theme === 'dirt') {
            // تراب المزرعة البني
            this.ctx.fillStyle = '#8d6e63';
            this.ctx.fillRect(0, 0, this.mapWidth, this.mapHeight);
            this.ctx.fillStyle = '#795548';
            for (let x = 0; x < this.mapWidth; x += 60) {
                for (let y = 0; y < this.mapHeight; y += 60) {
                    if ((x / 60 + y / 60) % 2 === 0) {
                        this.ctx.fillRect(x, y, 60, 60);
                    }
                }
            }
        } else if (theme === 'stone') {
            // قلعة حجرية رمادية
            this.ctx.fillStyle = '#546e7a';
            this.ctx.fillRect(0, 0, this.mapWidth, this.mapHeight);
            this.ctx.fillStyle = '#455a64';
            for (let x = 0; x < this.mapWidth; x += 60) {
                for (let y = 0; y < this.mapHeight; y += 60) {
                    if ((x / 60 + y / 60) % 2 === 0) {
                        this.ctx.fillRect(x, y, 60, 60);
                    }
                }
            }
        } else if (theme === 'lava') {
            // بيئة بركانية مظلمة مع وهج أحمر
            this.ctx.fillStyle = '#372a28';
            this.ctx.fillRect(0, 0, this.mapWidth, this.mapHeight);
            this.ctx.fillStyle = '#261b1a';
            for (let x = 0; x < this.mapWidth; x += 60) {
                for (let y = 0; y < this.mapHeight; y += 60) {
                    if ((x / 60 + y / 60) % 2 === 0) {
                        this.ctx.fillRect(x, y, 60, 60);
                    }
                }
            }
        }
    }

    drawWalls() {
        for (let wall of this.walls) {
            this.ctx.save();
            if (wall.isGate) {
                if (wall.isOpen) {
                    // بوابة مفتوحة
                    this.ctx.strokeStyle = '#8d6e63';
                    this.ctx.lineWidth = 3;
                    this.ctx.setLineDash([6, 6]);
                    this.ctx.strokeRect(wall.x, wall.y, wall.w, wall.h);
                } else {
                    // بوابة خشبية مقفلة بسلاسل وقفل
                    this.ctx.fillStyle = '#5d4037';
                    this.ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
                    this.ctx.strokeStyle = '#3e2723';
                    this.ctx.lineWidth = 2;
                    this.ctx.strokeRect(wall.x, wall.y, wall.w, wall.h);

                    // رمز القفل
                    this.ctx.fillStyle = '#ffd700';
                    this.ctx.beginPath();
                    this.ctx.arc(wall.x + wall.w / 2, wall.y + wall.h / 2 - 3, 4, 0, Math.PI * 2);
                    this.ctx.rect(wall.x + wall.w / 2 - 4.5, wall.y + wall.h / 2 - 2, 9, 7);
                    this.ctx.fill();
                }
            } else {
                // جدار سياج خشبي أو حجري بارز
                this.ctx.fillStyle = '#4e342e';
                this.ctx.fillRect(wall.x, wall.y, wall.w, wall.h);

                // تفاصيل الخشب والحدود
                this.ctx.strokeStyle = '#3e2723';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(wall.x, wall.y, wall.w, wall.h);

                // لمسة إضاءة على الحافة العلوية للجدار
                this.ctx.fillStyle = '#6d4c41';
                this.ctx.fillRect(wall.x, wall.y, wall.w, 4);
            }
            this.ctx.restore();
        }
    }

    drawFloatingTexts() {
        for (let ft of this.floatingTexts) {
            this.ctx.save();
            this.ctx.globalAlpha = Math.max(0, ft.alpha);
            this.ctx.fillStyle = ft.color;
            this.ctx.shadowColor = '#000000';
            this.ctx.shadowBlur = 4;
            this.ctx.font = 'bold 15px Tajawal, Cairo, sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(ft.text, ft.x, ft.y);
            this.ctx.restore();
        }
    }

    loop(timestamp) {
        this.update();
        this.draw();
        requestAnimationFrame((t) => this.loop(t));
    }

    // إدارة نوافذ الواجهة (Modals)
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    hideModals() {
        const modals = document.querySelectorAll('.modal-overlay');
        modals.forEach(m => {
            // حماية: عدم إغلاق نوافذ الإعلانات النشطة إطلاقاً عبر hideModals العامة
            if (window.adManager && window.adManager.isAdPlaying) {
                if (m.id === 'rewardedAdModal' || m.id === 'interstitialAdModal' || m.id === 'mandatoryPopAdModal') {
                    return;
                }
            }
            m.style.display = 'none';
        });
    }

    showStartMenu() {
        this.state = 'START_MENU';
        this.hideModals();
        this.showModal('startModal');
    }

    showLevelSelect() {
        this.state = 'LEVEL_SELECT';
        this.hideModals();
        this.renderLevelGrid();
        this.showModal('levelSelectModal');
    }

    renderLevelGrid() {
        const grid = document.getElementById('levelsGrid');
        if (!grid) return;

        grid.innerHTML = '';
        window.GAME_LEVELS.forEach((lvl, idx) => {
            const isUnlocked = (idx + 1) <= this.unlockedLevels;
            const stars = this.levelStars[idx + 1] || 0;

            const card = document.createElement('div');
            card.className = `level-card ${isUnlocked ? 'unlocked' : 'locked'}`;

            let starsHtml = '';
            for (let s = 1; s <= 3; s++) {
                starsHtml += `<span class="star-icon ${s <= stars ? 'active' : ''}">★</span>`;
            }

            card.innerHTML = `
                <div class="level-number">${idx + 1}</div>
                <div class="level-card-title">${lvl.title.split(':')[1] || lvl.title}</div>
                <div class="level-stars">${isUnlocked ? starsHtml : '🔒 مقفل'}</div>
            `;

            if (isUnlocked) {
                card.addEventListener('click', () => {
                    this.startLevel(idx);
                });
            }

            grid.appendChild(card);
        });
    }

    // تشغيل الإعلان المنبثق الإلزامي وتجميد حركة اللعبة مع مكافأة 500 نقطة
    triggerMandatoryPopAd() {
        // إيقاف اللعبة وتجميد حركة اللاعب والأفخاخ مؤقتاً
        this.state = 'PAUSED';
        this.lastActiveTimestamp = null;

        // تصفير مدخلات التحكم لتجنب استمرار حركة الدجاجة أثناء توقف اللعبة
        this.input = { up: false, down: false, left: false, right: false };
        ['btnUp', 'btnDown', 'btnLeft', 'btnRight'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.remove('active');
        });

        // كتم موسيقى الخلفية مؤقتاً أثناء الإعلان
        if (window.soundEngine && window.soundEngine.bgmPlaying) {
            window.soundEngine.stopBGM();
            this.wasBgmPlayingBeforeAd = true;
        } else {
            this.wasBgmPlayingBeforeAd = false;
        }

        if (window.adManager) {
            window.adManager.showMandatoryPopUpAd(() => {
                // 1. إضافة 500 نقطة تلقائياً لرصيد اللاعب
                this.score += 500;
                this.levelScore += 500;

                // حماية وتأمين النقاط مع جدار الحماية WAF
                if (window.securityWAF) {
                    window.securityWAF.lastValidScore = this.score;
                    window.securityWAF.lastScoreHash = window.securityWAF.generateScoreHash(this.score);
                }
                this.saveProgress();
                this.updateHUD();

                // 2. مؤثرات بصرية وصوتية للمكافأة
                if (this.player) {
                    this.addFloatingText("+500 مكافأة الإعلان! 🎁", this.player.x, this.player.y - 25, '#ffd700');
                }
                if (window.soundEngine) {
                    window.soundEngine.playCollectEgg();
                    if (this.wasBgmPlayingBeforeAd) {
                        window.soundEngine.startBGM();
                    }
                }

                // 3. إظهار رسالة التهنئة العائمة الأنيقة
                this.showToast("🎉 تهانينا! تمت إضافة +500 نقطة إلى رصيدك لمشاهدة الإعلان بنجاح! تم استئناف اللعبة 🚀", "success");

                // 4. استئناف اللعبة فوراً (Resume)
                this.state = 'PLAYING';
                this.lastActiveTimestamp = Date.now();
            });
        } else {
            // استئناف فوري في حال عدم توفر مكتبة الإعلانات
            this.state = 'PLAYING';
            this.lastActiveTimestamp = Date.now();
        }
    }

    // إظهار رسائل التهنئة والتنبيه العائمة
    showToast(message, type = 'success') {
        if (window.referralSystem && typeof window.referralSystem.showToast === 'function') {
            window.referralSystem.showToast(message, type);
            return;
        }
        let toast = document.getElementById('gameToast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'gameToast';
            toast.className = 'referral-toast';
            document.body.appendChild(toast);
        }
        toast.innerText = message;
        toast.className = `referral-toast show ${type}`;
        if (this.toastTimer) clearTimeout(this.toastTimer);
        this.toastTimer = setTimeout(() => {
            toast.className = 'referral-toast';
        }, 4000);
    }

    showLevelWinModal(stars) {
        this.hideModals();
        const starsSpan = document.getElementById('winStars');
        if (starsSpan) {
            let starsStr = '';
            for (let i = 0; i < 3; i++) {
                starsStr += (i < stars) ? '⭐' : '☆';
            }
            starsSpan.innerHTML = starsStr;
        }

        const scoreSpan = document.getElementById('winScore');
        if (scoreSpan) scoreSpan.innerText = this.score;

        const eggsSpan = document.getElementById('winEggs');
        if (eggsSpan) eggsSpan.innerText = `${this.eggsCollected} / ${this.requiredEggs}`;

        this.showModal('levelWinModal');
    }

    showGameOverModal(reason = 'NORMAL') {
        this.hideModals();
        const scoreSpan = document.getElementById('loseScore');
        if (scoreSpan) scoreSpan.innerText = this.score;

        const avatar = document.getElementById('gameOverAvatar');
        const title = document.getElementById('gameOverTitle');
        const text = document.getElementById('gameOverText');

        if (reason === 'FOX_ELIMINATED') {
            if (avatar) avatar.innerText = '🦊🍗';
            if (title) {
                title.innerText = 'أمسك الثعلب الماكر بكوكو!';
                title.className = 'modal-title danger';
            }
            if (text) {
                text.innerHTML = `تم إقصاؤك من اللعبة بواسطة الثعلب المتتبع الجائع!<br>
                النقاط المحققة: <strong id="loseScore">${this.score}</strong><br>
                <div style="margin-top: 10px; font-size: 0.88rem; color: #ffcc80; background: rgba(230, 81, 0, 0.2); padding: 8px 12px; border-radius: 8px; border: 1px dashed #ff9800;">
                    💡 <strong>تكتيك النجاة:</strong> الثعلب الماكر يشم رائحة الدجاجة ويطاردها بذكاء! استدرجه خلف الجدران، أو التقط درع الحماية 🛡️ لتفادي عضته القاضية!
                </div>`;
            }
        } else {
            if (avatar) avatar.innerText = '💔';
            if (title) {
                title.innerText = 'وقعْتَ في الفخ!';
                title.className = 'modal-title danger';
            }
            if (text) {
                text.innerHTML = `نفدت قلوب الدجاجة كوكو!<br>النقاط المحققة: <strong id="loseScore">${this.score}</strong>`;
            }
        }

        this.showModal('gameOverModal');
    }

    showGameComplete() {
        this.state = 'GAME_COMPLETE';
        this.hideModals();
        const finalScoreSpan = document.getElementById('finalVictoryScore');
        if (finalScoreSpan) finalScoreSpan.innerText = this.score;
        this.showModal('gameCompleteModal');
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.game = new ChickenGame();

    // ربط أزرار النوافذ
    document.getElementById('btnStartGame')?.addEventListener('click', () => {
        window.game.startLevel(0);
    });

    document.getElementById('btnOpenLevelSelect')?.addEventListener('click', () => {
        window.game.showLevelSelect();
    });

    document.getElementById('btnCloseLevelSelect')?.addEventListener('click', () => {
        window.game.showStartMenu();
    });

    document.getElementById('btnResume')?.addEventListener('click', () => {
        window.game.togglePause();
    });

    document.getElementById('btnPauseRestart')?.addEventListener('click', () => {
        window.game.startLevel(window.game.currentLevelIndex);
    });

    document.getElementById('btnPauseSelectLevel')?.addEventListener('click', () => {
        window.game.showLevelSelect();
    });

    document.getElementById('btnNextLevel')?.addEventListener('click', () => {
        // فحص عرض إعلان بيني بين المراحل
        if (window.adManager) {
            window.adManager.showInterstitialAd(() => {
                window.game.startLevel(window.game.currentLevelIndex + 1);
            });
        } else {
            window.game.startLevel(window.game.currentLevelIndex + 1);
        }
    });

    document.getElementById('btnWinLevelSelect')?.addEventListener('click', () => {
        window.game.showLevelSelect();
    });

    document.getElementById('btnRetryLevel')?.addEventListener('click', () => {
        window.game.startLevel(window.game.currentLevelIndex);
    });

    document.getElementById('btnLoseLevelSelect')?.addEventListener('click', () => {
        window.game.showLevelSelect();
    });

    document.getElementById('btnVictoryRestart')?.addEventListener('click', () => {
        window.game.startLevel(0);
    });

    // 1. زر مشاهدة إعلان لإحياء الدجاجة واستكمال اللعبة فوراً (Revive Rewarded Ad)
    document.getElementById('btnReviveWithAd')?.addEventListener('click', () => {
        if (window.adManager && window.game) {
            window.adManager.showRewardedAd('REVIVE', () => {
                window.game.player.lives = window.game.player.maxLives;
                window.game.player.invulnerableTimer = 120;
                window.game.state = 'PLAYING';
                window.game.hideModals();
                window.game.updateHUD();
                window.game.addFloatingText("تمت النجاة واستعادة القلوب! ❤️", window.game.player.x, window.game.player.y - 20, '#4caf50');
                if (window.soundEngine) window.soundEngine.playPowerup();
            });
        }
    });

    // 2. زر مشاهدة إعلان لمضاعفة النقاط x2 (Double Score Rewarded Ad)
    document.getElementById('btnDoubleScoreWithAd')?.addEventListener('click', () => {
        if (window.scoreAlreadyDoubled) return;
        if (window.adManager && window.game) {
            window.adManager.showRewardedAd('DOUBLE_SCORE', () => {
                window.scoreAlreadyDoubled = true;
                const bonus = window.game.levelScore > 0 ? window.game.levelScore : 300;
                window.game.score += bonus;
                window.game.updateHUD();

                const winScoreElem = document.getElementById('winScore');
                if (winScoreElem) winScoreElem.innerText = `${window.game.score} (+${bonus} مضاعفة!)`;

                const btnDouble = document.getElementById('btnDoubleScoreWithAd');
                if (btnDouble) {
                    btnDouble.disabled = true;
                    btnDouble.style.opacity = '0.5';
                    btnDouble.innerText = '✅ تم مضاعفة النقاط بنجاح!';
                }
                if (window.soundEngine) window.soundEngine.playCollectEgg();
            });
        }
    });

    // 3. زر مشاهدة إعلان للحصول على درع حماية مجاني
    document.getElementById('btnFreeShieldWithAd')?.addEventListener('click', () => {
        if (window.adManager && window.game) {
            window.adManager.showRewardedAd('FREE_SHIELD', () => {
                window.game.startLevel(window.game.currentLevelIndex);
                if (window.game.player) {
                    window.game.player.hasShield = true;
                    window.game.addFloatingText("درع حماية مجاني مفعّل! 🛡️", window.game.player.x, window.game.player.y - 20, '#00e5ff');
                }
                if (window.soundEngine) window.soundEngine.playPowerup();
            });
        }
    });

    // 4. لوحة الأرباح وإعدادات معرف Google AdSense
    document.getElementById('btnMonetization')?.addEventListener('click', () => {
        if (window.adManager) {
            window.adManager.updateEarningsUI();
            const earningsModalElem = document.getElementById('adEarningsDisplayModal');
            if (earningsModalElem) {
                earningsModalElem.innerText = `$${window.adManager.stats.estimatedEarningsUSD.toFixed(2)}`;
            }
            const input = document.getElementById('adsensePubIdInput');
            if (input && window.adManager.config.publisherId && window.adManager.config.publisherId !== "ca-pub-XXXXXXXXXXXXXXXX") {
                input.value = window.adManager.config.publisherId;
            }
        }
        window.game.showModal('monetizationModal');
    });

    document.getElementById('btnCloseMonetization')?.addEventListener('click', () => {
        document.getElementById('monetizationModal').style.display = 'none';
    });

    document.getElementById('btnSavePubId')?.addEventListener('click', () => {
        const input = document.getElementById('adsensePubIdInput');
        if (input && window.adManager) {
            const success = window.adManager.setPublisherId(input.value.trim());
            if (success) {
                alert('✅ تم حفظ معرف Google AdSense وتفعيله بنجاح! ستبدأ الإعلانات الحقيقية بالظهور في اللعبة.');
                document.getElementById('monetizationModal').style.display = 'none';
            }
        }
    });

    // 5. أحداث متجر قسائم شحن الألعاب (Free Fire & PUBG Store)
    const openVoucherStore = () => {
        if (window.voucherStore) {
            window.voucherStore.renderStore();
        }
        window.game.showModal('voucherStoreModal');
    };

    document.getElementById('btnOpenVoucherStore')?.addEventListener('click', openVoucherStore);
    document.getElementById('btnStartVoucherStore')?.addEventListener('click', openVoucherStore);

    // 5.1 أحداث نافذة سحب الأرباح والأموال الحقيقي (Real Cash Withdrawal)
    const openWithdrawalModal = () => {
        if (window.withdrawalManager) {
            window.withdrawalManager.openModal();
        }
    };
    document.getElementById('btnOpenWithdrawalModal')?.addEventListener('click', openWithdrawalModal);
    document.getElementById('btnStartWithdrawal')?.addEventListener('click', openWithdrawalModal);

    document.getElementById('btnCloseVoucherStore')?.addEventListener('click', () => {
        document.getElementById('voucherStoreModal').style.display = 'none';
    });

    // أزرار تبويبات المتجر
    document.querySelectorAll('.voucher-tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tab = e.currentTarget.getAttribute('data-tab');

            // إذا نقر على تبويب سحب كاش وبنوك، نوجهه فوراً لنافذة السحب المالي
            if (tab === 'withdraw_nav') {
                document.getElementById('voucherStoreModal').style.display = 'none';
                if (window.withdrawalManager) window.withdrawalManager.openModal();
                return;
            }

            document.querySelectorAll('.voucher-tab-btn').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');

            const grid = document.getElementById('voucherGrid');
            const historySec = document.getElementById('voucherHistorySection');

            if (tab === 'history') {
                if (grid) grid.style.display = 'none';
                if (historySec) historySec.style.display = 'block';
                if (window.voucherStore) window.voucherStore.renderHistory();
            } else {
                if (grid) grid.style.display = 'grid';
                if (historySec) historySec.style.display = 'none';
                if (window.voucherStore) {
                    window.voucherStore.currentFilter = tab;
                    window.voucherStore.renderStore();
                }
            }
        });
    });

    // مشاهدة إعلان لربح 2500 نقطة إضافية للشحن
    document.getElementById('btnStoreWatchAd')?.addEventListener('click', () => {
        if (window.adManager && window.game) {
            window.adManager.showRewardedAd('BONUS_POINTS', () => {
                window.game.score += 2500;
                window.game.updateHUD();
                if (window.voucherStore) window.voucherStore.renderStore();
                alert('🎉 تهانينا! تمت إضافة +2,500 نقطة مجانية إلى رصيدك بنجاح لشحن ألعابك المفضلة!');
                if (window.soundEngine) window.soundEngine.playCollectEgg();
            });
        }
    });

    // تأكيد استبدال القسيمة
    document.getElementById('btnConfirmRedeem')?.addEventListener('click', () => {
        const idInput = document.getElementById('redeemPlayerIdInput');
        if (idInput && window.voucherStore) {
            window.voucherStore.processRedeem(idInput.value);
        }
    });

    document.getElementById('btnCancelRedeem')?.addEventListener('click', () => {
        document.getElementById('redeemConfirmModal').style.display = 'none';
    });

    // نسخ رمز القسيمة
    document.getElementById('btnCopySuccessCode')?.addEventListener('click', () => {
        const codeElem = document.getElementById('successVoucherCode');
        if (codeElem) {
            navigator.clipboard.writeText(codeElem.innerText);
            alert('✅ تم نسخ كود القسيمة بنجاح إلى الحافظة!');
        }
    });

    document.getElementById('btnCloseSuccessVoucher')?.addEventListener('click', () => {
        document.getElementById('voucherSuccessModal').style.display = 'none';
    });

    // 6. أحداث لوحة تحكم المدير والشحن الحقيقي (Admin Panel)
    const openAdminModal = () => {
        document.getElementById('adminPinInput').value = '';
        window.game.showModal('adminPinModal');
    };

    document.getElementById('btnOpenAdminPanel')?.addEventListener('click', openAdminModal);
    document.getElementById('btnStartAdmin')?.addEventListener('click', openAdminModal);

    document.getElementById('btnCloseAdminPin')?.addEventListener('click', () => {
        document.getElementById('adminPinModal').style.display = 'none';
    });

    // إدخال الرمز السري للمدير
    const handleAdminLogin = async () => {
        const pinInput = document.getElementById('adminPinInput');
        const pin = pinInput ? pinInput.value : '';
        if (window.adminManager && await window.adminManager.verifyPin(pin)) {
            document.getElementById('adminPinModal').style.display = 'none';
            window.game.showModal('adminPanelModal');

            // تحميل البيانات في لوحة الإدارة
            window.adminManager.renderOrders();
            if (window.adminManager.renderWithdrawals) window.adminManager.renderWithdrawals();
            window.adminManager.renderVault();
            if (window.adminManager.renderWafLogs) window.adminManager.renderWafLogs();
            if (window.authManager) window.authManager.renderAdminUsersList();
            if (window.featuresManager) window.featuresManager.populateAdminForm();

            // تعبئة حقول الإعدادات
            const cfg = window.adminManager.config;
            const adsenseInp = document.getElementById('adminAdsenseInput');
            const monetagInp = document.getElementById('adminMonetagInput');
            const directLinkInp = document.getElementById('adminDirectLinkInput');
            const tgTokenInp = document.getElementById('adminTelegramToken');
            const tgChatInp = document.getElementById('adminTelegramChatId');

            if (adsenseInp && cfg.adsensePubId && cfg.adsensePubId !== 'ca-pub-XXXXXXXXXXXXXXXX') adsenseInp.value = cfg.adsensePubId;
            if (monetagInp) monetagInp.value = cfg.monetagZoneId || '';
            if (directLinkInp) directLinkInp.value = cfg.directAdLink || '';
            if (tgTokenInp) tgTokenInp.value = cfg.telegramBotToken || '';
            if (tgChatInp) tgChatInp.value = cfg.telegramChatId || '';
        } else {
            alert('❌ الرمز السري غير صحيح! تم توثيق المحاولة أمنياً بجدار الحماية.');
        }
    };

    document.getElementById('btnSubmitAdminPin')?.addEventListener('click', handleAdminLogin);
    document.getElementById('adminPinInput')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleAdminLogin();
    });

    // زر قفل لوحة الإدارة وتسجيل الخروج
    document.getElementById('btnLockAdminPanel')?.addEventListener('click', () => {
        if (window.adminManager) window.adminManager.lockAndLogout();
    });

    document.getElementById('btnCloseAdminPanel')?.addEventListener('click', () => {
        document.getElementById('adminPanelModal').style.display = 'none';
    });

    // تبويبات لوحة المدير
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            const tab = e.currentTarget.getAttribute('data-admin-tab');

            // إخفاء كل محتويات التبويبات
            document.querySelectorAll('.admin-tab-content').forEach(c => c.style.display = 'none');

            if (tab === 'orders') {
                document.getElementById('adminTabOrders').style.display = 'block';
                if (window.adminManager) window.adminManager.renderOrders();
            } else if (tab === 'withdrawals') {
                document.getElementById('adminTabWithdrawals').style.display = 'block';
                if (window.adminManager && window.adminManager.renderWithdrawals) window.adminManager.renderWithdrawals();
            } else if (tab === 'vault') {
                document.getElementById('adminTabVault').style.display = 'block';
                if (window.adminManager) window.adminManager.renderVault();
            } else if (tab === 'ads') {
                document.getElementById('adminTabAds').style.display = 'block';
            } else if (tab === 'social') {
                document.getElementById('adminTabSocial').style.display = 'block';
                if (window.featuresManager) window.featuresManager.populateAdminForm();
            } else if (tab === 'telegram') {
                document.getElementById('adminTabTelegram').style.display = 'block';
            } else if (tab === 'waf') {
                document.getElementById('adminTabWaf').style.display = 'block';
                if (window.adminManager.renderWafLogs) window.adminManager.renderWafLogs();
                if (window.authManager) window.authManager.renderAdminUsersList();
            } else if (tab === 'security') {
                document.getElementById('adminTabSecurity').style.display = 'block';
            }
        });
    });

    // حفظ وإيداع أكواد جديدة في المخزن الحقيقي
    document.getElementById('btnSaveVaultCodes')?.addEventListener('click', () => {
        const gameSelect = document.getElementById('vaultGameSelect');
        const textarea = document.getElementById('adminVaultCodesInput');

        if (gameSelect && textarea && window.adminManager) {
            const count = window.adminManager.addCodesToVault(gameSelect.value, textarea.value);
            if (count > 0) {
                alert(`✅ تم إيداع ${count} كود حقيقي في مخزن ${gameSelect.options[gameSelect.selectedIndex].text} بنجاح!\nسيتم تسليمها تلقائياً للاعبين فور استبدال النقاط.`);
                textarea.value = '';
                window.adminManager.renderVault();
            } else {
                alert('يرجى كتابة أو لصق الأكواد في الصندوق أولاً (كود في كل سطر).');
            }
        }
    });

    // حفظ إعدادات شبكات الإعلانات
    document.getElementById('btnSaveAdminAds')?.addEventListener('click', () => {
        if (!window.adminManager) return;
        const adsenseVal = document.getElementById('adminAdsenseInput').value.trim();
        const monetagVal = document.getElementById('adminMonetagInput').value.trim();
        const directLinkVal = document.getElementById('adminDirectLinkInput').value.trim();

        window.adminManager.config.adsensePubId = adsenseVal;
        window.adminManager.config.monetagZoneId = monetagVal;
        window.adminManager.config.directAdLink = directLinkVal;
        window.adminManager.saveData();

        if (adsenseVal && adsenseVal.startsWith('ca-pub-') && window.adManager) {
            window.adManager.setPublisherId(adsenseVal);
        }

        alert('✅ تم حفظ وتفعيل إعدادات شبكات الإعلانات الحقيقية بنجاح!');
    });

    // حفظ إعدادات تليجرام
    document.getElementById('btnSaveTelegramConfig')?.addEventListener('click', () => {
        if (!window.adminManager) return;
        const token = document.getElementById('adminTelegramToken').value.trim();
        const chatId = document.getElementById('adminTelegramChatId').value.trim();

        window.adminManager.config.telegramBotToken = token;
        window.adminManager.config.telegramChatId = chatId;
        window.adminManager.config.enableTelegramAlerts = !!(token && chatId);
        window.adminManager.saveData();

        alert('✅ تم حفظ إعدادات التليجرام! ستصلك تنبيهات فورية بكل طلب شحن جديد.');
    });

    // تجربة إرسال رسالة تليجرام
    document.getElementById('btnTestTelegramAlert')?.addEventListener('click', () => {
        if (!window.adminManager) return;
        const token = document.getElementById('adminTelegramToken').value.trim();
        const chatId = document.getElementById('adminTelegramChatId').value.trim();

        if (!token || !chatId) {
            alert('يرجى ملء كل من Bot Token و Chat ID أولاً!');
            return;
        }

        window.adminManager.config.telegramBotToken = token;
        window.adminManager.config.telegramChatId = chatId;
        window.adminManager.config.enableTelegramAlerts = true;

        window.adminManager.sendTelegramAlert({
            id: 'TEST-001',
            gameTitle: 'تجربة اتصال تليجرام 🐔',
            voucherTitle: '100 جوهرة فري فاير (تجريبي)',
            playerId: '123456789 (حساب تجريبي)',
            cost: 1500,
            date: new Date().toLocaleString('ar-EG'),
            status: '✅ اتصال ناجح وجاهز لاستقبال الطلبات الحقيقية'
        });

        alert('📲 تم إرسال رسالة تجريبية إلى تليجرام الخاص بك! افتح تطبيق Telegram للتأكد من وصولها.');
    });

    // حفظ إعدادات القناة ومواقع التواصل ومنع الإعلانات
    document.getElementById('btnSaveAdminSocial')?.addEventListener('click', () => {
        if (window.featuresManager) {
            window.featuresManager.saveAdminForm();
        }
    });

    // إعادة تعيين اشتراك القناة المحلي للاختبار
    document.getElementById('btnResetAdminSub')?.addEventListener('click', () => {
        if (window.featuresManager) {
            window.featuresManager.resetMySubscription();
        }
    });

    // تحديث وتشفير الرمز السري للوحة الإدارة بـ SHA-256
    document.getElementById('btnSaveNewPin')?.addEventListener('click', async () => {
        const newPin = document.getElementById('adminNewPinInput').value.trim();
        if (window.adminManager) {
            await window.adminManager.changePin(newPin);
            document.getElementById('adminNewPinInput').value = '';
        }
    });

    // إظهار شاشة البداية أولاً
    window.game.showStartMenu();
    if (window.adManager) {
        window.adManager.updateEarningsUI();
    }
});
