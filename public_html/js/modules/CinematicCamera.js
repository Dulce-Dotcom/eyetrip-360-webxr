/**
 * CinematicCamera - Smooth camera animations and transitions
 * Vanilla JS animations (GSAP-free version for compatibility)
 */

export class CinematicCamera {
    constructor(panoramaPlayer) {
        this.panoramaPlayer = panoramaPlayer;
        this.isAnimating = false;
        this.animationFrame = null;
        
        // Presets
        this.presets = {
            slow: { duration: 3, ease: 'power2.inOut' },
            medium: { duration: 1.5, ease: 'power2.inOut' },
            fast: { duration: 0.8, ease: 'power3.out' },
            dramatic: { duration: 4, ease: 'power4.inOut' },
            elastic: { duration: 2, ease: 'elastic.out(1, 0.5)' }
        };
        
        console.log('🎬 CinematicCamera initialized');
    }
    
    /**
     * Smooth transition to target
     */
    transitionTo(targetLat, targetLon, preset = 'medium', onComplete = null) {
        if (this.isAnimating) this.stop();
        
        const config = this.presets[preset] || this.presets.medium;
        this.isAnimating = true;
        
        const startLat = this.panoramaPlayer.lat;
        const startLon = this.panoramaPlayer.lon;
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / (config.duration * 1000), 1);
            
            // Easing function
            const eased = this.easeInOutQuad(progress);
            
            this.panoramaPlayer.lat = startLat + (targetLat - startLat) * eased;
            this.panoramaPlayer.lon = startLon + (targetLon - startLon) * eased;
            
            if (this.panoramaPlayer.update) {
                this.panoramaPlayer.update();
            }
            
            if (progress < 1) {
                this.animationFrame = requestAnimationFrame(animate);
            } else {
                this.isAnimating = false;
                if (onComplete) onComplete();
            }
        };
        
        animate();
    }
    
    /**
     * Easing function
     */
    easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }
    
    /**
     * Follow path of waypoints (simplified version)
     */
    followPath(waypoints, duration = 10, loop = false) {
        console.log('followPath: Simplified version - use transitionTo for now');
        // Simplified: just transition to first waypoint
        if (waypoints.length > 0) {
            this.transitionTo(waypoints[0].lat, waypoints[0].lon, 'medium');
        }
    }
    
    /**
     * Look at hotspot with dramatic reveal (simplified)
     */
    dramaticReveal(hotspot, callback = null) {
        // Simplified: just transition to hotspot
        this.transitionTo(
            hotspot.position.lat, 
            hotspot.position.lon, 
            'dramatic',
            callback
        );
    }
    
    /**
     * Shake camera (simplified)
     */
    shake(intensity = 0.5, duration = 0.5) {
        console.log('shake: Feature requires GSAP - install with: npm install gsap');
    }
    
    /**
     * Slow zoom effect (simplified)
     */
    zoom(targetFov, duration = 2) {
        console.log('zoom: Feature requires GSAP - install with: npm install gsap');
    }
    
    /**
     * Dolly zoom (simplified)
     */
    dollyZoom(targetFov, duration = 3) {
        console.log('dollyZoom: Feature requires GSAP - install with: npm install gsap');
    }    /**
     * Orbit around current position
     */
    orbit(radius = 30, duration = 8, direction = 'clockwise') {
        if (this.isAnimating) this.stop();
        
        const startLon = this.panoramaPlayer.lon;
        const totalRotation = direction === 'clockwise' ? 360 : -360;
        const startTime = Date.now();
        
        this.isAnimating = true;
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = (elapsed / (duration * 1000)) % 1;
            
            this.panoramaPlayer.lon = startLon + totalRotation * progress;
            
            if (this.panoramaPlayer.update) {
                this.panoramaPlayer.update();
            }
            
            if (this.isAnimating) {
                this.animationFrame = requestAnimationFrame(animate);
            }
        };
        
        animate();
    }
    
    /**
     * Look at hotspot with dramatic reveal
     */
    dramaticReveal(hotspot, callback = null) {
        if (this.isAnimating) this.stop();
        
        this.timeline = gsap.timeline({
            onComplete: () => {
                this.isAnimating = false;
                if (callback) callback();
            }
        });
        
        this.isAnimating = true;
        
        // Get current and target positions
        const currentLat = this.panoramaPlayer.lat;
        const currentLon = this.panoramaPlayer.lon;
        const targetLat = hotspot.position.lat;
        const targetLon = hotspot.position.lon;
        
        // Calculate intermediate positions for dramatic arc
        const midLat = (currentLat + targetLat) / 2 + 20; // Arc up
        const midLon = (currentLon + targetLon) / 2;
        
        // Sequence: Pull back -> Arc over -> Focus in
        this.timeline
            .to(this.panoramaPlayer, {
                lat: midLat,
                lon: midLon,
                duration: 2,
                ease: 'power2.in',
                onUpdate: () => this.panoramaPlayer.update?.()
            })
            .to(this.panoramaPlayer, {
                lat: targetLat,
                lon: targetLon,
                duration: 1.5,
                ease: 'power2.out',
                onUpdate: () => this.panoramaPlayer.update?.()
            });
        
        return this.timeline;
    }
    
    /**
     * Shake camera (for impact)
     */
    shake(intensity = 0.5, duration = 0.5) {
        if (!this.panoramaPlayer) return;
        
        const originalLat = this.panoramaPlayer.lat;
        const originalLon = this.panoramaPlayer.lon;
        
        gsap.to(this.panoramaPlayer, {
            lat: originalLat + (Math.random() - 0.5) * intensity * 5,
            lon: originalLon + (Math.random() - 0.5) * intensity * 5,
            duration: 0.05,
            repeat: Math.floor(duration / 0.05),
            yoyo: true,
            ease: 'none',
            onUpdate: () => this.panoramaPlayer.update?.(),
            onComplete: () => {
                // Return to original
                gsap.to(this.panoramaPlayer, {
                    lat: originalLat,
                    lon: originalLon,
                    duration: 0.2,
                    ease: 'power2.out',
                    onUpdate: () => this.panoramaPlayer.update?.()
                });
            }
        });
    }
    
    /**
     * Slow zoom effect
     */
    zoom(targetFov, duration = 2) {
        if (!this.panoramaPlayer || !this.panoramaPlayer.camera) return;
        
        gsap.to(this.panoramaPlayer.camera, {
            fov: targetFov,
            duration: duration,
            ease: 'power2.inOut',
            onUpdate: () => {
                this.panoramaPlayer.camera.updateProjectionMatrix();
            }
        });
    }
    
    /**
     * Dolly zoom (Vertigo effect)
     */
    dollyZoom(targetFov, duration = 3) {
        if (!this.panoramaPlayer || !this.panoramaPlayer.camera) return;
        
        const originalFov = this.panoramaPlayer.camera.fov;
        
        gsap.timeline()
            .to(this.panoramaPlayer.camera, {
                fov: targetFov,
                duration: duration / 2,
                ease: 'power2.in',
                onUpdate: () => this.panoramaPlayer.camera.updateProjectionMatrix()
            })
            .to(this.panoramaPlayer.camera, {
                fov: originalFov,
                duration: duration / 2,
                ease: 'power2.out',
                onUpdate: () => this.panoramaPlayer.camera.updateProjectionMatrix()
            });
    }
    
    /**
     * Intro sequence
     */
    playIntroSequence() {
        if (this.isAnimating) this.stop();
        
        this.isAnimating = true;
        
        // Start from top
        this.panoramaPlayer.lat = 80;
        this.panoramaPlayer.lon = 0;
        
        const startTime = Date.now();
        const duration = 8000; // 8 seconds
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = this.easeInOutQuad(progress);
            
            this.panoramaPlayer.lat = 80 - (80 * eased);
            this.panoramaPlayer.lon = 360 * eased;
            
            if (this.panoramaPlayer.update) {
                this.panoramaPlayer.update();
            }
            
            if (progress < 1) {
                this.animationFrame = requestAnimationFrame(animate);
            } else {
                // Final elastic bounce back to 0
                this.transitionTo(0, 0, 'fast', () => {
                    this.isAnimating = false;
                });
            }
        };
        
        animate();
    }
    
    /**
     * Auto-explore mode (simplified)
     */
    autoExplore(hotspotsToVisit, transitionDuration = 3, pauseDuration = 2) {
        console.log('autoExplore: Simplified version');
        // Simplified: just go to first hotspot
        if (hotspotsToVisit.length > 0) {
            this.transitionTo(
                hotspotsToVisit[0].position.lat,
                hotspotsToVisit[0].position.lon,
                'medium'
            );
        }
    }
    
    /**
     * Look around (simplified idle animation)
     */
    lookAround(range = 30, duration = 6) {
        console.log('lookAround: Use orbit() for continuous rotation');
        this.orbit(range, duration, 'clockwise');
    }
    
    /**
     * Stop all animations
     */
    stop() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        this.isAnimating = false;
    }
    
    /**
     * Pause animation
     */
    pause() {
        this.stop();
    }
    
    /**
     * Resume animation
     */
    resume() {
        // For vanilla JS version, just restart the animation
        console.log('Resume not fully implemented in vanilla JS version');
    }
    
    /**
     * Cleanup
     */
    cleanup() {
        this.stop();
    }
}
