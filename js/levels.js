/**
 * تصميم جميع المراحل الـ 10 للعبة الدجاجة والأفخاخ
 * كل مرحلة تتميز ببيئة، أفخاخ جديدة، وتحديات متدرجة في الصعوبة
 */

const GAME_LEVELS = [
    // المرحلة 1: بداية المغامرة في المزرعة
    {
        id: 1,
        title: "المرحلة 1: بداية المغامرة في المزرعة",
        subtitle: "تعلم التحرك وجمع البيض الذهبي",
        theme: "grass",
        playerStart: { x: 70, y: 480 },
        coop: { x: 760, y: 70, w: 60, h: 60 },
        walls: [
            // حدود وأسوار خشبية
            { x: 0, y: 0, w: 860, h: 20 },
            { x: 0, y: 540, w: 860, h: 20 },
            { x: 0, y: 0, w: 20, h: 560 },
            { x: 840, y: 0, w: 20, h: 560 },

            // حواجز داخلية لتشكيل مسار ممتع
            { x: 200, y: 120, w: 20, h: 320 },
            { x: 400, y: 20, w: 20, h: 320 },
            { x: 600, y: 160, w: 20, h: 380 }
        ],
        spikes: [
            // أشواك ثابتة سهلة للتجنب
            { x: 280, y: 240, w: 40, h: 40, isTimed: false },
            { x: 480, y: 340, w: 40, h: 40, isTimed: false },
            { x: 480, y: 160, w: 40, h: 40, isTimed: false }
        ],
        saws: [],
        bearTraps: [],
        crumbling: [],
        mud: [],
        dartShooters: [],
        foxes: [],
        collectibles: [
            { x: 120, y: 150, type: "EGG" },
            { x: 320, y: 460, type: "EGG" },
            { x: 520, y: 80, type: "EGG" },
            // حبات ذرة
            { x: 100, y: 320, type: "CORN" },
            { x: 320, y: 200, type: "CORN" },
            { x: 520, y: 240, type: "CORN" },
            { x: 700, y: 360, type: "CORN" },
            { x: 700, y: 200, type: "CORN" }
        ],
        requiredEggs: 3
    },

    // المرحلة 2: ممر الأشواك الموقوتة
    {
        id: 2,
        title: "المرحلة 2: حقل الأشواك الموقوتة",
        subtitle: "راقب توقيت الأشواك، احذر ثعلب الصيد المتتبع، وخذ درع الحماية!",
        theme: "grass",
        playerStart: { x: 70, y: 280 },
        coop: { x: 760, y: 250, w: 60, h: 60 },
        walls: [
            { x: 0, y: 0, w: 860, h: 20 },
            { x: 0, y: 540, w: 860, h: 20 },
            { x: 0, y: 0, w: 20, h: 560 },
            { x: 840, y: 0, w: 20, h: 560 },

            // مسارات متعرجة
            { x: 180, y: 20, w: 24, h: 220 },
            { x: 180, y: 320, w: 24, h: 220 },
            { x: 380, y: 100, w: 24, h: 360 },
            { x: 580, y: 20, w: 24, h: 220 },
            { x: 580, y: 320, w: 24, h: 220 }
        ],
        spikes: [
            // أشواك موقوتة
            { x: 260, y: 160, w: 40, h: 40, isTimed: true, offset: 0, cycleTime: 120 },
            { x: 260, y: 260, w: 40, h: 40, isTimed: true, offset: 60, cycleTime: 120 },
            { x: 260, y: 360, w: 40, h: 40, isTimed: true, offset: 0, cycleTime: 120 },

            { x: 460, y: 160, w: 40, h: 40, isTimed: true, offset: 30, cycleTime: 120 },
            { x: 460, y: 260, w: 40, h: 40, isTimed: true, offset: 90, cycleTime: 120 },
            { x: 460, y: 360, w: 40, h: 40, isTimed: true, offset: 30, cycleTime: 120 },

            { x: 670, y: 260, w: 40, h: 40, isTimed: false }
        ],
        saws: [],
        bearTraps: [],
        crumbling: [],
        mud: [],
        dartShooters: [],
        foxes: [
            // ثعلب متتبع يطارد الدجاجة ويقصيها عند الإمساك بها
            { startX: 720, startY: 460, endX: 720, endY: 460, speed: 1.8, isChaser: true }
        ],
        collectibles: [
            { x: 100, y: 100, type: "SHIELD" }, // درع حماية
            { x: 280, y: 70, type: "EGG" },
            { x: 480, y: 470, type: "EGG" },
            { x: 680, y: 100, type: "EGG" },
            { x: 280, y: 470, type: "CORN" },
            { x: 480, y: 70, type: "CORN" },
            { x: 680, y: 470, type: "CORN" }
        ],
        requiredEggs: 3
    },

    // المرحلة 3: طريق الثعلب الماكر
    {
        id: 3,
        title: "المرحلة 3: طريق الثعلب الماكر",
        subtitle: "احذر من الثعالب الدورية والثعلب المتتبع الماكر واجمع حذاء السرعة!",
        theme: "dirt",
        playerStart: { x: 70, y: 80 },
        coop: { x: 760, y: 460, w: 60, h: 60 },
        walls: [
            { x: 0, y: 0, w: 860, h: 20 },
            { x: 0, y: 540, w: 860, h: 20 },
            { x: 0, y: 0, w: 20, h: 560 },
            { x: 840, y: 0, w: 20, h: 560 },

            // حواجز ممرات الثعالب
            { x: 160, y: 160, w: 520, h: 24 },
            { x: 160, y: 340, w: 520, h: 24 }
        ],
        spikes: [
            { x: 740, y: 220, w: 40, h: 40, isTimed: false },
            { x: 100, y: 390, w: 40, h: 40, isTimed: false }
        ],
        saws: [],
        bearTraps: [],
        crumbling: [],
        mud: [],
        dartShooters: [],
        foxes: [
            // ثعلب دوري في الممر الأوسط
            { startX: 200, startY: 250, endX: 640, endY: 250, speed: 2.2 },
            // ثعلب متتبع يطارد الدجاجة مباشرة لإقصائها
            { startX: 700, startY: 100, endX: 700, endY: 100, speed: 2.0, isChaser: true }
        ],
        collectibles: [
            { x: 100, y: 250, type: "SPEED" }, // حذاء السرعة
            { x: 420, y: 80, type: "EGG" },
            { x: 420, y: 250, type: "EGG" },
            { x: 180, y: 470, type: "EGG" },
            { x: 260, y: 80, type: "CORN" },
            { x: 600, y: 80, type: "CORN" },
            { x: 720, y: 290, type: "CORN" }
        ],
        requiredEggs: 3
    },

    // المرحلة 4: طاحونة المناشير الدوارة
    {
        id: 4,
        title: "المرحلة 4: المناشير الفولاذية الدوارة",
        subtitle: "شفرات فولاذية سريعة الحركة!",
        theme: "stone",
        playerStart: { x: 70, y: 70 },
        coop: { x: 750, y: 70, w: 60, h: 60 },
        walls: [
            { x: 0, y: 0, w: 860, h: 20 },
            { x: 0, y: 540, w: 860, h: 20 },
            { x: 0, y: 0, w: 20, h: 560 },
            { x: 840, y: 0, w: 20, h: 560 },

            // أركان وممرات
            { x: 240, y: 120, w: 24, h: 320 },
            { x: 580, y: 120, w: 24, h: 320 }
        ],
        spikes: [
            { x: 400, y: 60, w: 40, h: 40, isTimed: true, offset: 0, cycleTime: 100 },
            { x: 400, y: 460, w: 40, h: 40, isTimed: true, offset: 50, cycleTime: 100 }
        ],
        saws: [
            // مناشير متحركة رأسياً وأفقياً
            { startX: 140, startY: 100, endX: 140, endY: 460, speed: 3.0, radius: 22 },
            { startX: 410, startY: 180, endX: 410, endY: 380, speed: 2.8, radius: 24 },
            { startX: 700, startY: 460, endX: 700, endY: 160, speed: 3.2, radius: 22 }
        ],
        bearTraps: [],
        crumbling: [],
        mud: [],
        dartShooters: [],
        foxes: [],
        collectibles: [
            { x: 140, y: 280, type: "EGG" },
            { x: 410, y: 280, type: "EGG" },
            { x: 700, y: 320, type: "EGG" },
            { x: 70, y: 470, type: "SHIELD" },
            { x: 500, y: 280, type: "CORN" },
            { x: 320, y: 280, type: "CORN" }
        ],
        requiredEggs: 3
    },

    // المرحلة 5: جسر الألواح المنهارة
    {
        id: 5,
        title: "المرحلة 5: جسر الألواح المنهارة",
        subtitle: "لا تتوقف عن الركض وإلا ستسقط في الهاوية!",
        theme: "stone",
        playerStart: { x: 70, y: 280 },
        coop: { x: 750, y: 260, w: 60, h: 60 },
        walls: [
            { x: 0, y: 0, w: 860, h: 20 },
            { x: 0, y: 540, w: 860, h: 20 },
            { x: 0, y: 0, w: 20, h: 560 },
            { x: 840, y: 0, w: 20, h: 560 },

            // هاوية علوية وسفلية
            { x: 180, y: 20, w: 480, h: 160 },
            { x: 180, y: 380, w: 480, h: 160 }
        ],
        spikes: [],
        saws: [
            { startX: 420, startY: 200, endX: 420, endY: 360, speed: 2.2, radius: 20 }
        ],
        bearTraps: [],
        crumbling: [
            // ممر جسر منهار يتطلب سرعة ودقة
            { x: 220, y: 230, w: 50, h: 50 },
            { x: 280, y: 280, w: 50, h: 50 },
            { x: 340, y: 230, w: 50, h: 50 },
            { x: 480, y: 280, w: 50, h: 50 },
            { x: 540, y: 230, w: 50, h: 50 },
            { x: 600, y: 280, w: 50, h: 50 }
        ],
        mud: [],
        dartShooters: [],
        foxes: [],
        collectibles: [
            { x: 250, y: 250, type: "EGG" },
            { x: 420, y: 280, type: "FREEZE" }, // بلورة تجميد الزمن!
            { x: 570, y: 250, type: "EGG" },
            { x: 70, y: 100, type: "EGG" },
            { x: 70, y: 460, type: "CORN" },
            { x: 720, y: 140, type: "CORN" },
            { x: 720, y: 420, type: "CORN" }
        ],
        requiredEggs: 3
    },

    // المرحلة 6: مستنقع الوحل ومصائد الدببة
    {
        id: 6,
        title: "المرحلة 6: الوحل ومصائد الفولاذ",
        subtitle: "الوحل يبطئك، فخاخ الدببة تطبق، والثعلب الجائع يطاردك!",
        theme: "mud",
        playerStart: { x: 70, y: 480 },
        coop: { x: 750, y: 70, w: 60, h: 60 },
        walls: [
            { x: 0, y: 0, w: 860, h: 20 },
            { x: 0, y: 540, w: 860, h: 20 },
            { x: 0, y: 0, w: 20, h: 560 },
            { x: 840, y: 0, w: 20, h: 560 },

            { x: 200, y: 140, w: 24, h: 400 },
            { x: 420, y: 20, w: 24, h: 380 },
            { x: 640, y: 140, w: 24, h: 400 }
        ],
        spikes: [],
        saws: [
            { startX: 530, startY: 100, endX: 530, endY: 460, speed: 2.6, radius: 20 }
        ],
        bearTraps: [
            // مصائد دببة في مسارات حرجة
            { x: 120, y: 240, radius: 20 },
            { x: 310, y: 160, radius: 20 },
            { x: 310, y: 380, radius: 20 },
            { x: 740, y: 320, radius: 20 }
        ],
        crumbling: [],
        mud: [
            // برك طين لزجة تبطئ الهروب
            { x: 240, y: 220, w: 140, h: 100 },
            { x: 680, y: 380, w: 120, h: 80 }
        ],
        dartShooters: [],
        foxes: [
            // ثعلب متتبع يصيد الدجاجة وسط الوحل
            { startX: 740, startY: 220, endX: 740, endY: 220, speed: 2.0, isChaser: true }
        ],
        collectibles: [
            { x: 120, y: 100, type: "EGG" },
            { x: 310, y: 270, type: "EGG" },
            { x: 740, y: 480, type: "EGG" },
            { x: 310, y: 60, type: "SPEED" },
            { x: 530, y: 60, type: "HEART" },
            { x: 120, y: 360, type: "CORN" },
            { x: 740, y: 200, type: "CORN" }
        ],
        requiredEggs: 3
    },

    // المرحلة 7: رماة السهام السريعة
    {
        id: 7,
        title: "المرحلة 7: رماة السهام السريعة",
        subtitle: "تفادَ السهام المقذوفة من الجدران!",
        theme: "stone",
        playerStart: { x: 70, y: 70 },
        coop: { x: 750, y: 460, w: 60, h: 60 },
        walls: [
            { x: 0, y: 0, w: 860, h: 20 },
            { x: 0, y: 540, w: 860, h: 20 },
            { x: 0, y: 0, w: 20, h: 560 },
            { x: 840, y: 0, w: 20, h: 560 },

            // قنوات وممرات إطلاق
            { x: 200, y: 80, w: 20, h: 420 },
            { x: 420, y: 40, w: 20, h: 420 },
            { x: 640, y: 80, w: 20, h: 420 }
        ],
        spikes: [
            { x: 310, y: 160, w: 40, h: 40, isTimed: true, offset: 0, cycleTime: 100 }
        ],
        saws: [],
        bearTraps: [],
        crumbling: [],
        mud: [],
        dartShooters: [
            // رماة سهام أفقية تطلق عبر الممرات
            { x: 20, y: 180, dirX: 1, dirY: 0, interval: 90, offset: 0 },
            { x: 20, y: 360, dirX: 1, dirY: 0, interval: 90, offset: 45 },
            { x: 420, y: 180, dirX: 1, dirY: 0, interval: 80, offset: 20 },
            { x: 420, y: 360, dirX: 1, dirY: 0, interval: 80, offset: 60 },
            { x: 800, y: 260, dirX: -1, dirY: 0, interval: 70, offset: 10 }
        ],
        foxes: [],
        collectibles: [
            { x: 110, y: 270, type: "EGG" },
            { x: 320, y: 380, type: "EGG" },
            { x: 530, y: 120, type: "EGG" },
            { x: 740, y: 120, type: "FREEZE" }, // تجميد يوقف السهام في الهواء!
            { x: 530, y: 460, type: "SHIELD" },
            { x: 110, y: 460, type: "CORN" },
            { x: 320, y: 80, type: "CORN" }
        ],
        requiredEggs: 3
    },

    // المرحلة 8: المتاهة المحصنة والمفتاح الذهبي
    {
        id: 8,
        title: "المرحلة 8: قلعة البوابة المغلقة",
        subtitle: "اعثر على المفتاح لفتح بوابة القن واهرب من الثعلب المتتبع!",
        theme: "dirt",
        playerStart: { x: 70, y: 480 },
        coop: { x: 750, y: 70, w: 60, h: 60 },
        walls: [
            { x: 0, y: 0, w: 860, h: 20 },
            { x: 0, y: 540, w: 860, h: 20 },
            { x: 0, y: 0, w: 20, h: 560 },
            { x: 840, y: 0, w: 20, h: 560 },

            // حواجز القلعة
            { x: 180, y: 160, w: 20, h: 380 },
            { x: 180, y: 20, w: 20, h: 80 },
            { x: 360, y: 20, w: 20, h: 360 },
            { x: 540, y: 160, w: 20, h: 380 },
            { x: 700, y: 160, w: 140, h: 20 },

            // بوابة خشبية مقفلة تحتاج مفتاحاً (Gate)
            { x: 700, y: 20, w: 20, h: 140, isGate: true, gateId: "gate1", isOpen: false }
        ],
        spikes: [
            { x: 260, y: 260, w: 40, h: 40, isTimed: true, offset: 0, cycleTime: 90 },
            { x: 440, y: 340, w: 40, h: 40, isTimed: true, offset: 45, cycleTime: 90 }
        ],
        saws: [
            { startX: 620, startY: 100, endX: 620, endY: 480, speed: 2.8, radius: 22 }
        ],
        bearTraps: [
            { x: 100, y: 220, radius: 18 },
            { x: 450, y: 120, radius: 18 }
        ],
        crumbling: [],
        mud: [],
        dartShooters: [],
        foxes: [
            { startX: 230, startY: 460, endX: 320, endY: 460, speed: 1.8 },
            // ثعلب متتبع يحرس ممرات القلعة
            { startX: 500, startY: 80, endX: 500, endY: 80, speed: 2.1, isChaser: true }
        ],
        collectibles: [
            { x: 90, y: 80, type: "KEY" }, // المفتاح الذهبي لفتح البوابة
            { x: 260, y: 80, type: "EGG" },
            { x: 450, y: 460, type: "EGG" },
            { x: 760, y: 260, type: "EGG" },
            { x: 760, y: 460, type: "SHIELD" },
            { x: 260, y: 360, type: "CORN" },
            { x: 450, y: 240, type: "CORN" }
        ],
        requiredEggs: 3
    },

    // المرحلة 9: فوضى المزرعة الكبرى
    {
        id: 9,
        title: "المرحلة 9: فوضى المزرعة الكبرى",
        subtitle: "مناشير، ثعلب متتبع صياد، وسهام في مواجهة حاسمة!",
        theme: "lava",
        playerStart: { x: 70, y: 280 },
        coop: { x: 750, y: 260, w: 60, h: 60 },
        walls: [
            { x: 0, y: 0, w: 860, h: 20 },
            { x: 0, y: 540, w: 860, h: 20 },
            { x: 0, y: 0, w: 20, h: 560 },
            { x: 840, y: 0, w: 20, h: 560 },

            { x: 220, y: 160, w: 20, h: 240 },
            { x: 600, y: 160, w: 20, h: 240 }
        ],
        spikes: [
            { x: 380, y: 60, w: 40, h: 40, isTimed: true, offset: 0, cycleTime: 80 },
            { x: 440, y: 460, w: 40, h: 40, isTimed: true, offset: 40, cycleTime: 80 }
        ],
        saws: [
            { startX: 140, startY: 80, endX: 140, endY: 480, speed: 3.4, radius: 22 },
            { startX: 690, startY: 480, endX: 690, endY: 80, speed: 3.4, radius: 22 }
        ],
        bearTraps: [
            { x: 320, y: 280, radius: 18 },
            { x: 500, y: 280, radius: 18 }
        ],
        crumbling: [
            { x: 380, y: 255, w: 50, h: 50 },
            { x: 440, y: 255, w: 50, h: 50 }
        ],
        mud: [
            { x: 350, y: 150, w: 160, h: 80 }
        ],
        dartShooters: [
            { x: 20, y: 80, dirX: 1, dirY: 0, interval: 80, offset: 0 },
            { x: 800, y: 480, dirX: -1, dirY: 0, interval: 80, offset: 40 }
        ],
        foxes: [
            { startX: 300, startY: 380, endX: 540, endY: 380, speed: 2.2 },
            // ثعلب متتبع سريع وقاتل
            { startX: 720, startY: 120, endX: 720, endY: 120, speed: 2.3, isChaser: true }
        ],
        collectibles: [
            { x: 70, y: 80, type: "EGG" },
            { x: 70, y: 480, type: "EGG" },
            { x: 410, y: 280, type: "EGG" },
            { x: 410, y: 480, type: "FREEZE" },
            { x: 410, y: 80, type: "SPEED" },
            { x: 750, y: 80, type: "HEART" },
            { x: 750, y: 480, type: "CORN" }
        ],
        requiredEggs: 3
    },

    // المرحلة 10: الهروب الأسطوري للدجاجة كوكو!
    {
        id: 10,
        title: "المرحلة 10: الهروب الأسطوري الكبير",
        subtitle: "التحدي الأعظم: راوغ الثعلب المتتبع الشرس واجمع البيضات الذهبية!",
        theme: "lava",
        playerStart: { x: 70, y: 480 },
        coop: { x: 750, y: 70, w: 60, h: 60 },
        walls: [
            { x: 0, y: 0, w: 860, h: 20 },
            { x: 0, y: 540, w: 860, h: 20 },
            { x: 0, y: 0, w: 20, h: 560 },
            { x: 840, y: 0, w: 20, h: 560 },

            // تصميم متاهة نهائية متقنة
            { x: 180, y: 100, w: 20, h: 440 },
            { x: 340, y: 20, w: 20, h: 420 },
            { x: 500, y: 120, w: 20, h: 420 },
            { x: 670, y: 20, w: 20, h: 400 },

            // بوابة ذهبية قبل القن
            { x: 670, y: 420, w: 170, h: 20 }
        ],
        spikes: [
            { x: 100, y: 240, w: 40, h: 40, isTimed: true, offset: 0, cycleTime: 70 },
            { x: 260, y: 180, w: 40, h: 40, isTimed: true, offset: 35, cycleTime: 70 },
            { x: 420, y: 340, w: 40, h: 40, isTimed: true, offset: 0, cycleTime: 70 },
            { x: 580, y: 200, w: 40, h: 40, isTimed: true, offset: 35, cycleTime: 70 }
        ],
        saws: [
            { startX: 260, startY: 460, endX: 260, endY: 80, speed: 3.5, radius: 24 },
            { startX: 420, startY: 80, endX: 420, endY: 460, speed: 3.5, radius: 24 },
            { startX: 580, startY: 460, endX: 580, endY: 80, speed: 3.8, radius: 24 }
        ],
        bearTraps: [
            { x: 100, y: 100, radius: 20 },
            { x: 760, y: 480, radius: 20 },
            { x: 760, y: 280, radius: 20 }
        ],
        crumbling: [
            { x: 240, y: 260, w: 50, h: 50 },
            { x: 560, y: 260, w: 50, h: 50 }
        ],
        mud: [
            { x: 700, y: 340, w: 120, h: 70 }
        ],
        dartShooters: [
            { x: 20, y: 360, dirX: 1, dirY: 0, interval: 70, offset: 0 },
            { x: 340, y: 240, dirX: -1, dirY: 0, interval: 70, offset: 35 },
            { x: 500, y: 480, dirX: 1, dirY: 0, interval: 65, offset: 20 }
        ],
        foxes: [
            // المفترس الأعظم: ثعلب أسطوري يتتبع الدجاجة في المتاهة
            { startX: 740, startY: 220, endX: 740, endY: 460, speed: 2.5, isChaser: true }
        ],
        hiddenPits: [
            { x: 420, y: 160, w: 50, h: 50 }
        ],
        spikedBalls: [
            { type: 'pendulum', pivotX: 420, pivotY: 100, length: 110, speed: 0.04, radius: 22 }
        ],
        ambushFoxes: [
            { x: 260, y: 260, speed: 2.3 }
        ],
        collectibles: [
            { x: 100, y: 60, type: "SHIELD" },
            { x: 260, y: 60, type: "EGG" },
            { x: 420, y: 500, type: "EGG" },
            { x: 580, y: 60, type: "EGG" },
            { x: 760, y: 500, type: "EGG" }, // 4 بيضات ذهبية للتحدي الأقصى
            { x: 260, y: 360, type: "FREEZE" },
            { x: 580, y: 360, type: "SPEED" },
            { x: 420, y: 220, type: "HEART" }
        ],
        requiredEggs: 4
    },

    // المرحلة 11: غابة الكمائن والحفر السحيقة
    {
        id: 11,
        title: "المرحلة 11: غابة الكمائن والحفر السحيقة",
        subtitle: "احذر الحفر المموهة بالأعشاب ولا تقترب من الشجيرات المشبوهة!",
        theme: "grass",
        playerStart: { x: 70, y: 480 },
        coop: { x: 760, y: 80, w: 60, h: 60 },
        walls: [
            { x: 0, y: 0, w: 860, h: 20 },
            { x: 0, y: 540, w: 860, h: 20 },
            { x: 0, y: 0, w: 20, h: 560 },
            { x: 840, y: 0, w: 20, h: 560 },

            // قواطع شجرية طبيعية
            { x: 180, y: 120, w: 24, h: 420 },
            { x: 360, y: 20, w: 24, h: 360 },
            { x: 540, y: 140, w: 24, h: 400 },
            { x: 700, y: 20, w: 24, h: 320 }
        ],
        spikes: [
            { x: 270, y: 240, w: 40, h: 40, isTimed: true, offset: 0, cycleTime: 80 },
            { x: 450, y: 340, w: 40, h: 40, isTimed: true, offset: 40, cycleTime: 80 }
        ],
        saws: [
            { startX: 450, startY: 80, endX: 450, endY: 300, speed: 2.8, radius: 22 }
        ],
        bearTraps: [
            { x: 100, y: 220, radius: 20 },
            { x: 620, y: 260, radius: 20 }
        ],
        crumbling: [],
        mud: [
            { x: 400, y: 420, w: 120, h: 80 }
        ],
        dartShooters: [],
        foxes: [],
        // حفر سحيقة مموهة تبدو كأرضية طبيعية
        hiddenPits: [
            { x: 260, y: 380, w: 55, h: 55 },
            { x: 440, y: 200, w: 55, h: 55 },
            { x: 620, y: 400, w: 55, h: 55 }
        ],
        spikedBalls: [],
        // ثعالب كمين متخفية في الشجيرات تفاجئك بالوثوب
        ambushFoxes: [
            { x: 300, y: 100, speed: 2.3 },
            { x: 620, y: 120, speed: 2.4 }
        ],
        collectibles: [
            { x: 100, y: 100, type: "SHIELD" }, // درع حماية أساسي للغابة
            { x: 270, y: 100, type: "EGG" },
            { x: 450, y: 480, type: "EGG" },
            { x: 620, y: 60, type: "EGG" },
            { x: 760, y: 460, type: "EGG" },
            { x: 450, y: 120, type: "SPEED" },
            { x: 270, y: 460, type: "CORN" },
            { x: 760, y: 240, type: "CORN" }
        ],
        requiredEggs: 4
    },

    // المرحلة 12: دهاليز الكرات الحديدية المشوكة
    {
        id: 12,
        title: "المرحلة 12: دهاليز الكرات الحديدية المشوكة",
        subtitle: "كرات حديدية عملاقة مشوكة تتأرجح بالسلاسل.. احسب توقيتك بدقة!",
        theme: "stone",
        playerStart: { x: 70, y: 280 },
        coop: { x: 760, y: 260, w: 60, h: 60 },
        walls: [
            { x: 0, y: 0, w: 860, h: 20 },
            { x: 0, y: 540, w: 860, h: 20 },
            { x: 0, y: 0, w: 20, h: 560 },
            { x: 840, y: 0, w: 20, h: 560 },

            // حواجز الدهاليز الحجرية
            { x: 200, y: 20, w: 20, h: 200 },
            { x: 200, y: 340, w: 20, h: 200 },
            { x: 380, y: 140, w: 20, h: 280 },
            { x: 560, y: 20, w: 20, h: 200 },
            { x: 560, y: 340, w: 20, h: 200 }
        ],
        spikes: [
            { x: 280, y: 140, w: 40, h: 40, isTimed: true, offset: 0, cycleTime: 90 },
            { x: 480, y: 380, w: 40, h: 40, isTimed: true, offset: 45, cycleTime: 90 }
        ],
        saws: [],
        bearTraps: [],
        crumbling: [
            { x: 270, y: 255, w: 50, h: 50 },
            { x: 470, y: 255, w: 50, h: 50 }
        ],
        mud: [],
        dartShooters: [],
        foxes: [
            { startX: 680, startY: 120, endX: 680, endY: 440, speed: 2.1 }
        ],
        hiddenPits: [
            { x: 280, y: 380, w: 50, h: 50 },
            { x: 480, y: 140, w: 50, h: 50 }
        ],
        // كرات حديدية مشوكة تتأرجح بالسلاسل كساعات الموت
        spikedBalls: [
            { type: 'pendulum', pivotX: 280, pivotY: 80, length: 130, speed: 0.042, radius: 24, angleRange: Math.PI * 0.44 },
            { type: 'orbit', pivotX: 470, pivotY: 280, length: 75, speed: 0.042, radius: 22 },
            { type: 'pendulum', pivotX: 660, pivotY: 480, length: 130, speed: -0.045, radius: 24, angleRange: Math.PI * 0.44 }
        ],
        ambushFoxes: [],
        collectibles: [
            { x: 100, y: 100, type: "EGG" },
            { x: 280, y: 480, type: "EGG" },
            { x: 480, y: 80, type: "EGG" },
            { x: 680, y: 480, type: "EGG" },
            { x: 470, y: 80, type: "FREEZE" }, // تجميد الزمن لإيقاف الكرات المشوكة
            { x: 680, y: 80, type: "HEART" },
            { x: 100, y: 460, type: "CORN" }
        ],
        requiredEggs: 4
    },

    // المرحلة 13: اجتياح الكرات المشوكة المتدحرجة
    {
        id: 13,
        title: "المرحلة 13: اجتياح الكرات المشوكة المتدحرجة",
        subtitle: "كرات حديدية مشوكة تتدحرج بسرعة في الممرات.. لا تتوقف عن الركض!",
        theme: "dirt",
        playerStart: { x: 70, y: 80 },
        coop: { x: 760, y: 460, w: 60, h: 60 },
        walls: [
            { x: 0, y: 0, w: 860, h: 20 },
            { x: 0, y: 540, w: 860, h: 20 },
            { x: 0, y: 0, w: 20, h: 560 },
            { x: 840, y: 0, w: 20, h: 560 },

            // ممرات أفقية لمسار الكرات المتدحرجة
            { x: 140, y: 140, w: 580, h: 20 },
            { x: 140, y: 280, w: 580, h: 20 },
            { x: 140, y: 420, w: 580, h: 20 }
        ],
        spikes: [
            { x: 740, y: 210, w: 40, h: 40, isTimed: false },
            { x: 80, y: 350, w: 40, h: 40, isTimed: false }
        ],
        saws: [],
        bearTraps: [
            { x: 420, y: 80, radius: 18 },
            { x: 420, y: 350, radius: 18 }
        ],
        crumbling: [],
        mud: [
            // برك طين في مسار الهروب
            { x: 300, y: 200, w: 120, h: 70 },
            { x: 500, y: 340, w: 120, h: 70 }
        ],
        dartShooters: [],
        foxes: [],
        hiddenPits: [
            { x: 200, y: 210, w: 55, h: 55 },
            { x: 640, y: 350, w: 55, h: 55 }
        ],
        // كرات حديدية مشوكة ثقيلة تتدحرج عبر الممرات
        spikedBalls: [
            { type: 'rolling', startX: 160, startY: 80, endX: 700, endY: 80, speed: 3.2, radius: 22 },
            { type: 'rolling', startX: 700, startY: 210, endX: 160, endY: 210, speed: 3.4, radius: 22 },
            { type: 'rolling', startX: 160, startY: 350, endX: 700, endY: 350, speed: 3.5, radius: 22 }
        ],
        ambushFoxes: [
            { x: 740, y: 80, speed: 2.3 }
        ],
        collectibles: [
            { x: 90, y: 210, type: "SPEED" }, // حذاء سرعة فائق
            { x: 260, y: 80, type: "EGG" },
            { x: 540, y: 80, type: "EGG" },
            { x: 420, y: 210, type: "EGG" },
            { x: 260, y: 480, type: "EGG" },
            { x: 740, y: 350, type: "SHIELD" },
            { x: 600, y: 480, type: "CORN" }
        ],
        requiredEggs: 4
    },

    // المرحلة 14: قلعة الرعب وقطيع الثعالب
    {
        id: 14,
        title: "المرحلة 14: قلعة الرعب وقطيع الثعالب",
        subtitle: "كمائن ثعالب وكرات مدارية مشوكة تحرس بوابة القلعة والمفتاح الذهبي!",
        theme: "stone",
        playerStart: { x: 70, y: 480 },
        coop: { x: 760, y: 70, w: 60, h: 60 },
        walls: [
            { x: 0, y: 0, w: 860, h: 20 },
            { x: 0, y: 540, w: 860, h: 20 },
            { x: 0, y: 0, w: 20, h: 560 },
            { x: 840, y: 0, w: 20, h: 560 },

            // دهاليز القلعة الحصينة
            { x: 180, y: 160, w: 20, h: 380 },
            { x: 180, y: 20, w: 20, h: 80 },
            { x: 360, y: 20, w: 20, h: 360 },
            { x: 540, y: 160, w: 20, h: 380 },
            { x: 680, y: 160, w: 160, h: 20 },

            // بوابة القلعة الحديدية المقفلة
            { x: 680, y: 20, w: 20, h: 140, isGate: true, gateId: "gate14", isOpen: false }
        ],
        spikes: [
            { x: 260, y: 300, w: 40, h: 40, isTimed: true, offset: 0, cycleTime: 75 },
            { x: 440, y: 300, w: 40, h: 40, isTimed: true, offset: 35, cycleTime: 75 }
        ],
        saws: [],
        bearTraps: [
            { x: 100, y: 260, radius: 20 },
            { x: 610, y: 460, radius: 20 }
        ],
        crumbling: [
            { x: 260, y: 180, w: 50, h: 50 },
            { x: 440, y: 420, w: 50, h: 50 }
        ],
        mud: [],
        dartShooters: [
            { x: 20, y: 200, dirX: 1, dirY: 0, interval: 70, offset: 0 },
            { x: 540, y: 320, dirX: -1, dirY: 0, interval: 70, offset: 35 }
        ],
        foxes: [],
        hiddenPits: [
            { x: 260, y: 440, w: 55, h: 55 },
            { x: 440, y: 180, w: 55, h: 55 }
        ],
        spikedBalls: [
            // كرات مشوكة تدور في مدارات حول قاعات القلعة
            { type: 'orbit', pivotX: 270, pivotY: 280, length: 75, speed: 0.045, radius: 22 },
            { type: 'orbit', pivotX: 450, pivotY: 280, length: 75, speed: -0.045, radius: 22 },
            { type: 'pendulum', pivotX: 740, pivotY: 340, length: 110, speed: 0.04, radius: 24, angleRange: Math.PI * 0.4 }
        ],
        ambushFoxes: [
            // قطيع ثعالب كمين يتربص بك في القلعة
            { x: 100, y: 160, speed: 2.4 },
            { x: 610, y: 240, speed: 2.4 }
        ],
        collectibles: [
            { x: 90, y: 80, type: "KEY" }, // المفتاح الذهبي لبوابة القلعة
            { x: 260, y: 80, type: "EGG" },
            { x: 440, y: 80, type: "EGG" },
            { x: 440, y: 480, type: "EGG" },
            { x: 760, y: 240, type: "EGG" },
            { x: 760, y: 460, type: "SHIELD" },
            { x: 260, y: 360, type: "CORN" }
        ],
        requiredEggs: 4
    },

    // المرحلة 15: الجحيم المستحيل - ملحمة كوكو الأسطورية الكبرى!
    {
        id: 15,
        title: "المرحلة 15: الجحيم المستحيل - ملحمة كوكو الأسطورية",
        subtitle: "التحدي النهائي الأقصى! حفر مموهة، كرات مشوكة مدارية، وقطيع ثعالب شرسة!",
        theme: "lava",
        playerStart: { x: 70, y: 480 },
        coop: { x: 760, y: 70, w: 60, h: 60 },
        walls: [
            { x: 0, y: 0, w: 860, h: 20 },
            { x: 0, y: 540, w: 860, h: 20 },
            { x: 0, y: 0, w: 20, h: 560 },
            { x: 840, y: 0, w: 20, h: 560 },

            // تصميم متاهة جهنمية فائقة الصعوبة
            { x: 160, y: 100, w: 20, h: 440 },
            { x: 320, y: 20, w: 20, h: 420 },
            { x: 480, y: 120, w: 20, h: 420 },
            { x: 640, y: 20, w: 20, h: 400 },
            { x: 640, y: 420, w: 140, h: 20 }
        ],
        spikes: [
            { x: 80, y: 240, w: 40, h: 40, isTimed: true, offset: 0, cycleTime: 60 },
            { x: 240, y: 180, w: 40, h: 40, isTimed: true, offset: 30, cycleTime: 60 },
            { x: 400, y: 360, w: 40, h: 40, isTimed: true, offset: 0, cycleTime: 60 },
            { x: 560, y: 200, w: 40, h: 40, isTimed: true, offset: 30, cycleTime: 60 }
        ],
        saws: [
            { startX: 240, startY: 460, endX: 240, endY: 80, speed: 3.8, radius: 24 },
            { startX: 560, startY: 460, endX: 560, endY: 80, speed: 4.0, radius: 24 }
        ],
        bearTraps: [
            { x: 90, y: 120, radius: 20 },
            { x: 740, y: 480, radius: 20 },
            { x: 740, y: 280, radius: 20 }
        ],
        crumbling: [
            { x: 220, y: 260, w: 50, h: 50 },
            { x: 540, y: 260, w: 50, h: 50 }
        ],
        mud: [
            { x: 360, y: 220, w: 100, h: 80 }
        ],
        dartShooters: [
            { x: 20, y: 360, dirX: 1, dirY: 0, interval: 60, offset: 0 },
            { x: 320, y: 260, dirX: -1, dirY: 0, interval: 60, offset: 30 },
            { x: 480, y: 480, dirX: 1, dirY: 0, interval: 55, offset: 15 }
        ],
        foxes: [
            // المفترس الأعظم: ثعلب متتبع فائق السرعة
            { startX: 400, startY: 80, endX: 400, endY: 80, speed: 2.5, isChaser: true }
        ],
        // حفر سحيقة مموهة
        hiddenPits: [
            { x: 230, y: 380, w: 50, h: 50 },
            { x: 390, y: 160, w: 50, h: 50 },
            { x: 550, y: 380, w: 50, h: 50 },
            { x: 710, y: 200, w: 50, h: 50 }
        ],
        // كرات حديدية مشوكة عملاقة تتأرجح وتدور
        spikedBalls: [
            { type: 'orbit', pivotX: 400, pivotY: 280, length: 85, speed: 0.052, radius: 25 },
            { type: 'pendulum', pivotX: 240, pivotY: 80, length: 120, speed: 0.045, radius: 22, angleRange: Math.PI * 0.45 },
            { type: 'pendulum', pivotX: 560, pivotY: 460, length: 120, speed: -0.045, radius: 22, angleRange: Math.PI * 0.45 }
        ],
        // ثعالب كمين متربصة
        ambushFoxes: [
            { x: 230, y: 460, speed: 2.5 },
            { x: 550, y: 100, speed: 2.5 }
        ],
        collectibles: [
            { x: 90, y: 60, type: "SHIELD" },
            { x: 240, y: 60, type: "EGG" },
            { x: 400, y: 480, type: "EGG" },
            { x: 560, y: 60, type: "EGG" },
            { x: 740, y: 480, type: "EGG" },
            { x: 400, y: 280, type: "EGG" }, // 5 بيضات ذهبية للتحدي الأسطوري الأقصى!
            { x: 240, y: 360, type: "FREEZE" },
            { x: 560, y: 360, type: "SPEED" },
            { x: 740, y: 160, type: "HEART" }
        ],
        requiredEggs: 5
    }
];

window.GAME_LEVELS = GAME_LEVELS;
