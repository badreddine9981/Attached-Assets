/**
 * Neworldody Sky & Galaxy Generator
 * Creates unique celestial visuals for every scene and day.
 */

const SkyGenerator = (() => {
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

    function createStars(container, count, seed, minSize = 1, maxSize = 2.5) {
        const rand = mulberry32(seed);
        container.innerHTML = '';
        for (let i = 0; i < count; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            const size = minSize + rand() * (maxSize - minSize);
            star.style.width = `${size}px`;
            star.style.height = `${size}px`;
            star.style.left = `${rand() * 100}%`;
            star.style.top = `${rand() * 100}%`;
            star.style.opacity = 0.3 + rand() * 0.7;
            star.style.setProperty('--twinkle', `${3 + rand() * 4}s`);
            star.style.animationDelay = `${rand() * 5}s`;
            container.appendChild(star);
        }
    }

    function createShootingStars(container, seed, chance = 0.4) {
        const rand = mulberry32(seed + 9999);
        container.innerHTML = '';
        if (rand() > chance) return;
        const count = 1 + Math.floor(rand() * 3);
        for (let i = 0; i < count; i++) {
            const meteor = document.createElement('div');
            meteor.className = 'shooting-star';
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
        element.className = 'moon mini-moon';
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
            case 'new': shadow.style.background = 'rgba(3, 5, 8, 0.95)'; break;
            case 'waxing-crescent': shadow.style.clipPath = 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'; shadow.style.transform = 'translateX(35%)'; break;
            case 'first-quarter': shadow.style.clipPath = 'polygon(50% 0, 100% 0, 100% 100%, 50% 100%)'; break;
            case 'waxing-gibbous': shadow.style.clipPath = 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'; shadow.style.transform = 'translateX(15%)'; break;
            case 'full': shadow.style.background = 'transparent'; break;
            case 'waning-gibbous': shadow.style.clipPath = 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'; shadow.style.transform = 'translateX(-15%)'; break;
            case 'last-quarter': shadow.style.clipPath = 'polygon(0 0, 50% 0, 50% 100%, 0 100%)'; break;
            case 'waning-crescent': shadow.style.clipPath = 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'; shadow.style.transform = 'translateX(-35%)'; break;
        }
        element.innerHTML = '';
        element.appendChild(shadow);
    }

    function generateGalaxy() {
        const stars = document.getElementById('galaxyStars');
        const shooting = document.getElementById('galaxyShooting');
        const seed = 777777;
        if (stars) createStars(stars, 150, seed, 1, 3);
        if (shooting) createShootingStars(shooting, seed + 1000, 0.6);
    }

    function generatePlanetsBackground() {
        const stars = document.getElementById('planetsStars');
        if (stars) createStars(stars, 100, 888888, 1, 2.5);
    }

    function generateGateBackground() {
        const stars = document.getElementById('gateStars');
        if (stars) createStars(stars, 80, 999999, 1, 2.5);
    }

    function generateChallengeBackground() {
        const stars = document.getElementById('challengeStars');
        if (stars) createStars(stars, 70, 111111, 1, 2.5);
    }

    function generateForDay(dayNum) {
        const seed = dayNum * 10000 + 20260726;
        const miniStars = document.getElementById('miniStars');
        const miniMoon = document.getElementById('miniMoon');
        const moonData = generateMoonPhase(dayNum, seed);
        if (miniStars) createStars(miniStars, 35 + (seed % 30), seed, 0.8, 2);
        if (miniMoon) setMoonElement(miniMoon, moonData);
    }

    return {
        generateGalaxy,
        generatePlanetsBackground,
        generateGateBackground,
        generateChallengeBackground,
        generateForDay,
        generateMoonPhase,
        createStars,
        createShootingStars,
        toArabicNum
    };
})();

if (typeof window !== 'undefined') {
    window.SkyGenerator = SkyGenerator;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = SkyGenerator;
}
