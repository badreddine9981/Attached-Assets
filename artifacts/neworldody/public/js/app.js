/**
 * Neworldody App
 * Orchestrates the living book experience for Dodi.
 */

const App = (() => {
    const CONFIG = {
        TOTAL_DAYS: 365,
        DATA_BASE: 'data/days/'
    };

    let currentScene = 'library';
    let currentDay = 1;
    let dayData = null;
    let timerInterval = null;

    // DOM cache
    const dom = {};

    function init() {
        cacheDOM();
        loadConfig().then(() => {
            const progress = Storage.getProgress();
            currentDay = progress.currentDay || 1;

            if (Storage.isFirstVisit()) {
                showWelcomeToast('مرحباً دودي. هذا الكتاب كُتب لكِ.');
                Storage.markVisited();
            }

            bindEvents();
            SkyGenerator.generateForDay(currentDay);
            renderProgress();
            maybeAutoOpen();

            // Register service worker for PWA
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('sw.js').catch(err => {
                    console.warn('SW registration failed:', err);
                });
            }
        });
    }

    function cacheDOM() {
        const ids = [
            'library-scene', 'reading-scene', 'waiting-scene',
            'closedBook', 'openBook', 'closeBookBtn', 'reopenBtn',
            'libraryHint', 'dayNum', 'progressBar', 'progressText',
            'pageTitle', 'pageMessage', 'pageWisdom', 'pageAuthor',
            'spaceFact', 'starOfDay', 'planetFocus',
            'variableCard', 'variableIcon', 'variableTitle', 'variableContent',
            'surpriseCard', 'surpriseIcon', 'surpriseTitle', 'surpriseContent',
            'occasionCard', 'occasionIcon', 'occasionTitle', 'occasionContent',
            'timerDisplay', 'waitText', 'waitSub', 'welcomeToast'
        ];
        ids.forEach(id => dom[id] = document.getElementById(id));
    }

    async function loadConfig() {
        try {
            const res = await fetch('data/config.json');
            if (res.ok) {
                const config = await res.json();
                Object.assign(CONFIG, config);
            }
        } catch (e) {
            console.warn('Config load failed, using defaults:', e);
        }
    }

    async function loadDay(dayNum) {
        const padded = String(dayNum).padStart(3, '0');
        try {
            const res = await fetch(`${CONFIG.DATA_BASE}day_${padded}.json`);
            if (res.ok) {
                return await res.json();
            }
        } catch (e) {
            console.warn(`Day ${dayNum} load failed:`, e);
        }
        return generateDefaultDay(dayNum);
    }

    function generateDefaultDay(dayNum) {
        return {
            day: dayNum,
            date: new Date().toISOString().split('T')[0],
            title: `اليوم ${toArabicNum(dayNum)}`,
            message: 'أهلاً بكِ في يوم جديد من رحلتك. كل صفحة تحمل فرصة جديدة للنمو والاكتشاف.',
            wisdom: 'الحكمة ليست في كمية ما نعرف، بل في كيفية استخدام ما تعلمنا.',
            wisdom_author: 'غوتاما بوذا',
            tip: 'خذي دقيقة واحدة اليوم للتنفس بعمق والشعور بالحاضر.',
            space_fact: 'الضوء القادم من الشمس يستغرق 8 دقائق و20 ثانية ليصل إلى الأرض.',
            star_of_day: 'سيريوس - ألمع نجم في سماء الليل.',
            planet_focus: 'المريخ - الكوكب الأحمر.',
            variable_card: { type: 'tip', content: 'ابدئي يومك بابتسامة، حتى لو كانت صغيرة.' },
            surprise_card: { type: 'special', content: 'تذكري: كل يوم جديد هو هدية. افتتحيه بهدوء.' },
            special_occasion: null,
            sky_seed: dayNum
        };
    }

    function bindEvents() {
        if (dom.closedBook) {
            dom.closedBook.addEventListener('click', openBook);
            dom.closedBook.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') openBook();
            });
        }

        if (dom.closeBookBtn) {
            dom.closeBookBtn.addEventListener('click', closeBook);
        }

        if (dom.reopenBtn) {
            dom.reopenBtn.addEventListener('click', reopenBook);
        }
    }

    function maybeAutoOpen() {
        // If a day is currently unlocked and the user is returning, we could auto-open.
        // For now, keep the magical library entrance.
    }

    async function openBook() {
        if (currentScene !== 'library') return;

        const canRead = Storage.isDayUnlocked(currentDay);
        if (!canRead) {
            showLibraryHint('الصفحة التالية لم تُفتح بعد. انتظري الفجر.');
            goToScene('waiting');
            startTimer();
            return;
        }

        dayData = await loadDay(currentDay);

        dom.closedBook.classList.add('opening');
        showLibraryHint('...');

        setTimeout(() => {
            goToScene('reading');
            renderDay(dayData);
            Storage.unlockDay(currentDay);
            renderProgress();
            SkyGenerator.generateForDay(currentDay);
        }, 1500);
    }

    async function closeBook() {
        if (currentScene !== 'reading') return;

        dom.openBook.classList.add('closing');

        setTimeout(() => {
            goToScene('waiting');
            startTimer();
        }, 700);
    }

    async function reopenBook() {
        if (currentScene !== 'waiting') return;
        stopTimer();
        dayData = await loadDay(currentDay);
        goToScene('reading');
        renderDay(dayData);
        SkyGenerator.generateForDay(currentDay);
    }

    function goToScene(scene) {
        const scenes = ['library', 'reading', 'waiting'];
        scenes.forEach(s => {
            const el = document.getElementById(`${s}-scene`);
            if (el) {
                el.classList.remove('scene-active', 'scene-fade-in', 'scene-fade-out');
                if (s === scene) {
                    el.classList.add('scene-active', 'scene-fade-in');
                }
            }
        });
        currentScene = scene;
    }

    function showLibraryHint(text) {
        if (dom.libraryHint) {
            dom.libraryHint.textContent = text;
            dom.libraryHint.style.animation = 'none';
            dom.libraryHint.offsetHeight; // reflow
            dom.libraryHint.style.animation = 'hintPulse 2.5s ease-in-out infinite';
        }
    }

    function showWelcomeToast(text) {
        if (dom.welcomeToast) {
            dom.welcomeToast.querySelector('span').textContent = text;
            dom.welcomeToast.classList.remove('hidden');
            setTimeout(() => dom.welcomeToast.classList.add('hidden'), 5000);
        }
    }

    function renderDay(data) {
        if (!data) return;

        // Left page
        if (dom.dayNum) dom.dayNum.textContent = toArabicNum(data.day);

        // Right page
        if (dom.pageTitle) dom.pageTitle.textContent = data.title || `اليوم ${toArabicNum(data.day)}`;
        if (dom.pageMessage) dom.pageMessage.textContent = data.message || '';
        if (dom.pageWisdom) dom.pageWisdom.textContent = data.wisdom || '';
        if (dom.pageAuthor) dom.pageAuthor.textContent = data.wisdom_author ? `— ${data.wisdom_author}` : '';

        // Space card
        if (dom.spaceFact) dom.spaceFact.textContent = data.space_fact || '';
        if (dom.starOfDay) dom.starOfDay.textContent = data.star_of_day || '';
        if (dom.planetFocus) dom.planetFocus.textContent = data.planet_focus || '';

        // Variable card
        renderVariableCard(data.variable_card);

        // Surprise card
        renderSurpriseCard(data.surprise_card);

        // Special occasion
        renderOccasion(data.special_occasion);

        // Sky note
        const skyNote = document.getElementById('skyNote');
        if (skyNote) {
            skyNote.textContent = 'لم تتكرر هذه السماء منذ بداية الرحلة';
        }
    }

    function renderVariableCard(card) {
        if (!card || !dom.variableCard) {
            if (dom.variableCard) dom.variableCard.classList.add('hidden');
            return;
        }

        const icons = {
            tip: '🌱',
            reflection: '💭',
            challenge: '⚡',
            word: '✒️',
            quote: '📜',
            habit: '🍃',
            idea: '💡'
        };

        const titles = {
            tip: 'نصيحة اليوم',
            reflection: 'سؤال للتأمل',
            challenge: 'تحدي اليوم',
            word: 'كلمة جميلة',
            quote: 'اقتباس أدبي',
            habit: 'عادة صحية',
            idea: 'فكرة إبداعية'
        };

        dom.variableCard.classList.remove('hidden');
        dom.variableIcon.textContent = icons[card.type] || '🌱';
        dom.variableTitle.textContent = titles[card.type] || 'بطاقة اليوم';
        dom.variableContent.textContent = card.content || '';
    }

    function renderSurpriseCard(card) {
        if (!card || !dom.surpriseCard) {
            if (dom.surpriseCard) dom.surpriseCard.classList.add('hidden');
            return;
        }

        const icons = {
            special: '🎁',
            love: '💖',
            support: '🤗',
            poetry: '📖',
            secret: '🔮',
            future: '🌅',
            night: '🌙',
            milestone: '👑'
        };

        const titles = {
            special: 'رسالة خاصة',
            love: 'رسالة حب',
            support: 'دعم لكِ',
            poetry: 'بيت شعر',
            secret: 'سر جميل',
            future: 'رسالة من المستقبل',
            night: 'رسالة ليلية',
            milestone: 'إنجاز رائع'
        };

        dom.surpriseCard.classList.remove('hidden');
        dom.surpriseIcon.textContent = icons[card.type] || '🎁';
        dom.surpriseTitle.textContent = titles[card.type] || 'مفاجأة اليوم';
        dom.surpriseContent.textContent = card.content || '';
    }

    function renderOccasion(occasion) {
        if (!occasion || !dom.occasionCard) {
            if (dom.occasionCard) dom.occasionCard.classList.add('hidden');
            return;
        }

        dom.occasionCard.classList.remove('hidden');
        dom.occasionIcon.textContent = occasion.icon || '✨';
        dom.occasionTitle.textContent = occasion.title || 'مناسبة خاصة';
        dom.occasionContent.textContent = occasion.content || '';
    }

    function renderProgress() {
        const progress = Storage.getProgress();
        const current = progress.highestDay || 1;
        const pct = (current / CONFIG.TOTAL_DAYS) * 100;
        const circumference = 2 * Math.PI * 45; // r=45

        if (dom.progressBar) {
            dom.progressBar.setAttribute('stroke-dasharray', `${pct / 100 * circumference}, ${circumference}`);
        }
        if (dom.progressText) {
            dom.progressText.textContent = `${toArabicNum(current)} / ${toArabicNum(CONFIG.TOTAL_DAYS)}`;
        }
    }

    function startTimer() {
        stopTimer();
        updateTimer();
        timerInterval = setInterval(updateTimer, 1000);
    }

    function stopTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    }

    function updateTimer() {
        const progress = Storage.getProgress();
        const nextUnlock = new Date(progress.nextUnlock);
        let remaining = nextUnlock.getTime() - Date.now();

        if (remaining <= 0) {
            if (dom.timerDisplay) dom.timerDisplay.textContent = '٠٠:٠٠:٠٠';
            if (dom.waitText) dom.waitText.textContent = 'حان وقت الصفحة الجديدة';
            if (dom.waitSub) dom.waitSub.textContent = 'المسي الكتاب الآن لترين يومك الجديد';
            return;
        }

        const h = Math.floor(remaining / 3600000);
        const m = Math.floor((remaining % 3600000) / 60000);
        const s = Math.floor((remaining % 60000) / 1000);

        if (dom.timerDisplay) {
            dom.timerDisplay.textContent = `${toArabicNum(h).padStart(2, '٠')}:${toArabicNum(m).padStart(2, '٠')}:${toArabicNum(s).padStart(2, '٠')}`;
        }
    }

    function toArabicNum(num) {
        const arabic = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
        return String(num).split('').map(d => arabic[d] || d).join('');
    }

    return {
        init,
        openBook,
        closeBook,
        reopenBook
    };
})();

// Global helpers
document.addEventListener('DOMContentLoaded', () => App.init());
