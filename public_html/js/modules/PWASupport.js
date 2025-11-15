/**
 * PWASupport - Progressive Web App features
 * Service worker, offline mode, installable, app manifest
 */
export class PWASupport {
    constructor() {
        this.isInstalled = false;
        this.deferredPrompt = null;
        
        // Check if already installed
        this.checkInstallStatus();
        
        // Register service worker
        this.registerServiceWorker();
        
        // Setup install prompt
        this.setupInstallPrompt();
        
        console.log('📱 PWASupport initialized');
    }
    
    /**
     * Check install status
     */
    checkInstallStatus() {
        // Check if running as installed PWA
        if (window.matchMedia('(display-mode: standalone)').matches) {
            this.isInstalled = true;
            console.log('✅ Running as installed PWA');
        }
    }
    
    /**
     * Register service worker
     */
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('✅ Service Worker registered:', registration.scope);
                
                // Check for updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    console.log('🔄 Service Worker update found');
                    
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            this.showUpdateNotification();
                        }
                    });
                });
            } catch (error) {
                console.error('❌ Service Worker registration failed:', error);
            }
        } else {
            console.warn('⚠️ Service Workers not supported');
        }
    }
    
    /**
     * Setup install prompt
     */
    setupInstallPrompt() {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            console.log('📱 Install prompt available');
            
            // Show install button
            this.showInstallButton();
        });
        
        // Listen for install success
        window.addEventListener('appinstalled', () => {
            this.isInstalled = true;
            this.hideInstallButton();
            console.log('✅ App installed successfully');
        });
    }
    
    /**
     * Show install button
     */
    showInstallButton() {
        if (document.getElementById('pwa-install-btn')) return;
        
        const btn = document.createElement('button');
        btn.id = 'pwa-install-btn';
        btn.textContent = '📱 Install App';
        btn.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 15px 25px;
            border-radius: 50px;
            font-size: 14px;
            font-weight: bold;
            cursor: pointer;
            z-index: 10000;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
            animation: pulseInstall 2s infinite;
        `;
        
        btn.onclick = () => this.promptInstall();
        
        document.body.appendChild(btn);
        
        // Add animation
        if (!document.getElementById('pwa-animations')) {
            const style = document.createElement('style');
            style.id = 'pwa-animations';
            style.textContent = `
                @keyframes pulseInstall {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    /**
     * Hide install button
     */
    hideInstallButton() {
        const btn = document.getElementById('pwa-install-btn');
        if (btn) btn.remove();
    }
    
    /**
     * Prompt installation
     */
    async promptInstall() {
        if (!this.deferredPrompt) {
            console.warn('⚠️ Install prompt not available');
            return;
        }
        
        // Show prompt
        this.deferredPrompt.prompt();
        
        // Wait for user choice
        const { outcome } = await this.deferredPrompt.userChoice;
        console.log(`User ${outcome} installation`);
        
        // Clear prompt
        this.deferredPrompt = null;
        
        if (outcome === 'accepted') {
            this.hideInstallButton();
        }
    }
    
    /**
     * Show update notification
     */
    showUpdateNotification() {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.95);
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            z-index: 10001;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.2);
        `;
        
        notification.innerHTML = `
            <div style="margin-bottom: 10px;">🔄 New version available!</div>
            <button id="pwa-reload-btn" style="background: #4CAF50; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; margin-right: 10px;">
                Update Now
            </button>
            <button id="pwa-dismiss-btn" style="background: transparent; color: white; border: 1px solid white; padding: 8px 15px; border-radius: 4px; cursor: pointer;">
                Later
            </button>
        `;
        
        document.body.appendChild(notification);
        
        document.getElementById('pwa-reload-btn').onclick = () => {
            window.location.reload();
        };
        
        document.getElementById('pwa-dismiss-btn').onclick = () => {
            notification.remove();
        };
    }
    
    /**
     * Check if online
     */
    isOnline() {
        return navigator.onLine;
    }
    
    /**
     * Setup offline detection
     */
    setupOfflineDetection() {
        window.addEventListener('online', () => {
            this.showConnectionStatus('online');
            console.log('✅ Back online');
        });
        
        window.addEventListener('offline', () => {
            this.showConnectionStatus('offline');
            console.log('⚠️ Offline mode');
        });
    }
    
    /**
     * Show connection status
     */
    showConnectionStatus(status) {
        const existing = document.getElementById('connection-status');
        if (existing) existing.remove();
        
        const statusDiv = document.createElement('div');
        statusDiv.id = 'connection-status';
        statusDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${status === 'online' ? 'rgba(76, 175, 80, 0.95)' : 'rgba(244, 67, 54, 0.95)'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10001;
            animation: slideDown 0.3s ease;
        `;
        
        statusDiv.textContent = status === 'online' ? '✅ Back Online' : '⚠️ Offline Mode';
        
        document.body.appendChild(statusDiv);
        
        setTimeout(() => {
            statusDiv.remove();
        }, 3000);
    }
    
    /**
     * Cache video for offline use
     */
    async cacheVideo(videoUrl) {
        if ('caches' in window) {
            try {
                const cache = await caches.open('eyetrip-videos-v1');
                await cache.add(videoUrl);
                console.log('✅ Video cached:', videoUrl);
            } catch (error) {
                console.error('❌ Failed to cache video:', error);
            }
        }
    }
    
    /**
     * Get cache size
     */
    async getCacheSize() {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            const estimate = await navigator.storage.estimate();
            return {
                usage: (estimate.usage / 1048576).toFixed(2), // MB
                quota: (estimate.quota / 1048576).toFixed(2), // MB
                percentage: ((estimate.usage / estimate.quota) * 100).toFixed(1)
            };
        }
        return null;
    }
    
    /**
     * Clear cache
     */
    async clearCache() {
        if ('caches' in window) {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map(name => caches.delete(name)));
            console.log('✅ Cache cleared');
        }
    }
}
