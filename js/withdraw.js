/**
 * =========================================================================
 * نظام سحب الأرباح والأموال الحقيقي (Real Cash Withdrawal System)
 * لعبة مغامرة كوكو والأفخاخ (Chicken Trap Adventure)
 * =========================================================================
 * 1. واجهة سحب احترافية تدعم ماستر كارد، باي بال، التحويل البنكي، والمحافظ الإلكترونية
 * 2. ربط جميع أزرار سحب الأرباح في القوائم والـ HUD لفتح النافذة بسلاسة
 * 3. حاسبة تحويل النقاط المباشرة (50,000 نقطة = 1$ USD)
 * 4. التحقق التفاعلي من صحة بيانات الحساب البنكي / المحفظة
 * 5. تسجيل الطلب محلياً وفي لوحة الإدارة مع إشعار نجاح فوري وتوثيق بالـ ID
 */

class WithdrawalManager {
    constructor() {
        this.conversionRate = 50000; // 50,000 نقطة لكل 1 دولار
        this.selectedMethod = 'mastercard';
        this.selectedAmountUSD = 10;
        this.historyStorageKey = 'chicken_user_withdrawals';

        // إعدادات وتفاصيل طرق السحب
        this.methodsConfig = {
            mastercard: {
                id: 'mastercard',
                title: 'بطاقة ماستر كارد / فيزا',
                icon: '💳',
                minUSD: 10,
                packages: [10, 25, 50, 100, 200],
                formId: 'withdrawForm_mastercard'
            },
            paypal: {
                id: 'paypal',
                title: 'باي بال (PayPal)',
                icon: '🅿️',
                minUSD: 5,
                packages: [5, 10, 25, 50, 100],
                formId: 'withdrawForm_paypal'
            },
            bank: {
                id: 'bank',
                title: 'التحويل البنكي (IBAN)',
                icon: '🏦',
                minUSD: 25,
                packages: [25, 50, 100, 250, 500],
                formId: 'withdrawForm_bank'
            },
            other: {
                id: 'other',
                title: 'بنوك ومحافظ إلكترونية (كاش / وايز)',
                icon: '🌐',
                minUSD: 5,
                packages: [5, 10, 25, 50, 100],
                formId: 'withdrawForm_other'
            }
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        this.initEventListeners();
        this.selectMethod(this.selectedMethod);
    }

    /**
     * استرجاع رصيد اللاعب الحالي
     */
    getPlayerScore() {
        if (window.game && typeof window.game.score === 'number') {
            return window.game.score;
        }
        try {
            const saved = localStorage.getItem('chicken_game_progress');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (typeof parsed.score === 'number') return parsed.score;
            }
        } catch (e) {}
        return 0;
    }

    /**
     * فتح نافذة السحب وتحديث الحسابات
     */
    openModal() {
        const modal = document.getElementById('withdrawalModal');
        if (!modal) return;

        // إغلاق أي نوافذ أخرى قد تكون مفتوحة
        const modals = document.querySelectorAll('.modal-overlay');
        modals.forEach(m => {
            if (m.id !== 'withdrawalModal') m.style.display = 'none';
        });

        modal.style.display = 'flex';

        // التبديل التلقائي إلى تبويب النموذج
        this.switchTab('form');

        // تحديث الرصيد الحالي
        const currentScore = this.getPlayerScore();
        const scoreElem = document.getElementById('withdrawPlayerScore');
        const usdElem = document.getElementById('withdrawPlayerUSD');

        if (scoreElem) scoreElem.innerText = currentScore.toLocaleString();
        if (usdElem) {
            const usdVal = (currentScore / this.conversionRate).toFixed(2);
            usdElem.innerText = `$${usdVal}`;
        }

        // تحديث الحسابات والباقات
        this.renderPackages();
        this.updateCalculations();
    }

    /**
     * إغلاق نافذة السحب
     */
    closeModal() {
        const modal = document.getElementById('withdrawalModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    /**
     * التبديل بين تبويب نموذج السحب وسجل السحوبات
     */
    switchTab(tabName) {
        const formBtn = document.getElementById('tabWithdrawFormBtn');
        const histBtn = document.getElementById('tabWithdrawHistBtn');
        const formSection = document.getElementById('withdrawFormSection');
        const histSection = document.getElementById('withdrawHistorySection');

        if (tabName === 'history') {
            if (formBtn) formBtn.classList.remove('active');
            if (histBtn) histBtn.classList.add('active');
            if (formSection) formSection.style.display = 'none';
            if (histSection) histSection.style.display = 'block';
            this.renderHistory();
        } else {
            if (histBtn) histBtn.classList.remove('active');
            if (formBtn) formBtn.classList.add('active');
            if (histSection) histSection.style.display = 'none';
            if (formSection) formSection.style.display = 'block';
        }
    }

    /**
     * تحديد طريقة السحب
     */
    selectMethod(methodKey) {
        if (!this.methodsConfig[methodKey]) return;
        this.selectedMethod = methodKey;
        const config = this.methodsConfig[methodKey];

        // تحديث تمييز الكروت
        document.querySelectorAll('.withdrawal-method-card').forEach(card => {
            if (card.getAttribute('data-method') === methodKey) {
                card.classList.add('active');
            } else {
                card.classList.remove('active');
            }
        });

        // إظهار نموذج الإدخال الخاص بالطريقة وإخفاء الباقي
        ['withdrawForm_mastercard', 'withdrawForm_paypal', 'withdrawForm_bank', 'withdrawForm_other'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = (id === config.formId) ? 'block' : 'none';
        });

        // ضبط المبلغ الافتراضي للحد الأدنى للطريقة إن كان أقل منه
        const customInput = document.getElementById('withdrawCustomAmount');
        if (customInput) {
            customInput.min = config.minUSD;
            if (parseFloat(customInput.value) < config.minUSD || !customInput.value) {
                customInput.value = config.minUSD;
            }
            this.selectedAmountUSD = parseFloat(customInput.value) || config.minUSD;
        }

        this.renderPackages();
        this.updateCalculations();
    }

    /**
     * رسم باقات المبالغ السريعة للطريقة المختارة
     */
    renderPackages() {
        const container = document.getElementById('withdrawPackagesContainer');
        if (!container) return;

        const config = this.methodsConfig[this.selectedMethod];
        const packages = config.packages;

        let html = '';
        packages.forEach(amt => {
            const pts = amt * this.conversionRate;
            const isActive = (amt === this.selectedAmountUSD) ? 'active' : '';
            html += `
                <div class="amount-package-pill ${isActive}" data-usd="${amt}">
                    <span class="package-usd">$${amt}</span>
                    <span class="package-pts">${pts.toLocaleString()} نقطة</span>
                </div>
            `;
        });

        container.innerHTML = html;

        // ربط النقر على الباقات السريعة
        container.querySelectorAll('.amount-package-pill').forEach(pill => {
            pill.addEventListener('click', (e) => {
                const usd = parseFloat(e.currentTarget.getAttribute('data-usd'));
                this.selectedAmountUSD = usd;
                const input = document.getElementById('withdrawCustomAmount');
                if (input) input.value = usd;

                container.querySelectorAll('.amount-package-pill').forEach(p => p.classList.remove('active'));
                e.currentTarget.classList.add('active');

                this.updateCalculations();
            });
        });
    }

    /**
     * تحديث الحسابات المباشرة والنقاط المطلوبة والمتبقية
     */
    updateCalculations() {
        const input = document.getElementById('withdrawCustomAmount');
        let amountUSD = parseFloat(input ? input.value : this.selectedAmountUSD) || 0;
        const config = this.methodsConfig[this.selectedMethod];

        this.selectedAmountUSD = amountUSD;

        const reqPoints = Math.round(amountUSD * this.conversionRate);
        const currentScore = this.getPlayerScore();
        const remaining = currentScore - reqPoints;

        const previewUsdElem = document.getElementById('withdrawPreviewUSD');
        const reqPointsElem = document.getElementById('withdrawReqPoints');
        const remScoreElem = document.getElementById('withdrawRemainingScore');
        const minNoticeElem = document.getElementById('withdrawMinNotice');

        if (previewUsdElem) previewUsdElem.innerText = `$${amountUSD.toFixed(2)}`;
        if (reqPointsElem) reqPointsElem.innerText = `${reqPoints.toLocaleString()} نقطة`;

        if (remScoreElem) {
            if (remaining >= 0) {
                remScoreElem.innerText = `${remaining.toLocaleString()} نقطة`;
                remScoreElem.style.color = '#81c784';
            } else {
                const shortfall = Math.abs(remaining);
                remScoreElem.innerText = `رصيدك لا يكفي (ينقصك ${shortfall.toLocaleString()} نقطة)`;
                remScoreElem.style.color = '#ff5252';
            }
        }

        if (minNoticeElem) {
            minNoticeElem.innerText = `الحد الأدنى للسحب عبر ${config.title}: $${config.minUSD} (${(config.minUSD * this.conversionRate).toLocaleString()} نقطة)`;
            if (amountUSD < config.minUSD) {
                minNoticeElem.style.color = '#ff5252';
            } else {
                minNoticeElem.style.color = '#ffd54f';
            }
        }
    }

    /**
     * جمع والتحقق من صحة بيانات الحساب المدخلة
     */
    collectAccountDetails() {
        const method = this.selectedMethod;

        if (method === 'mastercard') {
            const holder = document.getElementById('mcCardHolder')?.value.trim();
            const number = document.getElementById('mcCardNumber')?.value.trim();
            const expiry = document.getElementById('mcCardExpiry')?.value.trim();
            const bank = document.getElementById('mcIssuingBank')?.value.trim();

            if (!holder) return { valid: false, message: 'يرجى إدخال اسم صاحب بطاقة ماستر كارد بالكامل.' };
            if (!number || number.replace(/\s+/g, '').length < 14) {
                return { valid: false, message: 'يرجى إدخال رقم بطاقة صالح يتكون من 14 إلى 19 رقماً.' };
            }
            if (!expiry || !expiry.includes('/')) {
                return { valid: false, message: 'يرجى إدخال تاريخ انتهاء البطاقة بالشكل (MM/YY).' };
            }

            return {
                valid: true,
                details: {
                    cardHolder: holder,
                    cardNumber: number,
                    cardExpiry: expiry,
                    issuingBank: bank || 'غير محدد'
                }
            };
        }

        if (method === 'paypal') {
            const email = document.getElementById('paypalEmail')?.value.trim();
            const confirm = document.getElementById('paypalEmailConfirm')?.value.trim();
            const holder = document.getElementById('paypalHolderName')?.value.trim();

            if (!email || !email.includes('@')) {
                return { valid: false, message: 'يرجى إدخال بريد إلكتروني صالح لحساب PayPal.' };
            }
            if (confirm && email.toLowerCase() !== confirm.toLowerCase()) {
                return { valid: false, message: 'البريد الإلكتروني وتأكيده غير متطابقين.' };
            }

            return {
                valid: true,
                details: {
                    paypalEmail: email,
                    accountHolder: holder || 'حساب بايبال شخصي'
                }
            };
        }

        if (method === 'bank') {
            const bankName = document.getElementById('bankName')?.value.trim();
            const holder = document.getElementById('bankAccountHolder')?.value.trim();
            const iban = document.getElementById('bankIBAN')?.value.trim();
            const swift = document.getElementById('bankSWIFT')?.value.trim();
            const city = document.getElementById('bankCountryCity')?.value.trim();

            if (!bankName) return { valid: false, message: 'يرجى كتابة اسم البنك أو المصرف.' };
            if (!holder) return { valid: false, message: 'يرجى كتابة اسم صاحب الحساب البنكي الرباعي.' };
            if (!iban || iban.length < 12) {
                return { valid: false, message: 'يرجى إدخال رقم الآيبان الدولي (IBAN) بشكل صحيح.' };
            }

            return {
                valid: true,
                details: {
                    bankName: bankName,
                    accountHolder: holder,
                    iban: iban,
                    swift: swift || 'غير محدد',
                    location: city || 'محلي'
                }
            };
        }

        if (method === 'other') {
            const platform = document.getElementById('otherPlatformSelect')?.value;
            const accountId = document.getElementById('otherAccountId')?.value.trim();
            const holder = document.getElementById('otherHolderName')?.value.trim();

            if (!accountId) {
                return { valid: false, message: 'يرجى إدخال رقم المحفظة أو البريد الإلكتروني للتحويل.' };
            }

            return {
                valid: true,
                details: {
                    platform: platform || 'محفظة إلكترونية',
                    accountId: accountId,
                    accountHolder: holder || 'صاحب المحفظة'
                }
            };
        }

        return { valid: false, message: 'يرجى اختيار طريقة سحب صالحة.' };
    }

    /**
     * إرسال وتأكيد طلب السحب
     */
    submitWithdrawal() {
        const config = this.methodsConfig[this.selectedMethod];
        const input = document.getElementById('withdrawCustomAmount');
        const amountUSD = parseFloat(input ? input.value : this.selectedAmountUSD) || 0;

        // 1. التحقق من الحد الأدنى
        if (amountUSD < config.minUSD) {
            alert(`⚠️ الحد الأدنى للسحب عبر ${config.title} هو $${config.minUSD} دولار.`);
            return;
        }

        // 2. التحقق من بيانات الحساب
        const validation = this.collectAccountDetails();
        if (!validation.valid) {
            alert(`⚠️ ${validation.message}`);
            return;
        }

        // 3. التحقق من رصيد النقاط
        const requiredPoints = Math.round(amountUSD * this.conversionRate);
        const currentScore = this.getPlayerScore();

        let pointsDeducted = false;
        if (currentScore >= requiredPoints) {
            // خصم النقاط فعلياً من اللعبة
            if (window.game) {
                window.game.score -= requiredPoints;
                if (window.securityWAF) {
                    window.securityWAF.lastValidScore = window.game.score;
                    window.securityWAF.lastScoreHash = window.securityWAF.generateScoreHash(window.game.score);
                }
                window.game.saveProgress();
                window.game.updateHUD();
                pointsDeducted = true;
            }
        } else {
            // في حال رصيد أقل، نعرض تأكيد تسجيل الطلب كمعاينة وتجربة
            const proceed = confirm(
                `💡 تنبيه رصيد النقاط:\n` +
                `رصيدك الحالي (${currentScore.toLocaleString()} نقطة) أقل من المطلوب (${requiredPoints.toLocaleString()} نقطة لـ $${amountUSD}).\n\n` +
                `هل ترغب في تسجيل طلب السحب الآن للمراجعة والمعاينة؟`
            );
            if (!proceed) return;
        }

        // 4. إنشاء كائن الطلب الفريد
        const orderId = `WTH-${Date.now().toString(36).toUpperCase()}`;
        const newRecord = {
            id: orderId,
            date: new Date().toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' }),
            method: this.selectedMethod,
            methodTitle: config.title,
            amountUSD: amountUSD,
            pointsCost: requiredPoints,
            accountDetails: validation.details,
            status: 'قيد الانتظار ⏳',
            statusCode: 'pending',
            txRef: ''
        };

        // 5. حفظ الطلب في سجل المستخدم
        const history = this.getUserHistory();
        history.unshift(newRecord);
        this.saveUserHistory(history);

        // 6. ربط الطلب بلوحة الإدارة إن وُجدت
        if (window.adminManager && typeof window.adminManager.addWithdrawal === 'function') {
            window.adminManager.addWithdrawal(newRecord);
        }

        // 7. صوت احتفالي وتنبيه عائم
        if (window.soundEngine && typeof window.soundEngine.playWinLevel === 'function') {
            window.soundEngine.playWinLevel();
        }

        // 8. عرض رسالة النجاح والتهنئة للمستخدم
        const successMessage =
            `🎉 تم تسجيل طلب سحب الأرباح بنجاح!\n\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `📋 رقم المعاملة: ${orderId}\n` +
            `💰 المبلغ المطلوب: $${amountUSD.toFixed(2)} USD\n` +
            `🪙 النقاط: ${requiredPoints.toLocaleString()} نقطة\n` +
            `💳 طريقة الاستلام: ${config.title}\n` +
            `⏱️ حالة الطلب: قيد المراجعة والمعالجة ⏳\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
            `سيتم تحويل الأرباح لحسابك خلال 24 - 48 ساعة بإذن الله.\n` +
            `يمكنك متابعة حالة طلبك في تبويب "سجل طلبات السحب الخاصة بي".`;

        alert(successMessage);

        if (window.game && typeof window.game.showToast === 'function') {
            window.game.showToast(`✅ تم تسجيل طلب السحب (${orderId}) بنجاح!`, 'success');
        }

        // 9. تفريغ الحقول وإظهار السجل
        this.clearInputs();
        this.switchTab('history');
    }

    /**
     * استرجاع وحفظ سجل سحوبات اللاعب من localStorage
     */
    getUserHistory() {
        try {
            const raw = localStorage.getItem(this.historyStorageKey);
            if (raw) return JSON.parse(raw);
        } catch (e) {}
        return [];
    }

    saveUserHistory(history) {
        try {
            localStorage.setItem(this.historyStorageKey, JSON.stringify(history));
        } catch (e) {}
    }

    /**
     * رسم سجل سحوبات المستخدم في الواجهة
     */
    renderHistory() {
        const container = document.getElementById('withdrawHistoryList');
        if (!container) return;

        const history = this.getUserHistory();

        if (history.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 30px; color: #90a4ae; background: rgba(0,0,0,0.25); border-radius: 12px; border: 1px dashed rgba(255,255,255,0.1);">
                    <div style="font-size: 2.2rem; margin-bottom: 6px;">📜</div>
                    <div style="font-size: 1rem; font-weight: 700; color: #cfd8dc;">لا توجد أي طلبات سحب سابقة بعد</div>
                    <div style="font-size: 0.85rem; margin-top: 4px;">قدّم طلب سحب جديد الآن لتحويل نقاطك إلى أموال نقدية!</div>
                </div>
            `;
            return;
        }

        let html = '';
        history.forEach(item => {
            let statusBadgeClass = 'pending';
            let statusText = item.status || 'قيد الانتظار ⏳';

            if (item.statusCode === 'completed' || statusText.includes('✅')) {
                statusBadgeClass = 'completed';
            } else if (item.statusCode === 'rejected' || statusText.includes('❌')) {
                statusBadgeClass = 'rejected';
            }

            // استخراج تفاصيل الحساب للعرض
            let accPreview = '';
            if (item.accountDetails) {
                const d = item.accountDetails;
                if (d.cardNumber) accPreview = `بطاقة: **** ${d.cardNumber.slice(-4)}`;
                else if (d.paypalEmail) accPreview = `بايبال: ${d.paypalEmail}`;
                else if (d.iban) accPreview = `IBAN: ${d.iban.slice(0, 8)}...`;
                else if (d.accountId) accPreview = `حساب: ${d.accountId}`;
            }

            html += `
                <div class="withdraw-history-card">
                    <div class="withdraw-card-top">
                        <span class="withdraw-method-tag">${item.methodTitle || 'سحب نقدي'}</span>
                        <span class="withdraw-status-badge ${statusBadgeClass}">${statusText}</span>
                    </div>
                    <div class="withdraw-card-mid">
                        <div>
                            <div style="font-size: 1.3rem; font-weight: 900; color: #00e676;">$${item.amountUSD.toFixed(2)} USD</div>
                            <div style="font-size: 0.8rem; color: #ffd54f;">${(item.pointsCost || 0).toLocaleString()} نقطة</div>
                        </div>
                        <div style="text-align: left; font-size: 0.8rem; color: #90a4ae;">
                            <div>رقم الطلب: <strong style="color:#fff; font-family: monospace;">${item.id}</strong></div>
                            <div style="margin-top: 2px;">${item.date}</div>
                        </div>
                    </div>
                    ${accPreview ? `<div class="withdraw-card-bottom" style="font-size: 0.82rem; color: #b0bec5; border-top: 1px dashed rgba(255,255,255,0.08); padding-top: 6px; margin-top: 6px;">تفاصيل: ${accPreview}</div>` : ''}
                </div>
            `;
        });

        container.innerHTML = html;
    }

    /**
     * تفريغ حقول الإدخال بعد الإرسال
     */
    clearInputs() {
        ['mcCardHolder', 'mcCardNumber', 'mcCardExpiry', 'mcIssuingBank',
         'paypalEmail', 'paypalEmailConfirm', 'paypalHolderName',
         'bankName', 'bankAccountHolder', 'bankIBAN', 'bankSWIFT', 'bankCountryCity',
         'otherAccountId', 'otherHolderName'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
    }

    /**
     * ربط الأحداث وعناصر التحكم في الصفحة
     */
    initEventListeners() {
        // 1. أزرار فتح نافذة السحب من مختلف أنحاء اللعبة
        const triggerIds = ['navBtnWithdraw', 'btnOpenWithdrawalModal', 'btnStartWithdrawal'];
        triggerIds.forEach(id => {
            document.getElementById(id)?.addEventListener('click', (e) => {
                e.preventDefault();
                this.openModal();
            });
        });

        // زر السحب من تبويب متجر القسائم
        document.querySelectorAll('.voucher-tab-btn[data-tab="withdraw_nav"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.openModal();
            });
        });

        // 2. زر إغلاق نافذة السحب
        document.getElementById('btnCloseWithdrawModal')?.addEventListener('click', () => {
            this.closeModal();
        });

        // إغلاق عند النقر خارج المحتوى (على الخلفية المعتمة)
        const modal = document.getElementById('withdrawalModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeModal();
            });
        }

        // إغلاق عند الضغط على Escape
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal && modal.style.display === 'flex') {
                this.closeModal();
            }
        });

        // 3. أزرار التبويبات (تقديم طلب جديد / سجل الطلبات)
        document.getElementById('tabWithdrawFormBtn')?.addEventListener('click', () => {
            this.switchTab('form');
        });
        document.getElementById('tabWithdrawHistBtn')?.addEventListener('click', () => {
            this.switchTab('history');
        });

        // 4. اختيار طريقة السحب (كروت الطرق)
        document.querySelectorAll('.withdrawal-method-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const method = e.currentTarget.getAttribute('data-method');
                if (method) this.selectMethod(method);
            });
        });

        // 5. حقل المبلغ المخصص
        const customInput = document.getElementById('withdrawCustomAmount');
        if (customInput) {
            customInput.addEventListener('input', () => {
                this.selectedAmountUSD = parseFloat(customInput.value) || 0;
                // إزالة تمييز الباقات السريعة إذا كان المبلغ مخصصاً
                document.querySelectorAll('.amount-package-pill').forEach(p => p.classList.remove('active'));
                this.updateCalculations();
            });
        }

        // 6. زر تأكيد إرسال طلب السحب
        document.getElementById('btnSubmitWithdrawal')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.submitWithdrawal();
        });

        // 7. تنسيق إدخال رقم بطاقة ماستر كارد تلقائياً (فراغ كل 4 أرقام)
        const mcNumInput = document.getElementById('mcCardNumber');
        if (mcNumInput) {
            mcNumInput.addEventListener('input', (e) => {
                let v = e.target.value.replace(/\D/g, '').substring(0, 16);
                let formatted = v.match(/.{1,4}/g)?.join(' ') || v;
                e.target.value = formatted;
            });
        }

        // تنسيق إدخال تاريخ انتهاء البطاقة (MM/YY)
        const mcExpInput = document.getElementById('mcCardExpiry');
        if (mcExpInput) {
            mcExpInput.addEventListener('input', (e) => {
                let v = e.target.value.replace(/\D/g, '').substring(0, 4);
                if (v.length >= 3) {
                    e.target.value = v.substring(0, 2) + '/' + v.substring(2);
                } else {
                    e.target.value = v;
                }
            });
        }
    }
}

// تهيئة الكائن العام لإدارة سحب الأرباح
window.withdrawalManager = new WithdrawalManager();
