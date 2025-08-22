// js/app.js - Main Application Entry Point
console.log('[DEBUG] app.js loaded');
import { PanoramaPlayer } from './modules/PanoramaPlayer.js';
import { UIController } from './modules/UIController.js';
import { SceneManager } from './modules/SceneManager.js';
import { WebXRHandler } from './modules/WebXRHandler.js';

/**
 * Main Application Class
 * Initializes and coordinates all modules for the 360° video player
 */
class App {
    constructor() {
        console.log('App constructor called');
        
        this.player = null;
        this.ui = null;
        this.sceneManager = null;
        this.xrHandler = null;
        this.isInitialized = false;
        this.initPromise = null; // Track initialization promise
        
        // Bind methods
        this.init = this.init.bind(this);
        this.handleError = this.handleError.bind(this);
        
        // Start initialization only once
        if (!this.initPromise) {
            this.initPromise = this.init();
        }
    }
    
    /**
     * Initialize the application
     */
    async init() {
        // Prevent multiple initializations
        if (this.isInitialized) {
            console.log('App already initialized, skipping');
            return;
        }

        // Set flag immediately to prevent race conditions
        this.isInitialized = true;

        console.log('🚀 Initializing EyeTrip 360° Experience...');
        
        // Show loading overlay
        this.showLoading(true, 'Initializing 360° Experience...');
        
        try {
            // Step 1: Initialize the panorama player
            console.log('📹 Setting up panorama player...');
            const container = document.getElementById('canvas-container');
            
            if (!container) {
                throw new Error('Canvas container not found');
            }
            
            this.player = new PanoramaPlayer(container);
            
            // Step 2: Initialize WebXR handler
            console.log('🥽 Checking WebXR support...');
            this.xrHandler = new WebXRHandler(this.player.renderer);
            
            // Link WebXRHandler to PanoramaPlayer for Meta Quest optimizations
            this.xrHandler.setPanoramaPlayer(this.player);
            
            const xrSupported = await this.xrHandler.checkSupport();
            if (xrSupported) {
                console.log('✅ WebXR is supported');
                // Badge styling is handled by WebXRHandler.updateUIBadge()
            } else {
                console.log('⚠️ WebXR is not supported on this device');
                // Badge styling is handled by WebXRHandler.updateUIBadge()
            }
            
            // Step 3: Initialize scene manager
            console.log('🎬 Setting up scene manager...');
            this.sceneManager = new SceneManager(this.player);
            
            // Step 4: Initialize UI controller
            console.log('🎮 Setting up UI controls...');
            this.ui = new UIController(this.player, this.sceneManager, this.xrHandler);
            
            // Step 5: Load the first scene automatically (restored)
            console.log('📦 Loading initial scene...');
            await this.sceneManager.loadScene(0);
            
            // Step 6: Register service worker (only in production or non-localhost)
            if (location.hostname !== 'localhost') {
                this.registerServiceWorker();
            } else {
                console.log('📦 Service Worker disabled for localhost development');
            }
            
            // Step 7: Set up event listeners
            this.setupEventListeners();
            
            // Step 8: Hide loading and show ready state
            this.showLoading(false);
            this.isInitialized = true;
            
            console.log('✅ Application initialized successfully!');
            
            // Show instructions
            this.showInstructions();
            
        } catch (error) {
            this.handleError(error);
        }
    }
    
    /**
     * Set up global event listeners
     */
    setupEventListeners() {
        // Handle visibility change (pause video when tab is hidden)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.player && this.player.isPlaying) {
                console.log('Tab hidden, pausing video');
                this.player.pause();
            }
        });
        
        // Handle keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (!this.isInitialized) return;
            
            switch(e.key) {
                case ' ':  // Spacebar
                    e.preventDefault();
                    this.player.togglePlay();
                    this.ui.updatePlayButton();
                    break;
                case 'f':  // F key for fullscreen
                case 'F':
                    this.player.toggleFullscreen();
                    break;
                case 'ArrowLeft':
                    this.sceneManager.prevScene();
                    break;
                case 'ArrowRight':
                    this.sceneManager.nextScene();
                    break;
                case 'm':  // M key to mute/unmute
                case 'M':
                    if (this.player.video.muted) {
                        this.player.unmute();
                    } else {
                        this.player.mute();
                    }
                    break;
                case 'Escape':
                    if (this.xrHandler && this.xrHandler.isInVR()) {
                        this.xrHandler.exitVR();
                    }
                    break;
            }
        });
        
        // Handle orientation change on mobile
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                if (this.player) {
                    this.player.onWindowResize();
                }
            }, 100);
        });
        
        // Log performance metrics
        if (window.performance && window.performance.timing) {
            window.addEventListener('load', () => {
                const perfData = window.performance.timing;
                const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
                console.log(`📊 Page load time: ${pageLoadTime}ms`);
            });
        }
    }
    
    /**
     * Show/hide loading overlay
     */
    showLoading(show, message = 'Loading...') {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            if (show) {
                loadingOverlay.style.display = 'block';
                const loadingText = loadingOverlay.querySelector('div:last-child');
                if (loadingText) {
                    loadingText.textContent = message;
                }
            } else {
                loadingOverlay.style.display = 'none';
            }
        }
    }
    
    /**
     * Show instructions for first-time users
     */
    showInstructions() {
        // Check if user has seen instructions before
        const hasSeenInstructions = localStorage.getItem('eyetrip-instructions-seen');
        
        if (!hasSeenInstructions) {
            const instructions = `
Welcome to EyeTrip 360° Experience!

🎮 Controls:
• Click and drag to look around
• Spacebar or Play button to play/pause
• F key for fullscreen
• Arrow keys to switch scenes
• VR button to enter VR mode (if supported)

Enjoy your immersive experience!
            `;
            
            console.log(instructions);
            
            // Optionally show a toast or modal with instructions
            // For now, just log to console
            
            // Mark instructions as seen
            localStorage.setItem('eyetrip-instructions-seen', 'true');
        }
    }
    
    /**
     * Register service worker for PWA functionality
     */
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                console.log('📦 Registering service worker...');
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('✅ Service Worker registered:', registration.scope);
                
                // Check for updates
                registration.addEventListener('updatefound', () => {
                    console.log('🔄 Service Worker update found');
                    const newWorker = registration.installing;
                    
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            console.log('🆕 New Service Worker available, refresh to update');
                            // Optionally show update notification to user
                        }
                    });
                });
                
            } catch (error) {
                console.error('❌ Service Worker registration failed:', error);
            }
        } else {
            console.log('⚠️ Service Workers not supported in this browser');
        }
    }
    
    /**
     * Handle application errors
     */
    handleError(error) {
        console.error('❌ Application error:', error);
        
        // Hide loading overlay
        this.showLoading(false);
        
        // Show error message to user
        const errorMessage = document.createElement('div');
        errorMessage.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(244, 67, 54, 0.9);
            color: white;
            padding: 20px;
            border-radius: 8px;
            max-width: 400px;
            text-align: center;
            z-index: 9999;
            font-family: 'Roboto', sans-serif;
        `;
        
        errorMessage.innerHTML = `
            <h3 style="margin: 0 0 10px 0;">Error Loading Application</h3>
            <p style="margin: 0 0 10px 0;">${error.message || 'An unexpected error occurred'}</p>
            <button onclick="location.reload()" style="
                background: white;
                color: #f44336;
                border: none;
                padding: 10px 20px;
                border-radius: 4px;
                cursor: pointer;
                font-weight: 500;
            ">Reload Page</button>
        `;
        
        document.body.appendChild(errorMessage);
    }
    
    /**
     * Clean up resources
     */
    dispose() {
        console.log('🧹 Cleaning up application resources...');
        
        if (this.player) {
            this.player.dispose();
        }
        
        if (this.xrHandler && this.xrHandler.isInVR()) {
            this.xrHandler.exitVR();
        }
        
        // Remove event listeners
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        document.removeEventListener('keydown', this.handleKeyboard);
        window.removeEventListener('orientationchange', this.handleOrientation);
        
        this.isInitialized = false;
    }
}

// Initialize application when DOM is ready (prevent double initialization)
function initializeApp() {
    // Check if already initialized globally
    if (window.app || document.body.hasAttribute('data-app-initialized')) {
        console.log('App already exists, skipping duplicate initialization');
        return;
    }
    
    // Mark as initializing
    document.body.setAttribute('data-app-initialized', 'true');
    
    console.log('Creating new App instance...');
    window.app = new App();
}

// Only run once when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp, { once: true });
} else {
    // DOM is already loaded, run immediately
    initializeApp();
}

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (window.app) {
        window.app.dispose();
    }
});

// Export for debugging in console
export default App;