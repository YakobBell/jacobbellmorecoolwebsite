// This module manages the dynamic lighting effects, such as fading in lights and toggling the lava lamp.
/**
 * Manages dynamic lighting effects, including fading and toggling lights.
 */
export class LightingManager {
    /**
     * @param {object} lights - An object containing the light instances.
     * @param {THREE.Material} lavaMaterial - The material for the lava lamp blobs.
     * @param {THREE.Material} cityscapeMaterial - The material for the cityscape.
     * @param {THREE.Material} rainMaterial - The material for the rain effect.
     * @param {THREE.Material} rainSplatMaterial - The material for the rain splat effect.
     */
    constructor(lights, lavaMaterial, cityscapeMaterial, rainMaterial, rainSplatMaterial) {
        this.lights = lights;
        this.lavaMaterial = lavaMaterial;
        this.cityscapeMaterial = cityscapeMaterial;
        this.rainMaterial = rainMaterial;
        this.rainSplatMaterial = rainSplatMaterial;
        this.isFading = false;
        this.fadeDuration = 2000; // 2 seconds
        this.fadeTimer = 0;

        this.initialIntensities = {
            windowLight: 0,
            windowGlowLight: 0,
            screenLight: 0,
            lavaLampLight: 0
        };

        this.targetIntensities = {
            windowLight: 1.0,
            windowGlowLight: 0.8,
            screenLight: 1.5,
            lavaLampLight: 2
        };
        this.isLavaLampOn = true;
    }

    /**
     * Starts the fade-in animation for the scene lighting.
     */
    startFadeIn() {
        this.isFading = true;
        this.fadeTimer = 0;
    }

    /**
     * Updates the lighting fade-in animation.
     * @param {number} delta - The time delta since the last frame.
     */
    update(delta) {
        if (!this.isFading) return;

        this.fadeTimer += delta * 1000;
        const progress = Math.min(this.fadeTimer / this.fadeDuration, 1);

        for (const lightName in this.targetIntensities) {
            const light = this.lights[lightName];
            if (light) {
                const startIntensity = this.initialIntensities[lightName];
                const targetIntensity = this.targetIntensities[lightName];
                light.intensity = startIntensity + (targetIntensity - startIntensity) * progress;
            }
        }
        
        if (this.lavaMaterial) {
            this.lavaMaterial.emissiveIntensity = 1.5 * progress;
        }
        
        if (this.cityscapeMaterial) {
            this.cityscapeMaterial.opacity = progress;
        }
        
        if (this.rainMaterial) {
            this.rainMaterial.opacity = progress;
        }
        
        if (this.rainSplatMaterial) {
            this.rainSplatMaterial.opacity = progress;
        }

        if (progress >= 1) {
            this.isFading = false;
        }
    }

    /**
     * Toggles the lava lamp on and off.
     */
    toggleLavaLamp() {
        this.isLavaLampOn = !this.isLavaLampOn;
        this.lights.lavaLampLight.intensity = this.isLavaLampOn ? this.targetIntensities.lavaLampLight : 0;
        if (this.lavaMaterial) {
            this.lavaMaterial.emissiveIntensity = this.isLavaLampOn ? 1.5 : 0;
        }
    }
}