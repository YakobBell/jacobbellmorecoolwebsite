// This file contains constants for scene configuration, object dimensions, audio settings, and piano key mappings.

// Scene rendering settings
export const SCENE_CONFIG = {
    FOV: 75,
    NEAR: 0.1,
    FAR: 1000,
    CLEAR_COLOR: 0x000000
};

// Desk dimensions and positioning
export const DESK_CONFIG = {
    WIDTH: 20,
    HEIGHT: 0.8,
    DEPTH: 12,
    Y_POSITION: -1.5
};

// Window dimensions and positioning
export const WINDOW_CONFIG = {
    WIDTH: 6,
    HEIGHT: 8,
    CENTER_X: -11,
    CENTER_Y: 5,
    FRAME_THICKNESS: 0.2
};

// Main wall dimensions and texture scaling
export const WALL_CONFIG = {
    TOTAL_WIDTH: 60,
    TOTAL_HEIGHT: 30,
    CENTER_X: 0,
    CENTER_Y: 5,
    TEXTURE_SCALE_X: 30 / 60,
    TEXTURE_SCALE_Y: 15 / 30
};

// Side wall dimensions and positioning
export const SIDE_WALL_CONFIG = {
    WIDTH: 16,
    HEIGHT: 30,
    X_POSITION: -15,
    Y_POSITION: 5,
    Z_POSITION: 0
};

// Ceiling dimensions and positioning
export const CEILING_CONFIG = {
    WIDTH: 60,
    DEPTH: 30,
    Y_POSITION: 18
};

// Audio settings for the synthesizer
export const AUDIO_CONFIG = {
    MASTER_VOLUME: 0.05,
    ATTACK_TIME: 0.01,
    RELEASE_TIME: 0.1,
    OSC_TYPE: 'square'
};

// Note frequencies for the piano
export const PIANO_NOTES = {
    'C2': 261.63, 'Db2': 277.18, 'D2': 293.66, 'Eb2': 311.13,
    'E2': 329.63, 'F2': 349.23, 'Gb2': 369.99, 'G2': 392.00,
    'Ab2': 415.30, 'A2': 440.00, 'Bb2': 466.16, 'B2': 493.88,
    'F#2': 369.99, 'G#2': 415.30, 'A#2': 466.16
};

// Keyboard to piano note mapping
export const KEY_MAPPING = {
    'a': 'C2', 'w': 'Db2', 's': 'D2', 'e': 'Eb2', 'd': 'E2',
    'f': 'F2', 't': 'Gb2', 'g': 'G2', 'y': 'Ab2', 'h': 'A2',
    'u': 'Bb2', 'j': 'B2',
    // Add mappings for black keys to ensure navigation works
    'w': 'Db2', 'e': 'Eb2', 't': 'Gb2', 'y': 'Ab2', 'u': 'Bb2'
};

// White piano key dimensions and properties
export const WHITE_KEY_CONFIG = {
    POSITIONS: [-3, -2, -1, 0, 1, 2, 3],
    NAMES: ['C2', 'D2', 'E2', 'F2', 'G2', 'A2', 'B2'],
    WIDTH: 0.9,
    HEIGHT: 0.6,
    DEPTH: 4.5
};

// Black piano key dimensions and properties
export const BLACK_KEY_CONFIG = {
    POSITIONS: [-2.5, -1.5, 0.5, 1.5, 2.5],
    NAMES: ['Db2', 'Eb2', 'Gb2', 'Ab2', 'Bb2', 'F#2', 'G#2', 'A#2'],
    WIDTH: 0.6,
    HEIGHT: 0.6,
    DEPTH: 2.5,
    Z_OFFSET: -1,
    Y_OFFSET: 0.3
};