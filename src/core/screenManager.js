import * as THREE from 'three';

// This module defines the ScreenManager class, which manages the canvas and texture for the computer screen.
/**
 * Manages a canvas and its texture for rendering dynamic content, such as a terminal.
 */
export class ScreenManager {
    /**
     * @param {number} [width=512] - The width of the canvas.
     * @param {number} [height=384] - The height of the canvas.
     */
    constructor(width = 512, height = 384) {
        this.width = width;
        this.height = height;
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.ctx = this.canvas.getContext('2d');
        
        this.texture = new THREE.CanvasTexture(this.canvas);
        this.texture.minFilter = THREE.LinearFilter;
        this.texture.magFilter = THREE.NearestFilter;
    }

    /**
     * Returns the 2D rendering context of the canvas.
     * @returns {CanvasRenderingContext2D} The 2D rendering context.
     */
    getContext() {
        return this.ctx;
    }

    /**
     * Flags the texture for an update, so it gets re-rendered in the next frame.
     */
    updateTexture() {
        this.texture.needsUpdate = true;
    }

    /**
     * Clears the canvas with a black background.
     */
    clear() {
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0, 0, this.width, this.height);
    }
}