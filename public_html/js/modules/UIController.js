export class UIController {
    constructor(player, sceneManager, xrHandler) {
        this.player = player;
        this.sceneManager = sceneManager;
        this.xrHandler = xrHandler;
        this.setupUI();
        this.setupAutoHide();
    }
    
    setupUI() {
        // Play/Pause
        document.getElementById('playBtn')?.addEventListener('click', () => {
            console.log('Play/Pause button clicked');
            this.player.togglePlay();
            setTimeout(() => this.updatePlayButton(), 100);
        });

        // Navigation
        document.getElementById('nextBtn')?.addEventListener('click', () => {
            console.log('Next button clicked');
            this.sceneManager.nextScene();
        });

        document.getElementById('prevBtn')?.addEventListener('click', () => {
            console.log('Prev button clicked');
            this.sceneManager.prevScene();
        });

        // Fullscreen
        document.getElementById('fullscreenBtn')?.addEventListener('click', () => {
            console.log('Fullscreen button clicked');
            this.toggleFullscreen();
        });

        // Menu
        document.getElementById('menuBtn')?.addEventListener('click', () => {
            console.log('Menu button clicked');
            const selector = document.getElementById('sceneSelector');
            selector?.classList.toggle('hidden');
        });

        // FAB
        document.getElementById('fabBtn')?.addEventListener('click', () => {
            console.log('360 FAB button clicked');
            this.toggleUIVisibility();
        });
        
        // Video time update
        this.setupTimeDisplay();
    }
    
    setupTimeDisplay() {
        const videoTimeEl = document.getElementById('videoTime');
        if (!videoTimeEl || !this.player) return;
        
        // Update time display every second
        setInterval(() => {
            if (this.player.video) {
                const current = this.formatTime(this.player.video.currentTime || 0);
                const duration = this.formatTime(this.player.video.duration || 0);
                videoTimeEl.textContent = `${current} / ${duration}`;
            }
        }, 1000);
    }
    
    formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return '0:00';
        
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    setupAutoHide() {
        let timeout;
        const hideUI = () => {
            document.getElementById('topBar')?.classList.add('hidden');
            document.getElementById('controls')?.classList.add('hidden');
        };
        
        const showUI = () => {
            document.getElementById('topBar')?.classList.remove('hidden');
            document.getElementById('controls')?.classList.remove('hidden');
        };
        
        const resetTimeout = () => {
            clearTimeout(timeout);
            showUI();
            timeout = setTimeout(hideUI, 3000);
        };
        
        document.addEventListener('mousemove', resetTimeout);
        document.addEventListener('touchstart', resetTimeout);
        
        timeout = setTimeout(hideUI, 3000);
    }
    
    updatePlayButton() {
        const playBtn = document.querySelector('#playBtn .material-icons');
        if (playBtn && this.player && this.player.video) {
            playBtn.textContent = this.player.video.paused ? 'play_arrow' : 'pause';
        }
    }
    
    toggleFullscreen() {
        const container = document.getElementById('container');
        
        // Check if already in fullscreen
        const isFullscreen = document.fullscreenElement || 
                            document.webkitFullscreenElement || 
                            document.mozFullScreenElement || 
                            document.msFullscreenElement;
        
        if (!isFullscreen) {
            // Enter fullscreen - try different browser prefixes
            if (container) {
                if (container.requestFullscreen) {
                    container.requestFullscreen().catch(err => {
                        console.error('Fullscreen request failed:', err);
                    });
                } else if (container.webkitRequestFullscreen) {
                    container.webkitRequestFullscreen();
                } else if (container.mozRequestFullScreen) {
                    container.mozRequestFullScreen();
                } else if (container.msRequestFullscreen) {
                    container.msRequestFullscreen();
                }
            }
        } else {
            // Exit fullscreen - try different browser prefixes
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }
    }
    
    toggleUIVisibility() {
        const topBar = document.getElementById('topBar');
        const controls = document.getElementById('controls');
        
        if (topBar?.classList.contains('hidden')) {
            topBar?.classList.remove('hidden');
            controls?.classList.remove('hidden');
        } else {
            topBar?.classList.add('hidden');
            controls?.classList.add('hidden');
        }
    }
}
