import * as THREE from 'three';

/**
 * IntroSequence - Professional intro animation for EyeTrip VR
 * Cinematic fade-in with title, instructions, and smooth transitions
 */
export class IntroSequence {
    constructor(container, onComplete) {
        this.container = container;
        this.onComplete = onComplete;
        this.isSkipped = false;
        this.isPlaying = false;
        
        // Timing configuration
        this.timings = {
            fadeInDuration: 1500,      // Logo fade in
            titleHoldDuration: 2000,   // Hold on title
            instructionsDuration: 3000, // Show instructions
            fadeOutDuration: 1000      // Fade to experience
        };
        
        // DOM elements
        this.introOverlay = null;
        this.logoElement = null;
        this.titleElement = null;
        this.instructionsElement = null;
        this.skipButton = null;
        
        console.log('🎬 IntroSequence initialized');
        
        // Auto-start the intro
        this.play();
    }
    
    /**
     * Create intro sequence DOM elements
     */
    createIntroElements() {
        // Main overlay
        this.introOverlay = document.createElement('div');
        this.introOverlay.id = 'intro-overlay';
        this.introOverlay.innerHTML = `
            <div class="intro-content">
                <!-- Logo Section -->
                <div class="intro-logo-container">
                    <img src="images/eyetripimagesvr-wide.svg?v=2" alt="EyeTripVR" class="intro-logo">
                    <p class="intro-subtitle">Immersive 360° Audio-Visual Experience</p>
                </div>
                
                <!-- Instructions and Button Section -->
                <div class="intro-main-section">
                    <div class="intro-instructions">
                        <div class="instruction-item">
                            <span class="instruction-icon">🖱️</span>
                            <span class="instruction-text"><strong>Desktop:</strong> Click & drag to look around</span>
                        </div>
                        <div class="instruction-item">
                            <span class="instruction-icon">👆</span>
                            <span class="instruction-text"><strong>Mobile:</strong> Touch & drag to explore</span>
                        </div>
                        <div class="instruction-item">
                            <span class="instruction-icon">🥽</span>
                            <span class="instruction-text"><strong>VR:</strong> Use controller trigger to interact</span>
                        </div>
                        <div class="instruction-item instruction-highlight">
                            <span class="instruction-icon">🎵</span>
                            <span class="instruction-text"><strong>Find 10 hidden sounds</strong> throughout the experience</span>
                        </div>
                    </div>
                    
                    <!-- Action Button -->
                    <div class="intro-actions">
                        <button class="intro-button intro-start-btn" id="intro-start-btn">
                            <span class="button-icon">▶</span>
                            Start Experience
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Skip Button (top right) -->
            <button class="intro-skip-btn" id="intro-skip-btn">Skip Intro ⏩</button>
        `;
        
        document.body.appendChild(this.introOverlay);
        
        // Get references
        this.logoElement = this.introOverlay.querySelector('.intro-logo-container');
        this.instructionsElement = this.introOverlay.querySelector('.intro-instructions');
        this.skipButton = this.introOverlay.querySelector('#intro-skip-btn');
        this.startButton = this.introOverlay.querySelector('#intro-start-btn');
        
        // Add event listeners
        this.skipButton.addEventListener('click', () => this.skip());
        this.startButton.addEventListener('click', () => this.start());
        
        console.log('✨ Intro elements created');
    }
    
    /**
     * Play intro sequence
     */
    async play() {
        if (this.isPlaying) return;
        
        this.isPlaying = true;
        this.createIntroElements();
        
        console.log('🎬 Playing intro sequence...');
        
        // Initial state - everything hidden
        this.introOverlay.style.opacity = '0';
        this.logoElement.style.opacity = '0';
        this.logoElement.style.transform = 'translateY(30px) scale(0.9)';
        this.instructionsElement.style.opacity = '0';
        this.instructionsElement.style.transform = 'translateY(20px)';
        
        // Wait for DOM to be ready
        await this.wait(100);
        
        // Fade in overlay
        this.introOverlay.style.transition = 'opacity 0.5s ease';
        this.introOverlay.style.opacity = '1';
        
        await this.wait(300);
        
        // Animate logo/title in
        this.logoElement.style.transition = 'all 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
        this.logoElement.style.opacity = '1';
        this.logoElement.style.transform = 'translateY(0) scale(1)';
        
        await this.wait(this.timings.fadeInDuration);
        
        // Show instructions with stagger
        await this.animateInstructions();
        
        // Wait for user interaction (start button or skip)
        console.log('⏸️ Waiting for user to start...');
    }
    
    /**
     * Animate instructions in with stagger effect
     */
    async animateInstructions() {
        this.instructionsElement.style.transition = 'all 1s cubic-bezier(0.34, 1.56, 0.64, 1)';
        this.instructionsElement.style.opacity = '1';
        this.instructionsElement.style.transform = 'translateY(0)';
        
        // Stagger individual instruction items
        const items = this.instructionsElement.querySelectorAll('.instruction-item');
        for (let i = 0; i < items.length; i++) {
            await this.wait(150);
            items[i].style.opacity = '0';
            items[i].style.transform = 'translateX(-20px)';
            items[i].style.transition = 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
            
            // Trigger animation
            await this.wait(50);
            items[i].style.opacity = '1';
            items[i].style.transform = 'translateX(0)';
        }
    }
    
    /**
     * Start experience (user clicked start button)
     */
    async start() {
        if (this.isSkipped) return;
        
        console.log('🚀 User clicked Start - beginning experience...');
        
        // Track intro start
        if (window.trackVREvent) {
            window.trackVREvent('intro_completed', 'started_experience', 1);
        }
        
        // Mark intro as seen for this session
        sessionStorage.setItem('eyetripvr_intro_seen', 'true');
        
        // DON'T set autoPlayVideo flag on first visit - user should click play button
        // sessionStorage.setItem('autoPlayVideo', 'true');
        
        // Call the callback BEFORE fading out
        if (this.onComplete) {
            this.onComplete();
        }
        
        // Then fade out the intro
        await this.fadeOut();
    }
    
    /**
     * Skip intro sequence
     */
    async skip() {
        if (this.isSkipped) return;
        
        console.log('⏩ User skipped intro...');
        this.isSkipped = true;
        
        // Track intro skip
        if (window.trackVREvent) {
            window.trackVREvent('intro_skipped', 'skipped_intro', 1);
        }
        
        // Mark intro as seen for this session
        sessionStorage.setItem('eyetripvr_intro_seen', 'true');
        
        // DON'T set autoPlayVideo flag on first visit - user should click play button
        // sessionStorage.setItem('autoPlayVideo', 'true');
        
        // Call the callback BEFORE fading out
        if (this.onComplete) {
            this.onComplete();
        }
        
        // Then fade out quickly
        await this.fadeOut();
    }
    
    /**
     * Fade out intro and start experience
     */
    async fadeOut() {
        // Fade out all elements
        this.introOverlay.style.transition = `opacity ${this.timings.fadeOutDuration}ms ease`;
        this.introOverlay.style.opacity = '0';
        
        await this.wait(this.timings.fadeOutDuration);
        
        // Remove from DOM
        if (this.introOverlay && this.introOverlay.parentNode) {
            this.introOverlay.parentNode.removeChild(this.introOverlay);
        }
        
        this.isPlaying = false;
        
        // Don't call onComplete here - it's already called in start()
    }
    
    /**
     * Utility: Wait for specified milliseconds
     */
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * Check if intro should be shown (first visit, etc.)
     */
    static shouldShowIntro() {
        // Check if user has seen intro this session
        const hasSeenIntro = sessionStorage.getItem('eyetripvr_intro_seen');
        if (hasSeenIntro) {
            console.log('🔄 Intro already seen this session - skipping');
            return false;
        }
        
        console.log('✨ First visit this session - showing intro');
        return true;
    }
    
    /**
     * Reset intro state (for testing)
     */
    static resetIntro() {
        sessionStorage.removeItem('eyetripvr_intro_seen');
        console.log('🔄 Intro state reset');
    }
}
