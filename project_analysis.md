# Project Analysis and Overview

### **1. High-Level Concept**

This project is a highly creative and technically sophisticated interactive 3D portfolio website. It presents a virtual desktop scene with a 90s grunge/retro aesthetic, where the user can interact with various objects, most notably a piano keyboard and a CRT computer terminal. The terminal serves as the primary interface for navigating the portfolio's content, which includes sections for music, sound design, and personal information. The entire experience is designed to be immersive, blending 3D graphics, procedural animations, custom shaders, and a rich soundscape to create a unique and engaging user journey.

### **2. Core Technologies**

*   **Graphics:** The application is built on **Three.js**, a JavaScript library for creating and displaying 3D graphics in a web browser using WebGL.
*   **Physics:** **CANNON.js** is used for basic physics simulation, primarily to define static colliders for the floor and desk.
*   **Audio:** The project utilizes both the native **Web Audio API** for procedural sound synthesis (piano notes, UI sounds) and **Three.js's audio engine** for positional and streamed audio (ambient sounds, music tracks).
*   **Shaders:** Custom **GLSL** (OpenGL Shading Language) shaders are employed for post-processing effects, including a film grain filter and a "PS1-style" vertex wobble and color banding effect, which are crucial to the retro aesthetic.
*   **Architecture:** The codebase is written in modern JavaScript (ESM), using modules to separate concerns and maintain a clean, organized structure.

### **3. Architectural Breakdown**

The application follows a well-defined, modular architecture centered around a main `SceneManager` that orchestrates various specialized systems.

*   **Entry Point (`index.html`, `main.js`):**
    *   `index.html` sets up the webpage, includes all necessary libraries from CDNs, and defines the canvas and a hidden video element.
    *   `main.js` acts as the bootstrapper. It initializes the `SceneManager`, handles the initial loading screen and user interaction required to enable audio, and starts the main animation loop.

*   **The Core Engine (`src/core/`):**
    *   **`SceneManager.js`:** The heart of the application. It initializes the scene, renderer, camera, and all other managers. Its `update()` loop drives all animations, physics, and rendering for the entire application.
    *   **`Interaction.js`:** The central input hub. It captures all mouse, keyboard, and touch events and uses raycasting to translate them into meaningful actions within the 3D scene, such as playing a piano key, clicking a button, or interacting with the terminal.
    *   **`Terminal.js` & `ScreenManager.js`:** This pair forms the UI powerhouse.
        *   `ScreenManager` provides a 2D canvas as a texture.
        *   `Terminal` is a complex state machine that simulates a DOS-like operating system. It draws all its text, menus, and interactive UI elements (like the EP player) onto the `ScreenManager`'s canvas. It defines the entire content structure of the portfolio.
    *   **`Computer.js`:** A class that procedurally builds the 3D model of the CRT TV and its stand. It manages the TV's power state and the animation of the screen turning on and off. It's the object that displays the `ScreenManager`'s texture.
    *   **Managers & Factories (`lightingManager.js`, `sceneObjects.js`, `audioManager.js`, etc.):**
        *   The codebase makes excellent use of managers and factory functions to decouple object creation and state management from the main application logic.
        *   `sceneObjects.js` builds the room, furniture, and interactive objects.
        *   `lighting.js` and `lightingManager.js` create and control the scene's dynamic lighting.
        *   `audio.js` and `audioManager.js` handle ambient sounds, procedural effects, and the music player functionality.
        *   `textures.js` is a library for creating both procedural and loaded image textures.
        *   `shaders.js` loads and prepares the custom GLSL code for post-processing.

### **4. Key Features and How They Work**

*   **Interactive Piano:** The piano keys are individual 3D objects. The `interaction.js` module detects clicks or key presses, maps them to notes defined in `constants.js`, and triggers the `audio.js` module to generate the corresponding sound procedurally using the Web Audio API. The keys are visually animated to press down when played.

*   **CRT Terminal UI:** This is the core navigation system.
    1.  The `Terminal` class draws its text-based interface onto an off-screen canvas provided by `ScreenManager`.
    2.  This canvas is used as a texture on the 3D model of the computer screen created in `computer.js`.
    3.  When the user moves the mouse over the 3D screen, `interaction.js` raycasts the position, converts it to 2D coordinates on the texture, and passes them to the `Terminal`.
    4.  The `Terminal` then checks if these coordinates are over a clickable area (e.g., a menu item) and updates its canvas to show a hover effect.
    5.  A click triggers the `Terminal` to navigate to a new "page," redrawing the canvas with new content.

*   **Immersive Atmosphere:**
    *   **Lighting:** The scene uses a combination of spot lights and point lights to create a moody, atmospheric setting. The `LightingManager` fades the lights in at the start and controls effects like the lava lamp's glow.
    *   **Sound:** Positional audio is used for the rain, making it sound like it's coming from the window. UI sounds and a full music player (`AudioManager`) add to the immersion.
    *   **Visuals:** Post-processing shaders add a layer of film grain and a PS1-era wobble, cementing the retro feel. Procedural textures for rain splats and other details add life to the scene.

*   **Video Playback:** The `videoPlayer.js` module seamlessly integrates a DOM `<video>` element into the 3D scene. When triggered, it swaps the terminal's canvas texture on the computer screen with a `VideoTexture`, fades out the ambient audio to prevent clashes, and plays the video. When the video ends, it restores the original texture and audio levels.

### **5. Project Structure Summary**

*   **`/` (Root):** Contains the main HTML entry point, the primary JavaScript bootstrapper (`main.js`), and the main stylesheet.
*   **`src/`:** The main source code directory, containing the entire application logic.
    *   **`src/core/`:** The core engine, containing all the managers, factories, and classes that drive the application.
    *   **`src/audio/`:** Modules specifically for handling audio.
    *   **`src/core/shaders/`:** The GLSL shader files.
*   **`public/`:** All static assets, including images, textures, and audio files, organized by type.
*   **`modules/`:** An empty or deprecated directory; all relevant logic has been consolidated into the `src/` directory.