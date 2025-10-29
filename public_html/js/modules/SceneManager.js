export class SceneManager {
    constructor(player) {
        this.player = player;
        this.currentScene = 0;
        this.currentQuality = 'direct'; // For non-processed videos
        
        // Check for selected video from gallery FIRST (before clearing)
        const selectedVideo = sessionStorage.getItem('selectedVideo');
        const selectedTitle = sessionStorage.getItem('selectedTitle');
        
        console.log('🎬 [SceneManager] Debug - selectedVideo:', selectedVideo);
        console.log('🎬 [SceneManager] Debug - selectedTitle:', selectedTitle);
        
        // Scene configuration - dynamically set based on gallery selection
        if (selectedVideo && selectedTitle) {
            this.scenes = [
                {
                    basename: selectedVideo.replace(/\.(mp4|webm)$/, ''),  // Remove extension
                    videoPath: selectedVideo,  // Full path including subdirectories
                    title: selectedTitle,
                    duration: '0:00',  // Will be updated when video loads
                    thumbnail: 'assets/thumbnails/eyetrip-test-video2.jpg',
                    hasProcessed: selectedVideo.includes('processed/')
                }
            ];
            
            // Clear session storage after use to prevent stale data
            sessionStorage.removeItem('selectedVideo');
            sessionStorage.removeItem('selectedTitle');
        } else {
            // Default scene configuration - USE VIDEO WITH AUDIO
            this.scenes = [
                {
                    basename: 'stumpy_sphereMap_4ktest1',
                    videoPath: 'stumpy_rect_16_9_4ktest.mp4',
                    title: 'EyeTrip Default Experience (with Audio)',
                    duration: '4:18',
                    thumbnail: 'assets/thumbnails/eyetrip-test-video2.jpg',
                    hasProcessed: false
                }
            ];
        }
        
        console.log('🎬 [SceneManager] Final scenes config:', this.scenes);
        this.initSceneSelector();
    }
    
    // Updated getVideoUrl to handle full paths
    getVideoUrl(scene) {
        let videoUrl;
        if (scene.videoPath) {
            // If videoPath starts with 'assets/', use it as-is (full path already provided)
            // Otherwise, prepend 'assets/videos/'
            if (scene.videoPath.startsWith('assets/')) {
                videoUrl = scene.videoPath;
            } else {
                videoUrl = `assets/videos/${scene.videoPath}`;
            }
        } else if (scene.hasProcessed) {
            // Use processed versions if available
            videoUrl = `assets/videos/processed/${scene.basename}/${scene.basename}_${this.currentQuality}.mp4`;
        } else {
            // Use direct video file
            videoUrl = `assets/videos/${scene.basename}.mp4`;
        }
        
        console.log('🎬 [SceneManager] getVideoUrl result:', videoUrl);
        console.log('🎬 [SceneManager] Scene object:', scene);
        return videoUrl;
    }
    
    initSceneSelector() {
        const selector = document.getElementById('sceneSelector');
        if (!selector) return;
        
        selector.innerHTML = `
            ${this.scenes.map((scene, index) => `
                <div class="md-scene-item ${index === 0 ? 'active' : ''}" data-scene="${index}">
                    <div class="md-scene-info" style="color: white; padding: 10px;">
                        <div class="md-scene-title">${scene.title}</div>
                        <div class="md-scene-duration">${scene.duration}</div>
                    </div>
                </div>
            `).join('')}
        `;
        
        // Add event listeners
        selector.querySelectorAll('.md-scene-item').forEach(item => {
            item.addEventListener('click', () => {
                const index = parseInt(item.dataset.scene);
                this.loadScene(index);
                selector.classList.add('hidden');
            });
        });
    }
    
    async loadScene(index) {
        if (index < 0 || index >= this.scenes.length) return;
        const scene = this.scenes[index];
        const loadingOverlay = document.getElementById('loadingOverlay');
        const progressBar = document.getElementById('videoProgressBar');
        const progressFill = document.getElementById('videoProgress');
        try {
            if (loadingOverlay) loadingOverlay.style.display = 'block';
            if (progressBar && progressFill) {
                progressBar.style.display = 'block';
                progressFill.style.width = '0';
            }
            const videoUrl = this.getVideoUrl(scene);
            console.log(`Loading video: ${videoUrl}`);

            // Listen for video progress during initial load
            if (this.player && this.player.video) {
                this.player.video.addEventListener('progress', () => {
                    if (this.player.video.buffered.length > 0 && this.player.video.duration > 0) {
                        const bufferedEnd = this.player.video.buffered.end(this.player.video.buffered.length - 1);
                        const percent = Math.min(100, Math.round((bufferedEnd / this.player.video.duration) * 100));
                        if (progressFill) progressFill.style.width = percent + '%';
                    }
                });
            }

            await this.player.loadVideo(videoUrl);
            
            // Update duration when video metadata is loaded
            if (this.player.video && this.player.video.duration) {
                const duration = this.formatDuration(this.player.video.duration);
                this.scenes[index].duration = duration;
            }
            
            this.updateSceneUI();
            // Update play button icon after scene loads
            if (window.app && window.app.ui) window.app.ui.updatePlayButton();

        } catch (error) {
            console.error('Failed to load scene:', error);
            alert(`Failed to load video: ${this.getVideoUrl(scene)}`);
        } finally {
            if (loadingOverlay) loadingOverlay.style.display = 'none';
            if (progressBar) progressBar.style.display = 'none';
        }
    }
    
    updateSceneUI() {
        const items = document.querySelectorAll('.md-scene-item');
        items.forEach((item, index) => {
            if (index === this.currentScene) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }
    
    nextScene() {
        const next = (this.currentScene + 1) % this.scenes.length;
        this.loadScene(next);
    }
    
    prevScene() {
        const prev = this.currentScene === 0 ? this.scenes.length - 1 : this.currentScene - 1;
        this.loadScene(prev);
    }
    
    formatDuration(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
}