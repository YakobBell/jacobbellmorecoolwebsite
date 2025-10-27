import * as THREE from 'three';
// This module handles all audio-related functionality, including piano notes, UI sounds, and ambient effects.
import * as CONSTANTS from '../core/constants.js';

/**
 * Initializes the core audio components, including the AudioContext and master gain.
 * @returns {{audioContext: AudioContext, masterGain: GainNode, startNote: function, stopNote: function, playSong: function, stopSong: function}} An object containing the audio context and control functions.
 */
export function createAudioSystem() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const activeNotes = new Map();
    const masterGain = audioContext.createGain();
    masterGain.gain.value = CONSTANTS.AUDIO_CONFIG.MASTER_VOLUME;
    masterGain.connect(audioContext.destination);
    
    function startNote(noteName) {
        if (!CONSTANTS.PIANO_NOTES[noteName] || activeNotes.has(noteName)) return;
        
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        
        osc.type = CONSTANTS.AUDIO_CONFIG.OSC_TYPE;
        osc.frequency.setValueAtTime(CONSTANTS.PIANO_NOTES[noteName], audioContext.currentTime);
        
        gain.gain.setValueAtTime(0, audioContext.currentTime);
        gain.gain.linearRampToValueAtTime(0.5, audioContext.currentTime + CONSTANTS.AUDIO_CONFIG.ATTACK_TIME);
        
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start();
        
        activeNotes.set(noteName, { osc, gain });
    }
    
    function stopNote(noteName) {
        const noteData = activeNotes.get(noteName);
        if (!noteData) return;
        
        const { osc, gain } = noteData;
        const currentTime = audioContext.currentTime;
        
        gain.gain.cancelScheduledValues(currentTime);
        gain.gain.setValueAtTime(gain.gain.value, currentTime);
        gain.gain.linearRampToValueAtTime(0, currentTime + CONSTANTS.AUDIO_CONFIG.RELEASE_TIME);
        
        osc.stop(currentTime + CONSTANTS.AUDIO_CONFIG.RELEASE_TIME);
        activeNotes.delete(noteName);
    }
    
    let song;

    function playSong() {
        if (sounds.rain && !sounds.rain.isPlaying) {
            sounds.rain.play();
        }
    }

    function stopSong() {
        if (sounds.rain && sounds.rain.isPlaying) {
            sounds.rain.stop();
        }
    }

    return { audioContext, masterGain, startNote, stopNote, playSong, stopSong };
}

/**
 * Plays a procedural typing sound effect.
 * @param {AudioContext} audioContext - The global audio context.
 */
export function playTypingSound(audioContext) {
    if (!audioContext) return;
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.connect(gain);
    gain.connect(audioContext.destination);

    osc.type = 'triangle'; // A richer, more tonal sound
    osc.frequency.setValueAtTime(780, audioContext.currentTime); // Raise the pitch slightly
    gain.gain.setValueAtTime(0.06, audioContext.currentTime); // Lower the volume slightly
    gain.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.06);
    osc.start(audioContext.currentTime);
    osc.stop(audioContext.currentTime + 0.06);
}

/**
 * Loads and sets up ambient sounds for the scene.
 * @param {THREE.Camera} camera - The main scene camera.
 * @param {THREE.Scene} scene - The main scene.
 * @param {object} sounds - An object to store the loaded sound instances.
 * @returns {Promise<function>} A promise that resolves with a function to start playing the ambient sounds.
 */
export function createAmbientSounds(camera, scene, sounds) {
    const listener = new THREE.AudioListener();
    camera.add(listener);

    const audioLoader = new THREE.AudioLoader();

    const loadSound = (url, isPositional, loop, volume, refDistance) => {
        return new Promise((resolve) => {
            const sound = isPositional ? new THREE.PositionalAudio(listener) : new THREE.Audio(listener);
            audioLoader.load(url, function(buffer) {
                sound.setBuffer(buffer);
                sound.setLoop(loop);
                sound.setVolume(volume);
                if (isPositional) {
                    sound.setRefDistance(refDistance);
                }
                resolve(sound);
            });
        });
    };

    return new Promise((resolve) => {
        Promise.all([
            loadSound('public/assets/audio/SFX/rain.wav', true, true, 0.3, 15),
            loadSound('public/assets/audio/SFX/power_on.wav', false, false, 0.5),
            loadSound('public/assets/audio/SFX/power_off.wav', false, false, 0.28)
        ]).then(([rain, powerOn, powerOff]) => {
            sounds.rain = rain;
            const soundEmitter = new THREE.Object3D();
            soundEmitter.position.set(CONSTANTS.WINDOW_CONFIG.CENTER_X, CONSTANTS.WINDOW_CONFIG.CENTER_Y, -8);
            scene.add(soundEmitter);
            soundEmitter.add(sounds.rain);

            sounds.powerOn = powerOn;
            sounds.powerOff = powerOff;

            resolve(() => {
                if (sounds.rain && !sounds.rain.isPlaying) {
                    sounds.rain.play();
                    sounds.rain.setVolume(0);
                    const rainSound = sounds.rain;
                    const fadeAudio = () => {
                        const volume = Math.min(1, rainSound.context.currentTime / 5) * 0.3;
                        rainSound.setVolume(volume);
                        if (rainSound.context.currentTime < 5) {
                            requestAnimationFrame(fadeAudio);
                        }
                    };
                    fadeAudio();
                }
            });
        });
    });
}