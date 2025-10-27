import * as THREE from 'three';

// This module sets up various lights for the scene, including spot and point lights.
/**
 * Creates and configures the lighting for the scene.
 * @param {THREE.Scene} scene - The Three.js scene to add the lights to.
 * @param {THREE.Vector2} windowCenter - The center coordinates of the window.
 * @param {Computer} computer - The computer instance to attach lights to.
 * @returns {object} An object containing the created light instances.
 */
export function createLighting(scene, windowCenter, computer) {
    // Window lighting (Rainy night values)
    const windowLight = new THREE.SpotLight(0xaaaaff, 0, 30, Math.PI / 3, 0.8, 1.5);
    windowLight.position.set(windowCenter.x, windowCenter.y, -4);
    windowLight.target.position.set(-8, -1.5, 0);
    scene.add(windowLight);
    scene.add(windowLight.target);

    const windowGlowLight = new THREE.PointLight(0x8899bb, 0, 25);
    windowGlowLight.position.set(windowCenter.x, windowCenter.y, -6);
    scene.add(windowGlowLight);

    // Screen lighting
    const screenLight = new THREE.PointLight(0xffffff, 0, 15, 2);
    screenLight.position.copy(computer.crtTV.position).z += 3.05;
    scene.add(screenLight);

    // Button lighting
    const buttonLight = new THREE.PointLight(0xff0000, 1, 2);
    buttonLight.position.copy(computer.powerButton.position).z += 0.5;
    computer.crtTV.add(buttonLight);

    // Lava lamp lighting
    const lavaLampLight = new THREE.PointLight(0xff00ff, 0, 10, 1.5);
    lavaLampLight.position.set(9, 1.95, -4);
    scene.add(lavaLampLight);

    // Lightning effect
    const lightningLight = new THREE.SpotLight(0xadd8e6, 0);
    lightningLight.position.set(-11, 5, -10);
    lightningLight.target.position.set(-8, -1.5, -8);
    lightningLight.angle = Math.PI / 4;
    lightningLight.penumbra = 0.6;
    lightningLight.decay = 2;
    scene.add(lightningLight);
    scene.add(lightningLight.target);

    return { windowLight, windowGlowLight, screenLight, buttonLight, lavaLampLight, lightningLight };
}
