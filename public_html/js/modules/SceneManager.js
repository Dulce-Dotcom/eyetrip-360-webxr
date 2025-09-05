export class SceneManager {
    constructor(player) {
        this.player = player;
        this.currentScene = 0;
        this.currentQuality = 'direct'; // For non-processed videos
        
        // Scene configuration - UPDATE THIS
        this.scenes = [
            {
                basename: 'stumpy_rect_2_1_4ktest_isVR',  // Updated to match your video file
                title: 'EyeTrip Test Scene',
                duration: '2:15',  // Update with actual duration
                thumbnail: 'assets/thumbnails/eyetrip-test-video1.png',
                hasProcessed: false  // Set to false since this is the direct file
            }
        ];
        
        this.initSceneSelector();
    }
    
    // Simplified getVideoUrl for direct video
    getVideoUrl(scene) {
        if (scene.hasProcessed) {
            // Use processed versions if available
            return `assets/videos/processed/${scene.basename}/${scene.basename}_preview.mp4`;
        } else {
            // Use direct video file
            return `assets/videos/${scene.basename}.mp4`;
        }
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
}