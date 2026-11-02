with open("js/game.js", "r", encoding="utf-8") as f:
    code = f.read()

target1 = """    togglePause() {
        if (this.state === 'PLAYING') {
            this.state = 'PAUSED';
            this.lastActiveTimestamp = null;
            this.showModal('pauseModal');
        } else if (this.state === 'PAUSED') {
            this.state = 'PLAYING';
            this.lastActiveTimestamp = Date.now();
            this.hideModals();
        }
    }"""

replacement1 = """    togglePause() {
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
    }"""

target2 = """    hideModals() {
        const modals = document.querySelectorAll('.modal-overlay');
        modals.forEach(m => m.style.display = 'none');
    }"""

replacement2 = """    hideModals() {
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
    }"""

if target1 in code:
    code = code.replace(target1, replacement1, 1)
    print("Patched target1 (togglePause) successfully!")
else:
    print("target1 not found in code")

if target2 in code:
    code = code.replace(target2, replacement2, 1)
    print("Patched target2 (hideModals) successfully!")
else:
    print("target2 not found in code")

with open("js/game.js", "w", encoding="utf-8") as f:
    f.write(code)
print("Saved updated js/game.js")
