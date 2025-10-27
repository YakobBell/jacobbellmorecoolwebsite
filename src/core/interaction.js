import * as THREE from 'three';
// This module handles all user interactions, including mouse, keyboard, and touch events.
import * as CONSTANTS from './constants.js';
import { ProjectPage } from './terminal.js';
import { materials } from './materials.js';

let currentlyLitKey = null;

const keyToMaterialMap = {
    'home': { normal: materials.homeKey, lit: materials.homeKeyLit },
    'about': { normal: materials.aboutKey, lit: materials.aboutKeyLit },
    'sound-design': { normal: materials.soundDesignKey, lit: materials.soundDesignKeyLit },
    'music': { normal: materials.musicKey, lit: materials.musicKeyLit },
    'films': { normal: materials.filmmakingKey, lit: materials.filmmakingKeyLit },
};

const pageToKeyMap = {
    'home': ['Db2'],
    'about': ['Eb2'],
    'sound-design': ['F#2', 'Gb2'],
    'music': ['Ab2', 'G#2'],
    'films': ['Bb2'],
};

function setLitKey(page, noteName, noteToKeyMap) {
    // Reset the previously lit key
    if (currentlyLitKey) {
        const previousPage = Object.keys(pageToKeyMap).find(p => pageToKeyMap[p].includes(currentlyLitKey.name));
        if (previousPage && keyToMaterialMap[previousPage]) {
            // Find all keys for the previous page and reset their materials
            const previousKeyNames = pageToKeyMap[previousPage];
            previousKeyNames.forEach(keyName => {
                const keyToReset = noteToKeyMap.get(keyName);
                if (keyToReset && Array.isArray(keyToReset.material)) {
                    keyToReset.material[2] = keyToMaterialMap[previousPage].normal;
                }
            });
        }
    }

    // Set the new lit key
    const keyObject = noteToKeyMap.get(noteName);
    if (keyObject && Array.isArray(keyObject.material) && keyToMaterialMap[page]) {
        keyObject.material[2] = keyToMaterialMap[page].lit;
        currentlyLitKey = keyObject;
    }
}

/**
 * Initializes the interaction system and sets up event listeners for mouse, keyboard, and touch events.
 * @param {THREE.Camera} camera - The main scene camera.
 * @param {THREE.Mesh[]} allKeys - An array of all piano key meshes.
 * @param {Map<string, THREE.Mesh>} noteToKeyMap - A map from note names to key meshes.
 * @param {object} audioSystem - The audio system instance.
 * @param {Computer} computer - The computer instance.
 * @param {object} lampControls - The lava lamp controls.
 * @param {Terminal} terminal - The terminal instance.
 * @param {object} sounds - The global sounds object.
 * @param {object} videoPlayer - The video player instance.
 * @param {function} getInteractionEnabled - A function that returns whether interaction is enabled.
 * @param {SceneManager} sceneManager - The scene manager instance.
 * @returns {{pressedKeys: Set<THREE.Mesh>, mouse: THREE.Vector2}} An object containing the set of pressed keys and the mouse position vector.
 */
export function createInteractionSystem(camera, allKeys, noteToKeyMap, audioSystem, computer, lampControls, terminal, sounds, videoPlayer, getInteractionEnabled, sceneManager) {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let isMouseOverCRT = false;
    
    let isMouseDown = false;
    let lastHoveredKey = null;

    let isCdPickedUp = false;
    let draggedCd = null;
    const pressedKeys = new Set();
    const activeMouseKeys = new Set();
    const activeKeyboardKeys = new Set();
    let lastTouchY = 0;
    const touchMoveThreshold = 5;
    
    function updateMousePosition(clientX, clientY) {
        mouse.x = (clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(clientY / window.innerHeight) * 2 + 1;
    }
    
    function handleKeyInteraction(clientX, clientY) {
        console.log('handleKeyInteraction called');
        updateMousePosition(clientX, clientY);
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(allKeys);
        const currentHoveredKey = intersects.length > 0 ? intersects[0].object : null;
        
        if (lastHoveredKey !== currentHoveredKey) {
            if (lastHoveredKey && activeMouseKeys.has(lastHoveredKey.name)) {
                audioSystem.stopNote(lastHoveredKey.name);
                pressedKeys.delete(lastHoveredKey);
                activeMouseKeys.delete(lastHoveredKey.name);
            }
            
            if (currentHoveredKey) {
                if (audioSystem.audioContext.state === 'suspended') {
                    audioSystem.audioContext.resume();
                }
                audioSystem.startNote(currentHoveredKey.name);
                pressedKeys.add(currentHoveredKey);
                activeMouseKeys.add(currentHoveredKey.name);

                const noteName = currentHoveredKey.name;
                const keyToPageMap = {
                    'Db2': 'home', 'Eb2': 'about', 'Gb2': 'sound-design',
                    'Ab2': 'music', 'Bb2': 'films', 'F#2': 'sound-design',
                    'G#2': 'music'
                };
                if (computer.isTvOn && keyToPageMap[noteName]) {
                    const page = keyToPageMap[noteName];
                    terminal.navigateTo(page);
                    setLitKey(page, noteName, noteToKeyMap);
                }
            }
            
            lastHoveredKey = currentHoveredKey;
        }
    }
    
    // --- Event Handlers ---

    function _handleMouseDown(event) {
        if (!getInteractionEnabled()) return;
        event.preventDefault();
        updateMousePosition(event.clientX, event.clientY);
        raycaster.setFromCamera(mouse, camera);

        if (videoPlayer.isOpen && !isMouseOverCRT) {
            videoPlayer.close();
            sceneManager.zoomOut.bind(sceneManager)();
            return; // Exit early
        }

        const intersectsObjects = [computer.powerButton, lampControls.lavaLampSwitch, ...allKeys];
        console.log('Clickable objects:', intersectsObjects);
        const intersects = raycaster.intersectObjects(intersectsObjects);

        // Prioritize physical object interaction
        if (intersects.length > 0) {
            const firstIntersect = intersects[0].object;

            if (firstIntersect === computer.powerButton) {
                computer.toggleTV(sounds, terminal);
            } else if (firstIntersect === lampControls.lavaLampSwitch) {
                lampControls.toggleLavaLamp();
            } else if (allKeys.includes(firstIntersect)) {
                isMouseDown = true;
                const key = firstIntersect;
                const noteName = key.name;
                const keyToPageMap = {
                    'Db2': 'home', 'Eb2': 'about', 'Gb2': 'sound-design',
                    'Ab2': 'music', 'Bb2': 'films', 'F#2': 'sound-design',
                    'G#2': 'music'
                };
                if (computer.isTvOn) {
                    if (keyToPageMap[noteName]) {
                        const page = keyToPageMap[noteName];
                        terminal.navigateTo(page);
                        setLitKey(page, noteName, noteToKeyMap);
                    }
                }
                handleKeyInteraction(event.clientX, event.clientY);
            }
        // Then, check for terminal screen interaction if no physical object was clicked
        } else if (terminal.hoveredProjectIndex !== -1 && terminal.activeApp instanceof ProjectPage) {
            const project = terminal.activeApp.projects[terminal.hoveredProjectIndex];
            if (project.page) {
                terminal.navigateTo(project.page);
            } else if (project.url) {
                // Apply zoom and countdown for all videos to ensure consistent playback experience
                sceneManager.zoomToComputer();
                terminal.startCountdown(() => {
                    videoPlayer.open(project.url);
                });
            }
        } else if (isMouseOverCRT && terminal.activeApp.constructor.name === 'ContactPage') {
            const app = terminal.activeApp;
            const formState = app.formState;
            const x = terminal.mousePosition.x;
            const y = terminal.mousePosition.y;

            // Check for clicks on form elements
            const margin = 20;
            const lineHeight = 22;

            // Subject field
            if (y > margin + lineHeight * 3 && y < margin + lineHeight * 4) {
                formState.activeField = 'subject';
                terminal.isDirty = true;
                return;
            }

            // Email field
            if (y > margin + lineHeight * 5.5 && y < margin + lineHeight * 6.5) {
                formState.activeField = 'email';
                terminal.isDirty = true;
                return;
            }

            // Message field
            if (y > margin + lineHeight * 8 && y < margin + lineHeight * 14) {
                formState.activeField = 'message';
                terminal.isDirty = true;
                return;
            }

            // Send button
            const buttonWidth = 100;
            const buttonHeight = 30;
            const buttonX = terminal.screenManager.width - buttonWidth - margin;
            const buttonY = margin + lineHeight * 15;
            if (x > buttonX && x < buttonX + buttonWidth && y > buttonY && y < buttonY + buttonHeight) {
                const templateParams = {
                    from_email: formState.email,
                    subject: formState.subject,
                    message: formState.message,
                };

                emailjs.send('service_boc2zan', 'template_2s06f9q', templateParams, 'p7D1HR9lqgTP-3T3Y')
                    .then((response) => {
                        console.log('SUCCESS!', response.status, response.text);
                        formState.reset();
                        terminal.isDirty = true;
                        // Optionally, navigate to a "success" page or show a message
                    }, (error) => {
                        console.log('FAILED...', error);
                        // Optionally, show an error message
                    });

                formState.reset();
                terminal.isDirty = true;
            }
        }
    }

    function _handleMouseUp() {
        if (!getInteractionEnabled()) return;
        isMouseDown = false;

        if (lastHoveredKey && activeMouseKeys.has(lastHoveredKey.name)) {
            audioSystem.stopNote(lastHoveredKey.name);
            pressedKeys.delete(lastHoveredKey);
            activeMouseKeys.delete(lastHoveredKey.name);
            lastHoveredKey = null;
        }
    }

    let lastMove = 0;
    function _handleMouseMove(event) {
        if (!getInteractionEnabled()) return;

        updateMousePosition(event.clientX, event.clientY);
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(computer.crtTV.getObjectByName("screen"));
        isMouseOverCRT = intersects.length > 0;
        const overlay = document.getElementById('crt-overlay');
        if (isMouseOverCRT && computer.isTvOn) {
            overlay.classList.add('active');
        } else {
            overlay.classList.remove('active');
        }

        const now = performance.now();
        if (now - lastMove < 16) return;
        lastMove = now;

        if (isMouseOverCRT) {
            const intersects = raycaster.intersectObject(computer.screen);
            if (intersects.length > 0) {
                const uv = intersects[0].uv;
                const x = uv.x * terminal.screenManager.width;
                const y = (1 - uv.y) * terminal.screenManager.height;
                terminal.mousePosition = { x, y };
                terminal.isDirty = true;
            }
        } else {
            terminal.mousePosition = { x: -1, y: -1 };
            terminal.isDirty = true;
        }

        if (isMouseDown) {
            handleKeyInteraction(event.clientX, event.clientY);
        }
    }

    function _handleWheel(event) {
        if (!getInteractionEnabled()) return;
        if (isMouseOverCRT && terminal.activeApp) {
            const app = terminal.activeApp;
            if (app.constructor.name === 'ContactPage') {
                const formState = app.formState;
                const lines = terminal._wrapText(formState.message, terminal.screenManager.width - 40);
                const maxScroll = Math.max(0, lines.length - 5);
                formState.scrollOffset += Math.sign(event.deltaY);
                formState.scrollOffset = Math.max(0, Math.min(formState.scrollOffset, maxScroll));
            } else {
                app.scrollTop += event.deltaY * 0.5;
                const maxScroll = Math.max(0, (app.fullText.length * 24) - 384 + 20);
                app.scrollTop = Math.max(0, Math.min(app.scrollTop, maxScroll));
            }
            terminal.isDirty = true;
        }
    }

    function _handleKeyDown(event) {
        if (!getInteractionEnabled()) return;
        if (event.repeat) return;

        const app = terminal.activeApp;
        if (computer.isTvOn && app.constructor.name === 'ContactPage') {
            terminal.isDirty = true;
            const formState = app.formState;
            const field = formState.activeField;
            if (event.key === 'Backspace') {
                formState[field] = formState[field].slice(0, -1);
            } else if (event.key === 'Tab') {
                event.preventDefault();
                if (field === 'subject') formState.activeField = 'email';
                else if (field === 'email') formState.activeField = 'message';
                else formState.activeField = 'subject';
            } else if (event.key.length === 1) { // Handle printable characters
                if (field === 'subject' && formState.subject.length >= 36) {
                    return; // Enforce character limit
                }
                formState[field] += event.key;
            }
            return; // Prevent piano key sounds
        }
        
        const noteName = CONSTANTS.KEY_MAPPING[event.key.toLowerCase()];

        if (noteName && !activeKeyboardKeys.has(noteName)) {
            const keyToPageMap = {
                'Db2': 'home',
                'Eb2': 'about',
                'Gb2': 'sound-design',
                'Ab2': 'music',
                'Bb2': 'films',
                'F#2': 'sound-design',
                'G#2': 'music'
            };

            if (computer.isTvOn && keyToPageMap[noteName]) {
                const page = keyToPageMap[noteName];
                terminal.navigateTo(page);
                setLitKey(page, noteName, noteToKeyMap);
            }
            if (audioSystem.audioContext.state === 'suspended') {
                audioSystem.audioContext.resume();
            }
            audioSystem.startNote(noteName);
            const keyObject = noteToKeyMap.get(noteName);
            if (keyObject) pressedKeys.add(keyObject);
            activeKeyboardKeys.add(noteName);
        }
    }

    function _handleKeyUp(event) {
        if (!getInteractionEnabled()) return;
        const noteName = CONSTANTS.KEY_MAPPING[event.key.toLowerCase()];
        if (noteName && activeKeyboardKeys.has(noteName)) {
            audioSystem.stopNote(noteName);
            const keyObject = noteToKeyMap.get(noteName);
            if (keyObject) pressedKeys.delete(keyObject);
            activeKeyboardKeys.delete(noteName);
        }
    }

    function _handleTouchStart(event) {
        if (!getInteractionEnabled()) return;
        console.log('touchstart event fired');
        event.preventDefault();
        const touch = event.touches[0];
        lastTouchY = touch.clientY;
        console.log('Touch coordinates:', touch.clientX, touch.clientY);
        updateMousePosition(touch.clientX, touch.clientY);
        raycaster.setFromCamera(mouse, camera);

        if (videoPlayer.isOpen && !isMouseOverCRT) {
            videoPlayer.close();
            sceneManager.zoomOut();
            return;
        }

        const screenIntersect = raycaster.intersectObject(computer.crtTV.getObjectByName("screen"));
        isMouseOverCRT = screenIntersect.length > 0;

        if (isMouseOverCRT) {
            if (terminal.hoveredProjectIndex !== -1 && terminal.activeApp instanceof ProjectPage) {
                const project = terminal.activeApp.projects[terminal.hoveredProjectIndex];
                if (project.page) {
                    terminal.navigateTo(project.page);
                } else if (project.url) {
                    if (project.title === "SHOWREEL") {
                        sceneManager.zoomToComputer();
                        terminal.startCountdown(() => {
                            videoPlayer.open(project.url);
                        });
                    } else {
                        videoPlayer.open(project.url);
                    }
                }
            }
        } else {
            const intersectsObjects = [computer.powerButton, lampControls.lavaLampSwitch, ...allKeys];
            const intersects = raycaster.intersectObjects(intersectsObjects);

            if (intersects.length > 0) {
                const firstIntersect = intersects[0].object;

                if (firstIntersect === computer.powerButton) {
                    computer.toggleTV(sounds, terminal);
                } else if (firstIntersect === lampControls.lavaLampSwitch) {
                    lampControls.toggleLavaLamp();
                } else if (allKeys.includes(firstIntersect)) {
                    isMouseDown = true;
                    const key = firstIntersect;
                    const noteName = key.name;
                    const keyToPageMap = {
                        'Db2': 'home', 'Eb2': 'about', 'Gb2': 'sound-design',
                        'Ab2': 'music', 'Bb2': 'films', 'F#2': 'sound-design',
                        'G#2': 'music'
                    };
                    if (computer.isTvOn && keyToPageMap[noteName]) {
                        const page = keyToPageMap[noteName];
                        terminal.navigateTo(page);
                        setLitKey(page, noteName, noteToKeyMap);
                    }
                    handleKeyInteraction(touch.clientX, touch.clientY);
                }
            }
        }
    }

    function _handleTouchEnd() {
        if (!getInteractionEnabled()) return;
        isMouseDown = false;
        lastTouchY = 0;

        if (lastHoveredKey && activeMouseKeys.has(lastHoveredKey.name)) {
            audioSystem.stopNote(lastHoveredKey.name);
            pressedKeys.delete(lastHoveredKey);
            activeMouseKeys.delete(lastHoveredKey.name);
            lastHoveredKey = null;
        }
    }

    function _handleTouchMove(event) {
        if (!getInteractionEnabled()) return;
        console.log('touchmove event fired');
        event.preventDefault();

        const touch = event.touches[0];
        updateMousePosition(touch.clientX, touch.clientY);
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(computer.crtTV.getObjectByName("screen"));
        isMouseOverCRT = intersects.length > 0;
        const overlay = document.getElementById('crt-overlay');
        if (isMouseOverCRT && computer.isTvOn) {
            overlay.classList.add('active');
        } else {
            overlay.classList.remove('active');
        }

        if (isMouseOverCRT) {
            const touch = event.touches[0];
            const deltaY = lastTouchY - touch.clientY;

            if (Math.abs(deltaY) > touchMoveThreshold) {
                const app = terminal.activeApp;
                if (app) {
                    app.scrollTop += deltaY * 0.5;
                    const maxScroll = Math.max(0, (app.fullText.length * 24) - 384 + 20);
                    app.scrollTop = Math.max(0, Math.min(app.scrollTop, maxScroll));
                    terminal.isDirty = true;
                }
                lastTouchY = touch.clientY;
            }

            const intersects = raycaster.intersectObject(computer.screen);
            if (intersects.length > 0) {
                const uv = intersects[0].uv;
                const x = uv.x * terminal.screenManager.width;
                const y = (1 - uv.y) * terminal.screenManager.height;
                terminal.mousePosition = { x, y };
                terminal.isDirty = true;
            }
        } else {
            terminal.mousePosition = { x: -1, y: -1 };
            terminal.isDirty = true;
        }

        if (isMouseDown) {
            handleKeyInteraction(touch.clientX, touch.clientY);
        }
    }

    // --- Event Listeners ---
    window.addEventListener('mousedown', _handleMouseDown);
    window.addEventListener('mouseup', _handleMouseUp);
    window.addEventListener('mousemove', _handleMouseMove);
    window.addEventListener('wheel', _handleWheel);
    window.addEventListener('keydown', _handleKeyDown);
    window.addEventListener('keyup', _handleKeyUp);
    window.addEventListener('touchstart', _handleTouchStart, { passive: false });
    window.addEventListener('touchend', _handleTouchEnd);
    window.addEventListener('touchmove', _handleTouchMove, { passive: false });
    
    return { pressedKeys, mouse };
}


/**
 * Updates the visual state of the piano keys based on which keys are pressed.
 * @param {THREE.Mesh[]} allKeys - An array of all piano key meshes.
 * @param {Set<THREE.Mesh>} pressedKeys - A set of the currently pressed key meshes.
 */
export function updateInteraction(allKeys, pressedKeys) {
    const pressDepth = 0.2;
    for (const key of allKeys) {
        const targetY = key.userData.originalY - (pressedKeys.has(key) ? pressDepth : 0);
        key.position.y += (targetY - key.position.y) * 0.4;
    }
}