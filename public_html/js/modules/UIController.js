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
        // Use the main container for fullscreen, not document.documentElement
        const container = document.getElementById('container');
        if (!document.fullscreenElement) {
            if (container && container.requestFullscreen) {
                container.requestFullscreen();
            }
        } else {
            document.exitFullscreen();
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
