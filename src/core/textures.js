import * as THREE from 'three';

// A collection of functions for creating and loading various textures in a Three.js scene.
function createCanvasTexture(width, height, drawFunction) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    drawFunction(context, width, height);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    return texture;
}

/**
 * Creates a procedural wood texture.
 * @returns {THREE.CanvasTexture} A canvas texture representing wood.
 */
export function createWoodTexture() {
    return createCanvasTexture(128, 128, (ctx, w, h) => {
        ctx.fillStyle = '#2a1f14';
        ctx.fillRect(0, 0, w, h);
        
        // Add wood grain spots
        for (let i = 0; i < 30; i++) {
            ctx.fillStyle = `rgba(0, 0, 0, ${0.05 + Math.random() * 0.1})`;
            ctx.beginPath();
            ctx.arc(Math.random() * w, Math.random() * h, Math.random() * 15 + 5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Add wood grain lines
        for (let i = 0; i < 20; i++) {
            ctx.strokeStyle = `rgba(0, 0, 0, ${0.2 + Math.random() * 0.2})`;
            ctx.lineWidth = Math.random() * 2 + 0.5;
            ctx.beginPath();
            ctx.moveTo(0, Math.random() * h);
            ctx.bezierCurveTo(w * 0.3, Math.random() * h, w * 0.7, Math.random() * h, w, Math.random() * h);
            ctx.stroke();
        }
        
        // Add vertical grain
        for (let i = 0; i < 25; i++) {
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.03 + Math.random() * 0.05})`;
            ctx.lineWidth = Math.random() * 0.75;
            ctx.beginPath();
            ctx.moveTo(Math.random() * w, 0);
            ctx.lineTo(Math.random() * w, h);
            ctx.stroke();
        }
    });
}

/**
 * Creates a procedural brick texture.
 * @returns {THREE.CanvasTexture} A canvas texture representing bricks.
 */
export function createBrickTexture() {
    return createCanvasTexture(128, 128, (ctx, w, h) => {
        const brickHeight = 16;
        const brickWidth = 32;
        
        ctx.fillStyle = '#222';
        ctx.fillRect(0, 0, w, h);
        
        for (let y = 0; y < h; y += brickHeight) {
            for (let x = 0; x < w; x += brickWidth) {
                const offsetX = (y / brickHeight) % 2 === 0 ? 0 : brickWidth / 2;
                const brightness = 0.2 + Math.random() * 0.15;
                ctx.fillStyle = `rgb(${brightness * 180}, ${brightness * 50}, ${brightness * 40})`;
                ctx.fillRect(x - offsetX, y, brickWidth - 1, brickHeight - 1);
                ctx.fillRect(x - offsetX - brickWidth, y, brickWidth - 1, brickHeight - 1);
            }
        }
    });
}

/**
 * Creates a procedural aged key texture.
 * @returns {THREE.CanvasTexture} A canvas texture representing an aged key.
 */
export function createAgedKeyTexture() {
    return createCanvasTexture(32, 128, (ctx, w, h) => {
        ctx.fillStyle = '#d8d8c0';
        ctx.fillRect(0, 0, w, h);
        
        // Add aging spots
        for (let i = 0; i < 20; i++) {
            ctx.fillStyle = `rgba(0, 0, 0, ${0.02 + Math.random() * 0.05})`;
            ctx.beginPath();
            ctx.arc(Math.random() * w, Math.random() * h, Math.random() * 8 + 3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Add vertical wear lines
        for (let i = 0; i < 10; i++) {
            ctx.strokeStyle = `rgba(0, 0, 0, ${0.05 + Math.random() * 0.05})`;
            ctx.lineWidth = Math.random() * 0.5;
            const x = Math.random() * w;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
        }
    });
}

/**
 * Creates a procedural aged black key texture.
 * @returns {THREE.CanvasTexture} A canvas texture representing an aged black key.
 */
export function createAgedBlackKeyTexture() {
    return createCanvasTexture(32, 128, (ctx, w, h) => {
        ctx.fillStyle = '#3a3a3a';
        ctx.fillRect(0, 0, w, h);
        
        // Add subtle highlights
        for (let i = 0; i < 25; i++) {
            ctx.fillStyle = `rgba(255, 255, 255, ${0.01 + Math.random() * 0.03})`;
            ctx.beginPath();
            ctx.arc(Math.random() * w, Math.random() * h, Math.random() * 6 + 2, 0, Math.PI * 2);
            ctx.fill();
        }
    });
}

export function createKeyTexture(text, lit = false) {
    const width = 128;
    const height = 512;
    return createCanvasTexture(width, height, (ctx, w, h) => {
        // Background
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, w, h);

        // Text Style
        ctx.font = `bold ${w / 2}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Rotate context to draw text vertically
        ctx.save();
        ctx.translate(w / 2, h / 2);
        ctx.rotate(-Math.PI / 2);

        if (lit) {
            // Lit State
            ctx.fillStyle = '#ff0000';
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 20;
            ctx.fillText(text, 0, 0);
        } else {
            // Engraved State
            // Darker shadow for top part of engraving
            ctx.fillStyle = '#444444';
            ctx.fillText(text, 0, -2);

            // Lighter highlight for bottom part of engraving
            ctx.fillStyle = '#888888';
            ctx.fillText(text, 0, 0);
        }

        ctx.restore();
    });
}

/**
 * Creates a procedural color bars texture.
 * @returns {THREE.CanvasTexture} A canvas texture representing color bars.
 */
export function createColorBarsTexture() {
    return createCanvasTexture(256, 256, (ctx, w, h) => {
        const colors = ['#c0c0c0', '#c0c000', '#00c0c0', '#00c000', '#c000c0', '#c00000', '#0000c0'];
        const barWidth = w / colors.length;
        
        for (let i = 0; i < colors.length; i++) {
            ctx.fillStyle = colors[i];
            ctx.fillRect(i * barWidth, 0, barWidth, h);
        }
    });
}

/**
 * Creates a procedural scanline texture.
 * @returns {THREE.CanvasTexture} A canvas texture representing scanlines.
 */
export function createScanlineTexture() {
    return createCanvasTexture(1, 4, (ctx) => {
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(0, 0, 1, 1);
    });
}

/**
 * Creates a procedural rain texture.
 * @returns {THREE.CanvasTexture} A canvas texture representing rain.
 */
export function createRainTexture() {
    const rainTexture = createCanvasTexture(128, 256, (ctx, w, h) => {
        ctx.clearRect(0, 0, w, h); // Use clearRect for a transparent background
        
        for (let i = 0; i < 200; i++) {
            ctx.strokeStyle = `rgba(180, 180, 200, ${Math.random() * 0.5 + 0.3})`;
            ctx.lineWidth = Math.random() < 0.9 ? 1 : 2;
            ctx.beginPath();
            const x = Math.random() * w;
            const y = Math.random() * h;
            ctx.moveTo(x, y);
            ctx.lineTo(x + Math.random() * 2 - 1, y + 10 + Math.random() * 10);
            ctx.stroke();
        }
    });
    rainTexture.wrapS = THREE.RepeatWrapping;
    rainTexture.wrapT = THREE.RepeatWrapping;
    return rainTexture;
}

/**
 * Creates a procedural CRT texture.
 * @returns {THREE.CanvasTexture} A canvas texture representing a CRT screen.
 */
export function createCrtTexture() {
    return createCanvasTexture(128, 128, (ctx, w, h) => {
        ctx.fillStyle = '#e0e0d1';
        ctx.fillRect(0, 0, w, h);
        
        // Add static noise
        for (let i = 0; i < 2000; i++) {
            const x = Math.random() * w;
            const y = Math.random() * h;
            const alpha = 0.02 + Math.random() * 0.03;
            ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
            ctx.fillRect(x, y, 1, 1);
        }
        
        // Add vignette
        const gradient = ctx.createRadialGradient(64, 64, 40, 64, 64, 80);
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.1)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
    });
}


/**
 * Creates a procedural weather texture.
 * @param {string} type - The type of weather to create ('clear', 'cloudy', or 'night').
 * @returns {THREE.CanvasTexture} A canvas texture representing the weather.
 */
export function createWeatherTexture(type) {
    return createCanvasTexture(128, 128, (ctx, w, h) => {
        switch (type) {
            case 'clear':
                const gradient = ctx.createLinearGradient(0, 0, 0, h);
                gradient.addColorStop(0, '#87CEEB');
                gradient.addColorStop(1, '#ADD8E6');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, w, h);
                
                // Add sun
                ctx.fillStyle = 'rgba(255, 255, 224, 0.8)';
                ctx.beginPath();
                ctx.arc(w * 0.8, h * 0.2, 20, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'cloudy':
                ctx.fillStyle = '#B0C4DE';
                ctx.fillRect(0, 0, w, h);
                
                // Add clouds
                for (let i = 0; i < 15; i++) {
                    ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.3 + 0.4})`;
                    ctx.beginPath();
                    ctx.arc(Math.random() * w, Math.random() * h * 0.6, Math.random() * 20 + 15, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;
                
            case 'night':
                ctx.fillStyle = '#000033';
                ctx.fillRect(0, 0, w, h);
                
                // Add stars
                for (let i = 0; i < 100; i++) {
                    ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.5 + 0.5})`;
                    ctx.beginPath();
                    ctx.arc(Math.random() * w, Math.random() * h, Math.random() * 0.8, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;
        }
    });
}

/**
 * Creates a procedural cityscape texture.
 * @returns {THREE.CanvasTexture} A canvas texture representing a cityscape.
 */
export function createCityscapeTexture() {
    return createCanvasTexture(256, 128, (ctx, w, h) => {
        // Dark blue-purple night sky
        const gradient = ctx.createLinearGradient(0, 0, 0, h);
        gradient.addColorStop(0, '#1a1a3a');
        gradient.addColorStop(1, '#3a2a4a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);

        // Add stars
        for (let i = 0; i < 150; i++) {
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.6 + 0.2})`;
            ctx.fillRect(Math.random() * w, Math.random() * h * 0.8, 1, 1);
        }

        // Render buildings
        for (let i = 0; i < 40; i++) {
            const x = Math.random() * w;
            const buildingHeight = (Math.random() * Math.random()) * h * 0.7 + h * 0.1;
            const buildingWidth = Math.random() * 15 + 8;
            const y = h - buildingHeight;
            
            const buildingColor = Math.random() > 0.3 ? '#121222' : '#181828';
            ctx.fillStyle = buildingColor;
            ctx.fillRect(x, y, buildingWidth, buildingHeight);

            // Render windows
            for(let wy = y + 4; wy < h - 4; wy += 6) {
                for(let wx = x + 4; wx < x + buildingWidth - 4; wx += 6) {
                    if (Math.random() > 0.4) {
                        ctx.fillStyle = `rgba(255, 224, 130, ${Math.random() * 0.5 + 0.3})`;
                        ctx.fillRect(wx, wy, 2, 2);
                    }
                }
            }
        }
    });
}

/**
 * Creates a procedural post-it note texture.
 * @returns {THREE.CanvasTexture} A canvas texture representing a post-it note.
 */
export function createPostItTexture() {
    return createCanvasTexture(256, 256, (ctx, w, h) => {
        ctx.fillStyle = '#ffff00';
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = '#000000';
        ctx.font = "20px 'Comic Sans MS'";
        ctx.fillText("TO DO:", 20, 40);
        ctx.fillText("- Make a portfolio", 20, 80);
        ctx.fillText("- Get a job", 20, 120);
        ctx.fillText("- ???", 20, 160);
    });
}

/**
 * Loads the city window texture.
 * @returns {THREE.Texture} The loaded city window texture.
 */
export function createCityWindowTexture() {
    const textureLoader = new THREE.TextureLoader();
    return textureLoader.load('public/assets/images/textures/City_Window_2.png');
}
/**
 * Loads the desk texture.
 * @returns {THREE.Texture} The loaded desk texture.
 */
export function createDeskTexture() {
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load('public/assets/images/textures/desk_texture.png');
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);
    return texture;
}

/**
 * Loads the wall texture.
 * @returns {THREE.Texture} The loaded wall texture.
 */
export function createWallTexture() {
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load('public/assets/images/textures/wall_texture.png');
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
}