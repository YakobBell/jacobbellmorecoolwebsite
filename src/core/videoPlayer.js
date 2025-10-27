import * as THREE from 'three';

// This module manages the video player functionality for the computer screen in the scene.
/**
 * Creates and manages a video player instance.
 * This player interacts with a video element in the DOM, controls its playback,
 * and integrates it as a texture on a 3D object in the scene. It also handles
 * audio fading during video playback.
 *
 * @param {object} computer - The computer object that will display the video texture. Must have a `setVideoTexture` method.
 * @param {object} audioSystem - The main audio system to control master volume. Must have `masterGain` and `audioContext`.
 * @param {object} terminal - The terminal instance to interact with after video events. Must have `navigateTo` and `state` properties.
 * @param {object} sceneManager - The scene manager to control camera movements. Must have a `zoomOut` method.
 * @returns {{open: function(string): void, close: function(): void, isOpen: boolean}} An object with methods to control the video player.
 */
export function createVideoPlayer(computer, audioSystem, terminal, sceneManager) {
    const video = document.getElementById('video');
    let isOpen = false;

    const handleVideoEnd = () => {
        close();
        sceneManager.zoomOut();
        terminal.navigateTo('sound-design');
    };

    video.addEventListener('ended', handleVideoEnd);

    function open(videoUrl) {
        isOpen = true;
        video.src = videoUrl;
        video.muted = false;
        
        const playPromise = video.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.error("Error playing video:", error);
            });
        }

        computer.setVideoTexture(new THREE.VideoTexture(video));

        if (audioSystem && audioSystem.masterGain) {
            audioSystem.masterGain.gain.linearRampToValueAtTime(0, audioSystem.audioContext.currentTime + 1);
        }
    }

    function close() {
        isOpen = false;
        video.pause();
        computer.setVideoTexture(null);
        if (terminal) {
            terminal.state = 'running';
            terminal.isDirty = true;
        }

        if (audioSystem && audioSystem.masterGain) {
            audioSystem.masterGain.gain.linearRampToValueAtTime(1, audioSystem.audioContext.currentTime + 1);
        }
    }

    return {
        open,
        close,
        get isOpen() { return isOpen; }
    };
}