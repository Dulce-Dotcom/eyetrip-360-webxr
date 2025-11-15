/**
 * ExperienceEnding.js
 * Handles graceful endings and transitions between experiences
 */

export class ExperienceEnding {
    constructor(player, achievements) {
        this.player = player;
        this.achievements = achievements;
        this.isShowing = false;
        this.videoListenerAttached = false;
        this.setupTriggers();
        console.log('🎬 Experience Ending system initialized');
    }
    
    /**
     * Set up ending triggers
     */
    setupTriggers() {
        // Video completion trigger - use polling to catch when video is loaded
        this.setupVideoTrigger();
        
        // ESC key trigger
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.isShowing) {
                this.showEnding('manual');
            }
        });
    }
    
    /**
     * Set up video completion trigger (handles late video loading)
     */
    setupVideoTrigger() {
        // Try to attach listener immediately
        if (this.player.video) {
            this.attachVideoListener();
            return;
        }
        
        // Poll for video element if not available yet
        const checkInterval = setInterval(() => {
            if (this.player.video) {
                this.attachVideoListener();
                clearInterval(checkInterval);
                console.log('🎬 Video listener attached');
            }
        }, 500); // Check every 500ms
        
        // Stop polling after 10 seconds
        setTimeout(() => clearInterval(checkInterval), 10000);
    }
    
    /**
     * Attach the timeupdate listener to video
     */
    attachVideoListener() {
        if (this.videoListenerAttached) return;
        
        this.player.video.addEventListener('timeupdate', () => {
            this.checkVideoCompletion();
        });
        
        this.videoListenerAttached = true;
    }
    
    /**
     * Check if video is near completion
     */
    checkVideoCompletion() {
        if (!this.player.video || this.isShowing) return;
        
        const timeRemaining = this.player.video.duration - this.player.video.currentTime;
        
        // Show ending 5 seconds before video ends
        if (timeRemaining <= 5 && timeRemaining > 0) {
            this.showEnding('complete');
        }
    }
    
    /**
     * Show ending overlay
     */
    showEnding(type = 'complete') {
        if (this.isShowing) return;
        
        this.isShowing = true;
        
        // Pause video
        if (this.player.video && !this.player.video.paused) {
            this.player.video.pause();
        }
        
        // Track ending view
        if (window.trackVREvent) {
            window.trackVREvent('experience_ended', type, 1);
        }
        
        // Create ending overlay
        const overlay = this.createEndingOverlay(type);
        document.body.appendChild(overlay);
        
        // Fade in
        setTimeout(() => overlay.classList.add('show'), 100);
    }
    
    /**
     * Create ending overlay HTML
     */
    createEndingOverlay(type) {
        const overlay = document.createElement('div');
        overlay.className = 'experience-ending-overlay';
        overlay.id = 'experienceEnding';
        
        const content = type === 'complete' 
            ? this.getCompletionContent() 
            : this.getManualExitContent();
        
        overlay.innerHTML = content;
        
        // Add event listeners
        setTimeout(() => this.attachEventListeners(), 100);
        
        return overlay;
    }
    
    /**
     * Get completion ending content
     */
    getCompletionContent() {
        const progress = this.achievements ? this.achievements.getProgress() : { unlocked: 0, total: 4 };
        const recommendations = this.getRecommendations();
        
        return `
            <div class="ending-card">
                <div class="ending-header">
                    <div class="ending-icon">✨</div>
                    <h2 class="ending-title">Journey Complete!</h2>
                    <p class="ending-subtitle">Thank you for experiencing EyeTrip VR</p>
                </div>
                
                <div class="ending-stats">
                    <div class="stat-item">
                        <div class="stat-value">${progress.unlocked}/${progress.total}</div>
                        <div class="stat-label">Achievements</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${this.getHotspotsFound()}/10</div>
                        <div class="stat-label">Sounds Found</div>
                    </div>
                </div>
                
                ${recommendations.length > 0 ? `
                    <div class="ending-recommendations">
                        <h3>Explore More Worlds</h3>
                        <div class="rec-grid">
                            ${recommendations.map(rec => `
                                <a href="${rec.url}" class="rec-card">
                                    <div class="rec-title">${rec.title}</div>
                                    <div class="rec-icon">${rec.icon}</div>
                                </a>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                
                <div class="ending-actions">
                    <button class="ending-btn primary" onclick="location.href='index.html'">
                        Back to Home
                    </button>
                    <button class="ending-btn secondary" id="replayBtn">
                        Replay Experience
                    </button>
                </div>
            </div>
        `;
    }
    
    /**
     * Get manual exit content
     */
    getManualExitContent() {
        return `
            <div class="ending-card">
                <div class="ending-header">
                    <div class="ending-icon">👋</div>
                    <h2 class="ending-title">Leaving So Soon?</h2>
                    <p class="ending-subtitle">Your progress has been saved</p>
                </div>
                
                <div class="ending-actions">
                    <button class="ending-btn primary" onclick="location.href='index.html'">
                        Back to Home
                    </button>
                    <button class="ending-btn secondary" id="continueBtn">
                        Continue Experience
                    </button>
                </div>
            </div>
        `;
    }
    
    /**
     * Get hotspots found count
     */
    getHotspotsFound() {
        if (this.player.hotspotManager) {
            return this.player.hotspotManager.discoveredHotspots.size;
        }
        return 0;
    }
    
    /**
     * Get recommendations for next experiences
     */
    getRecommendations() {
        const currentPage = window.location.pathname;
        const allExperiences = [
            { url: 'video1.html', title: 'Matrix Caracas', icon: '🌃' },
            { url: 'video2.html', title: 'Scraptangle', icon: '🎨' },
            { url: 'video3.html', title: 'Shroom Zoom', icon: '🍄' },
            { url: 'video4.html', title: 'Stumpy Waves', icon: '🌊' }
        ];
        
        // Filter out current experience
        return allExperiences.filter(exp => !currentPage.includes(exp.url));
    }
    
    /**
     * Attach event listeners to buttons
     */
    attachEventListeners() {
        const replayBtn = document.getElementById('replayBtn');
        const continueBtn = document.getElementById('continueBtn');
        
        if (replayBtn) {
            replayBtn.addEventListener('click', () => this.replay());
        }
        
        if (continueBtn) {
            continueBtn.addEventListener('click', () => this.continue());
        }
    }
    
    /**
     * Replay experience
     */
    replay() {
        const overlay = document.getElementById('experienceEnding');
        if (overlay) {
            overlay.classList.remove('show');
            setTimeout(() => overlay.remove(), 300);
        }
        
        this.isShowing = false;
        
        // Reset video to beginning
        if (this.player.video) {
            this.player.video.currentTime = 0;
            this.player.video.play();
        }
        
        // Track replay
        if (window.trackVREvent) {
            window.trackVREvent('experience_replayed', 'user_action', 1);
        }
    }
    
    /**
     * Continue experience
     */
    continue() {
        const overlay = document.getElementById('experienceEnding');
        if (overlay) {
            overlay.classList.remove('show');
            setTimeout(() => overlay.remove(), 300);
        }
        
        this.isShowing = false;
        
        // Resume video
        if (this.player.video) {
            this.player.video.play();
        }
    }
    
    /**
     * Clean up
     */
    dispose() {
        const overlay = document.getElementById('experienceEnding');
        if (overlay) {
            overlay.remove();
        }
    }
}
