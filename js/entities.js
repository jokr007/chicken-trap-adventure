/**
 * الكائنات التفاعلية، الدجاجة، الأفخاخ، الأعداء، والمؤثرات البصرية
 */

// نظام الجسيمات للمؤثرات البصرية
class Particle {
    constructor(x, y, color, size, vx, vy, life, shape = 'circle') {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = size;
        this.vx = vx;
        this.vy = vy;
        this.life = life;
        this.maxLife = life;
        this.shape = shape;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotSpeed = (Math.random() - 0.5) * 0.2;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.05; // جاذبية خفيفة
        this.rotation += this.rotSpeed;
        this.life--;
    }

    draw(ctx) {
        const alpha = Math.max(0, this.life / this.maxLife);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        if (this.shape === 'feather') {
            // رسم ريشة صغيرة متطايرة
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.ellipse(0, 0, this.size * 2, this.size * 0.8, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(-this.size * 1.5, 0);
            ctx.lineTo(this.size * 1.5, 0);
            ctx.stroke();
        } else if (this.shape === 'star') {
            // رسم نجمة براقة
            ctx.fillStyle = this.color;
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
                const r = this.size;
                const inR = this.size * 0.4;
                ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
                const nextAngle = angle + Math.PI / 5;
                ctx.lineTo(Math.cos(nextAngle) * inR, Math.sin(nextAngle) * inR);
            }
            ctx.closePath();
            ctx.fill();
        } else {
            // دائرة عادية
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(0, 0, this.size, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}



// كائن الدجاجة "كوكو" (اللاعب)
class ChickenPlayer {
    constructor(x, y) {
        this.spawnX = x;
        this.spawnY = y;
        this.x = x;
        this.y = y;
        this.radius = 16;
        this.width = 32;
        this.height = 32;

        this.baseSpeed = 3.4;
        this.speed = this.baseSpeed;
        this.vx = 0;
        this.vy = 0;
        this.friction = 0.78;

        this.facing = 'right'; // right, left, up, down
        this.facingAngle = 0;

        this.lives = 3;
        this.maxLives = 5;
        this.hasShield = false;
        this.speedBoostTimer = 0;
        this.invulnerableTimer = 0;

        // متغيرات الحركة والأنيميشن
        this.walkCycle = 0;
        this.isMoving = false;
        this.combWobble = 0;
        this.blinkTimer = 100;
        this.isBlinking = false;
        this.stepSoundTimer = 0;
    }

    resetPosition() {
        this.x = this.spawnX;
        this.y = this.spawnY;
        this.vx = 0;
        this.vy = 0;
        this.invulnerableTimer = 60; // ثانية حماية عند الإعادة
    }

    takeDamage(particles) {
        if (this.invulnerableTimer > 0) return false;

        if (this.hasShield) {
            this.hasShield = false;
            this.invulnerableTimer = 45;
            if (window.soundEngine) window.soundEngine.playShieldBreak();
            // مؤثرات تكسر الدرع
            for (let i = 0; i < 16; i++) {
                const angle = Math.random() * Math.PI * 2;
                const spd = 2 + Math.random() * 3;
                particles.push(new Particle(this.x, this.y, '#00e5ff', 3, Math.cos(angle) * spd, Math.sin(angle) * spd, 30));
            }
            return false;
        }

        this.lives--;
        this.invulnerableTimer = 90; // 1.5 ثانية وميض حماية
        if (window.soundEngine) window.soundEngine.playHit();

        // مؤثرات تطاير الريش
        for (let i = 0; i < 18; i++) {
            const angle = Math.random() * Math.PI * 2;
            const spd = 1.5 + Math.random() * 4;
            const col = Math.random() > 0.4 ? '#ffffff' : (Math.random() > 0.5 ? '#ff4d4d' : '#ffe082');
            particles.push(new Particle(this.x, this.y, col, 3 + Math.random() * 3, Math.cos(angle) * spd, Math.sin(angle) * spd, 40, 'feather'));
        }

        return true;
    }

    update(input, mapWidth, mapHeight, walls, isFrozen, particles) {
        // تحديث الموقتات
        if (this.invulnerableTimer > 0) this.invulnerableTimer--;
        if (this.speedBoostTimer > 0) {
            this.speedBoostTimer--;
            this.speed = this.baseSpeed * 1.55;
            // ذيل سرعة رياح
            if (Math.random() > 0.4) {
                particles.push(new Particle(this.x - this.vx, this.y - this.vy, '#ffeb3b', 2, (Math.random() - 0.5) * 1, (Math.random() - 0.5) * 1, 15));
            }
        } else {
            this.speed = this.baseSpeed;
        }

        // معالجة المدخلات
        let dx = 0;
        let dy = 0;

        if (input.left) { dx -= 1; this.facing = 'left'; }
        if (input.right) { dx += 1; this.facing = 'right'; }
        if (input.up) { dy -= 1; this.facing = 'up'; }
        if (input.down) { dy += 1; this.facing = 'down'; }

        // تطبيع متجهات الحركة القطرية
        if (dx !== 0 && dy !== 0) {
            const factor = Math.SQRT1_2;
            dx *= factor;
            dy *= factor;
        }

        this.isMoving = (dx !== 0 || dy !== 0);

        if (this.isMoving) {
            this.vx += dx * 0.9;
            this.vy += dy * 0.9;

            // تحديد سرعة قصوى
            const currentSpeed = Math.hypot(this.vx, this.vy);
            if (currentSpeed > this.speed) {
                this.vx = (this.vx / currentSpeed) * this.speed;
                this.vy = (this.vy / currentSpeed) * this.speed;
            }

            this.walkCycle += 0.25;
            this.combWobble = Math.sin(this.walkCycle) * 3;

            // صوت خطوات الدجاجة
            this.stepSoundTimer++;
            if (this.stepSoundTimer % 14 === 0) {
                if (window.soundEngine) window.soundEngine.playStep();
                // نفخة غبار صغيرة عند الركض
                particles.push(new Particle(this.x, this.y + 12, 'rgba(200,200,180,0.5)', 2.5, -this.vx * 0.2, -0.3, 15));
            }
        } else {
            this.vx *= this.friction;
            this.vy *= this.friction;
            if (Math.abs(this.vx) < 0.05) this.vx = 0;
            if (Math.abs(this.vy) < 0.05) this.vy = 0;
            this.combWobble = 0;
        }

        // فحص حركة الدجاجة مع الجدران والعوائق
        this.moveAndCollide(walls, mapWidth, mapHeight);

        // رمش العين
        this.blinkTimer--;
        if (this.blinkTimer <= 0) {
            this.isBlinking = true;
            if (this.blinkTimer < -6) {
                this.isBlinking = false;
                this.blinkTimer = 120 + Math.random() * 80;
            }
        }
    }

    moveAndCollide(walls, mapWidth, mapHeight) {
        // حركة محور X
        let newX = this.x + this.vx;
        if (!this.checkWallCollision(newX, this.y, walls)) {
            this.x = newX;
        } else {
            this.vx = 0;
        }

        // حركة محور Y
        let newY = this.y + this.vy;
        if (!this.checkWallCollision(this.x, newY, walls)) {
            this.y = newY;
        } else {
            this.vy = 0;
        }

        // حدود الشاشة
        this.x = Math.max(this.radius + 4, Math.min(mapWidth - this.radius - 4, this.x));
        this.y = Math.max(this.radius + 4, Math.min(mapHeight - this.radius - 4, this.y));
    }

    checkWallCollision(x, y, walls) {
        const r = this.radius * 0.75; // صندوق تصادم مرن ومريح للدجاجة
        for (let wall of walls) {
            if (wall.isGate && wall.isOpen) continue;
            // تصادم دائرة مع مستطيل الجدار
            const closestX = Math.max(wall.x, Math.min(x, wall.x + wall.w));
            const closestY = Math.max(wall.y, Math.min(y, wall.y + wall.h));
            const distX = x - closestX;
            const distY = y - closestY;
            if ((distX * distX + distY * distY) < (r * r)) {
                return true;
            }
        }
        return false;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // وميض الحماية عند الإصابة
        if (this.invulnerableTimer > 0 && Math.floor(this.invulnerableTimer / 4) % 2 === 0) {
            ctx.globalAlpha = 0.45;
        }

        const isLeft = (this.facing === 'left');
        if (isLeft) {
            ctx.scale(-1, 1);
        }

        // ظل الدجاجة على الأرض
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(0, 13, 14, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // رسم الأقدام الصفراء اللطيفة مع حركة المشي
        const legOffset = this.isMoving ? Math.sin(this.walkCycle) * 4 : 0;
        ctx.fillStyle = '#ff9800';
        ctx.strokeStyle = '#e65100';
        ctx.lineWidth = 1.2;

        // القدم الخلفية
        ctx.beginPath();
        ctx.moveTo(-4, 9);
        ctx.lineTo(-4 + legOffset, 15);
        ctx.lineTo(-1 + legOffset, 15);
        ctx.stroke();

        // القدم الأمامية
        ctx.beginPath();
        ctx.moveTo(4, 9);
        ctx.lineTo(4 - legOffset, 15);
        ctx.lineTo(7 - legOffset, 15);
        ctx.stroke();

        // ريش الذيل
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-12, 0);
        ctx.quadraticCurveTo(-18, -8, -14, -14);
        ctx.quadraticCurveTo(-10, -8, -8, -3);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // جسم الدجاجة المستدير الممتلئ الجميل
        const bodyGrad = ctx.createRadialGradient(-2, -2, 2, 0, 0, 16);
        bodyGrad.addColorStop(0, '#ffffff');
        bodyGrad.addColorStop(0.7, '#fff8e1');
        bodyGrad.addColorStop(1, '#ffe082');

        ctx.fillStyle = bodyGrad;
        ctx.strokeStyle = '#f5c044';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(0, 0, 14, 13, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // الجناح مع حركة الخفقان
        const wingFlap = this.isMoving ? Math.sin(this.walkCycle * 1.5) * 4 : 0;
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#ffd54f';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(-1, 1 - wingFlap, 8, 6, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // العرف الأحمر في الأعلى (Comb)
        ctx.fillStyle = '#e53935';
        ctx.strokeStyle = '#b71c1c';
        ctx.lineWidth = 1;
        ctx.beginPath();
        const combY = -12 + this.combWobble;
        ctx.arc(3, combY, 4, 0, Math.PI * 2);
        ctx.arc(7, combY + 2, 3.5, 0, Math.PI * 2);
        ctx.arc(-1, combY + 2, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // اللغد الأحمر الصغير تحت المنقار (Wattle)
        ctx.fillStyle = '#d32f2f';
        ctx.beginPath();
        ctx.ellipse(10, 5, 2.5, 4, 0.2, 0, Math.PI * 2);
        ctx.fill();

        // المنقار البرتقالي الصغير اللطيف
        ctx.fillStyle = '#ff9800';
        ctx.strokeStyle = '#e65100';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(11, -2);
        ctx.lineTo(19, 1);
        ctx.lineTo(11, 4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // العين الكرتونية الكبيرة اللامعة
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(7, -3, 4.5, 0, Math.PI * 2);
        ctx.fill();

        if (this.isBlinking) {
            // خط إغلاق العين عند الرمش
            ctx.strokeStyle = '#212121';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(3, -3);
            ctx.lineTo(11, -3);
            ctx.stroke();
        } else {
            // بؤبؤ العين الأسود مع بريق أبيض
            ctx.fillStyle = '#212121';
            ctx.beginPath();
            ctx.arc(8.5, -3, 2.2, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(9.2, -4, 0.9, 0, Math.PI * 2);
            ctx.fill();
        }

        // تأثير فقاعة الدرع الواقي
        if (this.hasShield) {
            ctx.save();
            ctx.scale(isLeft ? -1 : 1, 1); // الحفاظ على اتجاه الدرع
            const shieldPulse = Math.sin(Date.now() * 0.008) * 2;
            const shieldR = 21 + shieldPulse;

            const shieldGrad = ctx.createRadialGradient(0, 0, shieldR * 0.5, 0, 0, shieldR);
            shieldGrad.addColorStop(0, 'rgba(0, 229, 255, 0.1)');
            shieldGrad.addColorStop(0.8, 'rgba(0, 229, 255, 0.35)');
            shieldGrad.addColorStop(1, 'rgba(255, 255, 255, 0.8)');

            ctx.fillStyle = shieldGrad;
            ctx.strokeStyle = '#00e5ff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, shieldR, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // بريق دائري للدرع
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(0, 0, shieldR - 3, -Math.PI * 0.7, -Math.PI * 0.2);
            ctx.stroke();
            ctx.restore();
        }

        ctx.restore();
    }
}



// فخ الأشواك الأرضية (ثابتة أو تخرج وتختفي بمؤقت)
class SpikeTrap {
    constructor(x, y, w = 36, h = 36, isTimed = false, timeOffset = 0, cycleTime = 140) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.isTimed = isTimed;
        this.cycleTime = cycleTime;
        this.timer = timeOffset % cycleTime;

        // حالة الشوك: 'down' (آمن), 'warning' (يرتجف ويستعد), 'active' (مميت)
        this.state = isTimed ? 'down' : 'active';
        this.spikeHeightRatio = isTimed ? 0 : 1;
    }

    update(isFrozen) {
        if (!this.isTimed) return;
        if (!isFrozen) {
            this.timer = (this.timer + 1) % this.cycleTime;
        }

        const half = this.cycleTime / 2;
        const warningWindow = 35;

        if (this.timer < half - warningWindow) {
            this.state = 'down';
            this.spikeHeightRatio = 0.1;
        } else if (this.timer < half) {
            this.state = 'warning';
            this.spikeHeightRatio = 0.35 + Math.sin(this.timer * 0.8) * 0.1;
        } else {
            this.state = 'active';
            this.spikeHeightRatio = 1.0;
        }
    }

    isDangerous() {
        return this.state === 'active';
    }

    checkCollision(player) {
        if (!this.isDangerous()) return false;
        // تصادم مع مساحة الأشواك
        const pad = 6;
        return (
            player.x + player.radius * 0.6 > this.x + pad &&
            player.x - player.radius * 0.6 < this.x + this.w - pad &&
            player.y + player.radius * 0.6 > this.y + pad &&
            player.y - player.radius * 0.6 < this.y + this.h - pad
        );
    }

    draw(ctx) {
        ctx.save();
        // قاعدة الفخ الحجرية
        ctx.fillStyle = '#424242';
        ctx.fillRect(this.x, this.y, this.w, this.h);

        ctx.strokeStyle = '#212121';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(this.x, this.y, this.w, this.h);

        // فتحات الأشواك
        const numSpikes = 3;
        const spacingX = this.w / numSpikes;
        const spacingY = this.h / numSpikes;

        ctx.fillStyle = '#1b1b1b';
        for (let ix = 0; ix < numSpikes; ix++) {
            for (let iy = 0; iy < numSpikes; iy++) {
                const cx = this.x + (ix + 0.5) * spacingX;
                const cy = this.y + (iy + 0.5) * spacingY;
                ctx.beginPath();
                ctx.arc(cx, cy, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // رسم الأشواك المعدنية اللامعة بحسب ارتفاعها
        if (this.spikeHeightRatio > 0.05) {
            for (let ix = 0; ix < numSpikes; ix++) {
                for (let iy = 0; iy < numSpikes; iy++) {
                    const cx = this.x + (ix + 0.5) * spacingX;
                    const cy = this.y + (iy + 0.5) * spacingY;
                    const h = 10 * this.spikeHeightRatio;

                    // لون الشوك: فضي حاد أو أحمر تحذيري
                    const spikeGrad = ctx.createLinearGradient(cx - 3, cy, cx + 3, cy - h);
                    if (this.state === 'warning') {
                        spikeGrad.addColorStop(0, '#e53935');
                        spikeGrad.addColorStop(1, '#ffcdd2');
                    } else {
                        spikeGrad.addColorStop(0, '#757575');
                        spikeGrad.addColorStop(0.5, '#e0e0e0');
                        spikeGrad.addColorStop(1, '#ffffff');
                    }

                    ctx.fillStyle = spikeGrad;
                    ctx.beginPath();
                    ctx.moveTo(cx - 3, cy + 2);
                    ctx.lineTo(cx + 3, cy + 2);
                    ctx.lineTo(cx, cy - h);
                    ctx.closePath();
                    ctx.fill();
                }
            }
        }

        ctx.restore();
    }
}



// فخ المنشار الدوار الحاد (Buzzsaw)
class SawTrap {
    constructor(startX, startY, endX, endY, speed = 2, radius = 20) {
        this.startX = startX;
        this.startY = startY;
        this.endX = endX;
        this.endY = endY;
        this.speed = speed;
        this.radius = radius;

        this.x = startX;
        this.y = startY;
        this.t = 0;
        this.direction = 1;
        this.rotation = 0;

        this.dist = Math.hypot(endX - startX, endY - startY);
    }

    update(isFrozen, particles) {
        if (!isFrozen) {
            this.rotation += 0.22;

            if (this.dist > 0) {
                this.t += (this.speed / this.dist) * this.direction;
                if (this.t >= 1) {
                    this.t = 1;
                    this.direction = -1;
                } else if (this.t <= 0) {
                    this.t = 0;
                    this.direction = 1;
                }

                this.x = this.startX + (this.endX - this.startX) * this.t;
                this.y = this.startY + (this.endY - this.startY) * this.t;
            }

            // شرارات معدنية سريعة
            if (Math.random() > 0.7) {
                const angle = Math.random() * Math.PI * 2;
                particles.push(new Particle(
                    this.x + Math.cos(angle) * this.radius,
                    this.y + Math.sin(angle) * this.radius,
                    '#ffd54f',
                    1.8,
                    (Math.random() - 0.5) * 2,
                    (Math.random() - 0.5) * 2,
                    12
                ));
            }
        }
    }

    checkCollision(player) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.hypot(dx, dy);
        return dist < (this.radius * 0.85 + player.radius * 0.7);
    }

    draw(ctx) {
        ctx.save();

        // مسار سكة حديد المنشار إذا كان متحركاً
        if (this.dist > 0) {
            ctx.strokeStyle = '#616161';
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(this.startX, this.startY);
            ctx.lineTo(this.endX, this.endY);
            ctx.stroke();

            ctx.strokeStyle = '#212121';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }

        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        // ظل المنشار
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.beginPath();
        ctx.arc(2, 3, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // شفرات المنشار المسننة الفولاذية
        const teeth = 12;
        ctx.fillStyle = '#b0bec5';
        ctx.strokeStyle = '#37474f';
        ctx.lineWidth = 1.2;

        ctx.beginPath();
        for (let i = 0; i < teeth; i++) {
            const a1 = (i * Math.PI * 2) / teeth;
            const a2 = a1 + (Math.PI / teeth);
            const rOuter = this.radius;
            const rInner = this.radius * 0.75;

            ctx.lineTo(Math.cos(a1) * rOuter, Math.sin(a1) * rOuter);
            ctx.lineTo(Math.cos(a2) * rInner, Math.sin(a2) * rInner);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // لمعان القرص الداخلي
        const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, this.radius * 0.6);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.5, '#cfd8dc');
        grad.addColorStop(1, '#78909c');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 0.6, 0, Math.PI * 2);
        ctx.fill();

        // برغي التثبيت المركزي
        ctx.fillStyle = '#263238';
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}



// مصيدة الدببة الفولاذية (Bear Trap) - تنطبق فجأة بصوت صاخب
class BearTrap {
    constructor(x, y, radius = 18) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.isSnapped = false;
        this.snapAnim = 0; // 0 مفتوح، 1 مغلق بالكامل
        this.resetTimer = 0;
    }

    update(isFrozen) {
        if (this.isSnapped) {
            if (this.snapAnim < 1) {
                this.snapAnim += 0.25;
                if (this.snapAnim > 1) this.snapAnim = 1;
            }
            if (!isFrozen) {
                this.resetTimer--;
                if (this.resetTimer <= 0) {
                    this.isSnapped = false;
                    this.snapAnim = 0;
                }
            }
        }
    }

    checkCollision(player, particles) {
        if (this.isSnapped) return false;

        const dist = Math.hypot(player.x - this.x, player.y - this.y);
        if (dist < this.radius * 0.85) {
            this.isSnapped = true;
            this.snapAnim = 0.2;
            this.resetTimer = 180; // 3 ثوانٍ قبل أن تفتح مجدداً

            if (window.soundEngine) window.soundEngine.playTrapSnap();

            // مؤثرات صدمة الفخ
            for (let i = 0; i < 10; i++) {
                const a = Math.random() * Math.PI * 2;
                particles.push(new Particle(this.x, this.y, '#e0e0e0', 2, Math.cos(a) * 2.5, Math.sin(a) * 2.5, 20));
            }
            return true;
        }
        return false;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // قاعدة حديدية
        ctx.strokeStyle = '#424242';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.stroke();

        // دواسة التشغيل في المركز
        ctx.fillStyle = this.isSnapped ? '#b71c1c' : '#757575';
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();

        // الفكوك المسننة
        const jawOpenAngle = (1 - this.snapAnim) * (Math.PI * 0.35);
        ctx.fillStyle = '#616161';
        ctx.strokeStyle = '#212121';
        ctx.lineWidth = 1.5;

        // الفك الأيمن
        ctx.beginPath();
        ctx.arc(0, 0, this.radius - 2, -jawOpenAngle, jawOpenAngle);
        ctx.stroke();

        // الفك الأيسر
        ctx.beginPath();
        ctx.arc(0, 0, this.radius - 2, Math.PI - jawOpenAngle, Math.PI + jawOpenAngle);
        ctx.stroke();

        // أسنان الفخ
        const teethCount = 6;
        for (let i = 0; i < teethCount; i++) {
            const angle = -jawOpenAngle + (i / (teethCount - 1)) * (jawOpenAngle * 2);
            const tx = Math.cos(angle) * (this.radius - 2);
            const ty = Math.sin(angle) * (this.radius - 2);
            ctx.fillStyle = '#eeeeee';
            ctx.beginPath();
            ctx.arc(tx, ty, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}



// أرضيات متهالكة / منهارة (Crumbling Floor)
class CrumblingFloor {
    constructor(x, y, w = 40, h = 40) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.state = 'stable'; // 'stable', 'shaking', 'collapsed', 'respawning'
        this.timer = 0;
        this.shakeOffset = 0;
    }

    update(player, isFrozen, particles) {
        if (isFrozen) return;

        const isPlayerOn = (
            player.x > this.x &&
            player.x < this.x + this.w &&
            player.y > this.y &&
            player.y < this.y + this.h
        );

        if (this.state === 'stable') {
            if (isPlayerOn) {
                this.state = 'shaking';
                this.timer = 35; // 0.6 ثانية قبل الانهيار
            }
        } else if (this.state === 'shaking') {
            this.timer--;
            this.shakeOffset = (Math.random() - 0.5) * 4;

            // غبار متساقط
            if (Math.random() > 0.6) {
                particles.push(new Particle(
                    this.x + Math.random() * this.w,
                    this.y + Math.random() * this.h,
                    '#8d6e63',
                    2,
                    0,
                    1,
                    15
                ));
            }

            if (this.timer <= 0) {
                this.state = 'collapsed';
                this.timer = 180; // تنهار لثلاث ثوانٍ
                // حطام متطاير
                for (let i = 0; i < 8; i++) {
                    particles.push(new Particle(
                        this.x + this.w / 2,
                        this.y + this.h / 2,
                        '#6d4c41',
                        3,
                        (Math.random() - 0.5) * 3,
                        (Math.random() - 0.5) * 3,
                        25
                    ));
                }
            }
        } else if (this.state === 'collapsed') {
            this.timer--;
            if (this.timer <= 0) {
                this.state = 'stable';
            }
        }
    }

    isDangerous() {
        return this.state === 'collapsed';
    }

    checkFall(player) {
        if (!this.isDangerous()) return false;
        // هل سقط اللاعب في الفراغ؟
        return (
            player.x > this.x + 8 &&
            player.x < this.x + this.w - 8 &&
            player.y > this.y + 8 &&
            player.y < this.y + this.h - 8
        );
    }

    draw(ctx) {
        ctx.save();

        if (this.state === 'collapsed') {
            // هوّة سحيقة مظلمة
            ctx.fillStyle = '#1a1008';
            ctx.fillRect(this.x, this.y, this.w, this.h);
            ctx.strokeStyle = '#3e2723';
            ctx.lineWidth = 1;
            ctx.strokeRect(this.x, this.y, this.w, this.h);
            ctx.restore();
            return;
        }

        const ox = (this.state === 'shaking') ? this.shakeOffset : 0;
        ctx.translate(ox, 0);

        // بلاطة حجرية خشبية متصدعة
        ctx.fillStyle = '#a1887f';
        ctx.fillRect(this.x, this.y, this.w, this.h);

        // شقوق واضحة
        ctx.strokeStyle = '#4e342e';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(this.x + 5, this.y + 5);
        ctx.lineTo(this.x + this.w * 0.4, this.y + this.h * 0.5);
        ctx.lineTo(this.x + this.w - 6, this.y + this.h - 8);
        ctx.moveTo(this.x + this.w * 0.4, this.y + this.h * 0.5);
        ctx.lineTo(this.x + 8, this.y + this.h - 6);
        ctx.stroke();

        ctx.strokeStyle = '#5d4037';
        ctx.strokeRect(this.x, this.y, this.w, this.h);

        ctx.restore();
    }
}



// بركة وحل لاصق (Mud Puddle) - تبطئ حركة الدجاجة بنسبة 60%
class MudPuddle {
    constructor(x, y, w = 60, h = 60) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }

    checkOverlap(player) {
        return (
            player.x > this.x &&
            player.x < this.x + this.w &&
            player.y > this.y &&
            player.y < this.y + this.h
        );
    }

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = 'rgba(78, 52, 46, 0.75)';
        ctx.beginPath();
        ctx.ellipse(this.x + this.w / 2, this.y + this.h / 2, this.w / 2, this.h / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // فقاعات طين طافية
        ctx.fillStyle = '#6d4c41';
        ctx.beginPath();
        const bubbleX = this.x + this.w * 0.35 + Math.sin(Date.now() * 0.002) * 5;
        const bubbleY = this.y + this.h * 0.45;
        ctx.arc(bubbleX, bubbleY, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}



// مطلق السهام / المقذوفات الجداري (Dart Shooter)
class DartShooter {
    constructor(x, y, dirX, dirY, interval = 120, offset = 0) {
        this.x = x;
        this.y = y;
        this.dirX = dirX; // 1, -1, 0
        this.dirY = dirY;
        this.interval = interval;
        this.timer = offset % interval;
    }

    update(isFrozen, dartsList) {
        if (isFrozen) return;

        this.timer = (this.timer + 1) % this.interval;
        if (this.timer === 0) {
            // إطلاق سهم جديد
            dartsList.push(new DartProjectile(
                this.x + 20 + this.dirX * 18,
                this.y + 20 + this.dirY * 18,
                this.dirX * 5.2,
                this.dirY * 5.2
            ));
        }
    }

    draw(ctx) {
        ctx.save();
        // برج إطلاق حجري مع فتحة ماسورة
        ctx.fillStyle = '#37474f';
        ctx.fillRect(this.x, this.y, 40, 40);

        ctx.strokeStyle = '#263238';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, 40, 40);

        // فتحة الإطلاق
        ctx.fillStyle = '#102027';
        const holeX = this.x + 20 + this.dirX * 12;
        const holeY = this.y + 20 + this.dirY * 12;
        ctx.beginPath();
        ctx.arc(holeX, holeY, 7, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}



// السهم المقذوف
class DartProjectile {
    constructor(x, y, vx, vy) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.radius = 4;
        this.isDead = false;
    }

    update(isFrozen, walls, mapWidth, mapHeight, particles) {
        if (!isFrozen) {
            this.x += this.vx;
            this.y += this.vy;

            // اصطدام مع الجدران أو خروج من الخريطة
            if (this.x < 0 || this.x > mapWidth || this.y < 0 || this.y > mapHeight) {
                this.isDead = true;
                return;
            }

            for (let wall of walls) {
                if (this.x > wall.x && this.x < wall.x + wall.w && this.y > wall.y && this.y < wall.y + wall.h) {
                    this.isDead = true;
                    // شرارة ارتطام
                    particles.push(new Particle(this.x, this.y, '#ffd54f', 2, -this.vx * 0.2, -this.vy * 0.2, 10));
                    break;
                }
            }
        }
    }

    checkCollision(player) {
        const dist = Math.hypot(player.x - this.x, player.y - this.y);
        return dist < (this.radius + player.radius * 0.7);
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        const angle = Math.atan2(this.vy, this.vx);
        ctx.rotate(angle);

        // جسم السهم الخشبي
        ctx.strokeStyle = '#8d6e63';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(-12, 0);
        ctx.lineTo(8, 0);
        ctx.stroke();

        // رأس السهم الفولاذي
        ctx.fillStyle = '#b0bec5';
        ctx.beginPath();
        ctx.moveTo(12, 0);
        ctx.lineTo(6, -4);
        ctx.lineTo(6, 4);
        ctx.closePath();
        ctx.fill();

        // ريش خلفية السهم
        ctx.fillStyle = '#e53935';
        ctx.beginPath();
        ctx.moveTo(-8, 0);
        ctx.lineTo(-12, -3);
        ctx.lineTo(-14, 0);
        ctx.lineTo(-12, 3);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }
}



// العدو الماكر: الثعلب المتجول والمتتبع الصياد (Chasing & Tracking Fox 🦊)
class FoxEnemy {
    constructor(startX, startY, endX, endY, speed = 2.0, isChaser = false) {
        this.startX = startX;
        this.startY = startY;
        this.endX = (endX !== undefined) ? endX : startX;
        this.endY = (endY !== undefined) ? endY : startY;
        this.x = startX;
        this.y = startY;
        this.speed = speed;
        this.radius = 18;
        this.isChaser = isChaser; // ثعلب متتبع يطارد الدجاجة أينما ذهبت!

        this.t = 0;
        this.direction = 1;
        this.dist = Math.hypot(this.endX - startX, this.endY - startY);
        this.facing = (this.endX >= startX) ? 'right' : 'left';
        this.runCycle = 0;
        this.alert = false;
        this.isHunting = false;
        this.stunTimer = 0;
        this.dustTimer = 0;
    }

    update(player, isFrozen, walls = [], particles = []) {
        if (isFrozen) return;

        // إذا كان الثعلب مصدوماً (بعد كسر درع الدجاجة)
        if (this.stunTimer > 0) {
            this.stunTimer--;
            return;
        }

        const distToPlayer = Math.hypot(player.x - this.x, player.y - this.y);

        // الثعلب يدخل وضع التتبع والمطاردة إذا كان ثعلباً صياداً (isChaser) أو اقتربت الدجاجة لمجال 180 بكسل
        const shouldChase = this.isChaser || distToPlayer < 180;
        this.alert = shouldChase;
        this.isHunting = shouldChase;

        if (shouldChase && distToPlayer > 5) {
            // سرعة المطاردة الذكية للثعلب المتتبع
            const chaseSpeed = this.isChaser ? Math.max(2.1, this.speed * 1.1) : this.speed * 1.25;
            const dx = (player.x - this.x) / distToPlayer;
            const dy = (player.y - this.y) / distToPlayer;

            // توجيه وجه الثعلب نحو حركة الدجاجة
            this.facing = (player.x >= this.x) ? 'right' : 'left';

            // حركة انسيابية نحو الدجاجة مع انزلاق ذكي على الجدران
            let stepX = dx * chaseSpeed;
            let stepY = dy * chaseSpeed;

            // فحص حركة المحور X
            let nextX = this.x + stepX;
            if (!this.checkWallCollision(nextX, this.y, walls)) {
                this.x = nextX;
            } else {
                // انزلاق عمودي في حال الاصطدام بجدار أفقي
                stepY += (dy >= 0 ? 0.9 : -0.9);
            }

            // فحص حركة المحور Y
            let nextY = this.y + stepY;
            if (!this.checkWallCollision(this.x, nextY, walls)) {
                this.y = nextY;
            } else {
                // انزلاق أفقي في حال الاصطدام بجدار رأسي
                if (!this.checkWallCollision(this.x + (dx >= 0 ? 0.9 : -0.9), this.y, walls)) {
                    this.x += (dx >= 0 ? 0.9 : -0.9);
                }
            }

            // حدود مساحة اللعب
            this.x = Math.max(24, Math.min(836, this.x));
            this.y = Math.max(24, Math.min(536, this.y));

            // غبار ركض ومطاردة الثعلب
            this.dustTimer++;
            if (this.dustTimer % 7 === 0 && particles) {
                particles.push(new Particle(
                    this.x + (this.facing === 'right' ? -10 : 10),
                    this.y + 12,
                    'rgba(230, 81, 0, 0.4)',
                    2.4,
                    (Math.random() - 0.5) * 1,
                    -Math.random() * 0.8,
                    16
                ));
            }
        } else if (this.dist > 0) {
            // نمط الدورية الهادئة بين النقطتين
            this.t += (this.speed / this.dist) * this.direction;
            if (this.t >= 1) {
                this.t = 1;
                this.direction = -1;
                this.facing = (this.startX > this.endX) ? 'right' : 'left';
            } else if (this.t <= 0) {
                this.t = 0;
                this.direction = 1;
                this.facing = (this.endX > this.startX) ? 'right' : 'left';
            }

            this.x = this.startX + (this.endX - this.startX) * this.t;
            this.y = this.startY + (this.endY - this.startY) * this.t;
        }

        this.runCycle += shouldChase ? 0.38 : 0.22;
    }

    checkWallCollision(x, y, walls) {
        const r = this.radius * 0.7;
        for (let wall of walls) {
            if (wall.isGate && wall.isOpen) continue;
            const closestX = Math.max(wall.x, Math.min(x, wall.x + wall.w));
            const closestY = Math.max(wall.y, Math.min(y, wall.y + wall.h));
            const distX = x - closestX;
            const distY = y - closestY;
            if ((distX * distX + distY * distY) < (r * r)) {
                return true;
            }
        }
        return false;
    }

    checkCollision(player) {
        const dist = Math.hypot(player.x - this.x, player.y - this.y);
        return dist < (this.radius * 0.85 + player.radius * 0.75);
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        if (this.facing === 'left') {
            ctx.scale(-1, 1);
        }

        // ظل الثعلب
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.beginPath();
        ctx.ellipse(0, 12, 16, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // ذيل برتقالي كثيف لطيف مع طرف أبيض
        const tailSpeed = this.isHunting ? 2.5 : 1.5;
        const tailWag = Math.sin(this.runCycle * tailSpeed) * (this.isHunting ? 8 : 5);
        ctx.fillStyle = this.isChaser ? '#bf360c' : '#e65100';
        ctx.beginPath();
        ctx.moveTo(-10, 0);
        ctx.quadraticCurveTo(-22, -8 + tailWag, -25, -2 + tailWag);
        ctx.quadraticCurveTo(-20, 6 + tailWag, -10, 4);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(-22, -5 + tailWag);
        ctx.lineTo(-25, -2 + tailWag);
        ctx.lineTo(-21, 3 + tailWag);
        ctx.closePath();
        ctx.fill();

        // جسم الثعلب البرتقالي
        ctx.fillStyle = this.isChaser ? '#e64a19' : '#f57c00';
        ctx.beginPath();
        ctx.ellipse(0, 2, 14, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // صدر وبطن أبيض
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(4, 4, 7, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // الرأس
        ctx.fillStyle = this.isChaser ? '#d84315' : '#ef6c00';
        ctx.beginPath();
        ctx.arc(8, -6, 9, 0, Math.PI * 2);
        ctx.fill();

        // أذنان مثلثة مدببة مع سواد عند الأطراف
        ctx.fillStyle = '#bf360c';
        ctx.beginPath();
        ctx.moveTo(3, -13);
        ctx.lineTo(7, -21);
        ctx.lineTo(10, -12);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(9, -13);
        ctx.lineTo(13, -20);
        ctx.lineTo(15, -11);
        ctx.closePath();
        ctx.fill();

        // أنف الثعلب المدبب الأسود
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(11, -5);
        ctx.lineTo(19, -2);
        ctx.lineTo(11, 1);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#212121';
        ctx.beginPath();
        ctx.arc(18, -2, 2.2, 0, Math.PI * 2);
        ctx.fill();

        // أنياب حادة تبرز عند المطاردة الشرسة
        if (this.isHunting || this.isChaser) {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(13, 0);
            ctx.lineTo(15, 5);
            ctx.lineTo(17, 0);
            ctx.closePath();
            ctx.fill();
        }

        // عيون الثعلب الماكرة
        if (this.isHunting || this.isChaser) {
            // عيون حمراء مشتعلة للمطاردة والصيد
            ctx.fillStyle = '#ff1744';
            ctx.beginPath();
            ctx.ellipse(9, -7, 3, 4, 0.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffea00';
            ctx.beginPath();
            ctx.ellipse(10, -7, 1.2, 3, 0.2, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillStyle = '#ffd600';
            ctx.beginPath();
            ctx.ellipse(9, -7, 2.5, 3.5, 0.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.ellipse(10, -7, 1.2, 3, 0.2, 0, Math.PI * 2);
            ctx.fill();
        }

        // علامة تعجب تحذيرية للمطاردة
        if (this.alert || this.isChaser) {
            ctx.fillStyle = '#d50000';
            ctx.font = 'bold 16px "Tajawal", Arial';
            ctx.fillText(this.isChaser ? '🦊!' : '!', 4, -25);
        }

        // نجوم الدوار عند الصدمة
        if (this.stunTimer > 0) {
            ctx.fillStyle = '#ffd700';
            ctx.font = '14px Arial';
            ctx.fillText('💫', 4, -26);
        }

        ctx.restore();
    }
}



// العناصر القابلة للجمع (بيض، ذرة، قوى خارقة)
class Collectible {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // 'EGG', 'CORN', 'SHIELD', 'SPEED', 'FREEZE', 'KEY', 'HEART'
        this.radius = 12;
        this.bobOffset = Math.random() * Math.PI * 2;
    }

    update() {
        this.bobOffset += 0.06;
    }

    checkCollision(player) {
        const dist = Math.hypot(player.x - this.x, player.y - this.y);
        return dist < (this.radius + player.radius * 0.7);
    }

    draw(ctx) {
        ctx.save();
        const floatY = Math.sin(this.bobOffset) * 3;
        ctx.translate(this.x, this.y + floatY);

        if (this.type === 'EGG') {
            // بيضة ذهبية براقة
            ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
            ctx.beginPath();
            ctx.ellipse(0, 10 - floatY, 8, 3, 0, 0, Math.PI * 2);
            ctx.fill();

            const eggGrad = ctx.createRadialGradient(-3, -3, 2, 0, 0, 11);
            eggGrad.addColorStop(0, '#ffffff');
            eggGrad.addColorStop(0.3, '#ffeb3b');
            eggGrad.addColorStop(0.8, '#ffb300');
            eggGrad.addColorStop(1, '#ff8f00');

            ctx.fillStyle = eggGrad;
            ctx.strokeStyle = '#ffa000';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.ellipse(0, 0, 8.5, 12, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // بريق النجمة فوق البيضة
            ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
            ctx.beginPath();
            ctx.arc(-2, -5, 2, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'CORN') {
            // حبة ذرة صفراء شهية
            ctx.fillStyle = '#ffc107';
            ctx.strokeStyle = '#ffa000';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.ellipse(0, 0, 5, 8, 0.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // ورقة خضراء صغيرة
            ctx.fillStyle = '#4caf50';
            ctx.beginPath();
            ctx.ellipse(-2, 7, 2, 4, -0.4, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'SHIELD') {
            // بلورة الدرع الأزرق
            ctx.fillStyle = '#00e5ff';
            ctx.strokeStyle = '#00b0ff';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(0, -10);
            ctx.lineTo(8, -4);
            ctx.lineTo(6, 6);
            ctx.lineTo(0, 10);
            ctx.lineTo(-6, 6);
            ctx.lineTo(-8, -4);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        } else if (this.type === 'SPEED') {
            // حذاء السرعة / صاعقة البرق الصفراء
            ctx.fillStyle = '#ffd600';
            ctx.strokeStyle = '#ff6d00';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(2, -10);
            ctx.lineTo(-6, 0);
            ctx.lineTo(0, 0);
            ctx.lineTo(-3, 10);
            ctx.lineTo(6, -1);
            ctx.lineTo(0, -1);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        } else if (this.type === 'FREEZE') {
            // بلورة التجميد الجليدية الزرقاء
            ctx.fillStyle = '#e1f5fe';
            ctx.strokeStyle = '#0288d1';
            ctx.lineWidth = 2;
            // شكل ساعة أو ندفة ثلج
            ctx.beginPath();
            ctx.arc(0, 0, 8, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = '#03a9f4';
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(0, -6);
            ctx.lineTo(0, 0);
            ctx.lineTo(4, 0);
            ctx.stroke();
        } else if (this.type === 'KEY') {
            // مفتاح ذهبي لفتح البوابات
            ctx.fillStyle = '#ffd700';
            ctx.strokeStyle = '#c68a00';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.arc(-4, 0, 5, 0, Math.PI * 2);
            ctx.rect(0, -2, 9, 4);
            ctx.rect(5, 2, 2.5, 3.5);
            ctx.fill();
            ctx.stroke();
        } else if (this.type === 'HEART') {
            // قلب أحمر لإضافة حياة
            ctx.fillStyle = '#e53935';
            ctx.beginPath();
            ctx.moveTo(0, 4);
            ctx.bezierCurveTo(-6, -4, -10, 0, 0, 10);
            ctx.bezierCurveTo(10, 0, 6, -4, 0, 4);
            ctx.fill();
        }

        ctx.restore();
    }
}



// قن الدجاج (Coop / Goal) - نقطة النهاية والنجاح
class ChickenCoop {
    constructor(x, y, w = 60, h = 60) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.isOpen = false;
        this.openProgress = 0;
    }

    update(allEggsCollected) {
        this.isOpen = allEggsCollected;
        if (this.isOpen && this.openProgress < 1) {
            this.openProgress += 0.05;
        }
    }

    checkWin(player) {
        if (!this.isOpen) return false;
        const centerX = this.x + this.w / 2;
        const centerY = this.y + this.h / 2;
        const dist = Math.hypot(player.x - centerX, player.y - centerY);
        return dist < 25;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // جدران الحظيرة الخشبية الدافئة
        ctx.fillStyle = '#8d6e63';
        ctx.fillRect(4, 18, this.w - 8, this.h - 18);

        // ألواح الخشب
        ctx.strokeStyle = '#5d4037';
        ctx.lineWidth = 1.5;
        for (let py = 24; py < this.h; py += 10) {
            ctx.beginPath();
            ctx.moveTo(4, py);
            ctx.lineTo(this.w - 4, py);
            ctx.stroke();
        }

        // سقف القن الأحمر القرميدي
        ctx.fillStyle = '#c62828';
        ctx.beginPath();
        ctx.moveTo(this.w / 2, 0);
        ctx.lineTo(this.w + 4, 20);
        ctx.lineTo(-4, 20);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#8e0000';
        ctx.lineWidth = 2;
        ctx.stroke();

        // مدخل القن
        const doorW = 26;
        const doorH = 32;
        const doorX = (this.w - doorW) / 2;
        const doorY = this.h - doorH;

        if (this.isOpen) {
            // الباب مفتوح ونور ذهبي متألق يشع بالداخل
            const lightGrad = ctx.createRadialGradient(
                this.w / 2, doorY + doorH * 0.7, 4,
                this.w / 2, doorY + doorH * 0.7, 24
            );
            lightGrad.addColorStop(0, '#fff59d');
            lightGrad.addColorStop(0.5, '#ffd54f');
            lightGrad.addColorStop(1, '#ff8f00');

            ctx.fillStyle = lightGrad;
            ctx.beginPath();
            ctx.arc(this.w / 2, doorY + 12, doorW / 2, Math.PI, 0);
            ctx.rect(doorX, doorY + 12, doorW, doorH - 12);
            ctx.fill();

            // أشعة النور
            ctx.strokeStyle = 'rgba(255, 235, 59, 0.4)';
            ctx.lineWidth = 2;
            for (let i = -2; i <= 2; i++) {
                ctx.beginPath();
                ctx.moveTo(this.w / 2, doorY + 14);
                ctx.lineTo(this.w / 2 + i * 16, doorY + doorH + 12);
                ctx.stroke();
            }
        } else {
            // الباب مغلق وعليه قفل
            ctx.fillStyle = '#3e2723';
            ctx.beginPath();
            ctx.arc(this.w / 2, doorY + 12, doorW / 2, Math.PI, 0);
            ctx.rect(doorX, doorY + 12, doorW, doorH - 12);
            ctx.fill();

            // رمز القفل الصغير
            ctx.fillStyle = '#ffd54f';
            ctx.beginPath();
            ctx.arc(this.w / 2, doorY + 16, 4, 0, Math.PI * 2);
            ctx.rect(this.w / 2 - 4.5, doorY + 16, 9, 7);
            ctx.fill();
        }

        ctx.restore();
    }
}

// ==========================================
// فخ الحفرة السحيقة المخفية والمموهة (Hidden Concealed Pitfall Trap)

// ==========================================
class HiddenPitTrap {
    constructor(x, y, w = 55, h = 55) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.state = 'hidden'; // 'hidden', 'cracking', 'opened'
        this.crackTimer = 0;
        this.shakeOffset = 0;
        this.depthProgress = 0;
        this.revealed = false;
    }

    update(player, isFrozen, particles = []) {
        if (isFrozen) return;

        const pDist = Math.hypot((this.x + this.w / 2) - player.x, (this.y + this.h / 2) - player.y);

        if (this.state === 'hidden') {
            // كشف الفخ إذا اقتربت الدجاجة جداً أو خطت عليه (مسافة 44 بكسل)
            if (pDist < 46 || (player.x > this.x - 4 && player.x < this.x + this.w + 4 && player.y > this.y - 4 && player.y < this.y + this.h + 4)) {
                this.state = 'cracking';
                this.crackTimer = 22; // ثلث ثانية شقوق واهتزاز سريع قبل الانهيار
                if (window.soundEngine && window.soundEngine.playPitfallCollapse) {
                    window.soundEngine.playPitfallCollapse();
                }
            }
        } else if (this.state === 'cracking') {
            this.crackTimer--;
            this.shakeOffset = (Math.random() - 0.5) * 3.5;

            // تطاير جزيئات تراب وأوراق شجر
            if (Math.random() > 0.4 && particles) {
                particles.push(new Particle(
                    this.x + Math.random() * this.w,
                    this.y + Math.random() * this.h,
                    '#8d6e63',
                    2.2,
                    (Math.random() - 0.5) * 2,
                    -Math.random() * 2,
                    20
                ));
            }

            if (this.crackTimer <= 0) {
                this.state = 'opened';
                this.revealed = true;
                // حطام متساقط في الهوة
                for (let i = 0; i < 12; i++) {
                    particles.push(new Particle(
                        this.x + this.w / 2,
                        this.y + this.h / 2,
                        '#4e342e',
                        3.5,
                        (Math.random() - 0.5) * 4,
                        Math.random() * 2,
                        30
                    ));
                }
            }
        } else if (this.state === 'opened') {
            if (this.depthProgress < 1) {
                this.depthProgress = Math.min(1, this.depthProgress + 0.1);
            }
        }
    }

    checkFall(player) {
        if (this.state !== 'opened') return false;
        // هل سقط اللاعب داخل الحفرة المفتوحة؟
        return (
            player.x > this.x + 8 &&
            player.x < this.x + this.w - 8 &&
            player.y > this.y + 8 &&
            player.y < this.y + this.h - 8
        );
    }

    draw(ctx) {
        ctx.save();

        if (this.state === 'hidden') {
            // أرضية مموهة ببراعة مع علامات خفيفة جداً (أوراق شجر متناثرة وشقوق دقيقة تحذيرية)
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.fillRect(this.x, this.y, this.w, this.h);

            // أوراق عشب أو تراب مموه
            ctx.fillStyle = 'rgba(76, 175, 80, 0.28)';
            ctx.beginPath();
            ctx.arc(this.x + this.w * 0.3, this.y + this.h * 0.4, 4, 0, Math.PI * 2);
            ctx.arc(this.x + this.w * 0.7, this.y + this.h * 0.6, 5, 0, Math.PI * 2);
            ctx.fill();

            // شق رفيع جداً يكاد لا يُرى
            ctx.strokeStyle = 'rgba(62, 39, 35, 0.2)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(this.x + 10, this.y + 12);
            ctx.lineTo(this.x + 22, this.y + 18);
            ctx.stroke();

            ctx.restore();
            return;
        }

        const ox = (this.state === 'cracking') ? this.shakeOffset : 0;
        ctx.translate(ox, 0);

        if (this.state === 'cracking') {
            // أرضية متصدعة وتهتز بقوة
            ctx.fillStyle = '#795548';
            ctx.fillRect(this.x, this.y, this.w, this.h);

            // شبكة شقوق عميقة
            ctx.strokeStyle = '#271206';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.x + this.w * 0.5, this.y + 2);
            ctx.lineTo(this.x + this.w * 0.3, this.y + this.h * 0.4);
            ctx.lineTo(this.x + this.w * 0.8, this.y + this.h * 0.6);
            ctx.lineTo(this.x + this.w * 0.5, this.y + this.h - 2);
            ctx.moveTo(this.x + this.w * 0.3, this.y + this.h * 0.4);
            ctx.lineTo(this.x + 4, this.y + this.h * 0.5);
            ctx.moveTo(this.x + this.w * 0.8, this.y + this.h * 0.6);
            ctx.lineTo(this.x + this.w - 4, this.y + this.h * 0.5);
            ctx.stroke();

            // علامة خطر طافية
            ctx.fillStyle = '#ff5722';
            ctx.font = 'bold 13px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('⚠️', this.x + this.w / 2, this.y - 4);
        } else if (this.state === 'opened') {
            // هوة سحيقة مظلمة 3D مع أشواك حادة في القاع
            const grad = ctx.createRadialGradient(
                this.x + this.w / 2, this.y + this.h / 2, 4,
                this.x + this.w / 2, this.y + this.h / 2, this.w * 0.6
            );
            grad.addColorStop(0, '#0a0502');
            grad.addColorStop(0.7, '#1b0d07');
            grad.addColorStop(1, '#3e2723');

            ctx.fillStyle = grad;
            ctx.fillRect(this.x, this.y, this.w, this.h);

            // إطار خشن مكسور حول الفوهة
            ctx.strokeStyle = '#271206';
            ctx.lineWidth = 3;
            ctx.strokeRect(this.x, this.y, this.w, this.h);

            // أشواك معدنية حادة في قاع الحفرة
            ctx.fillStyle = '#cfd8dc';
            const numSpikes = 4;
            const spWidth = this.w / numSpikes;
            for (let i = 0; i < numSpikes; i++) {
                const sx = this.x + i * spWidth;
                const sy = this.y + this.h;
                ctx.beginPath();
                ctx.moveTo(sx + 2, sy - 2);
                ctx.lineTo(sx + spWidth / 2, sy - 18 * this.depthProgress);
                ctx.lineTo(sx + spWidth - 2, sy - 2);
                ctx.closePath();
                ctx.fill();

                // لمعان رأس الشوكة
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(sx + spWidth / 2, sy - 18 * this.depthProgress, 1.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#cfd8dc';
            }
        }

        ctx.restore();
    }
}

// ==========================================
// فخ الكرة الحديدية المشوكة العملاقة (Spiked Iron Mace Ball)
// يدعم: متأرجحة بالسلسلة (pendulum / orbit) أو متدحرجة في الممرات (rolling)
// ==========================================
class SpikedIronBall {
    constructor(config) {
        this.type = config.type || 'pendulum'; // 'pendulum', 'orbit', 'rolling'
        this.radius = config.radius || 22; // نصف قطر الكرة
        this.numSpikes = 8;

        if (this.type === 'pendulum') {
            this.pivotX = config.pivotX;
            this.pivotY = config.pivotY;
            this.length = config.length || 110;
            this.speed = config.speed || 0.038;
            this.angleRange = config.angleRange || (Math.PI * 0.42);
            this.angle = config.startAngle || -this.angleRange;
            this.direction = 1;
            this.x = this.pivotX + Math.sin(this.angle) * this.length;
            this.y = this.pivotY + Math.cos(this.angle) * this.length;
            this.rotation = 0;
        } else if (this.type === 'orbit') {
            this.pivotX = config.pivotX;
            this.pivotY = config.pivotY;
            this.length = config.length || 95;
            this.speed = config.speed || 0.032;
            this.angle = config.startAngle || 0;
            this.x = this.pivotX + Math.cos(this.angle) * this.length;
            this.y = this.pivotY + Math.sin(this.angle) * this.length;
            this.rotation = 0;
        } else if (this.type === 'rolling') {
            this.startX = config.startX;
            this.startY = config.startY;
            this.endX = config.endX;
            this.endY = config.endY;
            this.speed = config.speed || 2.4;
            this.x = config.startX;
            this.y = config.startY;
            this.t = 0;
            this.direction = 1;
            this.dist = Math.hypot(this.endX - this.startX, this.endY - this.startY);
            this.rotation = 0;
        }
    }

    update(isFrozen, particles = []) {
        if (isFrozen) return;

        if (this.type === 'pendulum') {
            this.angle += this.speed * this.direction;
            if (this.angle >= this.angleRange) {
                this.angle = this.angleRange;
                this.direction = -1;
            } else if (this.angle <= -this.angleRange) {
                this.angle = -this.angleRange;
                this.direction = 1;
            }
            this.x = this.pivotX + Math.sin(this.angle) * this.length;
            this.y = this.pivotY + Math.cos(this.angle) * this.length;
            this.rotation += 0.05 * this.direction;
        } else if (this.type === 'orbit') {
            this.angle += this.speed;
            this.x = this.pivotX + Math.cos(this.angle) * this.length;
            this.y = this.pivotY + Math.sin(this.angle) * this.length;
            this.rotation += 0.06;
        } else if (this.type === 'rolling') {
            if (this.dist > 0) {
                this.t += (this.speed / this.dist) * this.direction;
                if (this.t >= 1) {
                    this.t = 1;
                    this.direction = -1;
                } else if (this.t <= 0) {
                    this.t = 0;
                    this.direction = 1;
                }
                this.x = this.startX + (this.endX - this.startX) * this.t;
                this.y = this.startY + (this.endY - this.startY) * this.t;
                this.rotation += (this.speed * 0.08) * this.direction;
            }
        }

        // شرارات معدنية واحتكاك
        if (Math.random() > 0.65 && particles) {
            particles.push(new Particle(
                this.x + (Math.random() - 0.5) * this.radius,
                this.y + (Math.random() - 0.5) * this.radius,
                '#ffeb3b',
                1.8,
                (Math.random() - 0.5) * 2.5,
                (Math.random() - 0.5) * 2.5,
                14
            ));
        }
    }

    checkCollision(player) {
        const dist = Math.hypot(player.x - this.x, player.y - this.y);
        return dist < (this.radius * 0.95 + player.radius * 0.75);
    }

    draw(ctx) {
        ctx.save();

        // رسم السلسلة الحديدية إن كانت متأرجحة أو مدارية
        if (this.type === 'pendulum' || this.type === 'orbit') {
            // نقطة التثبيت المركزية (Pivot anchor)
            ctx.fillStyle = '#37474f';
            ctx.beginPath();
            ctx.arc(this.pivotX, this.pivotY, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#212121';
            ctx.lineWidth = 2;
            ctx.stroke();

            // رسم حلقات السلسلة الفولاذية
            const numLinks = Math.floor(this.length / 10);
            for (let i = 1; i <= numLinks; i++) {
                const ratio = i / numLinks;
                const lx = this.pivotX + (this.x - this.pivotX) * ratio;
                const ly = this.pivotY + (this.y - this.pivotY) * ratio;

                ctx.strokeStyle = (i % 2 === 0) ? '#90a4ae' : '#546e7a';
                ctx.lineWidth = 3.5;
                ctx.beginPath();
                ctx.arc(lx, ly, 3.5, 0, Math.PI * 2);
                ctx.stroke();
            }
        } else if (this.type === 'rolling') {
            // ظل الكرة المتدحرجة
            ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
            ctx.beginPath();
            ctx.ellipse(this.x, this.y + this.radius + 2, this.radius * 0.9, 6, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // رسم الكرة الحديدية المشوكة الرئيسية
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        // رسم الأشواك الفولاذية المثلثة الحادة البارزة
        const spikeLength = 12;
        const spikeBase = 7;
        for (let i = 0; i < this.numSpikes; i++) {
            const angle = (i / this.numSpikes) * Math.PI * 2;
            ctx.save();
            ctx.rotate(angle);

            // تدرج لوني للشوك الحديدي المصقول
            const spGrad = ctx.createLinearGradient(this.radius, 0, this.radius + spikeLength, 0);
            spGrad.addColorStop(0, '#78909c');
            spGrad.addColorStop(0.6, '#cfd8dc');
            spGrad.addColorStop(1, '#ffffff');

            ctx.fillStyle = spGrad;
            ctx.beginPath();
            ctx.moveTo(this.radius - 2, -spikeBase / 2);
            ctx.lineTo(this.radius + spikeLength, 0); // رأس الشوكة الفولاذي
            ctx.lineTo(this.radius - 2, spikeBase / 2);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = '#263238';
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.restore();
        }

        // جسم الكرة الحديدية الدائرية بتدرج إضاءة معدنية واقعية
        const ballGrad = ctx.createRadialGradient(
            -this.radius * 0.35, -this.radius * 0.35, 2,
            0, 0, this.radius
        );
        ballGrad.addColorStop(0, '#eceff1');
        ballGrad.addColorStop(0.3, '#78909c');
        ballGrad.addColorStop(0.7, '#37474f');
        ballGrad.addColorStop(1, '#1a237e');

        ctx.fillStyle = ballGrad;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#212121';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // مسامير فولاذية حديدية داخل الكرة لتعزيز الطابع الحربي
        ctx.fillStyle = '#b0bec5';
        for (let i = 0; i < 4; i++) {
            const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
            const rx = Math.cos(a) * (this.radius * 0.55);
            const ry = Math.sin(a) * (this.radius * 0.55);
            ctx.beginPath();
            ctx.arc(rx, ry, 2.2, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

// ==========================================
// ثعلب الكمين المخفي في الشجيرة (Ambush Bush Fox 🦊🌿)
// ==========================================
class AmbushFox {
    constructor(x, y, speed = 2.4) {
        this.x = x;
        this.y = y;
        this.spawnX = x;
        this.spawnY = y;
        this.speed = speed;
        this.radius = 18;
        this.state = 'hidden'; // 'hidden', 'rustling', 'chasing'
        this.revealRadius = 135;
        this.rustleTimer = 0;
        this.shakeX = 0;
        this.foxEntity = new FoxEnemy(x, y, x, y, speed, true); // ثعلب صياد متتبع كامل الإمكانيات
    }

    update(player, isFrozen, walls = [], particles = []) {
        if (isFrozen) return;

        const dist = Math.hypot(player.x - this.x, player.y - this.y);

        if (this.state === 'hidden') {
            // اقتربت الدجاجة من الشجيرة المشبوهة
            if (dist < this.revealRadius) {
                this.state = 'rustling';
                this.rustleTimer = 20; // اهتزاز الشجيرة قبل الوثوب
                if (window.soundEngine && window.soundEngine.playFoxAmbush) {
                    window.soundEngine.playFoxAmbush();
                }
            }
        } else if (this.state === 'rustling') {
            this.rustleTimer--;
            this.shakeX = (Math.random() - 0.5) * 5;

            // تطاير أوراق شجر خضراء وبرتقالية
            if (particles && Math.random() > 0.3) {
                particles.push(new Particle(
                    this.x + (Math.random() - 0.5) * 26,
                    this.y + (Math.random() - 0.5) * 20,
                    '#43a047',
                    2.8,
                    (Math.random() - 0.5) * 3,
                    -Math.random() * 2.5,
                    22
                ));
            }

            if (this.rustleTimer <= 0) {
                this.state = 'chasing';
                // قفزة وثوب فورية للثعلب مع انفجار أوراق شجر
                for (let i = 0; i < 16; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const spd = 2 + Math.random() * 3;
                    particles.push(new Particle(this.x, this.y, '#2e7d32', 3.2, Math.cos(angle) * spd, Math.sin(angle) * spd, 28));
                }
            }
        } else if (this.state === 'chasing') {
            // مطاردة صيادة شرسة
            this.foxEntity.update(player, isFrozen, walls, particles);
            this.x = this.foxEntity.x;
            this.y = this.foxEntity.y;
        }
    }

    checkCollision(player) {
        if (this.state !== 'chasing') return false;
        return this.foxEntity.checkCollision(player);
    }

    draw(ctx) {
        if (this.state === 'chasing') {
            this.foxEntity.draw(ctx);
            return;
        }

        ctx.save();
        ctx.translate(this.x + (this.state === 'rustling' ? this.shakeX : 0), this.y);

        // رسم شجيرة كثيفة تخفي الثعلب
        // ظل الشجيرة
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.beginPath();
        ctx.ellipse(0, 14, 22, 7, 0, 0, Math.PI * 2);
        ctx.fill();

        // أوراق الشجيرة الخضراء الكثيفة
        const bushGrad = ctx.createRadialGradient(-4, -6, 4, 0, 0, 24);
        bushGrad.addColorStop(0, '#66bb6a');
        bushGrad.addColorStop(0.6, '#2e7d32');
        bushGrad.addColorStop(1, '#1b5e20');

        ctx.fillStyle = bushGrad;
        // رسم كتل الشجيرة الورقية
        ctx.beginPath();
        ctx.arc(-10, 2, 14, 0, Math.PI * 2);
        ctx.arc(10, 2, 14, 0, Math.PI * 2);
        ctx.arc(0, -8, 16, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#1b5e20';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // تفاصيل أوراق وأزهار برية صغيرة
        ctx.fillStyle = '#81c784';
        ctx.beginPath();
        ctx.arc(-5, -4, 3, 0, Math.PI * 2);
        ctx.arc(6, -2, 3.5, 0, Math.PI * 2);
        ctx.fill();

        if (this.state === 'rustling') {
            // عيون الثعلب تلمع في الظلام داخل الشجيرة قبل الوثوب!
            ctx.fillStyle = '#ff1744';
            ctx.shadowColor = '#ff1744';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(-4, -2, 2.5, 0, Math.PI * 2);
            ctx.arc(4, -2, 2.5, 0, Math.PI * 2);
            ctx.fill();

            // تنبيه وثوب
            ctx.fillStyle = '#ffca28';
            ctx.font = 'bold 14px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('🦊💥!', 0, -22);
        }

        ctx.restore();
    }
}
