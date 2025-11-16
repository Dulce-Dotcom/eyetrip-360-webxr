/**
 * AffirmationSurvey.js
 * Collects user preferences for personalized affirmation generation
 * 3-question survey: emotional tone, current mood, focus area
 */

export class AffirmationSurvey {
    constructor() {
        this.responses = {
            emotionalTone: null,
            currentMood: null,
            focusArea: null
        };
        
        this.onCompleteCallback = null;
    }
    
    /**
     * Display the survey overlay
     * @param {Function} onComplete - Callback when survey is completed
     */
    show(onComplete) {
        this.onCompleteCallback = onComplete;
        
        const overlay = document.createElement('div');
        overlay.className = 'affirmation-survey-overlay';
        overlay.id = 'affirmation-survey';
        overlay.innerHTML = `
            <div class="survey-card">
                <div class="survey-header">
                    <h2>✨ Personalize Your Affirmation Journey</h2>
                    <p>We'll create unique affirmations just for you using AI voice synthesis</p>
                    <div class="elevenlabs-badge">
                        <span>Powered by</span>
                        <strong>ElevenLabs</strong>
                    </div>
                </div>
                
                <div class="survey-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: 0%"></div>
                    </div>
                    <span class="progress-text">Question 1 of 3</span>
                </div>
                
                <!-- Question 1: Emotional Tone -->
                <div class="survey-question active" data-question="1">
                    <h3>What emotional tone resonates with you?</h3>
                    <div class="survey-options">
                        <button class="option-btn" data-key="emotionalTone" data-value="calming">
                            <span class="option-icon">🌊</span>
                            <span class="option-label">Calming & Peaceful</span>
                            <span class="option-desc">Soothing, slow, gentle</span>
                        </button>
                        <button class="option-btn" data-key="emotionalTone" data-value="grounding">
                            <span class="option-icon">🏔️</span>
                            <span class="option-label">Grounding & Steady</span>
                            <span class="option-desc">Stable, firm, reassuring</span>
                        </button>
                        <button class="option-btn" data-key="emotionalTone" data-value="energizing">
                            <span class="option-icon">⚡</span>
                            <span class="option-label">Energizing & Uplifting</span>
                            <span class="option-desc">Strong, upbeat, vibrant</span>
                        </button>
                        <button class="option-btn" data-key="emotionalTone" data-value="uplifting">
                            <span class="option-icon">🌟</span>
                            <span class="option-label">Uplifting & Joyful</span>
                            <span class="option-desc">Bright, hopeful, inspiring</span>
                        </button>
                        <button class="option-btn" data-key="emotionalTone" data-value="meditative">
                            <span class="option-icon">🧘</span>
                            <span class="option-label">Meditative & Deep</span>
                            <span class="option-desc">Contemplative, mindful, serene</span>
                        </button>
                        <button class="option-btn" data-key="emotionalTone" data-value="transformative">
                            <span class="option-icon">🦋</span>
                            <span class="option-label">Transformative & Bold</span>
                            <span class="option-desc">Dynamic, powerful, evolving</span>
                        </button>
                    </div>
                </div>
                
                <!-- Question 2: Current Mood -->
                <div class="survey-question" data-question="2">
                    <h3>How are you feeling right now?</h3>
                    <div class="survey-options">
                        <button class="option-btn" data-key="currentMood" data-value="anxious">
                            <span class="option-icon">😰</span>
                            <span class="option-label">Anxious or Worried</span>
                            <span class="option-desc">Need to calm down</span>
                        </button>
                        <button class="option-btn" data-key="currentMood" data-value="stressed">
                            <span class="option-icon">�</span>
                            <span class="option-label">Stressed or Overwhelmed</span>
                            <span class="option-desc">Need relief</span>
                        </button>
                        <button class="option-btn" data-key="currentMood" data-value="tired">
                            <span class="option-icon">😴</span>
                            <span class="option-label">Tired or Drained</span>
                            <span class="option-desc">Need energy boost</span>
                        </button>
                        <button class="option-btn" data-key="currentMood" data-value="sad">
                            <span class="option-icon">😢</span>
                            <span class="option-label">Sad or Down</span>
                            <span class="option-desc">Need uplifting</span>
                        </button>
                        <button class="option-btn" data-key="currentMood" data-value="peaceful">
                            <span class="option-icon">😌</span>
                            <span class="option-label">Peaceful & Calm</span>
                            <span class="option-desc">Want to deepen</span>
                        </button>
                        <button class="option-btn" data-key="currentMood" data-value="restless">
                            <span class="option-icon">🤔</span>
                            <span class="option-label">Restless or Uncertain</span>
                            <span class="option-desc">Need direction</span>
                        </button>
                        <button class="option-btn" data-key="currentMood" data-value="motivated">
                            <span class="option-icon">🔥</span>
                            <span class="option-label">Motivated & Ready</span>
                            <span class="option-desc">Ready to grow</span>
                        </button>
                        <button class="option-btn" data-key="currentMood" data-value="hopeful">
                            <span class="option-icon">🌟</span>
                            <span class="option-label">Hopeful & Optimistic</span>
                            <span class="option-desc">Embracing possibility</span>
                        </button>
                    </div>
                </div>
                
                <!-- Question 3: Focus Area -->
                <div class="survey-question" data-question="3">
                    <h3>What do you want to focus on today?</h3>
                    <div class="survey-options">
                        <button class="option-btn" data-key="focusArea" data-value="self-love">
                            <span class="option-icon">💝</span>
                            <span class="option-label">Self-Love</span>
                            <span class="option-desc">Acceptance & worthiness</span>
                        </button>
                        <button class="option-btn" data-key="focusArea" data-value="confidence">
                            <span class="option-icon">💪</span>
                            <span class="option-label">Confidence</span>
                            <span class="option-desc">Belief & empowerment</span>
                        </button>
                        <button class="option-btn" data-key="focusArea" data-value="gratitude">
                            <span class="option-icon">🙏</span>
                            <span class="option-label">Gratitude</span>
                            <span class="option-desc">Appreciation & joy</span>
                        </button>
                        <button class="option-btn" data-key="focusArea" data-value="resilience">
                            <span class="option-icon">🌱</span>
                            <span class="option-label">Resilience</span>
                            <span class="option-desc">Strength & perseverance</span>
                        </button>
                    </div>
                </div>
                
                <div class="survey-navigation">
                    <button class="nav-btn back-btn" style="visibility: hidden;">
                        ← Back
                    </button>
                    <button class="nav-btn next-btn" disabled>
                        Next →
                    </button>
                    <button class="nav-btn create-btn" style="display: none;">
                        Create My Experience ✨
                    </button>
                </div>
            </div>
        `;
        
        // Append directly to body and force it to be on top
        document.body.appendChild(overlay);
        
        // Force scroll to top and lock body
        window.scrollTo(0, 0);
        document.body.style.overflow = 'hidden';
        
        this.attachEventListeners(overlay);
        
        // Fade in animation
        setTimeout(() => {
            overlay.classList.add('visible');
            console.log('📋 Survey visible class added, checking position...');
            const rect = overlay.getBoundingClientRect();
            console.log('📍 Survey position:', {
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height,
                zIndex: window.getComputedStyle(overlay).zIndex
            });
        }, 10);
        
        console.log('📋 Affirmation survey displayed');
    }
    
    /**
     * Attach event listeners to survey elements
     */
    attachEventListeners(overlay) {
        const questions = overlay.querySelectorAll('.survey-question');
        const nextBtn = overlay.querySelector('.next-btn');
        const backBtn = overlay.querySelector('.back-btn');
        const createBtn = overlay.querySelector('.create-btn');
        const progressFill = overlay.querySelector('.progress-fill');
        const progressText = overlay.querySelector('.progress-text');
        
        let currentQuestion = 1;
        
        // Option button click handler
        overlay.addEventListener('click', (e) => {
            const optionBtn = e.target.closest('.option-btn');
            if (!optionBtn) return;
            
            const key = optionBtn.dataset.key;
            const value = optionBtn.dataset.value;
            
            // Deselect others in this question
            const questionDiv = optionBtn.closest('.survey-question');
            questionDiv.querySelectorAll('.option-btn').forEach(btn => {
                btn.classList.remove('selected');
            });
            
            // Select this option
            optionBtn.classList.add('selected');
            
            // Store response
            this.responses[key] = value;
            
            console.log(`✅ Selected ${key}: ${value}`);
            
            // Enable next/create button
            if (currentQuestion < 3) {
                nextBtn.disabled = false;
            } else {
                createBtn.disabled = false;
            }
        });
        
        // Next button
        nextBtn.addEventListener('click', () => {
            if (currentQuestion < 3) {
                // Hide current question
                questions[currentQuestion - 1].classList.remove('active');
                
                // Show next question
                currentQuestion++;
                questions[currentQuestion - 1].classList.add('active');
                
                // Update progress
                const progress = (currentQuestion / 3) * 100;
                progressFill.style.width = `${progress}%`;
                progressText.textContent = `Question ${currentQuestion} of 3`;
                
                // Update navigation buttons
                backBtn.style.visibility = 'visible';
                nextBtn.disabled = !this.responses[['emotionalTone', 'currentMood', 'focusArea'][currentQuestion - 1]];
                
                // Show create button on last question
                if (currentQuestion === 3) {
                    nextBtn.style.display = 'none';
                    createBtn.style.display = 'block';
                    createBtn.disabled = !this.responses.focusArea;
                }
                
                // Scroll to top of question
                questions[currentQuestion - 1].scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
        
        // Back button
        backBtn.addEventListener('click', () => {
            if (currentQuestion > 1) {
                // Hide current question
                questions[currentQuestion - 1].classList.remove('active');
                
                // Show previous question
                currentQuestion--;
                questions[currentQuestion - 1].classList.add('active');
                
                // Update progress
                const progress = (currentQuestion / 3) * 100;
                progressFill.style.width = `${progress}%`;
                progressText.textContent = `Question ${currentQuestion} of 3`;
                
                // Update navigation buttons
                if (currentQuestion === 1) {
                    backBtn.style.visibility = 'hidden';
                }
                
                nextBtn.style.display = 'block';
                nextBtn.disabled = false;
                createBtn.style.display = 'none';
                
                // Scroll to top of question
                questions[currentQuestion - 1].scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
        
        // Create button
        createBtn.addEventListener('click', () => {
            if (this.isComplete()) {
                console.log('✅ Survey complete:', this.responses);
                this.complete(overlay);
            }
        });
    }
    
    /**
     * Check if all questions are answered
     */
    isComplete() {
        return Object.values(this.responses).every(r => r !== null);
    }
    
    /**
     * Complete the survey and trigger callback
     */
    complete(overlay) {
        // Show loading state
        const card = overlay.querySelector('.survey-card');
        card.innerHTML = `
            <div class="survey-loading">
                <div class="loading-spinner"></div>
                <h2>Crafting Your Personalized Affirmations...</h2>
                <p>Using AI to create unique voice affirmations just for you</p>
                <div class="loading-stats">
                    <div class="stat">
                        <strong>✨ Tone:</strong> ${this.responses.emotionalTone}
                    </div>
                    <div class="stat">
                        <strong>💭 Mood:</strong> ${this.responses.currentMood}
                    </div>
                    <div class="stat">
                        <strong>🎯 Focus:</strong> ${this.responses.focusArea}
                    </div>
                </div>
                
                <!-- PHASE 1: Progress Indicator -->
                <div class="generation-progress">
                    <div class="progress-bar-container">
                        <div class="progress-bar-fill" id="generation-progress-fill" style="width: 0%"></div>
                    </div>
                    <div class="progress-message" id="generation-progress-message">Initializing...</div>
                    <div class="progress-details" id="generation-progress-details">
                        <div class="detail-item">
                            <span class="detail-icon">🎤</span>
                            <span class="detail-text">API Status: <span id="api-status">Connecting...</span></span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-icon">💾</span>
                            <span class="detail-text">Cache: <span id="cache-status">Checking...</span></span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-icon">⏱️</span>
                            <span class="detail-text">Elapsed: <span id="elapsed-time">0s</span></span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Start elapsed time counter
        const startTime = Date.now();
        const timerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            const elapsedEl = document.getElementById('elapsed-time');
            if (elapsedEl) {
                elapsedEl.textContent = `${elapsed}s`;
            } else {
                clearInterval(timerInterval);
            }
        }, 1000);
        
        // Trigger callback with responses
        if (this.onCompleteCallback) {
            setTimeout(() => {
                this.onCompleteCallback(this.responses, {
                    updateProgress: (message, percent) => {
                        const fillEl = document.getElementById('generation-progress-fill');
                        const messageEl = document.getElementById('generation-progress-message');
                        
                        if (fillEl) fillEl.style.width = `${percent}%`;
                        if (messageEl) messageEl.textContent = message;
                    },
                    updateApiStatus: (status) => {
                        const apiEl = document.getElementById('api-status');
                        if (apiEl) apiEl.textContent = status;
                    },
                    updateCacheStatus: (status) => {
                        const cacheEl = document.getElementById('cache-status');
                        if (cacheEl) cacheEl.textContent = status;
                    }
                });
            }, 1000);
        }
    }
    
    /**
     * Hide the survey
     */
    hide() {
        const overlay = document.querySelector('.affirmation-survey-overlay');
        if (overlay) {
            overlay.classList.remove('visible');
            setTimeout(() => {
                overlay.remove();
                // Restore body scroll
                document.body.style.overflow = '';
            }, 300);
        }
    }
    
    /**
     * Reset survey responses
     */
    reset() {
        this.responses = {
            emotionalTone: null,
            currentMood: null,
            focusArea: null
        };
    }
}
