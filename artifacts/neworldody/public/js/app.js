/**
 * Neworldody 2.0 — Celestial Journey App
 * Orchestrates galaxy, planetary system, gate, challenge, and reading pages.
 */

const App = (() => {
    const CONFIG = {
        TOTAL_DAYS: 365,
        DATA_BASE: 'data/days/'
    };

    let currentPage = 'galaxy';
    let currentDay = 1;
    let dayData = null;
    let challenges = [];
    let achievements = [];
    let planets = [];
    let soulQuestions = [];
    let soulReflections = [];
    let events = {};
    let timerInterval = null;
    let configData = null;

    const dom = {};

    // ═══════════════════════════════════════════
    // INIT
    // ═══════════════════════════════════════════
    async function init() {
        cacheDOM();
        await loadConfig();
        await loadGlobalData();

        AudioManager.init();
        AudioManager.playSceneMusic('galaxy');

        const progress = Storage.getProgress();
        currentDay = progress.currentDay || 1;
        if (Storage.isFirstVisit()) {
            showWelcomeToast('مرحباً دودي. هذا الكون كُتب لكِ.');
            Storage.markVisited();
            showAudioConsent();
        } else {
            updateAudioUI();
        }

        renderGalaxy();
        renderPlanets();
        renderGate();
        renderChallenge();
        renderStarMap();
        renderAchievements();
        bindEvents();
        updateNavDots();

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js').catch(err => console.warn('SW registration failed:', err));
        }

        checkEvents();
        checkAchievements();
    }

    function cacheDOM() {
        const ids = [
            'audioConsent', 'enableAudio', 'disableAudio', 'audioToggle', 'audioIcon', 'audioPanel',
            'musicToggle', 'effectsToggle', 'volumeSlider', 'pageNav',
            'galaxy-page', 'planets-page', 'gate-page', 'challenge-page', 'reading-page',
            'galaxyEnter', 'galaxySpiral', 'galaxyStars', 'galaxyShooting', 'solarSystem', 'sunCore',
            'gateCountdown', 'gateStatus', 'gateOpen', 'gateBack', 'gateHourglass',
            'challengeCard', 'challengeIcon', 'challengeText', 'challengeReward', 'challengeComplete', 'challengeCelebration', 'challengeBack',
            'openBook', 'closeBookBtn', 'dayNum', 'progressBar', 'progressText',
            'pageTitle', 'pageMessage', 'pageWisdom', 'pageAuthor',
            'spaceFact', 'starOfDay', 'planetFocus',
            'variableCard', 'variableIcon', 'variableTitle', 'variableContent',
            'surpriseCard', 'surpriseIcon', 'surpriseTitle', 'surpriseContent',
            'occasionCard', 'occasionIcon', 'occasionTitle', 'occasionContent',
            'modalOverlay', 'starMapModal', 'soulModal', 'achievementsModal', 'messagesModal', 'dreamsModal', 'surprisesModal', 'eventModal',
            'starMap', 'starMapStats', 'soulQuestion', 'soulAnswer', 'soulSave', 'soulReflection', 'soulHistory',
            'achievementsGrid', 'openTodayBook', 'messagesList', 'dreamInput', 'dreamSave', 'dreamsList',
            'giftBox', 'giftContent', 'surprisesBody', 'eventIcon', 'eventTitle', 'eventMessage', 'eventQuote', 'eventAuthor', 'eventClose',
            'welcomeToast'
        ];
        ids.forEach(id => dom[id] = document.getElementById(id));
    }

    async function loadConfig() {
        try {
            const res = await fetch('data/config.json');
            if (res.ok) {
                configData = await res.json();
                Object.assign(CONFIG, configData);
                planets = configData.planets || [];
            }
        } catch (e) {
            console.warn('Config load failed:', e);
        }
    }

    async function loadGlobalData() {
        try {
            const [ch, ach, ev, soul] = await Promise.all([
                fetch('data/challenges.json').then(r => r.ok ? r.json() : {}),
                fetch('data/achievements.json').then(r => r.ok ? r.json() : {}),
                fetch('data/events.json').then(r => r.ok ? r.json() : {}),
                fetch('data/soul.json').then(r => r.ok ? r.json() : {})
            ]);
            challenges = ch.challenges || [];
            achievements = ach.achievements || [];
            events = ev;
            soulQuestions = soul.questions || [];
            soulReflections = soul.reflections || [];
        } catch (e) {
            console.warn('Global data load failed:', e);
        }
    }

    // ═══════════════════════════════════════════
    // NAVIGATION
    // ═══════════════════════════════════════════
    function goToPage(page, options = {}) {
        if (page === currentPage && !options.force) return;
        const pages = ['galaxy', 'planets', 'gate', 'challenge', 'reading'];
        pages.forEach(p => {
            const el = document.getElementById(`${p}-page`);
            if (!el) return;
            el.classList.remove('page-active', 'page-fade-in', 'page-fade-out', 'page-zoom-in');
            if (p === page) {
                el.classList.add('page-active', options.zoom ? 'page-zoom-in' : 'page-fade-in');
            } else {
                el.classList.add('page-fade-out');
            }
        });
        currentPage = page;
        updateNavDots();
        updateAudioForPage(page);

        if (page === 'planets') SkyGenerator.generatePlanetsBackground();
        if (page === 'gate') {
            renderGate();
            startTimer();
        }
        if (page === 'challenge') {
            SkyGenerator.generateChallengeBackground();
            renderChallenge();
        }
        if (page === 'reading') {
            SkyGenerator.generateForDay(currentDay);
        }
    }

    function updateNavDots() {
        if (!dom.pageNav) return;
        const dots = dom.pageNav.querySelectorAll('.nav-dot');
        dots.forEach(dot => {
            dot.classList.toggle('active', dot.dataset.page === currentPage);
        });
        dom.pageNav.classList.toggle('visible', currentPage !== 'galaxy' && currentPage !== 'reading');
    }

    function updateAudioForPage(page) {
        const map = { galaxy: 'galaxy', planets: 'planets', gate: 'gate', challenge: 'challenge', reading: 'book' };
        AudioManager.playSceneMusic(map[page] || 'galaxy');
    }

    // ═══════════════════════════════════════════
    // EVENTS
    // ═══════════════════════════════════════════
    function bindEvents() {
        // Audio consent
        if (dom.enableAudio) dom.enableAudio.addEventListener('click', () => acceptAudio(true));
        if (dom.disableAudio) dom.disableAudio.addEventListener('click', () => acceptAudio(false));

        // Audio toggle
        if (dom.audioToggle) {
            dom.audioToggle.addEventListener('click', () => {
                AudioManager.playSFX('button');
                dom.audioPanel?.classList.toggle('hidden');
                dom.audioToggle.classList.toggle('active');
            });
        }
        if (dom.musicToggle) {
            dom.musicToggle.addEventListener('click', () => {
                AudioManager.setMusic(!AudioManager.musicEnabled);
                updateAudioUI();
            });
        }
        if (dom.effectsToggle) {
            dom.effectsToggle.addEventListener('click', () => {
                AudioManager.setEffects(!AudioManager.effectsEnabled);
                updateAudioUI();
            });
        }
        if (dom.volumeSlider) {
            dom.volumeSlider.addEventListener('input', (e) => {
                AudioManager.setVolume(parseFloat(e.target.value));
            });
        }

        // Galaxy
        if (dom.galaxyEnter) {
            dom.galaxyEnter.addEventListener('click', enterGalaxy);
        }
        const galaxyPage = document.getElementById('galaxy-page');
        if (galaxyPage) galaxyPage.addEventListener('click', enterGalaxy);

        // Gate
        if (dom.gateOpen) dom.gateOpen.addEventListener('click', openTodayBook);
        if (dom.gateBack) dom.gateBack.addEventListener('click', () => goToPage('planets'));

        // Challenge
        if (dom.challengeComplete) dom.challengeComplete.addEventListener('click', completeChallenge);
        if (dom.challengeBack) dom.challengeBack.addEventListener('click', () => goToPage('planets'));

        // Reading
        if (dom.closeBookBtn) dom.closeBookBtn.addEventListener('click', closeBook);

        // Nav dots
        if (dom.pageNav) {
            dom.pageNav.querySelectorAll('.nav-dot').forEach(dot => {
                dot.addEventListener('click', () => {
                    AudioManager.playSFX('button');
                    goToPage(dot.dataset.page);
                });
            });
        }

        // Modal closes
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => closeModal(btn.dataset.modal));
        });
        if (dom.modalOverlay) dom.modalOverlay.addEventListener('click', closeAllModals);
        if (dom.eventClose) dom.eventClose.addEventListener('click', () => closeModal('eventModal'));

        // Modal actions
        if (dom.openTodayBook) dom.openTodayBook.addEventListener('click', () => {
            closeModal('messagesModal');
            openTodayBook();
        });
        if (dom.soulSave) dom.soulSave.addEventListener('click', saveSoulAnswer);
        if (dom.dreamSave) dom.dreamSave.addEventListener('click', saveDream);
        if (dom.giftBox) {
            dom.giftBox.addEventListener('click', openGift);
            dom.giftBox.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') openGift(); });
        }
    }

    // ═══════════════════════════════════════════
    // AUDIO CONSENT
    // ═══════════════════════════════════════════
    function showAudioConsent() {
        dom.audioConsent?.classList.remove('hidden');
    }

    function acceptAudio(enabled) {
        AudioManager.setMusic(enabled);
        AudioManager.setEffects(true);
        if (enabled) AudioManager.ensureContext();
        dom.audioConsent?.classList.add('hidden');
        updateAudioUI();
        AudioManager.playSFX('button');
    }

    function updateAudioUI() {
        if (dom.musicToggle) {
            dom.musicToggle.textContent = AudioManager.musicEnabled ? 'تشغيل' : 'إيقاف';
            dom.musicToggle.classList.toggle('on', AudioManager.musicEnabled);
        }
        if (dom.effectsToggle) {
            dom.effectsToggle.textContent = AudioManager.effectsEnabled ? 'تشغيل' : 'إيقاف';
            dom.effectsToggle.classList.toggle('on', AudioManager.effectsEnabled);
        }
        if (dom.volumeSlider) dom.volumeSlider.value = AudioManager.volume;
        const icon = document.getElementById('audioIcon');
        if (icon) {
            icon.textContent = AudioManager.musicEnabled ? '🔊' : AudioManager.effectsEnabled ? '🔉' : '🔇';
        }
    }

    // ═══════════════════════════════════════════
    // GALAXY PAGE
    // ═══════════════════════════════════════════
    function renderGalaxy() {
        SkyGenerator.generateGalaxy();
    }

    function enterGalaxy() {
        if (currentPage !== 'galaxy') return;
        AudioManager.playSFX('galaxyTouch');
        const spiral = document.getElementById('galaxySpiral');
        if (spiral) spiral.classList.add('zooming');
        AudioManager.playSFX('zoom');
        setTimeout(() => {
            goToPage('planets', { zoom: true });
            spiral?.classList.remove('zooming');
        }, 1200);
    }

    // ═══════════════════════════════════════════
    // PLANETARY SYSTEM
    // ═══════════════════════════════════════════
    function renderPlanets() {
        if (!dom.solarSystem) return;
        dom.solarSystem.innerHTML = '';
        const sun = document.createElement('div');
        sun.className = 'sun-core';
        dom.solarSystem.appendChild(sun);

        const orbitRadii = [90, 130, 170, 210, 250, 290];
        const durations = [20, 28, 38, 50, 64, 80];

        planets.forEach((planet, i) => {
            const orbit = document.createElement('div');
            orbit.className = 'orbit-ring';
            orbit.style.width = `${orbitRadii[i] * 2}px`;
            orbit.style.height = `${orbitRadii[i] * 2}px`;
            orbit.style.top = '50%';
            orbit.style.left = '50%';
            orbit.style.transform = 'translate(-50%, -50%)';
            dom.solarSystem.appendChild(orbit);

            const orbitContainer = document.createElement('div');
            orbitContainer.className = 'planet-orbit';
            orbitContainer.style.setProperty('--orbit-duration', `${durations[i]}s`);
            orbitContainer.style.width = `${orbitRadii[i] * 2}px`;
            orbitContainer.style.height = `${orbitRadii[i] * 2}px`;
            orbitContainer.style.top = '50%';
            orbitContainer.style.left = '50%';
            orbitContainer.style.marginTop = `-${orbitRadii[i]}px`;
            orbitContainer.style.marginLeft = `-${orbitRadii[i]}px`;

            const planetEl = document.createElement('button');
            planetEl.className = 'planet';
            planetEl.style.width = `${42 + i * 4}px`;
            planetEl.style.height = `${42 + i * 4}px`;
            planetEl.style.background = `radial-gradient(circle at 30% 30%, ${lightenColor(planet.color, 40)}, ${planet.color} 60%, ${darkenColor(planet.color, 30)})`;
            planetEl.style.boxShadow = `0 0 20px ${planet.color}80, inset -4px -4px 10px rgba(0,0,0,0.3)`;
            planetEl.style.top = '0';
            planetEl.style.left = '50%';
            planetEl.style.transform = 'translate(-50%, -50%)';
            planetEl.style.animationDelay = `${i * -0.5}s`;
            planetEl.setAttribute('role', 'button');
            planetEl.setAttribute('aria-label', planet.name);
            planetEl.innerHTML = `<span class="planet-icon">${planet.icon}</span><span class="planet-label">${planet.name}</span>`;
            planetEl.addEventListener('click', (e) => {
                e.stopPropagation();
                openPlanet(planet.id);
            });

            orbitContainer.appendChild(planetEl);
            dom.solarSystem.appendChild(orbitContainer);
        });

        SkyGenerator.generatePlanetsBackground();
    }

    function openPlanet(planetId) {
        AudioManager.playSFX('planetClick');
        switch (planetId) {
            case 'messages': goToPage('gate'); break;
            case 'wisdom': openTodayBook(); break;
            case 'soul': openModal('soulModal'); renderSoul(); break;
            case 'achievements': openModal('achievementsModal'); renderAchievements(); break;
            case 'surprises': openModal('surprisesModal'); renderSurprises(); break;
            case 'dreams': openModal('dreamsModal'); renderDreams(); break;
        }
    }

    function lightenColor(hex, percent) {
        const num = parseInt(hex.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.min(255, (num >> 16) + amt);
        const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
        const B = Math.min(255, (num & 0x0000FF) + amt);
        return `rgb(${R}, ${G}, ${B})`;
    }

    function darkenColor(hex, percent) {
        const num = parseInt(hex.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.max(0, (num >> 16) - amt);
        const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
        const B = Math.max(0, (num & 0x0000FF) - amt);
        return `rgb(${R}, ${G}, ${B})`;
    }

    // ═══════════════════════════════════════════
    // GATE PAGE
    // ═══════════════════════════════════════════
    function renderGate() {
        const unlocked = Storage.isDayUnlocked(currentDay);
        if (dom.gateOpen) dom.gateOpen.disabled = !unlocked;
        if (dom.gateStatus) {
            dom.gateStatus.textContent = unlocked
                ? 'حان وقت الصفحة الجديدة'
                : 'الصفحة التالية تنتظركِ مع الفجر';
        }
        if (unlocked) {
            document.getElementById('gate-page')?.classList.add('gate-unlocked');
        } else {
            document.getElementById('gate-page')?.classList.remove('gate-unlocked');
        }
        updateTimer();
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
        const unlocked = remaining <= 0;

        if (unlocked) {
            if (dom.gateCountdown) dom.gateCountdown.textContent = '٠٠:٠٠:٠٠';
            if (dom.gateStatus) dom.gateStatus.textContent = 'حان وقت الصفحة الجديدة';
            if (dom.gateOpen) dom.gateOpen.disabled = false;
            document.getElementById('gate-page')?.classList.add('gate-unlocked');
        } else {
            const h = Math.floor(remaining / 3600000);
            const m = Math.floor((remaining % 3600000) / 60000);
            const s = Math.floor((remaining % 60000) / 1000);
            if (dom.gateCountdown) dom.gateCountdown.textContent = `${toArabicNum(h).padStart(2, '٠')}:${toArabicNum(m).padStart(2, '٠')}:${toArabicNum(s).padStart(2, '٠')}`;
            if (dom.gateOpen) dom.gateOpen.disabled = true;
        }
    }

    // ═══════════════════════════════════════════
    // CHALLENGE PAGE
    // ═══════════════════════════════════════════
    function getTodayChallenge() {
        if (!challenges.length) return { id: 0, text: 'ابتسمي اليوم.', reward: 'نجمة', difficulty: 'سهل' };
        const index = ((currentDay - 1) % challenges.length);
        return challenges[index];
    }

    function renderChallenge() {
        const challenge = getTodayChallenge();
        const completed = Storage.isChallengeCompleted(challenge.id);
        if (dom.challengeIcon) dom.challengeIcon.textContent = '⚡';
        if (dom.challengeText) dom.challengeText.textContent = challenge.text;
        if (dom.challengeReward) dom.challengeReward.textContent = `المكافأة: ${challenge.reward}`;
        if (dom.challengeComplete) {
            dom.challengeComplete.textContent = completed ? 'أنجزتِه اليوم' : 'أنجزتُ التحدي';
            dom.challengeComplete.classList.toggle('completed', completed);
            dom.challengeComplete.disabled = completed;
        }
        if (dom.challengeCelebration) dom.challengeCelebration.classList.toggle('hidden', !completed);
    }

    function completeChallenge() {
        const challenge = getTodayChallenge();
        if (Storage.isChallengeCompleted(challenge.id)) return;
        Storage.completeChallenge(challenge.id);
        Storage.unlockStar(currentDay);
        AudioManager.playSFX('challenge');
        AudioManager.playSFX('achievement');
        renderChallenge();
        renderStarMap();
        checkAchievements();
    }

    // ═══════════════════════════════════════════
    // READING / BOOK
    // ═══════════════════════════════════════════
    async function openTodayBook() {
        const canRead = Storage.isDayUnlocked(currentDay);
        if (!canRead) {
            goToPage('gate');
            return;
        }
        dayData = await loadDay(currentDay);
        goToPage('reading');
        renderDay(dayData);
        Storage.unlockDay(currentDay);
        Storage.unlockStar(currentDay);
        renderProgress();
        renderStarMap();
        checkAchievements();
    }

    async function closeBook() {
        if (!dom.openBook) return;
        dom.openBook.classList.add('closing');
        AudioManager.playSFX('page');
        setTimeout(() => {
            dom.openBook.classList.remove('closing');
            goToPage('planets');
        }, 700);
    }

    async function loadDay(dayNum) {
        const padded = String(dayNum).padStart(3, '0');
        try {
            const res = await fetch(`${CONFIG.DATA_BASE}day_${padded}.json`);
            if (res.ok) return await res.json();
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
            variable_card: { type: 'tip', content: 'ابدئي يومكِ بابتسامة، حتى لو كانت صغيرة.' },
            surprise_card: { type: 'special', content: 'تذكري: كل يوم جديد هو هدية. افتتحيه بهدوء.' },
            special_occasion: null,
            sky_seed: dayNum
        };
    }

    function renderDay(data) {
        if (!data) return;
        if (dom.dayNum) dom.dayNum.textContent = toArabicNum(data.day);
        if (dom.pageTitle) dom.pageTitle.textContent = data.title || `اليوم ${toArabicNum(data.day)}`;
        if (dom.pageMessage) dom.pageMessage.textContent = data.message || '';
        if (dom.pageWisdom) dom.pageWisdom.textContent = data.wisdom || '';
        if (dom.pageAuthor) dom.pageAuthor.textContent = data.wisdom_author ? `— ${data.wisdom_author}` : '';
        if (dom.spaceFact) dom.spaceFact.textContent = data.space_fact || '';
        if (dom.starOfDay) dom.starOfDay.textContent = data.star_of_day || '';
        if (dom.planetFocus) dom.planetFocus.textContent = data.planet_focus || '';
        renderVariableCard(data.variable_card);
        renderSurpriseCard(data.surprise_card);
        renderOccasion(data.special_occasion);
        if (dom.skyNote) dom.skyNote.textContent = 'لم تتكرر هذه السماء منذ بداية الرحلة';
    }

    function renderVariableCard(card) {
        if (!card || !dom.variableCard) {
            if (dom.variableCard) dom.variableCard.classList.add('hidden');
            return;
        }
        const icons = { tip: '🌱', reflection: '💭', challenge: '⚡', word: '✒️', quote: '📜', habit: '🍃', idea: '💡' };
        const titles = {
            tip: 'نصيحة اليوم', reflection: 'سؤال للتأمل', challenge: 'تحدي اليوم',
            word: 'كلمة جميلة', quote: 'اقتباس أدبي', habit: 'عادة صحية', idea: 'فكرة إبداعية'
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
        const icons = { special: '🎁', love: '💖', support: '🤗', poetry: '📖', secret: '🔮', future: '🌅', night: '🌙', milestone: '👑' };
        const titles = {
            special: 'رسالة خاصة', love: 'رسالة حب', support: 'دعم لكِ', poetry: 'بيت شعر',
            secret: 'سر جميل', future: 'رسالة من المستقبل', night: 'رسالة ليلية', milestone: 'إنجاز رائع'
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
        const circumference = 2 * Math.PI * 45;
        if (dom.progressBar) dom.progressBar.setAttribute('stroke-dasharray', `${pct / 100 * circumference}, ${circumference}`);
        if (dom.progressText) dom.progressText.textContent = `${toArabicNum(current)} / ${toArabicNum(CONFIG.TOTAL_DAYS)}`;
    }

    // ═══════════════════════════════════════════
    // MODALS
    // ═══════════════════════════════════════════
    function openModal(id) {
        const modal = document.getElementById(id);
        if (!modal) return;
        // Close other modals to avoid overlap
        document.querySelectorAll('.modal').forEach(m => {
            if (m.id !== id) m.classList.add('hidden');
        });
        modal.classList.remove('hidden');
        if (dom.modalOverlay) dom.modalOverlay.classList.remove('hidden');
        AudioManager.playSFX('button');
    }

    function closeModal(id) {
        const modal = document.getElementById(id);
        if (modal) modal.classList.add('hidden');
        const anyOpen = document.querySelectorAll('.modal:not(.hidden)').length > 0;
        if (!anyOpen && dom.modalOverlay) dom.modalOverlay.classList.add('hidden');
    }

    function closeAllModals() {
        document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
        if (dom.modalOverlay) dom.modalOverlay.classList.add('hidden');
    }

    // Star Map
    function renderStarMap() {
        if (!dom.starMap) return;
        const stars = Storage.getStars();
        const unlocked = new Set(stars.unlocked || []);
        const progress = Storage.getProgress();
        const today = progress.currentDay || 1;
        dom.starMap.innerHTML = '';
        const total = Math.min(CONFIG.TOTAL_DAYS, 365);
        for (let i = 1; i <= total; i++) {
            const cell = document.createElement('div');
            cell.className = 'star-map-cell';
            cell.textContent = toArabicNum(i);
            if (unlocked.has(i)) cell.classList.add('unlocked');
            if (i === today) cell.classList.add('today');
            cell.title = `اليوم ${toArabicNum(i)}`;
            dom.starMap.appendChild(cell);
        }
        if (dom.starMapStats) {
            dom.starMapStats.textContent = `فتحتِ ${toArabicNum(unlocked.size)} نجمة من ${toArabicNum(total)}`;
        }
    }

    // Soul Mirror
    function renderSoul() {
        const seed = currentDay + 1000;
        const q = soulQuestions[(currentDay - 1) % soulQuestions.length] || soulQuestions[0] || 'ما الذي تبحثين عنه اليوم؟';
        const r = soulReflections[(currentDay - 1) % soulReflections.length] || '';
        if (dom.soulQuestion) dom.soulQuestion.textContent = q;
        if (dom.soulReflection) dom.soulReflection.textContent = r;
        if (dom.soulAnswer) dom.soulAnswer.value = '';

        const history = Storage.getSoulAnswers().answers.slice(0, 5);
        if (dom.soulHistory) {
            dom.soulHistory.innerHTML = history.map(h => `
                <div class="history-item">
                    <div class="history-date">${formatDate(h.date)}</div>
                    <div><strong>${h.question}</strong></div>
                    <div>${h.answer}</div>
                </div>
            `).join('');
        }
    }

    function saveSoulAnswer() {
        const q = dom.soulQuestion?.textContent || '';
        const a = dom.soulAnswer?.value?.trim();
        if (!a) return;
        Storage.saveSoulAnswer(q, a);
        AudioManager.playSFX('button');
        renderSoul();
        checkAchievements();
    }

    // Achievements
    function renderAchievements() {
        if (!dom.achievementsGrid) return;
        const state = Storage.evaluateState();
        const unlocked = Storage.getAchievements();
        dom.achievementsGrid.innerHTML = '';

        achievements.forEach(ach => {
            const isUnlocked = !!unlocked[ach.id];
            const item = document.createElement('div');
            item.className = `achievement-item ${isUnlocked ? 'unlocked' : 'locked'}`;
            item.innerHTML = `
                <div class="achievement-icon">${ach.icon}</div>
                <div class="achievement-info">
                    <h3>${ach.name}</h3>
                    <p>${ach.description}</p>
                </div>
            `;
            dom.achievementsGrid.appendChild(item);
        });
    }

    function checkAchievements() {
        const state = Storage.evaluateState();
        let changed = false;
        achievements.forEach(ach => {
            if (evaluateCondition(ach.condition, state)) {
                if (Storage.unlockAchievement(ach.id)) {
                    changed = true;
                }
            }
        });
        if (changed) {
            AudioManager.playSFX('achievement');
            renderAchievements();
        }
    }

    function evaluateCondition(condition, state) {
        try {
            const parts = condition.split(' ');
            const key = parts[0];
            const op = parts[1];
            const val = parts[2];
            const left = state[key];
            const right = val === 'true' ? true : val === 'false' ? false : parseFloat(val);
            if (op === '>=') return left >= right;
            if (op === '<=') return left <= right;
            if (op === '>') return left > right;
            if (op === '<') return left < right;
            if (op === '==') return left === right;
            return false;
        } catch (e) {
            return false;
        }
    }

    // Dreams
    function renderDreams() {
        const data = Storage.getDreams().dreams.slice(0, 10);
        if (dom.dreamsList) {
            dom.dreamsList.innerHTML = data.map(d => `
                <div class="dream-item">
                    <div class="dream-date">${formatDate(d.date)}</div>
                    <div>${d.text}</div>
                </div>
            `).join('');
        }
        if (dom.dreamInput) dom.dreamInput.value = '';
    }

    function saveDream() {
        const text = dom.dreamInput?.value?.trim();
        if (!text) return;
        Storage.saveDream(text);
        AudioManager.playSFX('button');
        renderDreams();
    }

    // Surprises
    function renderSurprises() {
        if (dom.giftBox) dom.giftBox.classList.remove('hidden');
        if (dom.giftContent) dom.giftContent.classList.add('hidden');
    }

    function openGift() {
        if (!dayData) {
            loadDay(currentDay).then(d => {
                dayData = d;
                showGiftContent();
            });
            return;
        }
        showGiftContent();
    }

    function showGiftContent() {
        if (!dayData) return;
        const card = dayData.surprise_card;
        if (!card) return;
        if (dom.giftBox) dom.giftBox.classList.add('hidden');
        if (dom.giftContent) {
            dom.giftContent.classList.remove('hidden');
            dom.giftContent.innerHTML = `<h3>${card.type === 'love' ? 'رسالة حب' : card.type === 'secret' ? 'سر' : 'مفاجأة'}</h3><p>${card.content}</p>`;
        }
        AudioManager.playSFX('gift');
    }

    // Events
    function checkEvents() {
        const today = new Date();
        const month = today.getMonth() + 1;
        const day = today.getDate();
        const dateKey = `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const progress = Storage.getProgress();
        const start = new Date(progress.startDate);
        const daysSince = Math.floor((today - start) / (1000 * 60 * 60 * 24));
        let event = null;

        // Date-based events (birthday, new year, custom)
        const eventMap = events?.events || {};
        for (const key of Object.keys(eventMap)) {
            const ev = eventMap[key];
            if (ev.date && ev.date === dateKey) {
                // If both birthday and new year share a date, birthday takes priority
                if (key === 'birthday') { event = ev; break; }
                if (!event) event = ev;
            }
        }

        // Custom events
        if (!event) {
            const customEvents = events?.custom || [];
            for (const ev of customEvents) {
                if (ev.date && ev.date === dateKey) {
                    event = ev;
                    break;
                }
            }
        }

        // Anniversary: every 30 days since start
        if (!event && daysSince > 0 && daysSince % 30 === 0) {
            event = eventMap?.anniversary;
        }

        // Monthly milestone
        if (!event && daysSince > 0 && daysSince % 30 === 0) {
            event = eventMap?.monthly_milestone;
        }

        if (event) showEvent(event);
    }

    function showEvent(event) {
        if (dom.eventIcon) dom.eventIcon.textContent = event.icon || '✨';
        if (dom.eventTitle) dom.eventTitle.textContent = event.title || '';
        if (dom.eventMessage) dom.eventMessage.textContent = event.message || '';
        if (dom.eventQuote) dom.eventQuote.textContent = event.quote || '';
        if (dom.eventAuthor) dom.eventAuthor.textContent = event.quote_author ? `— ${event.quote_author}` : '';
        openModal('eventModal');
    }

    // ═══════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════
    function toArabicNum(num) {
        const arabic = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
        return String(num).split('').map(d => arabic[d] || d).join('');
    }

    function formatDate(iso) {
        try {
            const d = new Date(iso);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        } catch (e) {
            return '';
        }
    }

    function showWelcomeToast(text) {
        if (!dom.welcomeToast) return;
        dom.welcomeToast.querySelector('span').textContent = text;
        dom.welcomeToast.classList.remove('hidden');
        setTimeout(() => dom.welcomeToast.classList.add('hidden'), 5000);
    }

    return {
        init,
        goToPage,
        openTodayBook,
        closeBook
    };
})();

if (typeof window !== 'undefined') {
    window.App = App;
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
} else {
    App.init();
}
