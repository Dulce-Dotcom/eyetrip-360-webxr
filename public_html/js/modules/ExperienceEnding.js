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
        
        // Check if we have affirmation audio to download
        const hasAffirmations = this.checkForAffirmationAudio();
        
        return `
            <div class="ending-card">
                <div class="ending-header">
                    <div class="ending-icon">🎉</div>
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
                
                ${hasAffirmations ? `
                    <div class="ending-download">
                        <button class="ending-btn download" id="downloadAffirmationsBtn">
                            <span class="btn-icon">💾</span>
                            <span class="btn-text">Download My Affirmations</span>
                        </button>
                        <p class="download-hint">Save your personalized audio to listen anytime</p>
                    </div>
                ` : ''}
                
                ${recommendations.length > 0 ? `
                    <div class="ending-recommendations">
                        <h3>Explore More</h3>
                        <div class="rec-grid">
                            ${recommendations.map(rec => `
                                <a href="${rec.url}" class="rec-card">
                                    <div class="rec-info">
                                        <div class="rec-icon">${rec.icon}</div>
                                        <div class="rec-title">${rec.title}</div>
                                    </div>
                                </a>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                
                <div class="ending-actions">
                    <button class="ending-btn primary" onclick="location.href='gallery.html'">
                        Back to Gallery
                    </button>
                    <button class="ending-btn secondary" id="replayBtn">
                        Replay
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
        const downloadBtn = document.getElementById('downloadAffirmationsBtn');
        
        if (replayBtn) {
            replayBtn.addEventListener('click', () => this.replay());
        }
        
        if (continueBtn) {
            continueBtn.addEventListener('click', () => this.continue());
        }
        
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => this.downloadAffirmations());
        }
    }
    
    /**
     * Check if affirmation audio is available
     */
    checkForAffirmationAudio() {
        try {
            const data = sessionStorage.getItem('affirmationData');
            console.log('🔍 Checking for affirmation audio...', !!data);
            if (!data) return false;
            
            const parsed = JSON.parse(data);
            console.log('📦 Parsed data:', {
                hasFullAudio: !!parsed.fullAudio,
                hasAudioDataBase64: !!(parsed.fullAudio && parsed.fullAudio.audioDataBase64),
                hasBase64: !!(parsed.fullAudio && parsed.fullAudio.base64),
                hasUrl: !!(parsed.fullAudio && parsed.fullAudio.url)
            });
            return !!(parsed.fullAudio && (parsed.fullAudio.audioDataBase64 || parsed.fullAudio.base64 || parsed.fullAudio.url));
        } catch (e) {
            console.error('Error checking for affirmation audio:', e);
            return false;
        }
    }
    
    /**
     * Download affirmations as MP3
     */
    async downloadAffirmations() {
        console.log('💾 Downloading affirmations...');
        
        try {
            const data = sessionStorage.getItem('affirmationData');
            if (!data) {
                console.error('No affirmation data found');
                return;
            }
            
            const parsed = JSON.parse(data);
            const fullAudio = parsed.fullAudio;
            
            if (!fullAudio) {
                console.error('No full audio found in data');
                return;
            }
            
            let audioBlob;
            
            // Check if we have base64 data (stored as audioDataBase64 or base64)
            const base64Data = fullAudio.audioDataBase64 || fullAudio.base64;
            if (base64Data) {
                console.log('📦 Converting base64 to blob...');
                const base64Content = base64Data.split(',')[1];
                const binaryData = atob(base64Content);
                const bytes = new Uint8Array(binaryData.length);
                for (let i = 0; i < binaryData.length; i++) {
                    bytes[i] = binaryData.charCodeAt(i);
                }
                audioBlob = new Blob([bytes], { type: 'audio/mpeg' });
            } else if (fullAudio.url) {
                console.log('🔗 Using existing URL...');
                // If we have a URL (blob URL), fetch it
                const response = await fetch(fullAudio.url);
                audioBlob = await response.blob();
            } else {
                console.error('No audio data available for download');
                return;
            }
            
            // Create download link
            const url = URL.createObjectURL(audioBlob);
            const a = document.createElement('a');
            a.href = url;
            
            // Generate filename with timestamp
            const timestamp = new Date().toISOString().split('T')[0];
            const mood = parsed.metadata?.mood || 'custom';
            a.download = `eyetripvr_affirmations_${mood}_${timestamp}.mp3`;
            
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            // Clean up URL
            setTimeout(() => URL.revokeObjectURL(url), 100);
            
            console.log('✅ Download initiated!');
            
            // Track download
            if (window.trackVREvent) {
                window.trackVREvent('affirmations_downloaded', mood, 1);
            }
        } catch (error) {
            console.error('❌ Error downloading affirmations:', error);
            alert('Sorry, there was an error downloading your affirmations. Please try again.');
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
