import * as THREE from 'three';
import { playTypingSound } from '../audio/audio.js';
import { AudioManager } from '../audio/audioManager.js';

/**
 * Represents a single page of text in the terminal.
 */
class TextPage {
    /**
     * @param {string[]} text - An array of strings, where each string is a line of text.
     * @param {AudioContext} audioContext - The global audio context.
     * @param {string} [color='#0f0'] - The color of the text.
     */
    constructor(text, audioContext, color = '#18e699') {
        this.fullText = text;
        this.audioContext = audioContext;
        this.color = color;
        this.lines = [""];
        this.typingTimer = 0;
        this.currentLine = 0;
        this.currentChar = 0;
        this.isFinished = false;
        this.scrollTop = 0;
    }

    /**
     * Updates the typing animation for the page.
     * @param {number} deltaTime - The time delta since the last frame.
     * @param {number} typingSpeed - The speed at which to type.
     */
    update(deltaTime, typingSpeed) {
        if (this.isFinished) return;

        this.typingTimer += deltaTime;
        // Use a faster, consistent speed for line-by-line reveal
        if (this.typingTimer >= 0.05) {
            this.typingTimer = 0;

            if (this.currentLine < this.fullText.length) {
                // Reveal the whole line at once
                this.lines[this.currentLine] = this.fullText[this.currentLine];
                
                if (this.audioContext) {
                    playTypingSound(this.audioContext);
                }

                this.currentLine++;
                if (this.currentLine < this.fullText.length) {
                    this.lines.push("");
                }
            } else {
                this.isFinished = true;
            }
        }
    }

    /**
     * Resets the page to its initial state.
     */
    reset() {
        this.lines = [""];
        this.typingTimer = 0;
        this.currentLine = 0;
        this.currentChar = 0;
        this.isFinished = false;
        this.scrollTop = 0;
    }
}

class HomePage extends TextPage {
    constructor(text, audioContext, color = '#18e699', terminal) {
        super(text, audioContext, color);
        this.terminal = terminal;
        this.isFinished = true; // No typing animation for home page
        this.wrappedLines = [];
        this.needsWrapping = true;
    }

    update() {
        if (this.needsWrapping && this.terminal.ctx) {
            this.wrappedLines = [];
            const maxWidth = this.terminal.screenManager.width - 20; // 10px margin on each side
            this.fullText.forEach(line => {
                this.wrappedLines.push(...this.terminal._wrapText(line, maxWidth));
            });
            // Update the lines used for rendering and scrolling
            this.lines = this.wrappedLines;
            this.fullText = this.wrappedLines;
            this.needsWrapping = false;
        }
        this.isFinished = true;
    }

    reset() {
        super.reset();
        this.needsWrapping = true;
    }
}

/**
 * Represents a page that displays a list of projects.
 */
export class ProjectPage extends TextPage {
    /**
     * @param {string} title - The title of the project page.
     * @param {object[]} projects - An array of project objects.
     * @param {AudioContext} audioContext - The global audio context.
     * @param {string} color - The color of the text.
     */
    constructor(title, projects, audioContext, color) {
        const projectLines = [`${title}:`, ...projects.map((p, i) => `${i + 1}. ${p.title}`)];
        super(projectLines, audioContext, color);
        this.projects = projects;
        this.selectedProject = null;
    }

    /**
     * Resets the project page to its initial state.
     */
    reset() {
        super.reset();
        this.selectedProject = null;
    }

    /**
     * Selects a project and displays its details.
     * @param {number} index - The index of the project to select.
     */
    selectProject(index) {
        if (index >= 0 && index < this.projects.length) {
            this.selectedProject = this.projects[index];
            // When a project is selected, we can treat it as a new TextPage
            this.fullText = [this.selectedProject.title, '', this.selectedProject.description, '', '> Press any black key to go back'];
            this.reset();
        }
    }
}

/**
 * Represents a page that displays an EP audio player.
 */
class EpPlayerPage extends TextPage {
    constructor(audioContext, audioManager, albumArt, color = '#18e699') {
        super(['Loading...'], audioContext, color);
        this.audioManager = audioManager;
        this.albumArt = albumArt;
        this.tracks = [];
        this.playerState = {
            isPlaying: false,
            trackName: 'No Track',
            currentTime: 0,
            duration: 0,
            progress: 0,
            currentTrackIndex: 0
        };
        this.isDirty = false;

        this.audioManager.onTrackUpdate = this.updatePlayerState.bind(this);
    }

    async load(tracklist) {
        try {
            this.tracks = await this.audioManager.loadTracks(tracklist);
            this.updatePlayerState({
                ...this.playerState,
                trackName: this.tracks[0]?.name || 'No Track',
                duration: this.tracks[0]?.buffer.duration || 0,
            });
            this.isFinished = true;
        } catch (error) {
            this.fullText = ['Error loading tracks.'];
            this.isFinished = true;
        }
        this.reset();
    }

    updatePlayerState(newState) {
        const wasFinished = this.isFinished && this.lines.length > 1;
        this.isDirty = true;
        this.playerState = { ...this.playerState, ...newState };

        if (wasFinished && newState.progress > 0) {
            // If the page is already rendered and we are just updating the progress, only update the dynamic lines
            const newLines = this.generatePlayerText();
            const playPauseLineIndex = this.albumArt.length + 2;
            const progressBarLineIndex = this.albumArt.length + 3;

            this.lines[playPauseLineIndex] = newLines[playPauseLineIndex];
            this.lines[progressBarLineIndex] = newLines[progressBarLineIndex];
        } else {
            this.fullText = this.generatePlayerText();
            this.lines = [...this.fullText];
            this.isFinished = true;
        }
    }

    generatePlayerText() {
        const { isPlaying, trackName, currentTime, duration, progress } = this.playerState;
        const currentTrackIndex = this.audioManager.tracks.indexOf(this.audioManager.currentTrack);
        const text = [...this.albumArt, ''];
        text.push(`${trackName}`);
        
        const progressBarLength = 25;
        const filled = Math.floor(progress * progressBarLength);
        const empty = progressBarLength - filled;
        const time = `${this.formatTime(currentTime)} / ${this.formatTime(duration)}`;
        text.push(`[${'='.repeat(filled)}${'-'.repeat(empty)}] ${time}`);
        
        const controls = `<<<   ${isPlaying ? '||' : '>'}   >>>`;
        text.push(controls);
        text.push('');

        this.tracks.forEach((track, index) => {
            const prefix = index === currentTrackIndex ? '> ' : '  ';
            text.push(`${prefix}${index + 1}. ${track.name}`);
        });
        text.push('');
        text.push('> Press any black key to go back');
        return text;
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    }

    reset() {
        super.reset();
        if (this.isFinished) {
            this.lines = [...this.fullText];
        }
    }
}

class SoundtracksPlayerPage extends EpPlayerPage {
   constructor(audioContext, audioManager, albumArt, color = '#18e699') {
       super(audioContext, audioManager, albumArt, color);
   }
}

class AsciiArtPage extends ProjectPage {
    constructor(asciiArt, projects, audioContext, color) {
        // Pass a placeholder title to the parent, it won't be displayed.
        super('', projects, audioContext, color);
        this.asciiArt = asciiArt;
        // The full text for the typing animation will be the ASCII art, a blank line, and then the projects.
        // The full text for the typing animation will be the main ASCII art, a blank line,
        // and then placeholders for each project to trigger the animation steps.
        this.fullText = [
            ...this.asciiArt,
            '',
            ...projects.map(p => p.title[0]) // Use the first line of each project's ASCII as a placeholder
        ];
    }

    update(deltaTime, typingSpeed) {
        if (this.isFinished) return;

        // Only apply line-by-line animation to the ASCII art part
        if (this.currentLine < this.asciiArt.length) {
            this.typingTimer += deltaTime;
            if (this.typingTimer >= 0.05) { // 50ms delay between lines
                this.typingTimer = 0;
                // Reveal the whole line at once
                this.lines[this.currentLine] = this.fullText[this.currentLine];
                this.currentChar = this.fullText[this.currentLine].length; // Skip to end of line
                
                if (this.audioContext) {
                    playTypingSound(this.audioContext);
                }

                this.currentLine++;
                if (this.currentLine < this.fullText.length) {
                    this.lines.push("");
                } else {
                    this.isFinished = true;
                }
            }
        } else {
            // For projects list, use the default typing animation
            super.update(deltaTime, typingSpeed * 4);
        }
    }
}

class FormState {
    constructor() {
        this.subject = '';
        this.email = '';
        this.message = '';
        this.activeField = 'subject'; // 'subject', 'email', or 'message'
        this.scrollOffset = 0;
    }

    reset() {
        this.subject = '';
        this.email = '';
        this.message = '';
        this.activeField = 'subject';
        this.scrollOffset = 0;
    }
}

class ContactPage extends TextPage {
    constructor(audioContext, formState, color = '#18e699') {
        // Initialize with enough lines to represent the form layout for scrolling purposes
        super(['CONTACT:', '', '', '', '', '', '', '', '', '', '', '', ''], audioContext, color);
        this.formState = formState;
        this.isFinished = true; // No typing animation for the form itself
    }

    reset() {
        // Only reset the visual scroll, not the form data itself
        this.scrollTop = 0;
        this.formState.scrollOffset = 0;
    }

    update() {
        // No automatic typing for this page
        this.isFinished = true;
    }
}

class CvPage extends TextPage {
    constructor(title, content, audioContext, color) {
        // We pass a simplified text array to the parent for scroll calculation purposes.
        const simpleText = content.flatMap(job => [job.title, job.company, ...job.desc.split(' '), '']);
        super([title, '', ...simpleText, '> Press any black key to go back'], audioContext, color);
        this.cvContent = content;
        this.isFinished = true; // No typing animation for this page type.
    }

    // Override the update method to prevent the default typing animation
    update(deltaTime, typingSpeed) {
        this.isFinished = true;
    }
}

/**
 * Manages the terminal display, including booting, navigation, and rendering text.
 */
export class Terminal {
    /**
     * @param {ScreenManager} screenManager - The screen manager for the terminal's display.
     * @param {AudioContext} audioContext - The global audio context.
     */
    constructor(screenManager, audioContext) {
        this.screenManager = screenManager;
        this.ctx = screenManager.getContext();
        this.audioContext = audioContext;
        this.typingSpeed = 0.01;
        this.showCursor = true;
        this.blinkTimer = 0;
        this.isDirty = true;
        this.hoveredProjectIndex = -1;
        this.clickableAreas = [];
        this.mousePosition = { x: -1, y: -1 };

        // Initialize Three.js audio components for the EP player
        this.audioListener = new THREE.AudioListener();
        this.audioManager = new AudioManager(this.audioListener);
        this.formState = new FormState();

        this.state = 'idle'; // idle, booting, welcome, running, transition
        this.transitionTimer = 0;
        this.transitionDuration = 0.2; // seconds
        this.nextPage = null;

        this.bootTimer = 0;
        this.bootDuration = 5; // seconds
        this.welcomeFade = 0;
        this.bootMessages = [
            'Initializing JBS-DOS...',
            'Memory check: 640KB OK',
            'Loading drivers...',
            'Checking for floppy disk...',
            '...'
        ];

        this._createPages();
        this.activeApp = this.pages['home'];
    }

    _createPages() {
        const experienceContent = [
            {
                title: 'Kingdom Of Saudi Arabia VR Experience (2025)',
                company: 'Expo 2025 Osaka',
                desc: 'Designed and implemented the sound for this virtual reality experience. From its mythical history to its exotic aquatic life, the sound was integral in transporting the player through Saudi Arabia’s rich culture (Unity).'
            },
            {
                title: 'Locker Room VR (2024)',
                company: 'Electric Skies',
                desc: 'Designed an immersive audio experience for the player as they play as Muhammed Ali moments before his historic George Foreman fight (Unreal Engine 5).'
            },
            {
                title: 'Level Up Your Game (2024)',
                company: 'VISA',
                desc: 'Designed sounds for an arcade-inspired endless runner mobile game featuring Paralympian Johnny Peacock for VISA’s Paris 2024 Olympics campaign (Unity).'
            },
            {
                title: 'Sleep Swimmer (2024 - present)',
                company: 'Beyond Tomorrow Studios',
                desc: 'Working on a cozy 2D adventure puzzle game where sound and music is central to its premise (Unity).'
            },
            {
                title: 'Room (2022)',
                company: 'Spiral Eye Studios',
                desc: 'Wrote & directed a short psychological horror film for my final year at university.'
            }
        ];

        this.pages = {
            'home': new HomePage([
                'This website is a portfolio of my creative work, a testament to my belief that creative vision is the most important skill an artist can possess.',
                'I am a jack-of-all-trades, and this portfolio is a demonstration of my ability to apply a strong creative vision to a variety of mediums.',
                '',
                '> Use the black keys on the MIDI keyboard to navigate through the various pages of this website.'
            ], this.audioContext, '#18e699', this),
            'music': new ProjectPage('MUSIC', [
                { title: 'EP', page: 'ep-page' },
                { title: 'Soundtracks', page: 'soundtracks-page' },
                { title: 'Experiments', page: 'experiments-page' },
            ], this.audioContext, '#18e699'),
            'sound-design': new ProjectPage('SOUND DESIGN', [
                {
                    title: 'Showreel',
                    description: 'A showcase of my sound design work for various projects.',
                    url: 'https://res.cloudinary.com/dyla4ggyb/video/upload/v1757427950/sound_design_showreel_2025_-_jacob_bellmore_720p_trca0k.mp4'
                },
                {
                    title: 'Experience',
                    page: 'experience'
                },
                {
                    title: 'Experiments',
                    page: 'sound-design-experiments'
                }
            ], this.audioContext, '#18e699'),
            'sound-design-experiments': new TextPage([
                'SOUND DESIGN EXPERIMENTS:',
                '',
                'This page is under construction.',
                '',
                '> Press any black key to go back',
            ], this.audioContext, '#18e699'),
            'experience': new CvPage('EXPERIENCE', experienceContent, this.audioContext, '#18e699'),
            'about': new ContactPage(this.audioContext, this.formState, '#18e699'),
            'skills': new TextPage([
                'SKILLS:',
                'JS, Python, C++, GLSL,',
                'Three.js, React, Node.js',
            ], this.audioContext, '#18e699'),
            'contact': new TextPage([
                'CONTACT:',
                'Find me on GitHub,',
                'LinkedIn, or by email.',
            ], this.audioContext, '#18e699'),
            'films': new ProjectPage('FILMS', [
                { title: 'Short Films', page: 'short-films-page' },
                { title: 'Corporate Work', page: 'corporate-work-page' },
                { title: 'Experience', page: 'filmmaking-experience-page' },
            ], this.audioContext, '#18e699'),
            'short-films-page': new ProjectPage('SHORT FILMS', [
                {
                    title: 'ROOM (2021)',
                    description: 'Award-winning short psychological thriller film.',
                    url: 'https://res.cloudinary.com/dyla4ggyb/video/upload/v1761412825/ROOM_Award_Winning_Short_Psychological_Thriller_Film_2021_x2jga5.mp4'
                },
                {
                    title: 'The Taste of Love (2019)',
                    description: 'A short film about love and food.',
                    url: 'https://res.cloudinary.com/dyla4ggyb/video/upload/v1761578225/The_Taste_of_Love_jourj9.mp4'
                },
                {
                    title: 'The Tide Rises, The Tide Falls (2016)',
                    description: 'An experimental short film.',
                    url: 'https://res.cloudinary.com/dyla4ggyb/video/upload/v1761578203/The_tide_rises_the_tide_falls_-_Art_A_Level_short_film_hoxkh4.mp4'
                }
            ], this.audioContext, '#18e699'),
            'corporate-work-page': new TextPage([
                'CORPORATE WORK:',
                '',
                'Placeholder for corporate work.',
                '',
                '> Press any black key to go back',
            ], this.audioContext, '#18e699'),
            'filmmaking-experience-page': new TextPage([
                'FILMMAKING EXPERIENCE:',
                '',
                'Placeholder for filmmaking experience.',
                '',
                '> Press any black key to go back',
            ], this.audioContext, '#18e699'),
            'ep-page': new EpPlayerPage(
                this.audioContext,
                this.audioManager,
                [
                    '  _.-._',
                    ' /_._._\\',
                    '| ( ) |',
                    ' \\_._._/',
                    '  `-.-`'
                ],
                '#18e699'
            ),
            'soundtracks-page': new SoundtracksPlayerPage(
               this.audioContext,
               this.audioManager,
               [
                   '  _.-._',
                   ' /_._._\\',
                   '| ( ) |',
                   ' \\_._._/',
                   '  `-.-`'
               ],
               '#18e699'
           ),
            'experiments-page': new TextPage([
                'EXPERIMENTS:',
                '',
                'This is the Experiments page. Press any black key to go back.',
            ], this.audioContext, '#18e699'),
        };
    }

    /**
     * Starts the boot sequence animation.
     */
    startBootSequence() {
        this.state = 'booting';
        this.bootTimer = 0;
        this.isDirty = true;
    }

    /**
     * Starts a countdown animation.
     * @param {function} callback - The function to call when the countdown finishes.
     */
    startCountdown(callback) {
        this.state = 'countdown';
        let count = 3;
        let animationFrameId;

        const animateNumber = (number) => {
            let startTime = performance.now();
            const duration = 1000; // 1 second per number

            const glitchChars = '█▓▒░';
            const glitchDuration = 150; // ms

            const frame = (currentTime) => {
                const elapsedTime = currentTime - startTime;
                const progress = Math.min(elapsedTime / (duration - glitchDuration), 1);

                this.screenManager.clear();
                const ctx = this.ctx;

                // --- Glitch Effect ---
                if (elapsedTime < glitchDuration) {
                    ctx.fillStyle = `rgba(0, 255, 0, ${Math.random() * 0.5})`;
                    for (let i = 0; i < 20; i++) {
                        const x = Math.random() * this.screenManager.width;
                        const y = Math.random() * this.screenManager.height;
                        const size = Math.random() * 50 + 10;
                        ctx.font = `${size}px "BitcountGridSingle-Regular", monospace`;
                        ctx.fillText(glitchChars[Math.floor(Math.random() * glitchChars.length)], x, y);
                    }
                } else {
                    // --- Scaling and Fading Effect ---
                    const scale = 1 + (1 - progress) * 2; // Start big and shrink
                    const opacity = Math.max(0, 1 - (progress * progress)); // Fade out
                    const fontSize = 150 * scale;
                    
                    ctx.font = `${fontSize}px "BitcountGridSingle-Regular", monospace`;
                    ctx.fillStyle = `rgba(0, 255, 0, ${opacity})`;
                    
                    const text = String(number);
                    const textWidth = ctx.measureText(text).width;
                    ctx.textBaseline = 'middle'; // Align text vertically to its center
                    ctx.fillText(text, this.screenManager.width / 2, this.screenManager.height / 2);
                    ctx.textBaseline = 'top'; // Reset to default
                }

                // --- Flicker and Scanline Effect ---
                if (Math.random() > 0.8) {
                    ctx.fillStyle = `rgba(0, 0, 0, ${Math.random() * 0.3})`;
                    ctx.fillRect(0, Math.random() * this.screenManager.height, this.screenManager.width, Math.random() * 3);
                }
                ctx.fillStyle = `rgba(255, 255, 255, 0.05)`;
                for (let i = 0; i < this.screenManager.height; i += 4) {
                    ctx.fillRect(0, i, this.screenManager.width, 1);
                }


                this.screenManager.updateTexture();

                if (elapsedTime < duration) {
                    animationFrameId = requestAnimationFrame(frame);
                } else {
                    count--;
                    if (count > 0) {
                        animateNumber(count);
                    } else {
                        cancelAnimationFrame(animationFrameId);
                        callback();
                    }
                }
            };

            animationFrameId = requestAnimationFrame(frame);
        };

        animateNumber(count);
    }

    /**
     * Navigates to a different page in the terminal.
     * @param {string} page - The key of the page to navigate to.
     * @param {object} [options] - Additional options for navigation.
     */
    navigateTo(page, options) {
        if (this.pages[page] && this.state !== 'transition') {
            this.state = 'transition';
            this.transitionTimer = 0;
            this.nextPage = page;
            this.isDirty = true;
        }
    }

    _performNavigation() {
        const page = this.nextPage;
        if (this.pages[page]) {
            if (this.activeApp instanceof EpPlayerPage && page !== 'ep-page') {
                this.audioManager.stop();
            }
            const previousApp = this.activeApp;
            this.activeApp = this.pages[page];

            // Reset the new page, unless we are navigating away from the contact page
            // or back to it, in which case we want to preserve the form state.
            if (!(previousApp instanceof ContactPage && this.pages[page] !== this.pages['about']) &&
                !(this.activeApp instanceof ContactPage)) {
                this.activeApp.reset();
            }

           if (this.activeApp instanceof SoundtracksPlayerPage) {
               const tracklist = [
                   { name: 'Chamomile Early', url: 'https://res.cloudinary.com/dyla4ggyb/video/upload/v1761573228/Chamomile_early_jit5je.mp3' },
                   { name: 'Gyokoro Demo', url: 'https://res.cloudinary.com/dyla4ggyb/video/upload/v1761572986/Gyokoro_Demo_d8iiuh.mp3' },
                   { name: 'Project 16', url: 'https://res.cloudinary.com/dyla4ggyb/video/upload/v1761572984/Project_16_-_Master_Mix_Test_jqnv5o.mp3' },
                   { name: 'Project 50', url: 'https://res.cloudinary.com/dyla4ggyb/video/upload/v1761572982/Project_50_-_1st_MIX_MASTER_tczyq4.mp3' },
                   { name: 'Storming The Castle', url: 'https://res.cloudinary.com/dyla4ggyb/video/upload/v1761566247/Storming_The_Castle_u6youl.mp3' },
                   { name: 'Supercell', url: 'https://res.cloudinary.com/dyla4ggyb/video/upload/v1761566248/Supercell_ixs4jx.mp3' },
                   { name: 'Skirmish', url: 'https://res.cloudinary.com/dyla4ggyb/video/upload/v1761566246/Skirmish_mroq55.mp3' },
                   { name: 'Riposte', url: 'https://res.cloudinary.com/dyla4ggyb/video/upload/v1761566244/Riposte_xu7fgq.mp3' },
                   { name: 'Pensive Reflections', url: 'https://res.cloudinary.com/dyla4ggyb/video/upload/v1761566243/Pensive_Reflections_brnhrv.mp3' },
                   { name: 'Inner Demons', url: 'https://res.cloudinary.com/dyla4ggyb/video/upload/v1761566242/Inner_Demons_q0tplf.mp3' },
                   { name: 'Hells Gates', url: 'https://res.cloudinary.com/dyla4ggyb/video/upload/v1761566241/Hell_s_Gates_sj4rcj.mp3' },
                   { name: 'Emergence', url: 'https://res.cloudinary.com/dyla4ggyb/video/upload/v1761566240/Emergence_pxcl59.mp3' },
                   { name: 'Battle In The Sky', url: 'https://res.cloudinary.com/dyla4ggyb/video/upload/v1761566239/Battle_In_The_Sky_qguy4q.mp3' }
               ];
               this.activeApp.load(tracklist);
           } else if (this.activeApp instanceof EpPlayerPage) {
               const tracklist = [
                   { name: 'Ivory', url: 'https://res.cloudinary.com/dyla4ggyb/video/upload/v1760552704/1._Ivory_mkjvog.mp3' },
                   { name: 'Branches', url: 'https://res.cloudinary.com/dyla4ggyb/video/upload/v1760552705/2._Branches_kaywis.mp3' },
                   { name: 'Aimless Flame', url: 'https://res.cloudinary.com/dyla4ggyb/video/upload/v1760553035/3._Aimless_Flame_wkeyzq.mp3' },
                   { name: 'Golden Thread', url: 'https://res.cloudinary.com/dyla4ggyb/video/upload/v1760553036/4._Golden_Thread_a2strq.mp3' },
                   { name: 'Wastemanland', url: 'https://res.cloudinary.com/dyla4ggyb/video/upload/v1760552704/5._Wastemanland_cjwdq0.mp3' },
                   { name: 'Redeeming Qualities', url: 'https://res.cloudinary.com/dyla4ggyb/video/upload/v1760552706/6._Redeeming_Qualities_ypfryo.mp3' },
                   { name: 'Darling', url: 'https://res.cloudinary.com/dyla4ggyb/video/upload/v1760552705/7._Darling_x4jnbq.mp3' },
               ];
               this.activeApp.load(tracklist);
           }
            if (this.activeApp instanceof ProjectPage) {
            }
            if (page === 'projects' && options && options.projectIndex !== undefined) {
                this.activeApp.selectProject(options.projectIndex);
            }
            this.isDirty = true;
        }
    }

    /**
     * Updates the terminal's state and animations.
     * @param {number} deltaTime - The time delta since the last frame.
     */
    update(deltaTime) {
        this.blinkTimer += deltaTime;
        if (this.blinkTimer > 0.5) {
            this.showCursor = !this.showCursor;
            this.blinkTimer = 0;
            if (!(this.activeApp instanceof EpPlayerPage)) {
                this.isDirty = true;
            }
        }

        if (this.state === 'booting') {
            this.bootTimer += deltaTime;
            if (this.bootTimer >= this.bootDuration) {
                this.state = 'welcome';
                this.bootTimer = 0;
                this.isDirty = true;
            }
        } else if (this.state === 'welcome') {
            this.bootTimer += deltaTime;
            this.welcomeFade = Math.min(1, this.bootTimer / 1.5);
            if (this.bootTimer >= 2.5) {
                this.state = 'running';
                this._performNavigation('home'); // Use internal navigation to set home page
                this.isDirty = true;
            }
        } else if (this.state === 'transition') {
            this.transitionTimer += deltaTime;
            this.isDirty = true;
            if (this.transitionTimer >= this.transitionDuration) {
                this.state = 'running';
                this._performNavigation();
            }
        } else if (this.state === 'running') {
            const wasFinished = this.activeApp.isFinished;
            if (this.activeApp.update) {
                const speed = this.activeApp instanceof AsciiArtPage ? this.typingSpeed / 4 : this.typingSpeed;
                this.activeApp.update(deltaTime, speed);
            }
            if (!wasFinished || !this.activeApp.isFinished) {
                this.isDirty = true;
            }
        }

        if (this.isDirty || (this.activeApp instanceof EpPlayerPage && this.activeApp.isDirty)) {
            this.draw();
            this.screenManager.updateTexture();
        }

        if (this.isDirty) {
            this.isDirty = false;
        }
        this.updateHover();
    }

    /**
     * Updates the hover state of clickable areas in the terminal.
     * @private
     */
    updateHover() {
        if (this.activeApp instanceof ProjectPage) {
            let hoveredIndex = -1;
            if (this.activeApp.clickableAreas) {
                for (const area of this.activeApp.clickableAreas) {
                    if (this.mousePosition.y > area.y && this.mousePosition.y < area.y + area.height &&
                        this.mousePosition.x > area.x && this.mousePosition.x < area.x + area.width
                    ) {
                        hoveredIndex = area.projectIndex;
                        break;
                    }
                }
            }

            if (hoveredIndex !== this.hoveredProjectIndex) {
                this.hoveredProjectIndex = hoveredIndex;
                this.isDirty = true;
            }
        } else if (this.activeApp instanceof EpPlayerPage) {
            let hoveredIndex = -1;
            if (this.activeApp.clickableAreas) {
                for (const area of this.activeApp.clickableAreas) {
                    if (this.mousePosition.y > area.y && this.mousePosition.y < area.y + area.height &&
                        this.mousePosition.x > area.x && this.mousePosition.x < area.x + area.width
                    ) {
                        if (area.action === 'previousTrack') {
                            hoveredIndex = -3; // Special index for previous button
                        } else if (area.action === 'togglePlayPause') {
                            hoveredIndex = -2; // Special index for play/pause
                        } else if (area.action === 'nextTrack') {
                            hoveredIndex = -4; // Special index for next button
                        } else if (area.action === 'selectTrack') {
                            hoveredIndex = area.trackIndex;
                        } else if (area.action === 'seek') {
                            hoveredIndex = -5; // Special index for seek bar
                        }
                        break;
                    }
                }
            }

            if (hoveredIndex !== this.hoveredProjectIndex) {
                this.hoveredProjectIndex = hoveredIndex;
                this.isDirty = true;
            }
        }
    }

    /**
     * Draws the current state of the terminal to the canvas.
     * @private
     */
    draw() {
        if (this.isDirty) {
            this.screenManager.clear();
        } else if (this.activeApp instanceof EpPlayerPage && this.activeApp.isDirty) {
            // Don't clear the whole screen, just the parts that change
        } else {
            // Nothing to do
            return;
        }

        this.ctx.font = '20px "BitcountGridSingle-Regular", monospace';
        this.ctx.textBaseline = 'top';

        switch (this.state) {
            case 'booting':
                this._drawBootScreen();
                break;
            case 'welcome':
                this._drawWelcomeScreen();
                break;
            case 'transition':
                this._drawTransitionEffect();
                break;
            case 'running':
               if (this.activeApp instanceof AsciiArtPage) {
                   this._drawAsciiArtPage();
               } else if (this.activeApp instanceof ContactPage) {
                    this._drawContactPage();
               } else if (this.activeApp instanceof CvPage) {
                    this._drawCvPage();
               } else {
                   this._drawRunningScreen();
               }
               break;
        }

        this.drawCursor();
    }

    _drawBootScreen() {
        const lineHeight = 24;
        const margin = 10;
        const viewHeight = this.screenManager.height - margin * 2;

        this.ctx.fillStyle = '#18e699';
        const progress = this.bootTimer / this.bootDuration;
        const linesToShow = Math.floor(progress * this.bootMessages.length);
        for (let i = 0; i < linesToShow; i++) {
            this.ctx.fillText(this.bootMessages[i].toUpperCase(), margin, margin + i * lineHeight);
        }

        if (Math.random() > 0.95) {
            this.ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.5})`;
            this.ctx.fillRect(0, Math.random() * viewHeight, this.screenManager.width, Math.random() * 20);
        }
    }

    _drawWelcomeScreen() {
        this.ctx.fillStyle = `rgba(255, 255, 255, ${this.welcomeFade})`;
        const welcomeText = 'Welcome to JBS-DOS';
        const textWidth = this.ctx.measureText(welcomeText).width;
        this.ctx.fillText(welcomeText.toUpperCase(), (this.screenManager.width - textWidth) / 2, this.screenManager.height / 2);
    }

    _drawRunningScreen() {
        if (this.activeApp instanceof EpPlayerPage && this.activeApp.isDirty && !this.isDirty) {
            this._redrawPlayerControls();
            this.activeApp.isDirty = false;
            return;
        }
        const lineHeight = 24;
        const margin = 10;
        const viewHeight = this.screenManager.height - margin * 2;
        const app = this.activeApp;
        this.ctx.fillStyle = app.color;
        const contentHeight = app.fullText.length * lineHeight;
        const firstVisibleLine = Math.floor(app.scrollTop / lineHeight);
        const lastVisibleLine = Math.min(app.lines.length - 1, Math.ceil((app.scrollTop + viewHeight) / lineHeight));
        if (app instanceof ProjectPage || app instanceof EpPlayerPage) {
            app.clickableAreas = [];
        }

        for (let i = firstVisibleLine; i <= lastVisibleLine; i++) {
            let line = app.lines[i];
            if (i === app.currentLine && !app.isFinished && this.showCursor) {
                line += '_';
            }

            const projectIndex = i - 1;
            const isEpPlayer = app instanceof EpPlayerPage;
            const tracklistStartIndex = isEpPlayer ? app.albumArt.length + 5 : -1;
            const trackIndex = i - tracklistStartIndex;

            let originalColor = app.color;
            let isHovered = false;

            if (isEpPlayer) {
                const controlsLineIndex = app.albumArt.length + 3;
                if (i === controlsLineIndex && (this.hoveredProjectIndex === -2 || this.hoveredProjectIndex === -3 || this.hoveredProjectIndex === -4)) {
                    isHovered = true;
                } else if (i >= tracklistStartIndex && trackIndex === this.hoveredProjectIndex) {
                    isHovered = true;
                }
                const currentTrackIndex = this.audioManager.tracks.indexOf(this.audioManager.currentTrack);
                if (i >= tracklistStartIndex && trackIndex === currentTrackIndex) {
                    originalColor = lightenColor(app.color, 50);
                }
            } else if (app instanceof ProjectPage && projectIndex >= 0 && projectIndex < app.projects.length) {
                if (projectIndex === this.hoveredProjectIndex) {
                    isHovered = true;
                }
            }

            if (isHovered) {
                this.ctx.fillStyle = 'rgba(0, 255, 255, 0.2)';
                // Custom highlighting for player controls
                if (isEpPlayer && i === app.albumArt.length + 3) {
                    const controls = `<<<   ${app.playerState.isPlaying ? '||' : '>'}   >>>`;
                    const totalWidth = this.ctx.measureText(controls).width;
                    const startX = (this.screenManager.width - totalWidth) / 2;
                    
                    let buttonX = 0;
                    let buttonWidth = 0;

                    if (this.hoveredProjectIndex === -3) { // Prev
                        buttonX = startX;
                        buttonWidth = this.ctx.measureText('<<<').width;
                    } else if (this.hoveredProjectIndex === -2) { // Play/Pause
                        buttonX = startX + this.ctx.measureText('<<<   ').width;
                        buttonWidth = this.ctx.measureText(app.playerState.isPlaying ? '||' : '>').width;
                    } else if (this.hoveredProjectIndex === -4) { // Next
                        buttonX = startX + this.ctx.measureText('<<<   ' + (app.playerState.isPlaying ? '||' : '>') + '   ').width;
                        buttonWidth = this.ctx.measureText('>>>').width;
                    }
                    this.ctx.fillRect(buttonX, margin + i * lineHeight - app.scrollTop - 2, buttonWidth, lineHeight);

                } else {
                     this.ctx.fillRect(0, margin + i * lineHeight - app.scrollTop - 2, this.screenManager.width, lineHeight);
                }
                this.ctx.fillStyle = lightenColor(originalColor, 50);
            } else if (line.startsWith('>') || line.startsWith('*')) {
                this.ctx.fillStyle = '#18e699'; // Yellow for prompts and borders
            } else if (line.endsWith(':')) {
                this.ctx.fillStyle = '#18e699'; // Cyan for headers
            } else {
                this.ctx.fillStyle = originalColor;
            }

            if (app instanceof HomePage || app instanceof ProjectPage || app instanceof EpPlayerPage) {
                this.ctx.textAlign = 'center';
                if (isEpPlayer && i === app.albumArt.length + 3) {
                    const playPauseIcon = app.playerState.isPlaying ? '▐▐' : '▶';
                    const prevIcon = '⏮';
                    const nextIcon = '⏭';
                    const spacing = 40; // Pixels between the centers of icons

                    // Center X position
                    const centerX = this.screenManager.width / 2;

                    // --- Draw Icons ---
                    // Play/Pause (Center)
                    this.ctx.font = 'bold 20px "BitcountGridSingle-Regular", monospace';
                    const playPauseWidth = this.ctx.measureText(playPauseIcon).width;
                    const playPauseX = centerX - playPauseWidth / 2;
                    this.ctx.fillText(playPauseIcon.toUpperCase(), playPauseX, margin + i * lineHeight - app.scrollTop);

                    // Previous
                    this.ctx.font = '20px "BitcountGridSingle-Regular", monospace';
                    const prevWidth = this.ctx.measureText(prevIcon).width;
                    const prevX = centerX - spacing - prevWidth / 2;
                    this.ctx.fillText(prevIcon.toUpperCase(), prevX, margin + i * lineHeight - app.scrollTop);

                    // Next
                    const nextWidth = this.ctx.measureText(nextIcon).width;
                    const nextX = centerX + spacing - nextWidth / 2;
                    this.ctx.fillText(nextIcon.toUpperCase(), nextX, margin + i * lineHeight - app.scrollTop);

                } else {
                    this.ctx.fillText(line.toUpperCase(), this.screenManager.width / 2, margin + i * lineHeight - app.scrollTop);
                }
                this.ctx.textAlign = 'left';
            } else {
                this.ctx.fillText(line.toUpperCase(), margin, margin + i * lineHeight - app.scrollTop);
            }

            if (app instanceof ProjectPage && projectIndex >= 0 && projectIndex < app.projects.length) {
                const textMetrics = this.ctx.measureText(line);
                const textWidth = textMetrics.width;
                app.clickableAreas.push({
                    x: (this.screenManager.width - textWidth) / 2,
                    y: margin + i * lineHeight - app.scrollTop,
                    width: textWidth,
                    height: lineHeight,
                    projectIndex: projectIndex
                });
            } else if (app instanceof EpPlayerPage) {
                const progressBarLineIndex = app.albumArt.length + 2;
                const controlsLineIndex = app.albumArt.length + 3;

                if (i === progressBarLineIndex) {
                    const progressBarVisual = line.substring(line.indexOf('['), line.indexOf(']') + 1);
                    const fullProgressBarText = line.substring(line.indexOf('['));
                    const fullWidth = this.ctx.measureText(fullProgressBarText).width;
                    const visualWidth = this.ctx.measureText(progressBarVisual).width;
                    const startX = (this.screenManager.width - fullWidth) / 2;
                    
                    app.clickableAreas.push({
                        x: startX,
                        y: margin + i * lineHeight - app.scrollTop,
                        width: visualWidth,
                        height: lineHeight,
                        action: 'seek'
                    });
                }
                else if (i === controlsLineIndex) {
                    const playPauseIcon = app.playerState.isPlaying ? '▐▐' : '▶';
                    const prevIcon = '⏮';
                    const nextIcon = '⏭';
                    const spacing = 40;
                    const centerX = this.screenManager.width / 2;

                    // --- Define Clickable Areas ---
                    // Play/Pause
                    this.ctx.font = 'bold 20px "BitcountGridSingle-Regular", monospace';
                    const playPauseWidth = this.ctx.measureText(playPauseIcon).width;
                    const playPauseX = centerX - playPauseWidth / 2;
                    app.clickableAreas.push({ x: playPauseX, y: margin + i * lineHeight - app.scrollTop, width: playPauseWidth, height: lineHeight, action: 'togglePlayPause' });

                    // Previous
                    this.ctx.font = '20px "BitcountGridSingle-Regular", monospace';
                    const prevWidth = this.ctx.measureText(prevIcon).width;
                    const prevX = centerX - spacing - prevWidth / 2;
                    app.clickableAreas.push({ x: prevX, y: margin + i * lineHeight - app.scrollTop, width: prevWidth, height: lineHeight, action: 'previousTrack' });

                    // Next
                    const nextWidth = this.ctx.measureText(nextIcon).width;
                    const nextX = centerX + spacing - nextWidth / 2;
                    app.clickableAreas.push({ x: nextX, y: margin + i * lineHeight - app.scrollTop, width: nextWidth, height: lineHeight, action: 'nextTrack' });
                }
                else if (i >= tracklistStartIndex && trackIndex < app.tracks.length) {
                    const textMetrics = this.ctx.measureText(line);
                    const textWidth = textMetrics.width;
                    app.clickableAreas.push({
                        x: (this.screenManager.width - textWidth) / 2,
                        y: margin + i * lineHeight - app.scrollTop,
                        width: textWidth,
                        height: lineHeight,
                        action: 'selectTrack',
                        trackIndex: trackIndex
                    });
                }
            }
        }
        if (contentHeight > viewHeight) {
            const scrollbarWidth = 8;
            const scrollbarX = this.screenManager.width - scrollbarWidth - 2;
            
            // Scrollbar track
            this.ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
            this.ctx.fillRect(scrollbarX, margin, scrollbarWidth, viewHeight);

            // Scrollbar thumb
            const thumbHeight = Math.max(10, viewHeight * (viewHeight / contentHeight));
            const maxScroll = contentHeight - viewHeight;
            const thumbY = margin + (app.scrollTop / maxScroll) * (viewHeight - thumbHeight);
            
            this.ctx.fillStyle = 'rgba(0, 255, 0, 0.6)';
            this.ctx.fillRect(scrollbarX, thumbY, scrollbarWidth, thumbHeight);
        }
    }

    _drawAsciiArtPage() {
        const margin = 10;
        const app = this.activeApp;
        const originalFont = this.ctx.font;
        let yPos = margin - app.scrollTop;

        // --- 1. Draw Main ASCII Art Title ---
        this.ctx.textAlign = 'left';
        this.ctx.shadowColor = app.color;
        this.ctx.shadowBlur = 10;
        const brighterColor = '#18e699';
        
        const mainTitleLinesToShow = Math.min(app.lines.length, app.asciiArt.length);
        if (mainTitleLinesToShow > 0) {
            const longestLine = app.asciiArt.reduce((a, b) => a.length > b.length ? a : b);
            const availableWidth = this.screenManager.width - 2 * margin;
            const charWidth = this.ctx.measureText('W').width / 2;
            const scaleFactor = availableWidth / (longestLine.length * charWidth * 2.0);
            const newFontSize = Math.floor(20 * scaleFactor);
            this.ctx.font = `${newFontSize}px "BitcountGridSingle-Regular", monospace`;

            for (let i = 0; i < mainTitleLinesToShow; i++) {
                const line = app.lines[i];
                const lineWidth = this.ctx.measureText(line).width;
                let xPos = (this.screenManager.width - lineWidth) / 2;
                for (let j = 0; j < line.length; j++) {
                    const char = line[j];
                    this.ctx.fillStyle = (char === '/' || char === '\\') ? brighterColor : app.color;
                    this.ctx.fillText(char.toUpperCase(), xPos, yPos);
                    xPos += this.ctx.measureText(char).width;
                }
                yPos += newFontSize;
            }
        }
        
        this.ctx.shadowBlur = 0; // Reset glow
        this.ctx.font = originalFont; // Reset font

        // --- 2. Draw Project ASCII Art ---
        app.clickableAreas = [];
        const projectStartIndex = app.asciiArt.length + 1;
        let currentProjectY = yPos + 20; // Add some padding

        for (let projIndex = 0; projIndex < app.projects.length; projIndex++) {
            const project = app.projects[projIndex];
            const animationLineIndex = projectStartIndex + projIndex;

            if (app.lines.length <= animationLineIndex) continue;

            const longestProjectLine = project.title.reduce((a, b) => a.length > b.length ? a : b);
            const availableWidth = this.screenManager.width - margin * 4; // More margin for project titles
            const charWidth = this.ctx.measureText('W').width / 2;
            const scaleFactor = availableWidth / (longestProjectLine.length * charWidth * 3.0);
            const newFontSize = Math.floor(20 * scaleFactor);
            this.ctx.font = `${newFontSize}px "BitcountGridSingle-Regular", monospace`;

            const projectArtHeight = project.title.length * newFontSize;
            const projectArtWidth = this.ctx.measureText(longestProjectLine).width;
            
            // Hover effect
            if (projIndex === this.hoveredProjectIndex) {
                this.ctx.fillStyle = 'rgba(0, 255, 255, 0.2)';
                this.ctx.fillRect((this.screenManager.width - projectArtWidth) / 2 - 10, currentProjectY - 5, projectArtWidth + 20, projectArtHeight + 10);
                this.ctx.fillStyle = lightenColor(app.color, 50);
            } else {
                this.ctx.fillStyle = app.color;
            }

            let projectLineY = currentProjectY;
            for (const line of project.title) {
                const lineWidth = this.ctx.measureText(line).width;
                const xPos = (this.screenManager.width - lineWidth) / 2;
                this.ctx.fillText(line.toUpperCase(), xPos, projectLineY);
                projectLineY += newFontSize;
            }

            app.clickableAreas.push({
                x: (this.screenManager.width - projectArtWidth) / 2 - 10,
                y: currentProjectY - 5,
                width: projectArtWidth + 20,
                height: projectArtHeight + 10,
                projectIndex: projIndex
            });

            currentProjectY = projectLineY + 15; // Spacing between projects
        }
        
        this.ctx.font = originalFont; // Final font reset
    }

/**
 * Draws the custom cursor on the terminal screen.
 * @private
 */
drawCursor() {
    if (this.mousePosition.x > 0 && this.mousePosition.y > 0 && !('ontouchstart' in window)) {
        this.ctx.fillStyle = '#18e699';
        this.ctx.beginPath();
        this.ctx.moveTo(this.mousePosition.x, this.mousePosition.y);
        this.ctx.lineTo(this.mousePosition.x, this.mousePosition.y + 20);
        this.ctx.lineTo(this.mousePosition.x + 10, this.mousePosition.y + 15);
        this.ctx.closePath();
        this.ctx.fill();
    }
}

    handleClick(x, y) {
        if (this.activeApp instanceof ProjectPage) {
            for (const area of this.activeApp.clickableAreas) {
                if (y > area.y && y < area.y + area.height &&
                    x > area.x && x < area.x + area.width
                ) {
                    if (this.activeApp.projects[area.projectIndex].page) {
                        this.navigateTo(this.activeApp.projects[area.projectIndex].page);
                    }
                    return;
                }
            }
        } else if (this.activeApp instanceof EpPlayerPage) {
            for (const area of this.activeApp.clickableAreas) {
                if (y > area.y && y < area.y + area.height && x > area.x && x < area.x + area.width) {
                    if (area.action === 'togglePlayPause') {
                        if (!this.audioManager.currentTrack) {
                            this.audioManager.playTrack(0);
                             const selectedTrack = this.audioManager.tracks[0];
                            if (selectedTrack) {
                                this.activeApp.updatePlayerState({
                                    trackName: selectedTrack.name,
                                    duration: selectedTrack.buffer.duration,
                                    currentTime: 0,
                                    progress: 0,
                                    isPlaying: true
                                });
                            }
                        } else {
                            this.audioManager.togglePlayPause();
                            this.activeApp.updatePlayerState({ isPlaying: this.audioManager.isPlaying });
                        }
                    } else if (area.action === 'previousTrack') {
                        this.audioManager.playPrevious();
                    } else if (area.action === 'nextTrack') {
                        this.audioManager.playNext();
                    } else if (area.action === 'selectTrack') {
                        this.audioManager.playTrack(area.trackIndex);
                        // Manually update the player state to reflect the new track immediately
                        const selectedTrack = this.audioManager.tracks[area.trackIndex];
                        if (selectedTrack) {
                            this.activeApp.updatePlayerState({
                                trackName: selectedTrack.name,
                                duration: selectedTrack.buffer.duration,
                                currentTime: 0,
                                progress: 0,
                                isPlaying: true
                            });
                        }
                    } else if (area.action === 'seek') {
                        const clickX = x - area.x;
                        const percentage = clickX / area.width;
                        this.audioManager.seek(percentage);
                    }
                    this.isDirty = true;
                    return;
                }
            }
        }
    }

    _drawContactPage() {
        const app = this.activeApp;
        const formState = app.formState;
        this.ctx.fillStyle = app.color;
        this.ctx.font = '20px "BitcountGridSingle-Regular", monospace';
        const margin = 20;
        const lineHeight = 22; // Reduced line height
        const fieldWidth = this.screenManager.width - margin * 2 - 10; // 5px padding on each side

        // Title
        this.ctx.fillText('CONTACT:'.toUpperCase(), margin, margin);

        // Subject Field
        this.ctx.fillText('Subject:'.toUpperCase(), margin, margin + lineHeight * 2);
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.fillRect(margin, margin + lineHeight * 3, this.screenManager.width - margin * 2, lineHeight);
        this.ctx.fillStyle = app.color;
        let subjectText = formState.subject;
        if (formState.activeField === 'subject' && this.showCursor) {
            subjectText += '_';
        }
        const subjectLines = this._wrapText(subjectText, fieldWidth);
        this.ctx.fillText(subjectLines[0] || ''.toUpperCase(), margin + 5, margin + lineHeight * 3 + 2);

        // Email Field
        this.ctx.fillText('Your Email:'.toUpperCase(), margin, margin + lineHeight * 4.5);
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.fillRect(margin, margin + lineHeight * 5.5, this.screenManager.width - margin * 2, lineHeight);
        this.ctx.fillStyle = app.color;
        let emailText = formState.email;
        if (formState.activeField === 'email' && this.showCursor) {
            emailText += '_';
        }
        const emailLines = this._wrapText(emailText, fieldWidth);
        this.ctx.fillText(emailLines[0] || ''.toUpperCase(), margin + 5, margin + lineHeight * 5.5 + 2);


        // Message Field
        this.ctx.fillText('Message:'.toUpperCase(), margin, margin + lineHeight * 7);
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.fillRect(margin, margin + lineHeight * 8, this.screenManager.width - margin * 2, lineHeight * 6);
        this.ctx.fillStyle = app.color;
        let messageText = formState.message;
        if (formState.activeField === 'message' && this.showCursor) {
            messageText += '_';
        }
        const messageLines = this._wrapText(messageText, fieldWidth);
        const messageBoxHeight = 6;
        for (let i = 0; i < messageBoxHeight; i++) {
            const lineIndex = i + formState.scrollOffset;
            if (messageLines[lineIndex]) {
                this.ctx.fillText(messageLines[lineIndex].toUpperCase(), margin + 5, margin + lineHeight * (8 + i) + 2);
            }
        }

        // Message Scrollbar
        if (messageLines.length > messageBoxHeight) {
            const scrollbarWidth = 8;
            const scrollbarX = this.screenManager.width - scrollbarWidth - margin;
            const scrollbarY = margin + lineHeight * 8;
            const scrollbarHeight = lineHeight * messageBoxHeight;

            // Scrollbar track
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            this.ctx.fillRect(scrollbarX, scrollbarY, scrollbarWidth, scrollbarHeight);

            // Scrollbar thumb
            const thumbHeight = Math.max(10, scrollbarHeight * (messageBoxHeight / messageLines.length));
            const maxScroll = messageLines.length - messageBoxHeight;
            const thumbY = scrollbarY + (formState.scrollOffset / maxScroll) * (scrollbarHeight - thumbHeight);
            
            this.ctx.fillStyle = 'rgba(0, 255, 0, 0.6)';
            this.ctx.fillRect(scrollbarX, thumbY, scrollbarWidth, thumbHeight);
        }


        // Send Button
        const buttonWidth = 100;
        const buttonHeight = 30;
        const buttonX = this.screenManager.width - buttonWidth - margin;
        const buttonY = margin + lineHeight * 15;
        this.ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
        this.ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
        this.ctx.fillStyle = '#18e699';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Send'.toUpperCase(), buttonX + buttonWidth / 2, buttonY + 6);
        this.ctx.textAlign = 'left';
    }

    _wrapText(text, maxWidth) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';

        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            const width = this.ctx.measureText(currentLine + ' ' + word).width;
            if (width < maxWidth) {
                currentLine += (currentLine === '' ? '' : ' ') + word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);
        return lines;
    }

    _redrawPlayerControls() {
        const app = this.activeApp;
        const lineHeight = 24;
        const margin = 10;
        const progressBarLineIndex = app.albumArt.length + 2;
        const controlsLineIndex = app.albumArt.length + 3;
        const time = `${app.formatTime(app.playerState.currentTime)} / ${app.formatTime(app.playerState.duration)}`;
        const progressBarLength = 25;
        const filled = Math.floor(app.playerState.progress * progressBarLength);
        const empty = progressBarLength - filled;
        const progressBarText = `[${'='.repeat(filled)}${'-'.repeat(empty)}] ${time}`;

        // Clear the old lines
        this.ctx.clearRect(0, margin + progressBarLineIndex * lineHeight - app.scrollTop - 2, this.screenManager.width, lineHeight * 2);

        // Redraw the progress bar
        this.ctx.fillStyle = app.color;
        this.ctx.textAlign = 'center';
        this.ctx.fillText(progressBarText.toUpperCase(), this.screenManager.width / 2, margin + progressBarLineIndex * lineHeight - app.scrollTop);

        // Redraw the controls
        const playPauseIcon = app.playerState.isPlaying ? '▐▐' : '▶';
        const prevIcon = '⏮';
        const nextIcon = '⏭';
        const spacing = 40;
        const centerX = this.screenManager.width / 2;

        this.ctx.font = 'bold 20px "BitcountGridSingle-Regular", monospace';
        const playPauseWidth = this.ctx.measureText(playPauseIcon).width;
        const playPauseX = centerX - playPauseWidth / 2;
        this.ctx.fillText(playPauseIcon.toUpperCase(), playPauseX, margin + controlsLineIndex * lineHeight - app.scrollTop);

        this.ctx.font = '20px "BitcountGridSingle-Regular", monospace';
        const prevWidth = this.ctx.measureText(prevIcon).width;
        const prevX = centerX - spacing - prevWidth / 2;
        this.ctx.fillText(prevIcon.toUpperCase(), prevX, margin + controlsLineIndex * lineHeight - app.scrollTop);

        const nextWidth = this.ctx.measureText(nextIcon).width;
        const nextX = centerX + spacing - nextWidth / 2;
        this.ctx.fillText(nextIcon.toUpperCase(), nextX, margin + controlsLineIndex * lineHeight - app.scrollTop);

        this.ctx.textAlign = 'left';
    }

    _drawCvPage() {
        const app = this.activeApp;
        const lineHeight = 24;
        const margin = 20;
        const viewHeight = this.screenManager.height - margin * 2;
        this.ctx.fillStyle = app.color;

        let y = margin - app.scrollTop;

        // Draw title
        this.ctx.fillText(app.fullText[0].toUpperCase(), margin, y);
        y += lineHeight * 2;

        const maxWidth = this.screenManager.width - margin * 2;

        // Draw CV content
        app.cvContent.forEach(job => {
            if (y > viewHeight + margin) return; // Simple culling

            // Draw title in bold
            this.ctx.font = 'bold 20px "BitcountGridSingle-Regular", monospace';
            this.ctx.fillText(job.title.toUpperCase(), margin, y);
            y += lineHeight;
            this.ctx.font = '20px "BitcountGridSingle-Regular", monospace'; // Reset font

            // Draw company in italics
            this.ctx.font = 'italic 20px "BitcountGridSingle-Regular", monospace';
            this.ctx.fillText(job.company.toUpperCase(), margin, y);
            y += lineHeight;
            this.ctx.font = '20px "BitcountGridSingle-Regular", monospace'; // Reset font

            const wrappedDesc = this._wrapText(job.desc, maxWidth - 20); // Indent
            wrappedDesc.forEach(line => {
                if (y < viewHeight + margin) {
                    this.ctx.fillText(`  ${line}`.toUpperCase(), margin, y);
                }
                y += lineHeight;
            });
            y += lineHeight; // Space between jobs
        });

        // Manually update fullText for scrollbar calculation
        const finalLines = [];
        app.cvContent.forEach(job => {
            finalLines.push(job.title, job.company, ...this._wrapText(job.desc, maxWidth - 20), '');
        });
        app.fullText = ['EXPERIENCE:', '', ...finalLines, '> Press any black key to go back'];


        // Draw scrollbar (copied from _drawRunningScreen)
        const contentHeight = y + app.scrollTop;
        if (contentHeight > viewHeight) {
            const scrollbarWidth = 8;
            const scrollbarX = this.screenManager.width - scrollbarWidth - 2;
            
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            this.ctx.fillRect(scrollbarX, margin, scrollbarWidth, viewHeight);

            const thumbHeight = Math.max(10, viewHeight * (viewHeight / contentHeight));
            const maxScroll = contentHeight - viewHeight;
            const thumbY = margin + (app.scrollTop / maxScroll) * (viewHeight - thumbHeight);
            
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            this.ctx.fillRect(scrollbarX, thumbY, scrollbarWidth, thumbHeight);
        }
    }

    _drawTransitionEffect() {
        const w = this.screenManager.width;
        const h = this.screenManager.height;

        // Quick flicker
        this.ctx.fillStyle = `rgba(0, 0, 0, ${Math.random() * 0.5 + 0.5})`;
        this.ctx.fillRect(0, 0, w, h);

        // Horizontal static bars
        for (let i = 0; i < 10; i++) {
            this.ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.1})`;
            this.ctx.fillRect(0, Math.random() * h, w, Math.random() * 4 + 1);
        }

        // Vertical offset effect (rolling)
        const rollAmount = 50;
        const imageData = this.ctx.getImageData(0, 0, w, h);
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = w;
        tempCanvas.height = h;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.putImageData(imageData, 0, Math.random() * rollAmount - rollAmount / 2);
        this.ctx.clearRect(0, 0, w, h);
        this.ctx.drawImage(tempCanvas, 0, 0);
    }
}
function lightenColor(color, percent) {
    const num = parseInt(color.slice(1), 16),
        amt = Math.round(2.55 * percent),
        R = (num >> 16) + amt,
        G = (num >> 8 & 0x00FF) + amt,
        B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (G<255?G<1?0:G:255)*0x100 + (B<255?B<1?0:B:255)).toString(16).slice(1);
}