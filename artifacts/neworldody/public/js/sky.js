/**
 * Neworldody Sky Generator
 * Creates a unique night sky for every day based on a deterministic seed.
 * Used in the library, waiting, and reading scenes.
 */

const SkyGenerator = (() => {
    // Simple seeded random number generator
    function mulberry32(seed) {
        return function () {
            let t = (seed += 0x6D2B79F5);
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    function toArabicNum(num) {
        const arabic = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
        return String(num).split('').map(d => arabic[d] || d).join('');
    }

    function generateStars(container, count, seed) {
        const rand = mulberry32(seed);
        container.innerHTML = '';

        for (let i = 0; i < count; i++) {
            const star = document.createElement('div');
            star.className = 'mini-star';
            const size = 1 + rand() * 2.5;
            star.style.width = `${size}px`;
            star.style.height = `${size}px`;
            star.style.left = `${rand() * 100}%`;
            star.style.top = `${rand() * 100}%`;
            star.style.opacity = 0.3 + rand() * 0.7;
            star.style.animation = `twinkle ${3 + rand() * 4}s ease-in-out ${rand() * 5}s infinite`;
            container.appendChild(star);
        }
    }

    function generateMeteors(container, seed, chance = 0.4) {
        const rand = mulberry32(seed + 1000);
        container.innerHTML = '';

        if (rand() > chance) return; // No meteors this day

        const count = 1 + Math.floor(rand() * 3);
        for (let i = 0; i < count; i++) {
            const meteor = document.createElement('div');
            meteor.className = 'meteor';
            meteor.style.top = `${rand() * 60}%`;
            meteor.style.left = `${50 + rand() * 50}%`;
            meteor.style.animationDelay = `${rand() * 8 + 3}s`;
            meteor.style.animationDuration = `${1 + rand() * 1.5}s`;
            container.appendChild(meteor);
        }
    }

    function generateMoonPhase(day, seed) {
        const rand = mulberry32(seed + 2000);
        const phases = ['new', 'waxing-crescent', 'first-quarter', 'waxing-gibbous', 'full', 'waning-gibbous', 'last-quarter', 'waning-crescent'];
        const phase = phases[Math.floor(rand() * phases.length)];
        const glow = 0.6 + rand() * 0.4;

        return { phase, glow, size: 70 + rand() * 30 };
    }

    function setMoonElement(element, moonData) {
        if (!element) return;

        const { phase, glow, size } = moonData;
        element.style.width = `${size}px`;
        element.style.height = `${size}px`;
        element.style.boxShadow = `0 0 ${glow * 50}px rgba(255,255,255,${glow * 0.3})`;

        // Remove old phase classes
        element.className = 'moon';

        // Add a subtle shadow mask for phase
        const shadow = document.createElement('div');
        shadow.className = 'moon-phase-shadow';
        shadow.style.cssText = `
            position: absolute;
            inset: 0;
            border-radius: 50%;
            background: rgba(3, 5, 8, 0.85);
            transition: all 0.5s ease;
        `;

        switch (phase) {
            case 'new':
                shadow.style.background = 'rgba(3, 5, 8, 0.95)';
                break;
            case 'waxing-crescent':
                shadow.style.clipPath = 'polygon(0 0, 100% 0, 100% 100%, 0 100%)';
                shadow.style.transform = 'translateX(35%)';
                break;
            case 'first-quarter':
                shadow.style.clipPath = 'polygon(50% 0, 100% 0, 100% 100%, 50% 100%)';
                break;
            case 'waxing-gibbous':
                shadow.style.clipPath = 'polygon(0 0, 100% 0, 100% 100%, 0 100%)';
                shadow.style.transform = 'translateX(15%)';
                break;
            case 'full':
                shadow.style.background = 'transparent';
                break;
            case 'waning-gibbous':
                shadow.style.clipPath = 'polygon(0 0, 100% 0, 100% 100%, 0 100%)';
                shadow.style.transform = 'translateX(-15%)';
                break;
            case 'last-quarter':
                shadow.style.clipPath = 'polygon(0 0, 50% 0, 50% 100%, 0 100%)';
                break;
            case 'waning-crescent':
                shadow.style.clipPath = 'polygon(0 0, 100% 0, 100% 100%, 0 100%)';
                shadow.style.transform = 'translateX(-35%)';
                break;
        }

        element.innerHTML = '';
        element.appendChild(shadow);
    }

    function generateForDay(dayNum) {
        const seed = dayNum * 10000 + 20260726;

        const librarySky = document.getElementById('librarySky');
        const waitingSky = document.getElementById('waitingSky');
        const miniStars = document.getElementById('miniStars');
        const waitingMoon = document.getElementById('waitingMoon');
        const miniMoon = document.getElementById('miniMoon');
        const libraryMeteors = document.getElementById('libraryMeteors');
        const waitingMeteors = document.getElementById('waitingMeteors');

        const moonData = generateMoonPhase(dayNum, seed);

        if (librarySky) {
            const stars = librarySky.querySelector('.stars-bg');
            if (stars) {
                stars.style.backgroundPosition = `${(seed % 200)}px ${(seed % 100)}px`;
            }
        }

        if (waitingSky) {
            const stars = waitingSky.querySelector('.stars-slow');
            if (stars) {
                stars.style.backgroundPosition = `${(seed % 300)}px ${(seed % 150)}px`;
            }
        }

        if (miniStars) generateStars(miniStars, 35 + (seed % 30), seed);
        if (miniMoon) setMoonElement(miniMoon, moonData);
        if (waitingMoon) setMoonElement(waitingMoon, moonData);

        if (libraryMeteors) generateMeteors(libraryMeteors, seed, 0.35);
        if (waitingMeteors) generateMeteors(waitingMeteors, seed + 500, 0.25);
    }

    return {
        generateForDay,
        generateMoonPhase,
        toArabicNum
    };
})();

if (typeof window !== 'undefined') {
    window.SkyGenerator = SkyGenerator;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = SkyGenerator;
}
