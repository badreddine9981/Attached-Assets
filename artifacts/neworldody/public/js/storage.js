/**
 * Neworldody Storage
 * LocalStorage helpers for progress, settings, and unlock state.
 */

const Storage = (() => {
    const CONFIG = {
        TOTAL_DAYS: 365,
        STORAGE_KEYS: {
            PROGRESS: 'neworldody_progress_v1',
            SETTINGS: 'neworldody_settings_v1',
            FIRST_VISIT: 'neworldody_first_visit_v1',
            SKY_STATE: 'neworldody_sky_v1'
        }
    };

    function getDefaultProgress() {
        return {
            currentDay: 1,
            highestDay: 1,
            completedDays: [],
            startDate: new Date().toISOString(),
            lastUnlock: new Date().toISOString(),
            nextUnlock: getNextMidnight().toISOString()
        };
    }

    function getDefaultSettings() {
        return {
            music: null, // null = not asked yet, true/false = user choice
            volume: 0.6,
            effects: true
        };
    }

    function getNextMidnight() {
        const now = new Date();
        const midnight = new Date(now);
        midnight.setHours(24, 0, 0, 0);
        return midnight;
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

            // Ensure all required fields exist
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
            // dayNum === highestDay + 1: check if nextUnlock has passed
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
            this.saveProgress(progress);
            return progress;
        },

        setCurrentDay(dayNum) {
            const progress = this.getProgress();
            progress.currentDay = Math.max(1, Math.min(dayNum, CONFIG.TOTAL_DAYS));
            this.saveProgress(progress);
            return progress;
        },

        getNextMidnight: getNextMidnight,
        getTomorrowMidnight: getTomorrowMidnight,

        clearAll() {
            Object.values(CONFIG.STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
        }
    };
})();

if (typeof window !== 'undefined') {
    window.Storage = Storage;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Storage;
}
