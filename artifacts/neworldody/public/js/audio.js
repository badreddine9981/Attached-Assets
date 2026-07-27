/**
 * Neworldody Audio Manager
 * Web Audio API generated ambient music and sound effects.
 * No external audio files needed.
 */

const AudioManager = (() => {
    let ctx = null;
    let musicEnabled = false;
    let effectsEnabled = true;
    let volume = 0.6;
    let currentScene = null;
    let activeNodes = [];
    let gainNode = null;
    let settingsLoaded = false;

    function init() {
        const settings = Storage.getAudioSettings();
        musicEnabled = settings.music === true;
        effectsEnabled = settings.effects !== false;
        volume = settings.volume || 0.6;
        settingsLoaded = true;
    }

    function ensureContext() {
        if (!ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return false;
            ctx = new AudioContext();
            gainNode = ctx.createGain();
            gainNode.gain.value = volume;
            gainNode.connect(ctx.destination);
        }
        if (ctx.state === 'suspended') {
            ctx.resume();
        }
        return true;
    }

    function stopAll() {
        activeNodes.forEach(node => {
            try {
                if (node.stop) node.stop();
                if (node.disconnect) node.disconnect();
            } catch (e) {}
        });
        activeNodes = [];
    }

    function fadeIn(duration = 0.8) {
        if (!gainNode) return;
        const now = ctx.currentTime;
        gainNode.gain.cancelScheduledValues(now);
        gainNode.gain.setValueAtTime(0.001, now);
        gainNode.gain.exponentialRampToValueAtTime(volume, now + duration);
    }

    function fadeOut(duration = 0.8) {
        if (!gainNode) return;
        const now = ctx.currentTime;
        gainNode.gain.cancelScheduledValues(now);
        gainNode.gain.setValueAtTime(gainNode.gain.value, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
        return new Promise(resolve => setTimeout(() => {
            stopAll();
            gainNode.gain.setValueAtTime(0.001, ctx.currentTime);
            resolve();
        }, duration * 1000 + 50));
    }

    async function playSceneMusic(scene) {
        if (!musicEnabled || !ensureContext()) return;
        if (currentScene === scene) return;
        const previousScene = currentScene;
        currentScene = scene;

        if (previousScene) {
            await fadeOut(0.5);
        } else {
            stopAll();
        }

        if (!musicEnabled || currentScene !== scene) return;
        if (scene === 'galaxy') playAmbientDrone('galaxy');
        else if (scene === 'planets') playCelestialOrchestra();
        else if (scene === 'gate') playCalmPiano();
        else if (scene === 'challenge') playInspirational();
        else if (scene === 'book') playQuietPiano();
        fadeIn(0.8);
    }

    function stopMusic() {
        currentScene = null;
        fadeOut(0.6);
    }

    function addNode(node) {
        activeNodes.push(node);
    }

    // ─── Music Generators ───

    function playAmbientDrone(type) {
        if (!ctx) return;
        const frequencies = type === 'galaxy' ? [55, 110, 164.81, 220] : [65.41, 130.81, 196, 261.63];
        frequencies.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            osc.type = i % 2 === 0 ? 'sine' : 'triangle';
            osc.frequency.value = freq;
            const oscGain = ctx.createGain();
            oscGain.gain.value = 0.03 * volume;
            const lfo = ctx.createOscillator();
            lfo.frequency.value = 0.1 + i * 0.05;
            const lfoGain = ctx.createGain();
            lfoGain.gain.value = 0.015;
            lfo.connect(lfoGain);
            lfoGain.connect(oscGain.gain);
            osc.connect(oscGain);
            oscGain.connect(gainNode);
            osc.start();
            lfo.start();
            addNode(osc);
            addNode(lfo);
        });
    }

    function playCelestialOrchestra() {
        playAmbientDrone('planets');
        addGlimmerNotes([261.63, 329.63, 392, 493.88], 4000, 0.04);
    }

    function playCalmPiano() {
        playGentleNotes([261.63, 293.66, 329.63, 349.23, 392, 440, 493.88], 6000, 0.06);
    }

    function playQuietPiano() {
        playGentleNotes([220, 261.63, 293.66, 329.63, 392], 8000, 0.05);
    }

    function playInspirational() {
        playAmbientDrone('challenge');
        addGlimmerNotes([392, 440, 493.88, 523.25], 3000, 0.05);
    }

    function playGentleNotes(notes, interval, amp) {
        if (!ctx) return;
        let index = 0;
        function playNext() {
            if (!musicEnabled || !currentScene) return;
            const freq = notes[index % notes.length];
            playBellTone(freq, 1.5, amp * volume);
            index++;
            setTimeout(playNext, interval + Math.random() * 1000);
        }
        playNext();
    }

    function addGlimmerNotes(notes, interval, amp) {
        if (!ctx) return;
        function playNext() {
            if (!musicEnabled || !currentScene) return;
            const freq = notes[Math.floor(Math.random() * notes.length)];
            playBellTone(freq, 0.8, amp * volume);
            setTimeout(playNext, interval + Math.random() * 2000);
        }
        playNext();
    }

    function playBellTone(freq, duration, amp) {
        if (!ctx) return;
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = freq;
        const oscGain = ctx.createGain();
        oscGain.gain.setValueAtTime(0, ctx.currentTime);
        oscGain.gain.linearRampToValueAtTime(amp, ctx.currentTime + 0.05);
        oscGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.connect(oscGain);
        oscGain.connect(gainNode);
        osc.start();
        osc.stop(ctx.currentTime + duration);
    }

    // ─── Sound Effects ───

    function playSFX(type) {
        if (!effectsEnabled || !ensureContext()) return;
        switch (type) {
            case 'galaxyTouch': playSoftTone(130.81, 0.6); break;
            case 'zoom': playWhoosh(0.8); break;
            case 'planetClick': playSoftTone(329.63, 0.5); break;
            case 'hourglass': playSandSound(0.5); break;
            case 'countdownFinished': playArpeggio([523.25, 659.25, 783.99], 0.8); break;
            case 'achievement': playArpeggio([392, 523.25, 659.25, 783.99], 1.2); break;
            case 'challenge': playArpeggio([440, 523.25, 659.25], 0.8); break;
            case 'button': playSoftTone(440, 0.15); break;
            case 'page': playPageTurn(0.5); break;
            case 'gift': playArpeggio([523.25, 659.25, 783.99, 1046.5], 0.8); break;
            case 'star': playBellTone(880, 0.6, 0.05); break;
        }
    }

    function playSoftTone(freq, duration) {
        if (!ctx) return;
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = freq;
        const oscGain = ctx.createGain();
        oscGain.gain.setValueAtTime(0, ctx.currentTime);
        oscGain.gain.linearRampToValueAtTime(0.08 * volume, ctx.currentTime + 0.05);
        oscGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.connect(oscGain);
        oscGain.connect(gainNode);
        osc.start();
        osc.stop(ctx.currentTime + duration);
    }

    function playWhoosh(duration) {
        if (!ctx) return;
        const bufferSize = ctx.sampleRate * duration;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
        }
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + duration);
        const oscGain = ctx.createGain();
        oscGain.gain.setValueAtTime(0.1 * volume, ctx.currentTime);
        oscGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        source.connect(filter);
        filter.connect(oscGain);
        oscGain.connect(gainNode);
        source.start();
    }

    function playSandSound(duration) {
        if (!ctx) return;
        const bufferSize = ctx.sampleRate * duration;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.05;
        }
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 3000;
        const oscGain = ctx.createGain();
        oscGain.gain.value = 0.05 * volume;
        source.connect(filter);
        filter.connect(oscGain);
        oscGain.connect(gainNode);
        source.start();
        source.stop(ctx.currentTime + duration);
    }

    function playArpeggio(notes, duration) {
        notes.forEach((freq, i) => {
            setTimeout(() => playBellTone(freq, duration / notes.length + 0.3, 0.06 * volume), i * 150);
        });
    }

    function playPageTurn(duration) {
        if (!ctx) return;
        playWhoosh(duration);
    }

    // ─── Settings ───

    function setMusic(enabled) {
        musicEnabled = enabled;
        Storage.saveAudioSettings({ music: enabled, effects: effectsEnabled, volume });
        if (!settingsLoaded) init();
        if (enabled) {
            ensureContext();
            playSceneMusic(currentScene || 'galaxy');
        } else {
            stopMusic();
        }
        updateAudioIcon();
    }

    function setEffects(enabled) {
        effectsEnabled = enabled;
        Storage.saveAudioSettings({ music: musicEnabled, effects: enabled, volume });
        updateAudioIcon();
    }

    function setVolume(val) {
        volume = Math.max(0, Math.min(1, val));
        if (gainNode) gainNode.gain.setValueAtTime(volume, ctx.currentTime);
        Storage.saveAudioSettings({ music: musicEnabled, effects: effectsEnabled, volume });
    }

    function isEnabled() {
        return musicEnabled || effectsEnabled;
    }

    function updateAudioIcon() {
        const icon = document.getElementById('audioIcon');
        if (!icon) return;
        if (musicEnabled || effectsEnabled) {
            icon.textContent = musicEnabled ? '🔊' : '🔉';
        } else {
            icon.textContent = '🔇';
        }
    }

    return {
        init,
        playSceneMusic,
        stopMusic,
        playSFX,
        setMusic,
        setEffects,
        setVolume,
        isEnabled,
        ensureContext,
        get musicEnabled() { return musicEnabled; },
        get effectsEnabled() { return effectsEnabled; },
        get volume() { return volume; }
    };
})();

if (typeof window !== 'undefined') {
    window.AudioManager = AudioManager;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = AudioManager;
}
