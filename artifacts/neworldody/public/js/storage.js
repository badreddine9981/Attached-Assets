/**
 * Neworldody Storage
 * LocalStorage helpers for progress, settings, achievements, soul, and dreams.
 */

const Storage = (() => {
    const CONFIG = {
        TOTAL_DAYS: 365,
        STORAGE_KEYS: {
            PROGRESS: 'neworldody_progress_v2',
            SETTINGS: 'neworldody_settings_v2',
            FIRST_VISIT: 'neworldody_first_visit_v2',
            SKY_STATE: 'neworldody_sky_v2',
            ACHIEVEMENTS: 'neworldody_achievements_v2',
            CHALLENGES: 'neworldody_challenges_v2',
            SOUL: 'neworldody_soul_v2',
            DREAMS: 'neworldody_dreams_v2',
            AUDIO: 'neworldody_audio_v2',
            STARS: 'neworldody_stars_v2'
        }
    };

    function getDefaultProgress() {
        return {
            currentDay: 1,
            highestDay: 1,
            completedDays: [],
            challengesCompleted: 0,
            starsUnlocked: 0,
            startDate: new Date().toISOString(),
            lastUnlock: new Date().toISOString(),
            nextUnlock: getTomorrowMidnight().toISOString()
        };
    }

    function getDefaultSettings() {
        return {
            music: null, // null = not asked yet
            volume: 0.6,
            effects: true
        };
    }

    function getTomorrowMidnight() {
        const now = new Date();
        const midnight = new Date(now);
        midnight.setDate(midnight.getDate() + 1);
        midnight.setHours(0, 0, 0, 0);
        return midnight;
    }

    function safeGet(key, defaultValue) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : defaultValue;
        } catch (e) {
            console.error('Storage read failed:', e);
            return defaultValue;
        }
    }

    function safeSet(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('Storage write failed:', e);
            return false;
        }
    }

    return {
        CONFIG,

        getProgress() {
            const saved = safeGet(CONFIG.STORAGE_KEYS.PROGRESS, null);
            if (!saved) return getDefaultProgress();
            return { ...getDefaultProgress(), ...saved };
        },

        saveProgress(progress) {
            return safeSet(CONFIG.STORAGE_KEYS.PROGRESS, progress);
        },

        getSettings() {
            const saved = safeGet(CONFIG.STORAGE_KEYS.SETTINGS, null);
            if (!saved) return getDefaultSettings();
            return { ...getDefaultSettings(), ...saved };
        },

        saveSettings(settings) {
            return safeSet(CONFIG.STORAGE_KEYS.SETTINGS, settings);
        },

        getAudioSettings() {
            const saved = safeGet(CONFIG.STORAGE_KEYS.AUDIO, null);
            return { ...getDefaultSettings(), ...saved };
        },

        saveAudioSettings(settings) {
            return safeSet(CONFIG.STORAGE_KEYS.AUDIO, { ...getDefaultSettings(), ...settings });
        },

        isFirstVisit() {
            return safeGet(CONFIG.STORAGE_KEYS.FIRST_VISIT, true) === true;
        },

        markVisited() {
            return safeSet(CONFIG.STORAGE_KEYS.FIRST_VISIT, false);
        },

        isDayUnlocked(dayNum) {
            if (dayNum <= 1) return true;
            const progress = this.getProgress();
            if (dayNum > progress.highestDay + 1) return false;
            if (dayNum <= progress.highestDay) return true;
            const nextUnlock = new Date(progress.nextUnlock);
            return Date.now() >= nextUnlock.getTime();
        },

        canUnlockToday() {
            const progress = this.getProgress();
            const nextUnlock = new Date(progress.nextUnlock);
            return Date.now() >= nextUnlock.getTime() && progress.highestDay < CONFIG.TOTAL_DAYS;
        },

        unlockDay(dayNum) {
            const progress = this.getProgress();
            if (!progress.completedDays.includes(dayNum)) {
                progress.completedDays.push(dayNum);
            }
            if (dayNum > progress.highestDay) {
                progress.highestDay = dayNum;
                progress.currentDay = dayNum;
                progress.lastUnlock = new Date().toISOString();
                progress.nextUnlock = getTomorrowMidnight().toISOString();
            } else if (dayNum === progress.highestDay) {
                progress.currentDay = dayNum;
            }
            progress.starsUnlocked = Math.max(progress.starsUnlocked || 0, progress.highestDay);
            this.saveProgress(progress);
            return progress;
        },

        setCurrentDay(dayNum) {
            const progress = this.getProgress();
            progress.currentDay = Math.max(1, Math.min(dayNum, CONFIG.TOTAL_DAYS));
            this.saveProgress(progress);
            return progress;
        },

        // Achievements
        getAchievements() {
            return safeGet(CONFIG.STORAGE_KEYS.ACHIEVEMENTS, {});
        },

        saveAchievements(data) {
            return safeSet(CONFIG.STORAGE_KEYS.ACHIEVEMENTS, data);
        },

        unlockAchievement(id) {
            const data = this.getAchievements();
            if (!data[id]) {
                data[id] = { unlockedAt: new Date().toISOString() };
                this.saveAchievements(data);
                return true;
            }
            return false;
        },

        // Challenges
        getChallenges() {
            return safeGet(CONFIG.STORAGE_KEYS.CHALLENGES, { completed: [] });
        },

        saveChallenges(data) {
            return safeSet(CONFIG.STORAGE_KEYS.CHALLENGES, data);
        },

        isChallengeCompleted(id) {
            const data = this.getChallenges();
            return data.completed.some(c => c.id === id && c.date === new Date().toISOString().split('T')[0]);
        },

        completeChallenge(id) {
            const data = this.getChallenges();
            const today = new Date().toISOString().split('T')[0];
            if (!data.completed.some(c => c.id === id && c.date === today)) {
                data.completed.push({ id, date: today });
                this.saveChallenges(data);
                const progress = this.getProgress();
                progress.challengesCompleted = (progress.challengesCompleted || 0) + 1;
                this.saveProgress(progress);
                return true;
            }
            return false;
        },

        // Soul Mirror
        getSoulAnswers() {
            return safeGet(CONFIG.STORAGE_KEYS.SOUL, { answers: [] });
        },

        saveSoulAnswer(question, answer) {
            const data = this.getSoulAnswers();
            data.answers.unshift({
                question,
                answer,
                date: new Date().toISOString()
            });
            this.saveSoulAnswers(data);
        },

        saveSoulAnswers(data) {
            return safeSet(CONFIG.STORAGE_KEYS.SOUL, data);
        },

        // Dreams
        getDreams() {
            return safeGet(CONFIG.STORAGE_KEYS.DREAMS, { dreams: [] });
        },

        saveDream(text) {
            const data = this.getDreams();
            data.dreams.unshift({
                text,
                date: new Date().toISOString()
            });
            this.saveDreams(data);
        },

        saveDreams(data) {
            return safeSet(CONFIG.STORAGE_KEYS.DREAMS, data);
        },

        // Stars
        getStars() {
            return safeGet(CONFIG.STORAGE_KEYS.STARS, { unlocked: [] });
        },

        unlockStar(dayNum) {
            const data = this.getStars();
            if (!data.unlocked.includes(dayNum)) {
                data.unlocked.push(dayNum);
                this.saveStars(data);
                const progress = this.getProgress();
                progress.starsUnlocked = data.unlocked.length;
                this.saveProgress(progress);
                return true;
            }
            return false;
        },

        saveStars(data) {
            return safeSet(CONFIG.STORAGE_KEYS.STARS, data);
        },

        clearAll() {
            Object.values(CONFIG.STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
        },

        getTomorrowMidnight,

        // Helpers for achievement evaluation
        evaluateState() {
            const progress = this.getProgress();
            const achievements = this.getAchievements();
            const audio = this.getAudioSettings();
            return {
                highestDay: progress.highestDay || 1,
                challengesCompleted: progress.challengesCompleted || 0,
                starsUnlocked: progress.starsUnlocked || 0,
                musicEnabled: audio.music === true,
                firstVisit: !this.isFirstVisit()
            };
        }
    };
})();

if (typeof window !== 'undefined') {
    window.Storage = Storage;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Storage;
}
