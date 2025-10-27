import * as THREE from 'three';
// This module contains functions for creating and adding all the objects to the scene.
import * as CONSTANTS from './constants.js';
import { materials } from './materials.js';
import { RainSplatManager } from './rainSplatManager.js';

/**
 * Creates and adds the desk to the scene.
 * @param {THREE.Scene} scene - The main Three.js scene.
 * @returns {THREE.Mesh} The created desk mesh.
 */
export function createDesk(scene) {
    const desk = new THREE.Mesh(
        new THREE.BoxGeometry(CONSTANTS.DESK_CONFIG.WIDTH, CONSTANTS.DESK_CONFIG.HEIGHT, CONSTANTS.DESK_CONFIG.DEPTH),
        materials.desk
    );
    desk.position.set(0, CONSTANTS.DESK_CONFIG.Y_POSITION, 0);
    desk.receiveShadow = true;
    scene.add(desk);
    return desk;
}

/**
 * Creates and adds the floor to the scene.
 * @param {THREE.Scene} scene - The main Three.js scene.
 * @returns {THREE.Mesh} The created floor mesh.
 */
export function createFloor(scene) {
    const floorGeometry = new THREE.PlaneGeometry(60, 30);
    const floor = new THREE.Mesh(floorGeometry, materials.desk);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.9;
    scene.add(floor);
    return floor;
}

/**
 * Creates and adds the ceiling to the scene.
 * @param {THREE.Scene} scene - The main Three.js scene.
 * @returns {THREE.Mesh} The created ceiling mesh.
 */
export function createCeiling(scene) {
    const ceilingGeometry = new THREE.PlaneGeometry(CONSTANTS.CEILING_CONFIG.WIDTH, CONSTANTS.CEILING_CONFIG.DEPTH);
    const ceiling = new THREE.Mesh(ceilingGeometry, materials.desk);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = CONSTANTS.CEILING_CONFIG.Y_POSITION;
    scene.add(ceiling);
    return ceiling;
}

function createWindow(scene, windowCenter) {
    const windowGroup = new THREE.Group();
    scene.add(windowGroup);
    windowGroup.position.set(windowCenter.x, windowCenter.y, -8);
    
    // Window frame
    const frames = [
        { size: [CONSTANTS.WINDOW_CONFIG.WIDTH, CONSTANTS.WINDOW_CONFIG.FRAME_THICKNESS, CONSTANTS.WINDOW_CONFIG.FRAME_THICKNESS], pos: [0, CONSTANTS.WINDOW_CONFIG.HEIGHT / 2, 0] },
        { size: [CONSTANTS.WINDOW_CONFIG.WIDTH, CONSTANTS.WINDOW_CONFIG.FRAME_THICKNESS, CONSTANTS.WINDOW_CONFIG.FRAME_THICKNESS], pos: [0, -CONSTANTS.WINDOW_CONFIG.HEIGHT / 2, 0] },
        { size: [CONSTANTS.WINDOW_CONFIG.FRAME_THICKNESS, CONSTANTS.WINDOW_CONFIG.HEIGHT + CONSTANTS.WINDOW_CONFIG.FRAME_THICKNESS, CONSTANTS.WINDOW_CONFIG.FRAME_THICKNESS], pos: [-CONSTANTS.WINDOW_CONFIG.WIDTH / 2, 0, 0] },
        { size: [CONSTANTS.WINDOW_CONFIG.FRAME_THICKNESS, CONSTANTS.WINDOW_CONFIG.HEIGHT + CONSTANTS.WINDOW_CONFIG.FRAME_THICKNESS, CONSTANTS.WINDOW_CONFIG.FRAME_THICKNESS], pos: [CONSTANTS.WINDOW_CONFIG.WIDTH / 2, 0, 0] }
    ];
    
    frames.forEach(frame => {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(...frame.size), materials.windowFrame);
        mesh.position.set(...frame.pos);
        windowGroup.add(mesh);
    });
    
    // Mullions
    const verticalMullion = new THREE.Mesh(
        new THREE.BoxGeometry(CONSTANTS.WINDOW_CONFIG.FRAME_THICKNESS, CONSTANTS.WINDOW_CONFIG.HEIGHT, CONSTANTS.WINDOW_CONFIG.FRAME_THICKNESS),
        materials.windowFrame
    );
    windowGroup.add(verticalMullion);
    
    const horizontalMullion = new THREE.Mesh(
        new THREE.BoxGeometry(CONSTANTS.WINDOW_CONFIG.WIDTH, CONSTANTS.WINDOW_CONFIG.FRAME_THICKNESS, CONSTANTS.WINDOW_CONFIG.FRAME_THICKNESS),
        materials.windowFrame
    );
    windowGroup.add(horizontalMullion);
    
    // Weather planes
    const rainPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(CONSTANTS.WINDOW_CONFIG.WIDTH - CONSTANTS.WINDOW_CONFIG.FRAME_THICKNESS, CONSTANTS.WINDOW_CONFIG.HEIGHT - CONSTANTS.WINDOW_CONFIG.FRAME_THICKNESS),
        materials.rain
    );
    rainPlane.position.z = -0.2;
    rainPlane.visible = true;
    windowGroup.add(rainPlane);

    const cityscapePlane = new THREE.Mesh(
        new THREE.PlaneGeometry(CONSTANTS.WINDOW_CONFIG.WIDTH - CONSTANTS.WINDOW_CONFIG.FRAME_THICKNESS, CONSTANTS.WINDOW_CONFIG.HEIGHT - CONSTANTS.WINDOW_CONFIG.FRAME_THICKNESS),
        materials.cityscape
    );
    cityscapePlane.position.z = -0.3; // Behind rain
    cityscapePlane.visible = true;
    windowGroup.add(cityscapePlane);
    
    // Window glass
    const windowGlass = new THREE.Mesh(
        new THREE.PlaneGeometry(CONSTANTS.WINDOW_CONFIG.WIDTH - CONSTANTS.WINDOW_CONFIG.FRAME_THICKNESS, CONSTANTS.WINDOW_CONFIG.HEIGHT - CONSTANTS.WINDOW_CONFIG.FRAME_THICKNESS),
        materials.windowGlass
    );
    windowGlass.position.z = -0.1;
    windowGroup.add(windowGlass);

    const rainSplatManager = new RainSplatManager();
    materials.rainSplat.map = rainSplatManager.texture;

    const rainSplatPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(CONSTANTS.WINDOW_CONFIG.WIDTH - CONSTANTS.WINDOW_CONFIG.FRAME_THICKNESS, CONSTANTS.WINDOW_CONFIG.HEIGHT - CONSTANTS.WINDOW_CONFIG.FRAME_THICKNESS),
        materials.rainSplat
    );
    rainSplatPlane.position.z = -0.05; // In front of the glass
    windowGroup.add(rainSplatPlane);

    return { windowGroup, rainSplatManager };
}

/**
 * Creates and adds the main wall with a window to the scene.
 * @param {THREE.Scene} scene - The main Three.js scene.
 * @returns {{windowGroup: THREE.Group, rainSplatManager: RainSplatManager}} An object containing the window group and the rain splat manager.
 */
export function createWallAndWindow(scene) {
    const wallMeshes = [];
    const windowCenter = new THREE.Vector2(CONSTANTS.WINDOW_CONFIG.CENTER_X, CONSTANTS.WINDOW_CONFIG.CENTER_Y);
    
    // Calculate wall panels around window
    const wallLeft = CONSTANTS.WALL_CONFIG.CENTER_X - CONSTANTS.WALL_CONFIG.TOTAL_WIDTH / 2;
    const wallRight = CONSTANTS.WALL_CONFIG.CENTER_X + CONSTANTS.WALL_CONFIG.TOTAL_WIDTH / 2;
    const wallTop = CONSTANTS.WALL_CONFIG.CENTER_Y + CONSTANTS.WALL_CONFIG.TOTAL_HEIGHT / 2;
    const wallBottom = CONSTANTS.WALL_CONFIG.CENTER_Y - CONSTANTS.WALL_CONFIG.TOTAL_HEIGHT / 2;
    const windowLeft = windowCenter.x - CONSTANTS.WINDOW_CONFIG.WIDTH / 2;
    const windowRight = windowCenter.x + CONSTANTS.WINDOW_CONFIG.WIDTH / 2;
    const windowTop = windowCenter.y + CONSTANTS.WINDOW_CONFIG.HEIGHT / 2;
    const windowBottom = windowCenter.y - CONSTANTS.WINDOW_CONFIG.HEIGHT / 2;
    
    const panels = [
        { x: windowCenter.x, y: (wallTop + windowTop) / 2, w: CONSTANTS.WINDOW_CONFIG.WIDTH, h: wallTop - windowTop },
        { x: windowCenter.x, y: (windowBottom + wallBottom) / 2, w: CONSTANTS.WINDOW_CONFIG.WIDTH, h: windowBottom - wallBottom },
        { x: (windowLeft + wallLeft) / 2, y: CONSTANTS.WALL_CONFIG.CENTER_Y, w: windowLeft - wallLeft, h: CONSTANTS.WALL_CONFIG.TOTAL_HEIGHT },
        { x: (windowRight + wallRight) / 2, y: CONSTANTS.WALL_CONFIG.CENTER_Y, w: wallRight - windowRight, h: CONSTANTS.WALL_CONFIG.TOTAL_HEIGHT }
    ];
    
    panels.forEach(p => {
        if (p.w > 0 && p.h > 0) {
            const wallPieceMaterial = materials.wall.clone();
            // This part is tricky because createBrickTexture is in another module and not easily accessible here without more refactoring.
            // For now, we'll just use the base wall material. A deeper refactor could address this.
            // wallPieceMaterial.map = createBrickTexture();
            wallPieceMaterial.map.repeat.set(p.w * CONSTANTS.WALL_CONFIG.TEXTURE_SCALE_X, p.h * CONSTANTS.WALL_CONFIG.TEXTURE_SCALE_Y);
            
            const wallPiece = new THREE.Mesh(new THREE.PlaneGeometry(p.w, p.h), wallPieceMaterial);
            wallPiece.position.set(p.x, p.y, -8);
            scene.add(wallPiece);
            wallMeshes.push(wallPiece);
        }
    });
    
    return createWindow(scene, windowCenter);
}

/**
 * Creates and adds the side walls to the scene.
 * @param {THREE.Scene} scene - The main Three.js scene.
 */
export function createSideWalls(scene) {
    const wallGeometry = new THREE.PlaneGeometry(CONSTANTS.SIDE_WALL_CONFIG.WIDTH, CONSTANTS.SIDE_WALL_CONFIG.HEIGHT);

    const leftWall = new THREE.Mesh(wallGeometry, materials.wall);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(CONSTANTS.SIDE_WALL_CONFIG.X_POSITION, CONSTANTS.SIDE_WALL_CONFIG.Y_POSITION, CONSTANTS.SIDE_WALL_CONFIG.Z_POSITION);
    scene.add(leftWall);

    const rightWall = new THREE.Mesh(wallGeometry, materials.wall.clone());
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(-CONSTANTS.SIDE_WALL_CONFIG.X_POSITION, CONSTANTS.SIDE_WALL_CONFIG.Y_POSITION, CONSTANTS.SIDE_WALL_CONFIG.Z_POSITION);
    scene.add(rightWall);
}

/**
 * Creates and adds the lava lamp to the scene.
 * @param {THREE.Scene} scene - The main Three.js scene.
 * @returns {{lavaLampGroup: THREE.Group, lavaLampSwitch: THREE.Mesh, lavaBlobs: THREE.Mesh[], lavaMaterial: THREE.MeshLambertMaterial}} An object containing the lava lamp components.
 */
export function createLavaLamp(scene) {
    const lavaLampGroup = new THREE.Group();
    lavaLampGroup.position.set(9, -1.2, -4);
    scene.add(lavaLampGroup);
    
    const lampBaseMaterial = new THREE.MeshLambertMaterial({ color: 0xcccccc });
    const lampGlassMaterial = new THREE.MeshLambertMaterial({ color: 0x6a0dad, transparent: true, opacity: 0.6 });
    const lavaMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0 });
    
    // Base components
    const lampBase1 = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.8, 0.8, 12), lampBaseMaterial);
    lampBase1.position.y = 0.4;
    lavaLampGroup.add(lampBase1);
    
    const lampBase2 = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.6, 0.6, 12), lampBaseMaterial);
    lampBase2.position.y = 1.1;
    lavaLampGroup.add(lampBase2);
    
    const lampCap = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.2, 1.2, 12), lampBaseMaterial);
    lampCap.position.y = 5.0;
    lavaLampGroup.add(lampCap);
    
    const lampGlass = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.6, 3.5, 12), lampGlassMaterial);
    lampGlass.position.y = 3.15;
    lavaLampGroup.add(lampGlass);
    
    // Switch
    const lampSwitchMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    const lavaLampSwitch = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.4, 0.2), lampSwitchMaterial);
    lavaLampSwitch.position.set(0, 1.1, 0.8);
    lavaLampSwitch.name = "lavaLampSwitch";
    lavaLampGroup.add(lavaLampSwitch);
    
    // Lava blobs
    const lavaBlobs = [];
    for (let i = 0; i < 8; i++) {
        const size = 0.2 + Math.random() * 0.4;
        const blob = new THREE.Mesh(new THREE.SphereGeometry(size, 8, 8), lavaMaterial);
        blob.position.y = 1.6 + Math.random() * 3;
        blob.userData.speed = 0.1 + Math.random() * 0.3;
        blob.userData.offset = Math.random() * Math.PI * 2;
        lavaLampGroup.add(blob);
        lavaBlobs.push(blob);
    }
    
    return { lavaLampGroup, lavaLampSwitch, lavaBlobs, lavaMaterial };
}

/**
 * Creates and adds various clutter objects to the scene.
 * @param {THREE.Scene} scene - The main Three.js scene.
 */
export function createRoomClutter(scene) {
    const clutterMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
    
    // MIDI controller
    const midiBodyMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    const midiBody = new THREE.Mesh(new THREE.BoxGeometry(9, 0.8, 5), midiBodyMaterial);
    midiBody.position.set(-1.25, -0.9, 0);
    scene.add(midiBody);
    
    const controlElements = [
        { geo: [0.2, 1, 0.8], pos: [-5.25, midiBody.position.y + 0.3, 0.2] },
        { geo: [0.3, 0.2, 0.8], pos: [-4.55, midiBody.position.y + 0.5, 0.2] },
        { geo: [0.3, 0.2, 0.8], pos: [-3.95, midiBody.position.y + 0.5, 0.2] }
    ];
    
    controlElements.forEach(element => {
        const control = new THREE.Mesh(new THREE.BoxGeometry(...element.geo), clutterMaterial);
        control.position.set(...element.pos);
        scene.add(control);
    });
}

// export function createCurtains(scene) {
//     const curtainGeometry = new THREE.PlaneGeometry(3, CONSTANTS.WINDOW_CONFIG.HEIGHT + 0.5);
    
//     const leftCurtain = new THREE.Mesh(curtainGeometry, materials.curtain);
//     leftCurtain.position.set(CONSTANTS.WINDOW_CONFIG.CENTER_X - CONSTANTS.WINDOW_CONFIG.WIDTH / 2 - 1.5, CONSTANTS.WINDOW_CONFIG.CENTER_Y, -7.9);
//     scene.add(leftCurtain);

//     const rightCurtain = new THREE.Mesh(curtainGeometry, materials.curtain);
//     rightCurtain.position.set(CONSTANTS.WINDOW_CONFIG.CENTER_X + CONSTANTS.WINDOW_CONFIG.WIDTH / 2 + 1.5, CONSTANTS.WINDOW_CONFIG.CENTER_Y, -7.9);
//     scene.add(rightCurtain);
// }

/**
 * Creates and adds a shelf and a vinyl player to the scene.
 * @param {THREE.Scene} scene - The main Three.js scene.
 */
export function createShelfAndVinylPlayer(scene) {
    // Shelf
    const shelf = new THREE.Mesh(
        new THREE.BoxGeometry(8, 0.4, 3),
        materials.desk
    );
    shelf.position.set(8, 2, -6);
    scene.add(shelf);

    // Vinyl Player
    const vinylPlayer = new THREE.Group();
    vinylPlayer.position.set(8, 2.4, -6);
    scene.add(vinylPlayer);

    const base = new THREE.Mesh(
        new THREE.BoxGeometry(4, 0.6, 2.5),
        materials.blackKey
    );
    vinylPlayer.add(base);

    const platter = new THREE.Mesh(
        new THREE.CylinderGeometry(1, 1, 0.1, 32),
        new THREE.MeshLambertMaterial({ color: 0x111111 })
    );
    platter.position.y = 0.35;
    vinylPlayer.add(platter);

    const tonearmBase = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 0.2, 16),
        materials.windowFrame
    );
    tonearmBase.position.set(1.5, 0.35, 0.8);
    vinylPlayer.add(tonearmBase);

    const tonearm = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 0.1, 0.1),
        materials.windowFrame
    );
    tonearm.position.set(0.8, 0.45, 0.8);
    vinylPlayer.add(tonearm);
}

/**
 * Creates and adds the piano keys to the scene.
 * @param {THREE.Scene} scene - The main Three.js scene.
 * @returns {{allKeys: THREE.Mesh[], noteToKeyMap: Map<string, THREE.Mesh>}} An object containing an array of all keys and a map from note names to key meshes.
 */
export function createPianoKeys(scene) {
    const keysGroup = new THREE.Group();
    scene.add(keysGroup);
    keysGroup.position.set(0, -0.5, 0.2);
    
    const allKeys = [];
    const noteToKeyMap = new Map();
    
    // White keys
    for (let i = 0; i < CONSTANTS.WHITE_KEY_CONFIG.NAMES.length; i++) {
        const key = new THREE.Mesh(
            new THREE.BoxGeometry(CONSTANTS.WHITE_KEY_CONFIG.WIDTH, CONSTANTS.WHITE_KEY_CONFIG.HEIGHT, CONSTANTS.WHITE_KEY_CONFIG.DEPTH),
            materials.whiteKey
        );
        key.position.x = CONSTANTS.WHITE_KEY_CONFIG.POSITIONS[i];
        key.name = CONSTANTS.WHITE_KEY_CONFIG.NAMES[i];
        key.userData.originalY = key.position.y;
        keysGroup.add(key);
        allKeys.push(key);
        noteToKeyMap.set(key.name, key);
    }
    
    // Black keys
    const keyToMaterialMap = {
        'Db2': materials.homeKey,
        'Eb2': materials.aboutKey,
        'F#2': materials.soundDesignKey,
        'Gb2': materials.soundDesignKey,
        'Ab2': materials.musicKey,
        'G#2': materials.musicKey,
        'Bb2': materials.filmmakingKey,
    };

    for (let i = 0; i < CONSTANTS.BLACK_KEY_CONFIG.NAMES.length; i++) {
        const keyName = CONSTANTS.BLACK_KEY_CONFIG.NAMES[i];
        const topMaterial = keyToMaterialMap[keyName] || materials.blackKey;

        const sideMaterial = materials.blackKey;
        const materialsArray = [
            sideMaterial, // right
            sideMaterial, // left
            topMaterial,  // top
            sideMaterial, // bottom
            sideMaterial, // front
            sideMaterial  // back
        ];

        const key = new THREE.Mesh(
            new THREE.BoxGeometry(CONSTANTS.BLACK_KEY_CONFIG.WIDTH, CONSTANTS.BLACK_KEY_CONFIG.HEIGHT, CONSTANTS.BLACK_KEY_CONFIG.DEPTH),
            materialsArray
        );
        key.position.set(CONSTANTS.BLACK_KEY_CONFIG.POSITIONS[i], CONSTANTS.BLACK_KEY_CONFIG.Y_OFFSET, CONSTANTS.BLACK_KEY_CONFIG.Z_OFFSET);
        key.name = keyName;
        key.userData.originalY = key.position.y;
        keysGroup.add(key);
        allKeys.push(key);
        noteToKeyMap.set(key.name, key);
    }
    
    return { allKeys, noteToKeyMap };
}

/**
 * Creates and adds a teacup to the scene.
 * @param {THREE.Scene} scene - The main Three.js scene.
 */
export function createTeacup(scene) {
    const teacupGroup = new THREE.Group();
    scene.add(teacupGroup);

    // Position the teacup on the desk, to the right of the keyboard area
    teacupGroup.position.set(5.5, -1.1, -2);

    const cupMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });

    // Cup body
    const cupGeometry = new THREE.CylinderGeometry(0.5, 0.4, 0.8, 16);
    const cup = new THREE.Mesh(cupGeometry, cupMaterial);
    cup.position.y = 0.4;
    teacupGroup.add(cup);

    // Cup handle
    const handleGeometry = new THREE.TorusGeometry(0.3, 0.1, 8, 16, Math.PI * 1.5);
    const handle = new THREE.Mesh(handleGeometry, cupMaterial);
    handle.position.x = 0.5;
    handle.position.y = 0.4;
    handle.rotation.y = Math.PI / 2;
    teacupGroup.add(handle);
}


/**
 * A wrapper function that creates and adds all the scene objects.
 * @param {THREE.Scene} scene - The main Three.js scene.
 * @returns {object} An object containing all the created scene objects.
 */
export function createSceneObjects(scene) {
    createDesk(scene);
    createFloor(scene);
    createCeiling(scene);
    const { windowGroup, rainSplatManager } = createWallAndWindow(scene);
    createSideWalls(scene);
    const { lavaLampGroup, lavaLampSwitch, lavaBlobs, lavaMaterial } = createLavaLamp(scene);
    createRoomClutter(scene);
    createTeacup(scene);
    // createCurtains(scene);
    const { allKeys, noteToKeyMap } = createPianoKeys(scene);

    return {
        windowGroup,
        rainSplatManager,
        lavaLampGroup,
        lavaLampSwitch,
        lavaBlobs,
        lavaMaterial,
        allKeys,
        noteToKeyMap
    };
}