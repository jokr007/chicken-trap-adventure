/**
 * نظام المؤثرات الصوتية والموسيقى التوليدية (Web Audio API)
 * بدون الحاجة لأي ملفات صوتية خارجية - يعمل في أي متصفح مباشرة!
 */
class SoundEngine {
    constructor() {
        this.ctx = null;
        this.isMuted = false;
        this.bgmPlaying = false;
        this.bgmTimer = null;
        this.bgmStep = 0;
        this.volume = 0.3;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.ctx = new AudioContext();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.isMuted && this.bgmPlaying) {
            this.stopBGM();
        } else if (!this.isMuted && !this.bgmPlaying) {
            this.startBGM();
        }
        return this.isMuted;
    }

    // صوت خطوة الدجاجة اللطيفة
    playStep() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        const now = this.ctx.currentTime;

        osc.frequency.setValueAtTime(140 + Math.random() * 40, now);
        osc.frequency.exponentialRampToValueAtTime(70, now + 0.05);

        gain.gain.setValueAtTime(0.04 * this.volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.05);
    }

    // صوت نقنقة الدجاجة المضحك (Bawk Bawk!)
    playCluck() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const mod = this.ctx.createOscillator();
        const modGain = this.ctx.createGain();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        mod.type = 'sine';

        const baseFreq = 480 + Math.random() * 80;
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.08);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.9, now + 0.22);

        mod.frequency.setValueAtTime(25, now);
        modGain.gain.setValueAtTime(120, now);

        gain.gain.setValueAtTime(0.2 * this.volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        mod.connect(modGain);
        modGain.connect(osc.frequency);
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        mod.start(now);
        osc.start(now);
        mod.stop(now + 0.25);
        osc.stop(now + 0.25);
    }

    // صوت التقاط البيضة الذهبية
    playCollectEgg() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        const now = this.ctx.currentTime;

        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.06);

            gain.gain.setValueAtTime(0.18 * this.volume, now + idx * 0.06);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.22);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now + idx * 0.06);
            osc.stop(now + idx * 0.06 + 0.22);
        });
    }

    // صوت جمع حبة الذرة
    playCollectCorn() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800 + Math.random() * 200, now);
        osc.frequency.exponentialRampToValueAtTime(1400, now + 0.08);

        gain.gain.setValueAtTime(0.12 * this.volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.08);
    }

    // صوت أخذ قوة خاصة (درع / سرعة / تجميد)
    playPowerup() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.35);

        gain.gain.setValueAtTime(0.2 * this.volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.35);
    }

    // صوت إطباق الفخ الفولاذي (Snap!)
    playTrapSnap() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;

        // صوت الكلاك المعدني
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(900, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.12);

        gain.gain.setValueAtTime(0.3 * this.volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.12);

        // هزة منخفضة
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(180, now);
        osc2.frequency.exponentialRampToValueAtTime(40, now + 0.2);

        gain2.gain.setValueAtTime(0.25 * this.volume, now);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        osc2.connect(gain2);
        gain2.connect(this.ctx.destination);

        osc2.start(now);
        osc2.stop(now + 0.2);
    }

    // صوت إصابة الدجاجة
    playHit() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(700, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.3);

        gain.gain.setValueAtTime(0.35 * this.volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.3);
    }

    // صوت تكسر الدرع
    playShieldBreak() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(950, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.25);

        gain.gain.setValueAtTime(0.25 * this.volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.25);
    }

    // نغمة الفوز وإكمال المرحلة
    playWinLevel() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        const melody = [
            { f: 523.25, d: 0.12 }, // C5
            { f: 659.25, d: 0.12 }, // E5
            { f: 783.99, d: 0.12 }, // G5
            { f: 1046.50, d: 0.35 } // C6
        ];

        let timeOffset = 0;
        const now = this.ctx.currentTime;

        melody.forEach(note => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(note.f, now + timeOffset);

            gain.gain.setValueAtTime(0.25 * this.volume, now + timeOffset);
            gain.gain.exponentialRampToValueAtTime(0.001, now + timeOffset + note.d);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now + timeOffset);
            osc.stop(now + timeOffset + note.d);

            timeOffset += note.d * 0.9;
        });
    }

    // صوت الخسارة
    playGameOver() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        const notes = [440, 392, 349.23, 293.66];
        const now = this.ctx.currentTime;

        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, now + idx * 0.2);

            gain.gain.setValueAtTime(0.25 * this.volume, now + idx * 0.2);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.2 + 0.25);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now + idx * 0.2);
            osc.stop(now + idx * 0.2 + 0.25);
        });
    }

    // تشغيل موسيقى خلفية تفاعلية مبهجة لطيفة خفيفة
    startBGM() {
        if (this.isMuted || this.bgmPlaying) return;
        this.init();
        if (!this.ctx) return;

        this.bgmPlaying = true;
        this.bgmStep = 0;

        // لحن كلاسيكي مبهج للمزرعة
        const bassNotes = [261.63, 261.63, 329.63, 392.00, 349.23, 349.23, 392.00, 261.63];
        const leadNotes = [523.25, 659.25, 783.99, 659.25, 587.33, 659.25, 523.25, 0];

        const playTick = () => {
            if (!this.bgmPlaying || this.isMuted || !this.ctx) return;

            const now = this.ctx.currentTime;
            const bFreq = bassNotes[this.bgmStep % bassNotes.length];
            const lFreq = leadNotes[this.bgmStep % leadNotes.length];

            // نوتة الباص
            if (bFreq > 0) {
                const bOsc = this.ctx.createOscillator();
                const bGain = this.ctx.createGain();
                bOsc.type = 'triangle';
                bOsc.frequency.setValueAtTime(bFreq / 2, now);
                bGain.gain.setValueAtTime(0.06 * this.volume, now);
                bGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
                bOsc.connect(bGain);
                bGain.connect(this.ctx.destination);
                bOsc.start(now);
                bOsc.stop(now + 0.2);
            }

            // نوتة اللحن
            if (lFreq > 0 && this.bgmStep % 2 === 0) {
                const lOsc = this.ctx.createOscillator();
                const lGain = this.ctx.createGain();
                lOsc.type = 'sine';
                lOsc.frequency.setValueAtTime(lFreq, now);
                lGain.gain.setValueAtTime(0.04 * this.volume, now);
                lGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
                lOsc.connect(lGain);
                lGain.connect(this.ctx.destination);
                lOsc.start(now);
                lOsc.stop(now + 0.16);
            }

            this.bgmStep++;
            this.bgmTimer = setTimeout(playTick, 240); // سرعة إيقاعية مبهجة
        };

        playTick();
    }

    // صوت انهيار الحفرة المخفية
    playPitfallCollapse() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(35, now + 0.35);

        gain.gain.setValueAtTime(0.28 * this.volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
    }

    // صوت اصطدام ورنين الكرة الحديدية المشوكة
    playSpikedBallImpact() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        // رنين معدني ثقيل مركب
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc1.type = 'square';
        osc2.type = 'triangle';
        osc1.frequency.setValueAtTime(260, now);
        osc1.frequency.exponentialRampToValueAtTime(80, now + 0.28);
        osc2.frequency.setValueAtTime(540, now);
        osc2.frequency.exponentialRampToValueAtTime(120, now + 0.28);

        gain.gain.setValueAtTime(0.3 * this.volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.28);
        osc2.stop(now + 0.28);
    }

    // صوت وثوب كمين الثعلب من الشجيرة
    playFoxAmbush() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.linearRampToValueAtTime(750, now + 0.12);
        osc.frequency.exponentialRampToValueAtTime(240, now + 0.32);

        gain.gain.setValueAtTime(0.24 * this.volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.32);
    }

    stopBGM() {
        this.bgmPlaying = false;
        if (this.bgmTimer) {
            clearTimeout(this.bgmTimer);
            this.bgmTimer = null;
        }
    }
}

// كائن عام للصوت
window.soundEngine = new SoundEngine();
