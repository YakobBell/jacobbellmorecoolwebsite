// This module defines the SceneManager class, which orchestrates the entire Three.js scene.
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import * as CONSTANTS from './constants.js';
import { ScreenManager } from './screenManager.js';
import { Computer } from './computer.js';
import { materials } from './materials.js';
import { Terminal } from './terminal.js';
import * as SCENEOBJECTS from './sceneObjects.js';
import { setupPhysics, updatePhysics } from './physics.js';
import * as AUDIO from '../audio/audio.js';
import { createInteractionSystem, updateInteraction } from './interaction.js';
import { createLighting } from './lighting.js';
import { LightingManager } from './lightingManager.js';
import { createVideoPlayer } from './videoPlayer.js';
import { loadShaders } from './shaders.js';

/**
 * Manages the entire Three.js scene, including setup, updates, and rendering.
 */
export class SceneManager {
    /**
     * Initializes the SceneManager and sets default values for scene components.
     */
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.composer = null;
        this.filmGrainPass = null;
        this.ps1Pass = null;

        this.computer = null;
        this.terminal = null;
        this.videoPlayer = null;
        this.videoScreen = null;
        this.audioSystem = null;
        this.world = null;
        this.lighting = null;
        this.lightingManager = null;
        this.allKeys = [];
        this.noteToKeyMap = new Map();
        this.pressedKeys = new Set();
        this.rainSplatManager = null;
        this.lavaBlobs = [];
        this.lavaMaterial = null;

        this.isLavaLampOn = true;
        this.sounds = {};
        this.clock = new THREE.Clock();

        this.originalCameraPosition = new THREE.Vector3(0, 5, 8);
        this.originalCameraRotation = new THREE.Euler(-Math.PI / 12, 0, 0);
    }

    /**
     * Asynchronously initializes the scene, camera, renderer, objects, and post-processing effects.
     * @param {function} getInteractionEnabled - A function that returns whether interaction is enabled.
     * @param {function} onReady - A callback function to execute when the scene is ready.
     */
    async init(getInteractionEnabled, onReady) {
        const shaders = await loadShaders();
        this._setupSceneAndRenderer();
        this._setupPostProcessing(shaders);
        this._setupSceneObjects();
        this._setupLighting();
        this._setupInteraction(getInteractionEnabled);

        // Camera
        this.camera.position.copy(this.originalCameraPosition);
        this.camera.rotation.copy(this.originalCameraRotation);

        window.addEventListener('resize', this.onWindowResize.bind(this));
        this.onWindowResize();
        if (onReady) {
            onReady(this.lighting);
        }
    }

    _setupSceneAndRenderer() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(
            CONSTANTS.SCENE_CONFIG.FOV,
            window.innerWidth / window.innerHeight,
            CONSTANTS.SCENE_CONFIG.NEAR,
            CONSTANTS.SCENE_CONFIG.FAR
        );
        this.renderer = new THREE.WebGLRenderer({ antialias: false });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(0.8);
        this.renderer.setClearColor(CONSTANTS.SCENE_CONFIG.CLEAR_COLOR);
        this.renderer.shadowMap.enabled = true;
        document.body.appendChild(this.renderer.domElement);
    }

    _setupPostProcessing(shaders) {
        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        this.composer.addPass(new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.5, 0.4, 0.3));

        const FilmGrainShader = {
            uniforms: { 'tDiffuse': { value: null }, 'u_time': { value: 0 }, 'u_intensity': { value: 0.05 } },
            vertexShader: shaders.filmGrain.vertex,
            fragmentShader: shaders.filmGrain.fragment
        };
        this.filmGrainPass = new ShaderPass(FilmGrainShader);
        this.composer.addPass(this.filmGrainPass);

        const PS1Shader = {
            uniforms: { 'tDiffuse': { value: null }, 'u_time': { value: 0 }, 'u_wobble': { value: 0.0005 }, 'u_colorBanding': { value: 12.0 } },
            vertexShader: shaders.ps1.vertex,
            fragmentShader: shaders.ps1.fragment
        };
        this.ps1Pass = new ShaderPass(PS1Shader);
        this.composer.addPass(this.ps1Pass);
        this.scene.fog = new THREE.Fog(0x000000, 15, 40);
    }

    _setupSceneObjects() {
        const screenManager = new ScreenManager();
        this.computer = new Computer(this.scene, screenManager.texture);
        this.audioSystem = AUDIO.createAudioSystem();
        this.terminal = new Terminal(screenManager, this.audioSystem.audioContext);
        this.videoPlayer = createVideoPlayer(this.computer, this.audioSystem, this.terminal, this);

        const sceneObjects = SCENEOBJECTS.createSceneObjects(this.scene);
        this.rainSplatManager = sceneObjects.rainSplatManager;
        this.lavaBlobs = sceneObjects.lavaBlobs;
        this.lavaMaterial = sceneObjects.lavaMaterial;
        this.allKeys = sceneObjects.allKeys;
        this.noteToKeyMap = sceneObjects.noteToKeyMap;

        const { world } = setupPhysics();
        this.world = world;
    }

    _setupLighting() {
        this.scene.add(new THREE.AmbientLight(0x404040, 0.3));
        this.lighting = createLighting(this.scene, new THREE.Vector2(CONSTANTS.WINDOW_CONFIG.CENTER_X, CONSTANTS.WINDOW_CONFIG.CENTER_Y), this.computer);
        this.lightingManager = new LightingManager(this.lighting, this.lavaMaterial, materials.cityscape, materials.rain, materials.rainSplat);
    }

    _setupInteraction(getInteractionEnabled) {
        this.computer.screen.visible = false;
        this.computer.scanlinePlane.visible = false;
        this.lighting.screenLight.visible = false;

        const lampControls = {
            lavaLampSwitch: this.scene.getObjectByName("lavaLampSwitch"),
            toggleLavaLamp: () => {
                this.lightingManager.toggleLavaLamp();
                lampControls.lavaLampSwitch.rotation.x = this.lightingManager.isLavaLampOn ? 0 : Math.PI / 6;
            }
        };

        const interactionSystem = createInteractionSystem(this.camera, this.allKeys, this.noteToKeyMap, this.audioSystem, this.computer, lampControls, this.terminal, this.sounds, this.videoPlayer, getInteractionEnabled, this);
        this.pressedKeys = interactionSystem.pressedKeys;
    }

    /**
     * The main update loop, called on each frame to update all animated components of the scene.
     */
    update() {
        const delta = this.clock.getDelta();
        const time = this.clock.getElapsedTime();

        this._updatePhysics(delta);
        this._updateAnimations(delta, time);
        this._updateComputerAndTerminal(time, delta);
        this._updateLightingAndPostProcessing(delta);
        this.terminal.audioManager.update(this.terminal);

        this.composer.render();
    }

    _updatePhysics(delta) {
        updatePhysics(this.world);
    }

    _updateAnimations(delta, time) {
        materials.rain.map.offset.y += delta * 1.2;
        this.rainSplatManager.update(delta);
        updateInteraction(this.allKeys, this.pressedKeys);

        if (this.lightingManager.isLavaLampOn) {
            this.lavaBlobs.forEach(blob => {
                blob.position.y = 3.15 + Math.sin(time * blob.userData.speed + blob.userData.offset) * 1.5;
            });
        }
    }

    _updateComputerAndTerminal(time, delta) {
        this.computer.update(time, delta);
        if (this.computer.isTvOn) {
            this.terminal.update(delta);
        }
    }

    _updateLightingAndPostProcessing(delta) {
        this.lightingManager.update(delta);
        this.lighting.screenLight.visible = this.computer.screen.visible;
        this.lighting.buttonLight.color.setHex(this.computer.isTvOn ? 0x00ff00 : 0xff0000);
        this.lighting.buttonLight.intensity = this.computer.buttonMaterial.emissiveIntensity;
        this.filmGrainPass.uniforms.u_time.value += delta;
        this.ps1Pass.uniforms.u_time.value += delta;
    }

    /**
     * Handles window resize events to keep the camera and renderer updated.
     */
    onWindowResize() {
        const aspect = window.innerWidth / window.innerHeight;
        console.log('Current Aspect Ratio:', aspect);
        this.camera.aspect = aspect;
        if (aspect < 1) {
            this.camera.fov = CONSTANTS.SCENE_CONFIG.FOV + (1 - aspect) * 25;
        } else {
            this.camera.fov = CONSTANTS.SCENE_CONFIG.FOV;
        }
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(0.8);
        this.composer.setSize(window.innerWidth, window.innerHeight);
        this.composer.setPixelRatio(0.8);
    }
    /**
     * Animates the camera to zoom in on the computer screen.
     */
    zoomToComputer() {
        const duration = 2000; // 2 seconds
        const startTime = performance.now();
        const startPosition = this.camera.position.clone();
        const targetPosition = new THREE.Vector3(0, 4.5, 2);
        const startRotation = this.camera.rotation.clone();
        const targetRotation = new THREE.Euler(0, 0, 0);

        const animate = (currentTime) => {
            const elapsedTime = currentTime - startTime;
            const progress = Math.min(elapsedTime / duration, 1);
            const easedProgress = 0.5 * (1 - Math.cos(Math.PI * progress)); // Ease in-out

            this.camera.position.lerpVectors(startPosition, targetPosition, easedProgress);
            this.camera.rotation.x = startRotation.x + (targetRotation.x - startRotation.x) * easedProgress;
            this.camera.rotation.y = startRotation.y + (targetRotation.y - startRotation.y) * easedProgress;
            this.camera.rotation.z = startRotation.z + (targetRotation.z - startRotation.z) * easedProgress;

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    /**
     * Animates the camera to zoom back out to its original position.
     */
    zoomOut() {
        const duration = 2000; // 2 seconds
        const startTime = performance.now();
        const startPosition = this.camera.position.clone();
        const targetPosition = this.originalCameraPosition;
        const startRotation = this.camera.rotation.clone();
        const targetRotation = this.originalCameraRotation;

        const animate = (currentTime) => {
            const elapsedTime = currentTime - startTime;
            const progress = Math.min(elapsedTime / duration, 1);
            const easedProgress = 0.5 * (1 - Math.cos(Math.PI * progress)); // Ease in-out

            this.camera.position.lerpVectors(startPosition, targetPosition, easedProgress);
            this.camera.rotation.x = startRotation.x + (targetRotation.x - startRotation.x) * easedProgress;
            this.camera.rotation.y = startRotation.y + (targetRotation.y - startRotation.y) * easedProgress;
            this.camera.rotation.z = startRotation.z + (targetRotation.z - startRotation.z) * easedProgress;

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }
}