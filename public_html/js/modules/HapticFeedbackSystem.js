/**
 * HapticFeedbackSystem - Vibration feedback for mobile and VR controllers
 * Proximity-based intensity, discovery celebrations, directional pulses
 */
export class HapticFeedbackSystem {
    constructor(webxrHandler) {
        this.webxrHandler = webxrHandler;
        
        // Check for vibration support
        this.hasVibration = 'vibrate' in navigator;
        this.vrControllers = [];
        
        // Settings
        this.enabled = true;
        this.intensity = 1.0; // 0.0 - 1.0
        
        // Patterns
        this.patterns = {
            discovery: [200, 100, 100, 100, 200], // Long-short-short-long
            proximity: [50], // Short pulse
            hint: [100, 50, 100], // Double tap
            achievement: [300, 100, 300, 100, 300], // Triple pulse
            error: [200, 100, 200], // Double thud
            navigation: [30] // Tiny tick
        };
        
        console.log('📳 HapticFeedbackSystem initialized', {
            hasVibration: this.hasVibration,
            hasVRControllers: this.webxrHandler && this.webxrHandler.controllers
        });
    }
    
    /**
     * Update VR controllers reference
     */
    updateVRControllers(controllers) {
        this.vrControllers = controllers || [];
    }
    
    /**
     * Trigger haptic feedback
     */
    trigger(patternName, intensityMultiplier = 1.0) {
        if (!this.enabled) return;
        
        const pattern = this.patterns[patternName];
        if (!pattern) {
            console.warn('Unknown haptic pattern:', patternName);
            return;
        }
        
        const adjustedIntensity = this.intensity * intensityMultiplier;
        
        // Mobile vibration
        if (this.hasVibration) {
            const scaledPattern = pattern.map(duration => 
                Math.round(duration * adjustedIntensity)
            );
            navigator.vibrate(scaledPattern);
        }
        
        // VR controller haptics
        this.triggerVRHaptics(pattern, adjustedIntensity);
    }
    
    /**
     * Trigger VR controller haptics
     */
    triggerVRHaptics(pattern, intensity) {
        if (!this.vrControllers || this.vrControllers.length === 0) return;
        
        this.vrControllers.forEach(controller => {
            if (!controller || !controller.gamepad) return;
            
            const gamepad = controller.gamepad;
            
            // Check for haptic actuators
            if (gamepad.hapticActuators && gamepad.hapticActuators.length > 0) {
                const actuator = gamepad.hapticActuators[0];
                
                // Convert pattern to pulses
                this.playVRPattern(actuator, pattern, intensity);
            }
        });
    }
    
    /**
     * Play VR haptic pattern
     */
    async playVRPattern(actuator, pattern, intensity) {
        for (let i = 0; i < pattern.length; i++) {
            const duration = pattern[i];
            
            // Odd indices = pulse, even = pause
            if (i % 2 === 0) {
                try {
                    await actuator.pulse(intensity, duration);
                } catch (e) {
                    console.warn('VR haptic pulse failed:', e);
                }
            } else {
                await this.sleep(duration);
            }
        }
    }
    
    /**
     * Sleep utility
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * Proximity-based haptic feedback
     */
    updateProximityFeedback(hotspot, distance, maxDistance = 45) {
        if (!this.enabled) return;
        
        // Normalize distance (0 = at hotspot, 1 = max distance)
        const normalized = Math.min(1.0, distance / maxDistance);
        
        // Trigger haptics based on zones
        if (normalized < 0.2) {
            // Very close - intense rapid pulses
            this.trigger('proximity', 1.0);
        } else if (normalized < 0.4) {
            // Close - moderate pulses
            this.trigger('proximity', 0.7);
        } else if (normalized < 0.6) {
            // Medium - soft pulses
            this.trigger('proximity', 0.4);
        }
        // No feedback beyond 60% distance
    }
    
    /**
     * Continuous proximity haptics (call in animation loop)
     */
    continuousProximityUpdate(nearestHotspot, distance) {
        if (!nearestHotspot || !this.enabled) {
            // Clear any ongoing proximity feedback
            if (this.proximityTimer) {
                clearTimeout(this.proximityTimer);
                this.proximityTimer = null;
            }
            return;
        }
        
        // Calculate pulse frequency based on distance
        const maxDistance = 45;
        const normalized = Math.min(1.0, distance / maxDistance);
        
        // Closer = faster pulses
        const frequency = 2000 - (1800 * (1 - normalized)); // 200ms to 2000ms
        
        if (!this.proximityTimer) {
            this.proximityTimer = setTimeout(() => {
                const intensity = 1.0 - (normalized * 0.7); // 0.3 to 1.0
                
                // Short pulse
                if (this.hasVibration) {
                    navigator.vibrate(Math.round(30 * intensity));
                }
                
                this.triggerVRPulse(intensity, 30);
                
                this.proximityTimer = null;
            }, frequency);
        }
    }
    
    /**
     * Single VR controller pulse
     */
    triggerVRPulse(intensity, duration) {
        if (!this.vrControllers) return;
        
        this.vrControllers.forEach(controller => {
            if (!controller || !controller.gamepad) return;
            
            const gamepad = controller.gamepad;
            if (gamepad.hapticActuators && gamepad.hapticActuators.length > 0) {
                try {
                    gamepad.hapticActuators[0].pulse(intensity, duration);
                } catch (e) {
                    // Silently fail
                }
            }
        });
    }
    
    /**
     * Discovery celebration
     */
    celebrateDiscovery() {
        this.trigger('discovery', 1.0);
        
        // Add extra sparkle for VR
        setTimeout(() => {
            this.triggerVRPulse(0.8, 100);
        }, 400);
    }
    
    /**
     * Achievement unlocked
     */
    achievementUnlocked() {
        this.trigger('achievement', 1.0);
    }
    
    /**
     * Directional hint (helps guide user to hotspot)
     */
    directionalHint(direction) {
        // Different pattern based on direction
        switch (direction) {
            case 'left':
                // Left controller stronger pulse
                this.triggerDirectionalVR(0, 0.8, 1.0);
                break;
            case 'right':
                // Right controller stronger pulse
                this.triggerDirectionalVR(1, 0.8, 1.0);
                break;
            case 'up':
                // Both controllers light pulse
                this.trigger('hint', 0.5);
                break;
            case 'down':
                // Both controllers medium pulse
                this.trigger('hint', 0.8);
                break;
        }
    }
    
    /**
     * Trigger directional VR haptics
     */
    triggerDirectionalVR(controllerIndex, leftIntensity, rightIntensity) {
        if (!this.vrControllers || this.vrControllers.length < 2) {
            // Fallback to standard pattern
            this.trigger('hint', 1.0);
            return;
        }
        
        const leftController = this.vrControllers[0];
        const rightController = this.vrControllers[1];
        
        if (controllerIndex === 0 && leftController && leftController.gamepad) {
            this.pulseController(leftController.gamepad, leftIntensity, 150);
        }
        
        if (controllerIndex === 1 && rightController && rightController.gamepad) {
            this.pulseController(rightController.gamepad, rightIntensity, 150);
        }
    }
    
    /**
     * Pulse individual controller
     */
    pulseController(gamepad, intensity, duration) {
        if (gamepad.hapticActuators && gamepad.hapticActuators.length > 0) {
            try {
                gamepad.hapticActuators[0].pulse(intensity, duration);
            } catch (e) {
                // Silently fail
            }
        }
    }
    
    /**
     * Error feedback
     */
    error() {
        this.trigger('error', 1.0);
    }
    
    /**
     * Navigation tick (subtle feedback for menu navigation)
     */
    navigationTick() {
        this.trigger('navigation', 0.5);
    }
    
    /**
     * Custom pattern
     */
    customPattern(pattern, intensity = 1.0) {
        if (!this.enabled) return;
        
        const adjustedIntensity = this.intensity * intensity;
        
        if (this.hasVibration) {
            const scaledPattern = pattern.map(duration => 
                Math.round(duration * adjustedIntensity)
            );
            navigator.vibrate(scaledPattern);
        }
        
        this.triggerVRHaptics(pattern, adjustedIntensity);
    }
    
    /**
     * Rhythm-based haptics (sync with audio)
     */
    rhythmicPulse(bpm, beats) {
        const interval = 60000 / bpm; // ms per beat
        let count = 0;
        
        const pulse = setInterval(() => {
            this.trigger('proximity', 0.8);
            count++;
            
            if (count >= beats) {
                clearInterval(pulse);
            }
        }, interval);
    }
    
    /**
     * Gradual intensity ramp
     */
    intensityRamp(startIntensity, endIntensity, durationMs) {
        const steps = 10;
        const stepDuration = durationMs / steps;
        const intensityStep = (endIntensity - startIntensity) / steps;
        
        let currentStep = 0;
        
        const ramp = setInterval(() => {
            const intensity = startIntensity + (intensityStep * currentStep);
            
            if (this.hasVibration) {
                navigator.vibrate(Math.round(50 * intensity));
            }
            
            this.triggerVRPulse(intensity, 50);
            
            currentStep++;
            
            if (currentStep >= steps) {
                clearInterval(ramp);
            }
        }, stepDuration);
    }
    
    /**
     * Heartbeat pattern (for immersion)
     */
    heartbeat() {
        // Lub-dub pattern
        const pattern = [100, 100, 150]; // Short-pause-longer
        this.customPattern(pattern, 0.6);
    }
    
    /**
     * Enable/disable haptics
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        console.log(`📳 Haptics ${enabled ? 'enabled' : 'disabled'}`);
    }
    
    /**
     * Set intensity
     */
    setIntensity(intensity) {
        this.intensity = Math.max(0, Math.min(1, intensity));
        console.log(`📳 Haptic intensity: ${Math.round(this.intensity * 100)}%`);
    }
    
    /**
     * Test all patterns
     */
    async testPatterns() {
        console.log('📳 Testing haptic patterns...');
        
        for (const [name, pattern] of Object.entries(this.patterns)) {
            console.log(`Testing: ${name}`);
            this.trigger(name, 1.0);
            await this.sleep(1000);
        }
        
        console.log('✅ Haptic test complete');
    }
    
    /**
     * Cleanup
     */
    cleanup() {
        if (this.proximityTimer) {
            clearTimeout(this.proximityTimer);
        }
        
        // Stop any ongoing vibrations
        if (this.hasVibration) {
            navigator.vibrate(0);
        }
    }
}
