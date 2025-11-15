/**
 * AdaptiveDifficulty - Personalized difficulty adjustment system
 * Learns from user behavior and adjusts gameplay parameters
 */
export class AdaptiveDifficulty {
    constructor() {
        this.userSkill = this.loadUserSkill();
        
        // Default adjustments
        this.adjustments = {
            hotspotSize: 1.0,           // Scale multiplier (0.5 = harder, 1.5 = easier)
            proximityRange: 45,          // Degrees for proximity hints (30 = harder, 60 = easier)
            hintFrequency: 'medium',     // 'low', 'medium', 'high'
            timeWindow: 120,             // Seconds hotspot stays visible (90 = harder, 150 = easier)
            audioVolume: 1.0,            // Hotspot audio volume (0.7 = harder, 1.2 = easier)
            glowIntensity: 1.0           // Visual prominence (0.6 = harder, 1.4 = easier)
        };
        
        // Performance tracking
        this.sessionStats = {
            discoveries: [],
            missedHotspots: 0,
            totalTime: 0,
            frustrationEvents: 0,
            perfectionStreak: 0
        };
        
        // Apply saved adjustments
        if (this.userSkill) {
            this.adjustments = { ...this.adjustments, ...this.userSkill };
            console.log('📊 Loaded user skill level:', this.getUserDifficultyLevel());
        } else {
            console.log('📊 New player - starting with medium difficulty');
        }
    }
    
    /**
     * Load user skill from localStorage
     */
    loadUserSkill() {
        try {
            const saved = localStorage.getItem('eyetrip_user_skill');
            return saved ? JSON.parse(saved) : null;
        } catch (e) {
            return null;
        }
    }
    
    /**
     * Save user skill to localStorage
     */
    saveUserSkill() {
        try {
            localStorage.setItem('eyetrip_user_skill', JSON.stringify(this.adjustments));
            console.log('💾 Saved user skill level:', this.getUserDifficultyLevel());
        } catch (e) {
            console.error('Failed to save user skill:', e);
        }
    }
    
    /**
     * Track hotspot discovery
     */
    trackDiscovery(hotspot, timeToDiscover) {
        this.sessionStats.discoveries.push({
            hotspotId: hotspot.id,
            timeToDiscover,
            timestamp: Date.now()
        });
        
        // Check for perfection streak
        if (timeToDiscover < 15) {
            this.sessionStats.perfectionStreak++;
        } else {
            this.sessionStats.perfectionStreak = 0;
        }
        
        console.log(`📈 Discovery tracked: ${timeToDiscover.toFixed(1)}s (streak: ${this.sessionStats.perfectionStreak})`);
    }
    
    /**
     * Track missed hotspot
     */
    trackMissed(hotspot) {
        this.sessionStats.missedHotspots++;
        this.sessionStats.perfectionStreak = 0;
        
        console.log(`❌ Missed hotspot: ${hotspot.label} (total: ${this.sessionStats.missedHotspots})`);
    }
    
    /**
     * Track frustration event (e.g., rapid camera movement, giving up)
     */
    trackFrustration() {
        this.sessionStats.frustrationEvents++;
        
        console.log(`😤 Frustration detected (count: ${this.sessionStats.frustrationEvents})`);
    }
    
    /**
     * Analyze performance and adjust difficulty
     */
    analyzeAndAdjust() {
        if (this.sessionStats.discoveries.length < 3) {
            console.log('📊 Not enough data for adjustment (need 3+ discoveries)');
            return;
        }
        
        // Calculate metrics
        const avgTimePerDiscovery = this.calculateAverageTime();
        const discoveryRate = this.calculateDiscoveryRate();
        const frustrationLevel = this.sessionStats.frustrationEvents;
        const perfectionStreak = this.sessionStats.perfectionStreak;
        
        console.log('📊 Performance Analysis:', {
            avgTime: avgTimePerDiscovery.toFixed(1) + 's',
            rate: (discoveryRate * 100).toFixed(1) + '%',
            frustration: frustrationLevel,
            streak: perfectionStreak
        });
        
        // Determine if player needs harder or easier difficulty
        const needsHarder = this.needsHarderDifficulty(avgTimePerDiscovery, discoveryRate, perfectionStreak);
        const needsEasier = this.needsEasierDifficulty(avgTimePerDiscovery, discoveryRate, frustrationLevel);
        
        if (needsHarder) {
            this.increaseDifficulty();
        } else if (needsEasier) {
            this.decreaseDifficulty();
        } else {
            console.log('✅ Difficulty is well-balanced');
        }
        
        this.saveUserSkill();
    }
    
    /**
     * Calculate average discovery time
     */
    calculateAverageTime() {
        const times = this.sessionStats.discoveries.map(d => d.timeToDiscover);
        return times.reduce((a, b) => a + b, 0) / times.length;
    }
    
    /**
     * Calculate discovery rate (found / total)
     */
    calculateDiscoveryRate() {
        const total = this.sessionStats.discoveries.length + this.sessionStats.missedHotspots;
        return total > 0 ? this.sessionStats.discoveries.length / total : 0;
    }
    
    /**
     * Check if player needs harder difficulty
     */
    needsHarderDifficulty(avgTime, rate, streak) {
        // Player is too good if:
        // - Average time < 10 seconds
        // - Discovery rate > 90%
        // - Perfection streak > 5
        return (avgTime < 10 && rate > 0.9) || streak > 5;
    }
    
    /**
     * Check if player needs easier difficulty
     */
    needsEasierDifficulty(avgTime, rate, frustration) {
        // Player is struggling if:
        // - Average time > 60 seconds
        // - Discovery rate < 50%
        // - Multiple frustration events
        return (avgTime > 60 && rate < 0.5) || frustration > 3;
    }
    
    /**
     * Increase difficulty (make it harder)
     */
    increaseDifficulty() {
        console.log('⬆️ Increasing difficulty...');
        
        // Make hotspots smaller
        this.adjustments.hotspotSize = Math.max(0.5, this.adjustments.hotspotSize * 0.85);
        
        // Reduce proximity range
        this.adjustments.proximityRange = Math.max(25, this.adjustments.proximityRange * 0.8);
        
        // Reduce hint frequency
        if (this.adjustments.hintFrequency === 'high') {
            this.adjustments.hintFrequency = 'medium';
        } else if (this.adjustments.hintFrequency === 'medium') {
            this.adjustments.hintFrequency = 'low';
        }
        
        // Reduce time window
        this.adjustments.timeWindow = Math.max(90, this.adjustments.timeWindow * 0.9);
        
        // Reduce visual prominence
        this.adjustments.glowIntensity = Math.max(0.6, this.adjustments.glowIntensity * 0.85);
        
        console.log('🎯 New difficulty:', this.getUserDifficultyLevel());
    }
    
    /**
     * Decrease difficulty (make it easier)
     */
    decreaseDifficulty() {
        console.log('⬇️ Decreasing difficulty...');
        
        // Make hotspots larger
        this.adjustments.hotspotSize = Math.min(1.6, this.adjustments.hotspotSize * 1.2);
        
        // Increase proximity range
        this.adjustments.proximityRange = Math.min(70, this.adjustments.proximityRange * 1.3);
        
        // Increase hint frequency
        if (this.adjustments.hintFrequency === 'low') {
            this.adjustments.hintFrequency = 'medium';
        } else if (this.adjustments.hintFrequency === 'medium') {
            this.adjustments.hintFrequency = 'high';
        }
        
        // Increase time window
        this.adjustments.timeWindow = Math.min(180, this.adjustments.timeWindow * 1.15);
        
        // Increase visual prominence
        this.adjustments.glowIntensity = Math.min(1.5, this.adjustments.glowIntensity * 1.2);
        
        // Increase audio volume
        this.adjustments.audioVolume = Math.min(1.3, this.adjustments.audioVolume * 1.1);
        
        console.log('🎯 New difficulty:', this.getUserDifficultyLevel());
    }
    
    /**
     * Apply adjustments to a hotspot
     */
    applyToHotspot(hotspot) {
        // Scale size
        if (hotspot.mesh) {
            const baseScale = hotspot.mesh.scale.x;
            hotspot.mesh.scale.multiplyScalar(this.adjustments.hotspotSize);
            
            // Also scale glow layers
            if (hotspot.glowLayers) {
                hotspot.glowLayers.forEach(layer => {
                    layer.scale.multiplyScalar(this.adjustments.hotspotSize);
                });
            }
        }
        
        // Adjust proximity range
        hotspot.proximityRange = this.adjustments.proximityRange;
        
        // Adjust visibility time window
        hotspot.timeWindow = this.adjustments.timeWindow;
        
        // Adjust glow intensity
        if (hotspot.mesh && hotspot.mesh.material) {
            hotspot.mesh.material.emissiveIntensity *= this.adjustments.glowIntensity;
        }
        
        // Adjust audio volume
        if (hotspot.audio) {
            hotspot.audio.setVolume(this.adjustments.audioVolume);
        }
    }
    
    /**
     * Get hint frequency cooldown in milliseconds
     */
    getHintCooldown() {
        switch (this.adjustments.hintFrequency) {
            case 'high': return 2000;   // Every 2 seconds
            case 'medium': return 4000; // Every 4 seconds
            case 'low': return 8000;    // Every 8 seconds
            default: return 4000;
        }
    }
    
    /**
     * Get user difficulty level as string
     */
    getUserDifficultyLevel() {
        const score = 
            (this.adjustments.hotspotSize) +
            (this.adjustments.proximityRange / 45) +
            (this.adjustments.hintFrequency === 'high' ? 1.3 : this.adjustments.hintFrequency === 'low' ? 0.7 : 1.0) +
            (this.adjustments.glowIntensity);
        
        if (score < 2.5) return 'Expert 🔥';
        if (score < 3.5) return 'Hard 💪';
        if (score < 4.5) return 'Normal 👍';
        if (score < 5.5) return 'Easy 🌟';
        return 'Beginner 🎈';
    }
    
    /**
     * Reset to default difficulty
     */
    reset() {
        this.adjustments = {
            hotspotSize: 1.0,
            proximityRange: 45,
            hintFrequency: 'medium',
            timeWindow: 120,
            audioVolume: 1.0,
            glowIntensity: 1.0
        };
        
        this.sessionStats = {
            discoveries: [],
            missedHotspots: 0,
            totalTime: 0,
            frustrationEvents: 0,
            perfectionStreak: 0
        };
        
        this.saveUserSkill();
        console.log('🔄 Difficulty reset to Normal');
    }
    
    /**
     * Display difficulty indicator
     */
    showDifficultyIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'difficulty-indicator';
        indicator.style.cssText = `
            position: fixed;
            top: 250px;
            right: 20px;
            background: rgba(0, 0, 0, 0.85);
            color: white;
            padding: 10px 15px;
            border-radius: 8px;
            font-size: 13px;
            z-index: 1000;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        `;
        indicator.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 5px;">Difficulty</div>
            <div style="font-size: 16px;">${this.getUserDifficultyLevel()}</div>
        `;
        
        document.body.appendChild(indicator);
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            indicator.style.transition = 'opacity 0.5s';
            indicator.style.opacity = '0';
            setTimeout(() => indicator.remove(), 500);
        }, 5000);
    }
}
