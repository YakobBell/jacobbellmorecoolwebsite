import * as THREE from 'three';

// This module defines the LoadingScreen class, which displays an animated loading sequence.
/**
 * Manages the animated loading screen displayed at the start of the application.
 */
export class LoadingScreen {

    /**
     * @param {THREE.Scene} scene - The main Three.js scene.
     * @param {THREE.Camera} camera - The main scene camera.
     */
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.group = new THREE.Group();
        this.scene.add(this.group);
    }

    /**
     * Initializes the loading screen components and starts the animation.
     */
    init() {
        // Match the camera's rotation
        this.group.rotation.copy(this.camera.rotation);

        this._createBackground();
        this._createTextField();
        this._createSoundIcon();

        this.pulsating = false;
        this.rainbowCool = false;
        this.animateText();
    }

    _createBackground() {
        const backgroundGeometry = new THREE.PlaneGeometry(10, 10);
        const backgroundMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
        this.backgroundMesh = new THREE.Mesh(backgroundGeometry, backgroundMaterial);
        this.group.position.copy(this.camera.position);
        this.group.rotation.copy(this.camera.rotation);
        this.backgroundMesh.position.set(0, 0, -2);
        this.group.add(this.backgroundMesh);
    }

    _createTextField() {
        this.canvas = document.createElement('canvas');
        this.context = this.canvas.getContext('2d');
        this.canvas.width = 1024;
        this.canvas.height = 512;

        this.context.font = "40px 'BitcountGridSingle-Regular', monospace";
        this.context.fillStyle = '#18e699';
        this.context.textAlign = 'center';

        this.texture = new THREE.CanvasTexture(this.canvas);
        const material = new THREE.MeshBasicMaterial({ map: this.texture, transparent: true });
        const geometry = new THREE.PlaneGeometry(2, 1);
        this.textMesh = new THREE.Mesh(geometry, material);

        this.textMesh.position.set(0, 0.1, -1.9);
        this.group.add(this.textMesh);
    }

    _createSoundIcon() {
        this.soundIconMuted = this.createSoundIconTexture(true);
        this.soundIconUnmuted = this.createSoundIconTexture(false);

        const iconMaterial = new THREE.MeshBasicMaterial({ map: this.soundIconMuted, transparent: true });
        const iconGeometry = new THREE.PlaneGeometry(0.3, 0.3);
        this.soundIcon = new THREE.Mesh(iconGeometry, iconMaterial);
        this.soundIcon.position.set(0, -0.1, -1.9);
        this.soundIcon.visible = false;
        this.group.add(this.soundIcon);
    }

    createSoundIconTexture(muted) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 64;
        canvas.height = 64;

        context.fillStyle = '#18e699';

        context.strokeStyle = '#18e699';
        context.lineWidth = 4;

        // Draw the central circle
        context.beginPath();
        context.arc(32, 32, 10, 0, Math.PI * 2);
        context.stroke();

        if (muted) {
            // The 'X' has been removed, only the circle will be drawn.
        } else {
            // Draw sound waves on both sides of the circle
            for (let i = 0; i < 3; i++) {
                // Right side
                context.beginPath();
                context.arc(32, 32, 15 + i * 5, -Math.PI / 3, Math.PI / 3);
                context.stroke();

                // Left side
                context.beginPath();
                context.arc(32, 32, 15 + i * 5, Math.PI * 2 / 3, Math.PI * 4 / 3);
                context.stroke();
            }
        }

        return new THREE.CanvasTexture(canvas);
    }

    animateText() {
        let flashes = 0;
        const flashInterval = setInterval(() => {
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
            if (flashes % 2 === 0) {
                this.context.fillText('_', this.canvas.width / 2, this.canvas.height / 2 - 40);
            }
            this.texture.needsUpdate = true;
            flashes++;
            if (flashes >= 6) {
                clearInterval(flashInterval);
                this.typeMessage(["Please enable sound..."], () => {
                    this.soundIcon.visible = true;
                    this.fadeInSoundIcon();
                });
            }
        }, 200);
    }

    typeMessage(messages, onComplete) {
        let messageIndex = 0;
        let i = 0;

        const type = () => {
            if (messageIndex >= messages.length) {
                if (onComplete) onComplete();
                return;
            }

            const message = messages[messageIndex];
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

            for (let j = 0; j < messageIndex; j++) {
                this.context.fillText(messages[j].toUpperCase(), this.canvas.width / 2, this.canvas.height / 2 - 40 + (j * 80));
            }

            const typedPart = message.substring(0, i + 1);
            this.context.fillText(typedPart.toUpperCase(), this.canvas.width / 2, this.canvas.height / 2 - 40 + (messageIndex * 80));
            this.texture.needsUpdate = true;
            i++;

            if (i >= message.length) {
                i = 0;
                messageIndex++;
            }

            setTimeout(type, 50);
        };

        type();
    }

    /**
     * Fades out and hides the loading screen.
     */
    hide() {
        const duration = 1000; // 1 second
        const startTime = Date.now();

        const animateFadeOut = () => {
            const elapsedTime = Date.now() - startTime;
            const progress = Math.min(elapsedTime / duration, 1);
            const opacity = 1 - progress;

            this.group.children.forEach(child => {
                if (child.material) {
                    child.material.transparent = true;
                    child.material.opacity = opacity;
                }
            });

            if (progress < 1) {
                requestAnimationFrame(animateFadeOut);
            } else {
                this.group.visible = false;
            }
        };

        animateFadeOut();
    }

    /**
     * Updates the loading screen animations.
     * @param {number} time - The total elapsed time.
     */
    update(time) {
        // Ensure the loading screen follows the camera's rotation
        this.group.rotation.copy(this.camera.rotation);

        if (this.pulsating && this.soundIcon.visible) {
            const opacity = (Math.sin(time * 3) + 1) / 2 * 0.5 + 0.5; // Pulsates between 0.5 and 1.0
            this.soundIcon.material.opacity = opacity;
        }

        if (this.rainbowCool) {
            // This logic is no longer needed with the simplified message.
        }
    }

    triggerPulsation() {
        let waveCount = 0;
        let repeats = 0;
        const maxRepeats = 2; // Animation will run 3 times (0, 1, 2)

        const animate = () => {
            waveCount++;
            if (waveCount > 3) {
                waveCount = 1;
                repeats++;
            }

            if (repeats > maxRepeats) {
                // Restore the final unmuted icon state
                this.soundIcon.material.map = this.soundIconUnmuted;
                this.soundIcon.material.needsUpdate = true;
                return;
            }

            const canvas = this.soundIcon.material.map.image;
            const context = canvas.getContext('2d');
            context.clearRect(0, 0, canvas.width, canvas.height);

            // Draw the central circle
            context.strokeStyle = '#18e699';
            context.lineWidth = 4;
            context.beginPath();
            context.arc(32, 32, 10, 0, Math.PI * 2);
            context.stroke();

            // Draw the sound waves
            for (let i = 0; i < waveCount; i++) {
                // Right side
                context.beginPath();
                context.arc(32, 32, 15 + i * 5, -Math.PI / 3, Math.PI / 3);
                context.stroke();

                // Left side
                context.beginPath();
                context.arc(32, 32, 15 + i * 5, Math.PI * 2 / 3, Math.PI * 4 / 3);
                context.stroke();
            }
            this.soundIcon.material.map.needsUpdate = true;

            setTimeout(animate, 200);
        };

        animate();
    }

    fadeInSoundIcon() {
        const duration = 1000; // 1 second
        const startTime = Date.now();

        const animateFadeIn = () => {
            const elapsedTime = Date.now() - startTime;
            const progress = Math.min(elapsedTime / duration, 1);
            this.soundIcon.material.opacity = progress;

            if (progress < 1) {
                requestAnimationFrame(animateFadeIn);
            } else {
                this.pulsating = true;
            }
        };

        animateFadeIn();
    }
}