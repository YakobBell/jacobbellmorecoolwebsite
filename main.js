import * as THREE from 'three';
import { SceneManager } from './src/core/sceneManager.js';
import * as AUDIO from './src/audio/audio.js';
import { LoadingScreen } from './src/core/loadingScreen.js';
const sceneManager = new SceneManager();
let loadingScreen;
let interactionEnabled = false;

function animate() {
    requestAnimationFrame(animate);
    const time = performance.now() / 1000;
    if (loadingScreen) {
        loadingScreen.update(time);
    }
    sceneManager.update();
}

window.addEventListener('DOMContentLoaded', async () => {
    await sceneManager.init(() => interactionEnabled, () => {
        loadingScreen = new LoadingScreen(sceneManager.scene, sceneManager.camera);
        loadingScreen.init();
    });
    animate();

    const handleInteraction = (x, y) => {
        if (!interactionEnabled) {
            const raycaster = new THREE.Raycaster();
            const mouse = new THREE.Vector2();
            mouse.x = (x / window.innerWidth) * 2 - 1;
            mouse.y = -(y / window.innerHeight) * 2 + 1;
            raycaster.setFromCamera(mouse, sceneManager.camera);
            const intersects = raycaster.intersectObject(loadingScreen.soundIcon);
            if (intersects.length > 0) {
                loadingScreen.triggerPulsation();
                loadingScreen.pulsating = false;
                loadingScreen.soundIcon.material.opacity = 1.0;
                setTimeout(() => {
                    // Resume audio context on the first user interaction
                    if (sceneManager.audioSystem && sceneManager.audioSystem.audioContext.state === 'suspended') {
                        sceneManager.audioSystem.audioContext.resume();
                    }
                    loadingScreen.hide();
                    interactionEnabled = true;
                    setTimeout(() => {
                        sceneManager.lightingManager.startFadeIn();
                    }, 2000);
                    AUDIO.createAmbientSounds(sceneManager.camera, sceneManager.scene, sceneManager.sounds).then(playAmbientSounds => {
                        playAmbientSounds();
                    });
                }, 500); // Short delay to show the unmuted icon
            }
        }
    };

    window.addEventListener('click', (event) => {
        if (!interactionEnabled) {
            handleInteraction(event.clientX, event.clientY);
        } else {
            const raycaster = new THREE.Raycaster();
            const mouse = new THREE.Vector2();
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            raycaster.setFromCamera(mouse, sceneManager.camera);
            const intersects = raycaster.intersectObject(sceneManager.computer.screen);
            if (intersects.length > 0) {
                const uv = intersects[0].uv;
                const x = uv.x * sceneManager.terminal.screenManager.width;
                const y = (1 - uv.y) * sceneManager.terminal.screenManager.height;
                sceneManager.terminal.handleClick(x, y);
            }
        }
    });

    window.addEventListener('touchstart', (event) => {
        if (event.touches.length > 0) {
            handleInteraction(event.touches[0].clientX, event.touches[0].clientY);
        }
    });
});