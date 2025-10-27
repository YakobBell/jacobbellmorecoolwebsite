import * as THREE from 'three';

// Manages the creation, animation, and rendering of rain splat effects on a canvas texture.
/**
 * @class RainSplatManager
 * @classdesc Manages the dynamic creation and animation of rain splats on a canvas,
 * which is then used as a texture in a Three.js scene.
 */
export class RainSplatManager {
    /**
     * @constructs RainSplatManager
     * @param {number} [width=256] - The width of the canvas texture.
     * @param {number} [height=256] - The height of the canvas texture.
     */
    constructor(width = 256, height = 256) {
        this.width = width;
        this.height = height;
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.ctx = this.canvas.getContext('2d');
        
        this.texture = new THREE.CanvasTexture(this.canvas);
        this.texture.minFilter = THREE.LinearFilter;
        this.texture.magFilter = THREE.NearestFilter;

        this.splats = [];
    }

    /**
     * Updates the state of all rain splats, adding new ones, and redrawing the canvas.
     * This method should be called in the main animation loop.
     * @param {number} delta - The time elapsed since the last frame, in seconds.
     */
    update(delta) {
        let changed = false;
        // Add new splats occasionally
        if (Math.random() > 0.7) {
            this.splats.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                radius: Math.random() * 2 + 1,
                opacity: 1.0,
                life: 1.5, // Longer life
                dripLength: Math.random() * 40 + 20, // Increased drip length
                dripSpeed: Math.random() * 10 + 10, // Increased drip speed
            });
            changed = true;
        }

        if (this.splats.length > 0) {
            changed = true;
        }

        if (!changed) return;

        // Update and draw existing splats
        this.ctx.clearRect(0, 0, this.width, this.height);
        for (let i = this.splats.length - 1; i >= 0; i--) {
            const splat = this.splats[i];
            splat.life -= delta;

            if (splat.life <= 0) {
                this.splats.splice(i, 1);
            } else {
                splat.opacity = splat.life; // Fade out
                
                // Draw the main splat
                this.ctx.fillStyle = `rgba(200, 200, 220, ${splat.opacity * 0.6})`;
                this.ctx.beginPath();
                this.ctx.arc(splat.x, splat.y, splat.radius, 0, Math.PI * 2);
                this.ctx.fill();

                // Draw the drip
                const dripY = splat.y + (1.5 - splat.life) * splat.dripSpeed;
                this.ctx.strokeStyle = `rgba(200, 200, 220, ${splat.opacity * 0.5})`;
                this.ctx.lineWidth = splat.radius * 0.5;
                this.ctx.beginPath();
                this.ctx.moveTo(splat.x, splat.y);
                this.ctx.lineTo(splat.x, dripY);
                this.ctx.stroke();
            }
        }
        this.texture.needsUpdate = true;
    }
}