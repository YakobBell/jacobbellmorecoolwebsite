// This module defines and exports all the materials used in the scene.
import * as THREE from 'three';
import * as TEXTURES from './textures.js';

export const materials = {
    desk: new THREE.MeshLambertMaterial({ map: TEXTURES.createDeskTexture() }), // Material for the desk
    whiteKey: new THREE.MeshLambertMaterial({ map: TEXTURES.createAgedKeyTexture() }), // Material for the white piano keys
    blackKey: new THREE.MeshLambertMaterial({ map: TEXTURES.createAgedBlackKeyTexture() }), // Material for the black piano keys
    wall: new THREE.MeshLambertMaterial({ map: TEXTURES.createWallTexture() }), // Material for the walls
    windowFrame: new THREE.MeshLambertMaterial({ color: 0x1a1a1a }), // Material for the window frame
    rain: new THREE.MeshBasicMaterial({ map: TEXTURES.createRainTexture(), transparent: true, color: 0x8899aa, opacity: 0 }), // Material for the rain effect
    rainSplat: new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 }), // Material for the rain splat effect
    windowGlass: new THREE.MeshPhongMaterial({
        color: 0xadd8e6,
        transparent: true,
        opacity: 0.15,
        specular: 0xeeeeff,
        shininess: 100
    }), // Material for the window glass
    clearSky: new THREE.MeshBasicMaterial({ map: TEXTURES.createWeatherTexture('clear') }), // Material for the clear sky
    cityscape: new THREE.MeshBasicMaterial({ map: TEXTURES.createCityWindowTexture(), transparent: true, opacity: 0 }), // Material for the cityscape
    cloudySky: new THREE.MeshBasicMaterial({ map: TEXTURES.createWeatherTexture('cloudy') }), // Material for the cloudy sky
    nightSky: new THREE.MeshBasicMaterial({ map: TEXTURES.createWeatherTexture('night') }), // Material for the night sky
    curtain: new THREE.MeshLambertMaterial({ color: 0x800000, side: THREE.DoubleSide }), // Material for the curtains

    // Engraved Key Materials
    homeKey: new THREE.MeshLambertMaterial({ map: TEXTURES.createKeyTexture('ABOUT') }),
    aboutKey: new THREE.MeshLambertMaterial({ map: TEXTURES.createKeyTexture('CONTACT') }),
    soundDesignKey: new THREE.MeshLambertMaterial({ map: TEXTURES.createKeyTexture('SOUND') }),
    musicKey: new THREE.MeshLambertMaterial({ map: TEXTURES.createKeyTexture('MUSIC') }),
    filmmakingKey: new THREE.MeshLambertMaterial({ map: TEXTURES.createKeyTexture('FILM') }),

    // Lit Key Materials
    homeKeyLit: new THREE.MeshLambertMaterial({ map: TEXTURES.createKeyTexture('ABOUT', true), emissiveMap: TEXTURES.createKeyTexture('ABOUT', true), emissive: 0x18e699, emissiveIntensity: 0.4 }),
    aboutKeyLit: new THREE.MeshLambertMaterial({ map: TEXTURES.createKeyTexture('CONTACT', true), emissiveMap: TEXTURES.createKeyTexture('CONTACT', true), emissive: 0x18e699, emissiveIntensity: 0.4 }),
    soundDesignKeyLit: new THREE.MeshLambertMaterial({ map: TEXTURES.createKeyTexture('SOUND', true), emissiveMap: TEXTURES.createKeyTexture('SOUND', true), emissive: 0x18e699, emissiveIntensity: 0.4 }),
    musicKeyLit: new THREE.MeshLambertMaterial({ map: TEXTURES.createKeyTexture('MUSIC', true), emissiveMap: TEXTURES.createKeyTexture('MUSIC', true), emissive: 0x18e699, emissiveIntensity: 0.4 }),
    filmmakingKeyLit: new THREE.MeshLambertMaterial({ map: TEXTURES.createKeyTexture('FILM', true), emissiveMap: TEXTURES.createKeyTexture('FILM', true), emissive: 0x18e699, emissiveIntensity: 0.4 }),
};

const colorBarsTexture = TEXTURES.createColorBarsTexture();
materials.screenOn = new THREE.MeshLambertMaterial({
    map: colorBarsTexture,
    emissiveMap: colorBarsTexture,
    emissive: 0xffffff,
    emissiveIntensity: 0.9,
    color: 0x000000
});
materials.screenOff = new THREE.MeshBasicMaterial({ color: 0x050505 });