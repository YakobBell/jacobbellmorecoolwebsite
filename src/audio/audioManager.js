import * as THREE from 'three';

class AudioManager {
    constructor(listener) {
        this.audioLoader = new THREE.AudioLoader();
        this.listener = listener;
        this.tracks = [];
        this.currentTrack = null;
        this.isPlaying = false;
        this.onTrackUpdate = null; // Callback for UI updates
    }

    async loadTracks(tracks) {
        const loadPromises = tracks.map(track =>
            new Promise((resolve, reject) => {
                this.audioLoader.load(track.url,
                    (buffer) => {
                        const sound = new THREE.Audio(this.listener);
                        sound.setBuffer(buffer);
                        resolve({ name: track.name, sound, buffer });
                    },
                    () => {},
                    (err) => reject(new Error(`Failed to load ${track.url}: ${err}`))
                );
            })
        );
        this.tracks = await Promise.all(loadPromises);
        return this.tracks;
    }

    playTrack(index) {
        if (index >= 0 && index < this.tracks.length) {
            if (this.currentTrack && this.currentTrack.sound.isPlaying) {
                this.currentTrack.sound.stop();
            }
            this.currentTrack = this.tracks[index];
            this.currentTrack.sound.play();
            this.isPlaying = true;
            // We will now rely on the main update loop
        }
    }

    togglePlayPause() {
        if (!this.currentTrack) return;
        if (this.isPlaying) {
            this.currentTrack.sound.pause();
            this.isPlaying = false;
        } else {
            this.currentTrack.sound.play();
            this.isPlaying = true;
        }
    }
    
    stop() {
        if (this.currentTrack && this.currentTrack.sound.isPlaying) {
            this.currentTrack.sound.stop();
        }
        this.isPlaying = false;
        this.currentTrack = null;
    }

    seek(percentage) {
        if (!this.currentTrack || !this.currentTrack.sound.buffer) return;

        const duration = this.currentTrack.sound.buffer.duration;
        const seekTime = duration * percentage;

        this.currentTrack.sound.offset = seekTime;

        if (this.isPlaying) {
            this.currentTrack.sound.stop();
            this.currentTrack.sound.play();
        }

        if (this.onTrackUpdate) {
            this.onTrackUpdate({
                currentTime: seekTime,
                progress: percentage,
            });
        }
    }

    update(terminal) {
        if (this.currentTrack && this.isPlaying) {
            const sound = this.currentTrack.sound;
            if (!sound.isPlaying || isNaN(sound.startTime)) {
                return;
            }
            const currentTime = sound.context.currentTime - sound.startTime + sound.offset;
            const duration = this.currentTrack.sound.buffer.duration;
            const progress = Math.min(currentTime / duration, 1);

            if (this.onTrackUpdate) {
                this.onTrackUpdate({
                    isPlaying: this.isPlaying,
                    trackName: this.currentTrack.name,
                    currentTime,
                    duration,
                    progress
                });
            }

            if (terminal && terminal.activeApp && (terminal.activeApp.constructor.name === 'EpPlayerPage' || terminal.activeApp.constructor.name === 'SoundtracksPlayerPage')) {
                terminal.activeApp.isDirty = true;
            }

            if (progress >= 1 && this.isPlaying) {
                this.playNext();
            }
        }
    }

    playNext() {
        const currentIndex = this.tracks.indexOf(this.currentTrack);
        const nextIndex = (currentIndex + 1) % this.tracks.length;
        this.playTrack(nextIndex);
        if (this.onTrackUpdate) {
            const nextTrack = this.tracks[nextIndex];
            this.onTrackUpdate({
                trackName: nextTrack.name,
                duration: nextTrack.buffer.duration,
                currentTime: 0,
                progress: 0,
            });
        }
    }

    playPrevious() {
        const currentIndex = this.tracks.indexOf(this.currentTrack);
        const prevIndex = (currentIndex - 1 + this.tracks.length) % this.tracks.length;
        this.playTrack(prevIndex);
        if (this.onTrackUpdate) {
            const prevTrack = this.tracks[prevIndex];
            this.onTrackUpdate({
                trackName: prevTrack.name,
                duration: prevTrack.buffer.duration,
                currentTime: 0,
                progress: 0,
            });
        }
    }
}

export { AudioManager };