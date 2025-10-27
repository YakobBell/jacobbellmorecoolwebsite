import * as THREE from 'three';
// This module defines the Computer class, which creates and manages the interactive CRT TV model.
import { createCrtTexture, createScanlineTexture } from './textures.js';
import { materials } from './materials.js';

/**
 * Represents the CRT TV and its stand, managing its state and appearance.
 */
export class Computer {
    /**
     * @param {THREE.Scene} scene - The main Three.js scene.
     * @param {THREE.Texture} screenTexture - The texture for the computer screen.
     */
    constructor(scene, screenTexture) {
        this.scene = scene;
        this.screenTexture = screenTexture;
        this.isTvOn = false;
        this.tvAnimationProgress = 0;
        this.tvStateTarget = 0;

        this.create();
    }

    /**
     * Creates the components of the computer setup.
     * @private
     */
    create() {
        const stackTopY = this.createElectronicsStack();
        this.createCRTTV(stackTopY);
    }

    createElectronicsStack() {
        const stackBaseY = -1.1;
        const vcrMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        const vcr = new THREE.Mesh(new THREE.BoxGeometry(10, 1, 5.5), vcrMaterial);
        vcr.position.set(0, stackBaseY + 0.5, -6);
        this.scene.add(vcr);

        const book1Material = new THREE.MeshLambertMaterial({ color: 0x5c2a2a });
        const book2Material = new THREE.MeshLambertMaterial({ color: 0x2a5c3d });
        const book1 = new THREE.Mesh(new THREE.BoxGeometry(6, 0.8, 4.5), book1Material);
        book1.position.set(0.2, stackBaseY + 1 + 0.4, -6);
        book1.rotation.y = -0.05;
        this.scene.add(book1);

        const book2 = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.6, 4), book2Material);
        book2.position.set(-0.1, stackBaseY + 1 + 0.8 + 0.3, -6);
        book2.rotation.y = 0.03;
        this.scene.add(book2);

        return stackBaseY + 1 + 0.8 + 0.6;
    }

    createCRTTV(stackTopY) {
        const crtBodyMaterial = new THREE.MeshLambertMaterial({ map: createCrtTexture() });
        this.crtTV = new THREE.Group();
        this.scene.add(this.crtTV);
        this.crtTV.position.set(0, stackTopY + 3.75, -6);

        const crtBodyBack = new THREE.Mesh(new THREE.BoxGeometry(9, 7.5, 6), crtBodyMaterial);
        this.crtTV.add(crtBodyBack);

        this._createTVBezels(crtBodyMaterial);
        this._createTVControls(crtBodyMaterial);
        this._createTVScreen();
    }

    _createTVBezels(material) {
        const bezelDepth = 1, bezelWidth = 0.8, screenW = 7.5, screenH = 6;
        const bezels = [
            { size: [screenW + bezelWidth * 2, bezelWidth, bezelDepth], pos: [0, screenH / 2 + bezelWidth / 2, 3] },
            { size: [screenW + bezelWidth * 2, bezelWidth, bezelDepth], pos: [0, -screenH / 2 - bezelWidth / 2, 3] },
            { size: [bezelWidth, screenH, bezelDepth], pos: [-screenW / 2 - bezelWidth / 2, 0, 3] },
            { size: [bezelWidth, screenH, bezelDepth], pos: [screenW / 2 + bezelWidth / 2, 0, 3] }
        ];
        bezels.forEach(b => {
            const mesh = new THREE.Mesh(new THREE.BoxGeometry(...b.size), material);
            mesh.position.set(...b.pos);
            this.crtTV.add(mesh);
        });
    }

    _createTVControls(material) {
        const crtFrontPanel = new THREE.Mesh(new THREE.BoxGeometry(9.2, 1.2, 1), material);
        crtFrontPanel.position.set(0, -4.35, 3);
        this.crtTV.add(crtFrontPanel);

        this.buttonMaterial = new THREE.MeshLambertMaterial({ color: 0x444444, emissive: 0x800517, emissiveIntensity: 1.5 });
        this.powerButton = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.2), this.buttonMaterial);
        this.powerButton.name = "powerButton";
        this.powerButton.position.set(-3.5, -4.35, 3.5);
        this.crtTV.add(this.powerButton);

        this.cdSlotMaterial = new THREE.MeshLambertMaterial({ color: 0x111111, emissive: 0xffffff, emissiveIntensity: 0 });
        this.cdSlot = new THREE.Mesh(new THREE.BoxGeometry(3, 0.2, 0.8), this.cdSlotMaterial);
        this.cdSlot.position.set(2.5, -3.8, 3.55);
        this.crtTV.add(this.cdSlot);

        const hitboxGeometry = new THREE.BoxGeometry(4, 1, 1);
        const hitboxMaterial = new THREE.MeshBasicMaterial({ visible: false });
        this.cdSlotHitbox = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
        this.cdSlotHitbox.position.copy(this.cdSlot.position);
        this.crtTV.add(this.cdSlotHitbox);

        const ejectSymbol = new THREE.Group();
        ejectSymbol.position.set(2.5, -4.1, 3.6);
        this.crtTV.add(ejectSymbol);

        const ejectBar = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.05, 0.1), new THREE.MeshBasicMaterial({ color: 0xaaaaaa }));
        ejectBar.position.y = -0.1;
        ejectSymbol.add(ejectBar);

        const ejectTriangle = new THREE.Mesh(new THREE.CylinderGeometry(0, 0.15, 0.2, 3), new THREE.MeshBasicMaterial({ color: 0xaaaaaa }));
        ejectTriangle.position.y = 0.1;
        ejectTriangle.rotation.z = Math.PI;
        ejectSymbol.add(ejectTriangle);
    }

    _createTVScreen() {
        const screenW = 7.5, screenH = 6;
        const screenMaterial = new THREE.MeshLambertMaterial({
            map: this.screenTexture,
            emissiveMap: this.screenTexture,
            emissive: 0xffffff,
            emissiveIntensity: 0.9,
            color: 0x000000
        });
        this.screen = new THREE.Mesh(new THREE.BoxGeometry(screenW, screenH, 0.1), screenMaterial);
        this.screen.name = "screen";
        this.screen.position.set(0, 0, 3.05);
        this.crtTV.add(this.screen);

        const screenBacking = new THREE.Mesh(new THREE.BoxGeometry(screenW, screenH, 0.1), materials.screenOff);
        screenBacking.position.set(0, 0, 3.04);
        this.crtTV.add(screenBacking);

        this.scanlinePlane = new THREE.Mesh(new THREE.PlaneGeometry(screenW, screenH), new THREE.MeshBasicMaterial({ map: createScanlineTexture(), transparent: true }));
        this.scanlinePlane.position.set(0, 0, 3.1);
        this.crtTV.add(this.scanlinePlane);
    }

    /**
     * Toggles the power state of the TV.
     * @param {object} sounds - The global sounds object.
     * @param {Terminal} terminal - The terminal instance.
     */
    toggleTV(sounds, terminal) {
        this.isTvOn = !this.isTvOn;
        this.tvStateTarget = this.isTvOn ? 1 : 0;
        this.buttonMaterial.emissive.setHex(this.isTvOn ? 0x18e699 : 0x800517);

        if (this.isTvOn) {
            if (sounds.powerOn) sounds.powerOn.play();
            terminal.startBootSequence();
        } else {
            if (sounds.powerOff) sounds.powerOff.play();
            terminal.state = 'idle'; // Reset on power off
            terminal.isDirty = true;
        }
    }

    /**
     * Updates the TV's animation and state.
     * @param {number} time - The total elapsed time.
     * @param {number} delta - The time delta since the last frame.
     */
    update(time, delta) {
        if (this.tvAnimationProgress !== this.tvStateTarget) {
            this.tvAnimationProgress += (this.tvStateTarget - this.tvAnimationProgress) * 0.1;
            const easeOut = 1 - Math.pow(1 - this.tvAnimationProgress, 3);
            
            this.screen.visible = this.tvAnimationProgress > 0.01;
            this.scanlinePlane.visible = this.tvAnimationProgress > 0.5;

            if (easeOut > 0.5) {
                this.screen.scale.x = 1;
                this.screen.scale.y = Math.max(0.01, (easeOut - 0.5) * 2);
            } else {
                this.screen.scale.x = Math.max(0.01, easeOut * 2);
                this.screen.scale.y = 0.01;
            }

            if (Math.abs(this.tvAnimationProgress - this.tvStateTarget) < 0.001) {
                this.tvAnimationProgress = this.tvStateTarget;
                if (this.tvStateTarget === 0) {
                    this.screen.visible = false;
                    this.scanlinePlane.visible = false;
                }
            }
        } else {
            if (!this.isTvOn) {
                const pulse = 1.5 + Math.sin(time * 4) * 0.5;
                this.buttonMaterial.emissiveIntensity = pulse;
            } else {
                this.buttonMaterial.emissiveIntensity = 1.5;
            }
        }
        this.scanlinePlane.scale.copy(this.screen.scale);
    }
    /**
     * Sets the texture of the screen to a video texture.
     * @param {THREE.VideoTexture | null} videoTexture - The video texture to apply, or null to revert.
     */
    setVideoTexture(videoTexture) {
        if (videoTexture) {
            this.screen.material.map = videoTexture;
            this.screen.material.emissiveMap = videoTexture;
        } else {
            this.screen.material.map = this.screenTexture;
            this.screen.material.emissiveMap = this.screenTexture;
        }
        this.screen.material.needsUpdate = true;
    }
}