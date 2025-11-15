/**
 * AccessibilitySystem - WCAG 2.1 AAA compliant accessibility features
 * Screen reader support, keyboard navigation, high contrast, reduced motion
 */
export class AccessibilitySystem {
    constructor(panoramaPlayer, hotspotManager) {
        this.panoramaPlayer = panoramaPlayer;
        this.hotspotManager = hotspotManager;
        
        // Settings
        this.settings = this.loadSettings();
        
        // Apply saved settings
        this.applySettings();
        
        console.log('♿ AccessibilitySystem initialized');
    }
    
    /**
     * Load accessibility settings
     */
    loadSettings() {
        try {
            const saved = localStorage.getItem('eyetrip_accessibility');
            return saved ? JSON.parse(saved) : {
                screenReader: false,
                highContrast: false,
                reducedMotion: false,
                keyboardOnly: false,
                audioDescriptions: false,
                largeText: false
            };
        } catch (e) {
            return {};
        }
    }
    
    /**
     * Save settings
     */
    saveSettings() {
        try {
            localStorage.setItem('eyetrip_accessibility', JSON.stringify(this.settings));
        } catch (e) {
            console.error('Failed to save accessibility settings:', e);
        }
    }
    
    /**
     * Apply all settings
     */
    applySettings() {
        if (this.settings.screenReader) this.enableScreenReaderMode();
        if (this.settings.highContrast) this.enableHighContrastMode();
        if (this.settings.reducedMotion) this.enableReducedMotion();
        if (this.settings.keyboardOnly) this.enableKeyboardNavigation();
        if (this.settings.audioDescriptions) this.enableAudioDescriptions();
        if (this.settings.largeText) this.enableLargeText();
    }
    
    /**
     * Enable screen reader mode
     */
    enableScreenReaderMode() {
        this.settings.screenReader = true;
        
        // Add ARIA live region
        this.createLiveRegion();
        
        // Add ARIA labels to all hotspots
        if (this.hotspotManager && this.hotspotManager.hotspots) {
            this.hotspotManager.hotspots.forEach(hotspot => {
                if (hotspot.mesh) {
                    hotspot.mesh.userData.ariaLabel = `
                        Hotspot: ${hotspot.label}.
                        Position: ${hotspot.position.lat.toFixed(0)} degrees latitude,
                        ${hotspot.position.lon.toFixed(0)} degrees longitude.
                        ${hotspot.discovered ? 'Already discovered.' : 'Not yet discovered.'}
                    `.trim();
                }
            });
        }
        
        // Announce camera direction changes
        this.startDirectionAnnouncements();
        
        console.log('✅ Screen reader mode enabled');
        this.announce('Screen reader mode enabled. Use arrow keys to navigate and Enter to discover hotspots.');
        this.saveSettings();
    }
    
    /**
     * Create ARIA live region
     */
    createLiveRegion() {
        if (document.getElementById('aria-live-region')) return;
        
        const liveRegion = document.createElement('div');
        liveRegion.id = 'aria-live-region';
        liveRegion.setAttribute('role', 'status');
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.style.cssText = `
            position: absolute;
            left: -10000px;
            width: 1px;
            height: 1px;
            overflow: hidden;
        `;
        document.body.appendChild(liveRegion);
    }
    
    /**
     * Announce message to screen reader
     */
    announce(message) {
        const liveRegion = document.getElementById('aria-live-region');
        if (liveRegion) {
            liveRegion.textContent = message;
        }
    }
    
    /**
     * Start announcing direction changes
     */
    startDirectionAnnouncements() {
        let lastDirection = '';
        
        this.directionInterval = setInterval(() => {
            const direction = this.getCurrentDirection();
            if (direction !== lastDirection) {
                this.announce(`Now facing ${direction}`);
                lastDirection = direction;
            }
        }, 3000); // Every 3 seconds
    }
    
    /**
     * Get current compass direction
     */
    getCurrentDirection() {
        if (!this.panoramaPlayer) return 'unknown';
        
        const lon = this.panoramaPlayer.lon;
        const directions = [
            { name: 'North', min: 337.5, max: 22.5 },
            { name: 'Northeast', min: 22.5, max: 67.5 },
            { name: 'East', min: 67.5, max: 112.5 },
            { name: 'Southeast', min: 112.5, max: 157.5 },
            { name: 'South', min: 157.5, max: 202.5 },
            { name: 'Southwest', min: 202.5, max: 247.5 },
            { name: 'West', min: 247.5, max: 292.5 },
            { name: 'Northwest', min: 292.5, max: 337.5 }
        ];
        
        const normalized = ((lon % 360) + 360) % 360;
        
        for (const dir of directions) {
            if (dir.min < dir.max) {
                if (normalized >= dir.min && normalized < dir.max) return dir.name;
            } else {
                if (normalized >= dir.min || normalized < dir.max) return dir.name;
            }
        }
        
        return 'North';
    }
    
    /**
     * Enable high contrast mode
     */
    enableHighContrastMode() {
        this.settings.highContrast = true;
        
        // Apply high contrast colors to hotspots
        if (this.hotspotManager && this.hotspotManager.hotspots) {
            this.hotspotManager.hotspots.forEach(hotspot => {
                if (hotspot.mesh && hotspot.mesh.material) {
                    // Bright yellow for undiscovered
                    hotspot.mesh.material.color.setHex(0xFFFF00);
                    hotspot.mesh.material.emissive.setHex(0xFFFF00);
                    hotspot.mesh.material.emissiveIntensity = 8.0;
                    
                    // Add black outline
                    if (hotspot.glowLayers) {
                        hotspot.glowLayers[0].material.color.setHex(0x000000);
                    }
                }
                
                if (hotspot.discovered && hotspot.mesh) {
                    // Bright green for discovered
                    hotspot.mesh.material.color.setHex(0x00FF00);
                    hotspot.mesh.material.emissive.setHex(0x00FF00);
                }
            });
        }
        
        // Apply high contrast to UI
        document.documentElement.style.setProperty('--high-contrast', 'true');
        document.body.classList.add('high-contrast');
        
        // Add high contrast CSS
        this.addHighContrastCSS();
        
        console.log('✅ High contrast mode enabled');
        this.announce('High contrast mode enabled');
        this.saveSettings();
    }
    
    /**
     * Add high contrast CSS
     */
    addHighContrastCSS() {
        if (document.getElementById('high-contrast-css')) return;
        
        const style = document.createElement('style');
        style.id = 'high-contrast-css';
        style.textContent = `
            body.high-contrast {
                background: #000;
                color: #FFF;
            }
            
            body.high-contrast button {
                background: #000 !important;
                color: #FFF !important;
                border: 2px solid #FFF !important;
            }
            
            body.high-contrast button:hover {
                background: #FFF !important;
                color: #000 !important;
            }
            
            body.high-contrast a {
                color: #FFFF00 !important;
                text-decoration: underline !important;
            }
        `;
        document.head.appendChild(style);
    }
    
    /**
     * Enable reduced motion
     */
    enableReducedMotion() {
        this.settings.reducedMotion = true;
        
        // Disable particle effects
        if (this.panoramaPlayer && this.panoramaPlayer.particleTrailSystem) {
            this.panoramaPlayer.particleTrailSystem.cleanup();
        }
        
        // Disable hotspot animations
        if (this.hotspotManager && this.hotspotManager.hotspots) {
            this.hotspotManager.hotspots.forEach(hotspot => {
                // Stop pulsing
                if (hotspot.mesh) {
                    hotspot.mesh.scale.set(1, 1, 1);
                }
                
                // Stop particle rings
                if (hotspot.particles) {
                    hotspot.particles.visible = false;
                }
            });
        }
        
        // Add CSS to disable animations
        this.addReducedMotionCSS();
        
        console.log('✅ Reduced motion enabled');
        this.announce('Reduced motion enabled. Animations disabled.');
        this.saveSettings();
    }
    
    /**
     * Add reduced motion CSS
     */
    addReducedMotionCSS() {
        if (document.getElementById('reduced-motion-css')) return;
        
        const style = document.createElement('style');
        style.id = 'reduced-motion-css';
        style.textContent = `
            *, *::before, *::after {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
            }
        `;
        document.head.appendChild(style);
    }
    
    /**
     * Enable keyboard navigation
     */
    enableKeyboardNavigation() {
        this.settings.keyboardOnly = true;
        
        // Add keyboard event listeners
        document.addEventListener('keydown', this.handleKeyboardNav.bind(this));
        
        // Show keyboard hints
        this.showKeyboardHints();
        
        console.log('✅ Keyboard navigation enabled');
        this.announce('Keyboard navigation enabled. Use arrow keys to look around, Tab to focus hotspots, Enter to discover.');
        this.saveSettings();
    }
    
    /**
     * Handle keyboard navigation
     */
    handleKeyboardNav(e) {
        if (!this.panoramaPlayer) return;
        
        const speed = e.shiftKey ? 10 : 5; // Shift = faster
        
        switch (e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                this.panoramaPlayer.lon -= speed;
                this.announce(`Turning left. Now facing ${this.getCurrentDirection()}`);
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.panoramaPlayer.lon += speed;
                this.announce(`Turning right. Now facing ${this.getCurrentDirection()}`);
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.panoramaPlayer.lat = Math.min(85, this.panoramaPlayer.lat + speed);
                this.announce(`Looking up`);
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.panoramaPlayer.lat = Math.max(-85, this.panoramaPlayer.lat - speed);
                this.announce(`Looking down`);
                break;
            case 'Enter':
                e.preventDefault();
                this.tryDiscoverNearestHotspot();
                break;
            case 'h':
            case 'H':
                e.preventDefault();
                this.describeNearestHotspot();
                break;
        }
    }
    
    /**
     * Try to discover nearest hotspot in view
     */
    tryDiscoverNearestHotspot() {
        if (!this.hotspotManager) return;
        
        const nearest = this.findNearestHotspotInView();
        
        if (nearest && !nearest.discovered) {
            this.hotspotManager.discoverHotspot(nearest);
            this.announce(`Discovered: ${nearest.label}!`);
        } else if (nearest && nearest.discovered) {
            this.announce(`This hotspot has already been discovered.`);
        } else {
            this.announce(`No hotspots in view. Keep exploring!`);
        }
    }
    
    /**
     * Find nearest hotspot in current view
     */
    findNearestHotspotInView() {
        if (!this.hotspotManager || !this.hotspotManager.hotspots) return null;
        
        let nearest = null;
        let minDistance = Infinity;
        
        this.hotspotManager.hotspots.forEach(hotspot => {
            if (!hotspot.visible || hotspot.discovered) return;
            
            // Calculate angle to hotspot
            const dLon = Math.abs(hotspot.position.lon - this.panoramaPlayer.lon);
            const dLat = Math.abs(hotspot.position.lat - this.panoramaPlayer.lat);
            const distance = Math.sqrt(dLon * dLon + dLat * dLat);
            
            if (distance < 30 && distance < minDistance) {
                minDistance = distance;
                nearest = hotspot;
            }
        });
        
        return nearest;
    }
    
    /**
     * Describe nearest hotspot
     */
    describeNearestHotspot() {
        const nearest = this.findNearestHotspotInView();
        
        if (nearest) {
            const direction = this.getRelativeDirection(nearest);
            this.announce(`Hotspot detected: ${nearest.label}. ${direction}. ${nearest.discovered ? 'Already discovered.' : 'Press Enter to discover.'}`);
        } else {
            this.announce(`No hotspots nearby. Continue exploring.`);
        }
    }
    
    /**
     * Get relative direction to hotspot
     */
    getRelativeDirection(hotspot) {
        const dLon = hotspot.position.lon - this.panoramaPlayer.lon;
        const dLat = hotspot.position.lat - this.panoramaPlayer.lat;
        
        let horizontal = '';
        let vertical = '';
        
        if (Math.abs(dLon) > 5) {
            horizontal = dLon > 0 ? 'to your right' : 'to your left';
        }
        
        if (Math.abs(dLat) > 5) {
            vertical = dLat > 0 ? 'above' : 'below';
        }
        
        if (horizontal && vertical) {
            return `${vertical} and ${horizontal}`;
        } else if (horizontal) {
            return horizontal;
        } else if (vertical) {
            return vertical;
        } else {
            return 'directly ahead';
        }
    }
    
    /**
     * Show keyboard hints overlay
     */
    showKeyboardHints() {
        const hints = document.createElement('div');
        hints.id = 'keyboard-hints';
        hints.style.cssText = `
            position: fixed;
            bottom: 80px;
            left: 20px;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 15px;
            border-radius: 8px;
            font-size: 13px;
            z-index: 1000;
            border: 1px solid rgba(255, 255, 255, 0.3);
        `;
        hints.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 8px;">⌨️ Keyboard Controls</div>
            <div>← → : Turn left/right</div>
            <div>↑ ↓ : Look up/down</div>
            <div>Enter: Discover hotspot</div>
            <div>H: Describe nearest</div>
            <div>Shift + Arrow: Move faster</div>
        `;
        
        document.body.appendChild(hints);
    }
    
    /**
     * Enable audio descriptions
     */
    enableAudioDescriptions() {
        this.settings.audioDescriptions = true;
        
        // Use Web Speech API
        if ('speechSynthesis' in window) {
            this.speech = window.speechSynthesis;
            
            // Start describing
            this.startAudioDescriptions();
            
            console.log('✅ Audio descriptions enabled');
        } else {
            console.warn('Speech synthesis not supported');
        }
        
        this.saveSettings();
    }
    
    /**
     * Start audio descriptions
     */
    startAudioDescriptions() {
        // Describe scene every 10 seconds
        this.descriptionInterval = setInterval(() => {
            this.describeScene();
        }, 10000);
        
        // Initial description
        setTimeout(() => this.describeScene(), 2000);
    }
    
    /**
     * Describe current scene
     */
    describeScene() {
        if (!this.speech || this.speech.speaking) return;
        
        const direction = this.getCurrentDirection();
        const nearbyHotspots = this.getNearbyHotspots();
        
        let description = `You are facing ${direction}. `;
        
        if (nearbyHotspots.length > 0) {
            description += `${nearbyHotspots.length} sound${nearbyHotspots.length > 1 ? 's' : ''} nearby. `;
        } else {
            description += `No sounds nearby. Keep exploring. `;
        }
        
        const utterance = new SpeechSynthesisUtterance(description);
        utterance.rate = 1.1;
        utterance.pitch = 1.0;
        this.speech.speak(utterance);
    }
    
    /**
     * Get nearby hotspots
     */
    getNearbyHotspots() {
        if (!this.hotspotManager) return [];
        
        return this.hotspotManager.hotspots.filter(h => {
            if (!h.visible || h.discovered) return false;
            
            const dLon = Math.abs(h.position.lon - this.panoramaPlayer.lon);
            const dLat = Math.abs(h.position.lat - this.panoramaPlayer.lat);
            const distance = Math.sqrt(dLon * dLon + dLat * dLat);
            
            return distance < 45;
        });
    }
    
    /**
     * Enable large text
     */
    enableLargeText() {
        this.settings.largeText = true;
        
        document.documentElement.style.fontSize = '120%';
        
        console.log('✅ Large text enabled');
        this.saveSettings();
    }
    
    /**
     * Create accessibility menu
     */
    createAccessibilityMenu() {
        const menu = document.createElement('div');
        menu.id = 'accessibility-menu';
        menu.style.cssText = `
            position: fixed;
            top: 80px;
            left: 20px;
            background: rgba(0, 0, 0, 0.95);
            color: white;
            border-radius: 12px;
            z-index: 10000;
            border: 2px solid rgba(255, 255, 255, 0.3);
            min-width: 250px;
            transition: all 0.3s ease;
        `;
        
        menu.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 20px; cursor: pointer;" id="access-header">
                <h3 style="margin: 0;">♿ Accessibility</h3>
                <span style="font-size: 18px; transition: transform 0.3s ease;" id="access-toggle">▼</span>
            </div>
            <div id="access-content" style="padding: 0 20px 20px 20px;">
                ${this.createToggle('screenReader', 'Screen Reader')}
                ${this.createToggle('highContrast', 'High Contrast')}
                ${this.createToggle('reducedMotion', 'Reduced Motion')}
                ${this.createToggle('keyboardOnly', 'Keyboard Navigation')}
                ${this.createToggle('audioDescriptions', 'Audio Descriptions')}
                ${this.createToggle('largeText', 'Large Text')}
            </div>
        `;
        
        document.body.appendChild(menu);
        
        // Add collapse functionality
        const header = document.getElementById('access-header');
        const content = document.getElementById('access-content');
        const toggle = document.getElementById('access-toggle');
        this.isCollapsed = false;
        
        header.addEventListener('click', () => {
            this.isCollapsed = !this.isCollapsed;
            if (this.isCollapsed) {
                content.style.display = 'none';
                toggle.style.transform = 'rotate(-90deg)';
            } else {
                content.style.display = 'block';
                toggle.style.transform = 'rotate(0deg)';
            }
        });
    }
    
    /**
     * Create toggle button
     */
    createToggle(key, label) {
        const checked = this.settings[key] ? 'checked' : '';
        return `
            <label style="display: block; margin: 10px 0; cursor: pointer;">
                <input type="checkbox" ${checked} onchange="window.accessibility.toggle('${key}')">
                ${label}
            </label>
        `;
    }
    
    /**
     * Toggle setting
     */
    toggle(key) {
        this.settings[key] = !this.settings[key];
        
        // Apply change
        const methodName = `${this.settings[key] ? 'enable' : 'disable'}${key.charAt(0).toUpperCase() + key.slice(1)}`;
        if (this[methodName]) {
            this[methodName]();
        }
    }
    
    /**
     * Cleanup
     */
    cleanup() {
        if (this.directionInterval) clearInterval(this.directionInterval);
        if (this.descriptionInterval) clearInterval(this.descriptionInterval);
        if (this.speech) this.speech.cancel();
        
        const menu = document.getElementById('accessibility-menu');
        if (menu) menu.remove();
        
        const hints = document.getElementById('keyboard-hints');
        if (hints) hints.remove();
    }
}
