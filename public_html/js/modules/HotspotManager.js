import * as THREE from 'three';

/**
 * HotspotManager - Interactive Audio Hotspots for 360° VR Experiences
 * Creates discoverable audio triggers that appear at timed intervals
 * Works on Meta Quest, Desktop, WebXR Emulator, and Mobile
 */
export class HotspotManager {
    constructor(scene, camera, video, renderer = null) {
        this.scene = scene;
        this.camera = camera;
        this.video = video;
        this.renderer = renderer; // For VR mode detection
        
        // Detect Safari for performance optimizations
        this.isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        console.log('🔍 Browser detection - Safari:', this.isSafari);
        
        this.hotspots = [];
        this.discoveredHotspots = new Set();
        this.activeHotspots = [];
        
        // Audio setup
        this.audioListener = null;
        this.audioLoader = new THREE.AudioLoader();
        this.currentLoopingAudio = null; // Track currently playing looped sound
        this.proximityAudio = null; // Audio cue for proximity hints
        this.lastProximitySound = 0; // Throttle proximity sounds
        
        // Raycaster for interaction detection
        this.raycaster = new THREE.Raycaster();
        this.raycaster.far = 20; // Extended range for sphere
        
        // Visual settings
        this.hotspotRadius = 0.4;
        this.pulseSpeed = 2;
        this.glowIntensity = 1.5;
        
        // Discovery tracking
        this.totalHotspots = 0;
        this.onDiscoveryCallback = null;
        
        console.log('🎯 HotspotManager initialized');
    }
    
    /**
     * Initialize audio listener (must be called after camera is ready)
     */
    setupAudio() {
        if (!this.audioListener) {
            this.audioListener = new THREE.AudioListener();
            this.camera.add(this.audioListener);
            console.log('🔊 Audio listener attached to camera');
        }
    }
    
    /**
     * Create hotspot configuration for a specific video
     */
    createHotspotsForVideo(videoName) {
        console.log('🎯 Creating hotspots for:', videoName);
        
        // Clear existing hotspots
        this.clearAllHotspots();
        
        // Video-specific hotspot configurations
        const configs = this.getHotspotConfigs();
        const config = configs[videoName] || configs['default'];
        
        this.totalHotspots = config.length;
        
        config.forEach((hotspotData, index) => {
            this.createHotspot(hotspotData, index);
        });
        
        console.log(`✨ Created ${this.totalHotspots} hotspots for ${videoName}`);
    }
    
    /**
     * Hotspot configurations per video
     * Each hotspot: { time, position, sound, label, color }
     * 10 hotspots per video, spread across entire duration
     */
    getHotspotConfigs() {
        return {
            // Matrix Caracas Sphere - Mysterious, tech sounds (10 hotspots)
            'matrixCaracasSphere_1': [
                { time: 8, position: [10, 2, 5], sound: 'ES_TransitionTech.mp3', label: 'Digital Echo', color: 0x00ffff },
                { time: 20, position: [-8, -3, 8], sound: 'ES_ModulatedRadio.mp3', label: 'Radio Signal', color: 0xff00ff },
                { time: 35, position: [5, 5, -10], sound: 'ES_RippleTexturesWarpsClicky05.mp3', label: 'Data Stream', color: 0x00ff00 },
                { time: 50, position: [-10, 0, -5], sound: 'ES_SynthBraamRiser.mp3', label: 'Matrix Pulse', color: 0xffff00 },
                { time: 65, position: [0, -8, 10], sound: 'ES_ScaryDissonantTone.mp3', label: 'System Alert', color: 0xff0000 },
                { time: 80, position: [8, 4, -7], sound: 'ES_TransitionTech.mp3', label: 'Echo Return', color: 0x00ffff },
                { time: 95, position: [-6, 6, 9], sound: 'ES_ModulatedRadio.mp3', label: 'Signal Boost', color: 0xff00ff },
                { time: 110, position: [9, -5, -6], sound: 'ES_RippleTexturesWarpsClicky05.mp3', label: 'Data Surge', color: 0x00ff00 },
                { time: 125, position: [-11, 3, 7], sound: 'ES_SynthBraamRiser.mp3', label: 'Power Up', color: 0xffff00 },
                { time: 140, position: [4, 7, 10], sound: 'ES_ScaryDissonantTone.mp3', label: 'Final Alert', color: 0xff0000 }
            ],
            
            // Scraptangle - Industrial, gritty sounds (10 hotspots)
            'Scraptangle_latlong_05b_offsetOverture1': [
                { time: 10, position: [12, 3, -3], sound: 'ES_FireImpact.mp3', label: 'Spark', color: 0xff4500 },
                { time: 25, position: [-10, -2, 10], sound: 'ES_ImpactLongEerieToneMetallicScrapeFalling .mp3', label: 'Metal Scrape', color: 0x8b4513 },
                { time: 40, position: [8, 6, 8], sound: 'ES_CymbalRiseBassyBoomProcessed.mp3', label: 'Resonance', color: 0xffa500 },
                { time: 55, position: [-5, -5, -12], sound: 'ES_BassDropDownerOvertones.mp3', label: 'Deep Rumble', color: 0xff6347 },
                { time: 70, position: [0, 8, -8], sound: 'ES_LowHit.mp3', label: 'Impact', color: 0xdc143c },
                { time: 85, position: [11, -4, 6], sound: 'ES_FireImpact.mp3', label: 'Ember', color: 0xff4500 },
                { time: 100, position: [-9, 5, -9], sound: 'ES_ImpactLongEerieToneMetallicScrapeFalling .mp3', label: 'Metal Echo', color: 0x8b4513 },
                { time: 115, position: [7, -7, 11], sound: 'ES_CymbalRiseBassyBoomProcessed.mp3', label: 'Reverb', color: 0xffa500 },
                { time: 130, position: [-8, 2, 8], sound: 'ES_BassDropDownerOvertones.mp3', label: 'Bass Drop', color: 0xff6347 },
                { time: 145, position: [6, 9, -5], sound: 'ES_LowHit.mp3', label: 'Final Impact', color: 0xdc143c }
            ],
            
            // Shroom Zoom - Psychedelic, organic sounds (10 hotspots)
            'ShroomZoomLatlong_12': [
                { time: 12, position: [9, 4, 7], sound: 'ES_AnimeRandomFrequencyResonance.mp3', label: 'Energy Pulse', color: 0x9370db },
                { time: 28, position: [-11, 2, -6], sound: 'ES_BellsDistortedRiserReversed 01.mp3', label: 'Crystal Chime', color: 0x8a2be2 },
                { time: 44, position: [6, -6, 10], sound: 'ES_SqueakyStutterExtreme.mp3', label: 'Spore Pop', color: 0xda70d6 },
                { time: 60, position: [-8, 7, -9], sound: 'ES_VeryShortTonalRumble.mp3', label: 'Mycelium', color: 0xff1493 },
                { time: 76, position: [10, -4, -5], sound: 'ES_FullFrequencyReversedHitLogoSignature.mp3', label: 'Bloom', color: 0xff69b4 },
                { time: 92, position: [-7, -8, 8], sound: 'ES_AnimeRandomFrequencyResonance.mp3', label: 'Frequency Wave', color: 0x9370db },
                { time: 108, position: [8, 5, -10], sound: 'ES_BellsDistortedRiserReversed 01.mp3', label: 'Bell Shimmer', color: 0x8a2be2 },
                { time: 124, position: [-10, 1, 9], sound: 'ES_SqueakyStutterExtreme.mp3', label: 'Spore Burst', color: 0xda70d6 },
                { time: 140, position: [5, 8, 6], sound: 'ES_VeryShortTonalRumble.mp3', label: 'Root System', color: 0xff1493 },
                { time: 156, position: [-6, -5, -11], sound: 'ES_FullFrequencyReversedHitLogoSignature.mp3', label: 'Full Bloom', color: 0xff69b4 }
            ],
            
            // Stumpy Waves - Nature, atmospheric sounds (10 hotspots)
            'stumpy_latlong_01_waves_61Mbps-003': [
                { time: 9, position: [11, 1, 8], sound: 'ES_RippleTexturesWarpsClicky05.mp3', label: 'Wave Ripple', color: 0x1e90ff },
                { time: 24, position: [-9, 5, -7], sound: 'ES_TransitionTech.mp3', label: 'Tide Shift', color: 0x00bfff },
                { time: 39, position: [7, -7, 11], sound: 'ES_AnimeRandomFrequencyResonance.mp3', label: 'Ocean Resonance', color: 0x4169e1 },
                { time: 54, position: [-10, 3, 5], sound: 'ES_BellsDistortedRiserReversed 01.mp3', label: 'Seashell', color: 0x6495ed },
                { time: 69, position: [5, 8, -10], sound: 'ES_CymbalRiseBassyBoomProcessed.mp3', label: 'Surge', color: 0x00ced1 },
                { time: 84, position: [-8, -6, 9], sound: 'ES_RippleTexturesWarpsClicky05.mp3', label: 'Ripple Echo', color: 0x1e90ff },
                { time: 99, position: [9, 4, -8], sound: 'ES_TransitionTech.mp3', label: 'Current Flow', color: 0x00bfff },
                { time: 114, position: [-6, 7, 10], sound: 'ES_AnimeRandomFrequencyResonance.mp3', label: 'Deep Sea', color: 0x4169e1 },
                { time: 129, position: [10, -3, -7], sound: 'ES_BellsDistortedRiserReversed 01.mp3', label: 'Coral Chime', color: 0x6495ed },
                { time: 144, position: [-11, 2, 6], sound: 'ES_CymbalRiseBassyBoomProcessed.mp3', label: 'Wave Crash', color: 0x00ced1 }
            ],
            
            // 4K Overture - Epic, cinematic sounds (10 hotspots)
            '4klatlong_05b_offsetOverture1': [
                { time: 7, position: [10, 5, 6], sound: 'ES_SynthBraamRiser.mp3', label: 'Rising Power', color: 0xffd700 },
                { time: 22, position: [-12, -1, -8], sound: 'ES_FullFrequencyReversedHitLogoSignature.mp3', label: 'Epic Moment', color: 0xff8c00 },
                { time: 37, position: [8, -5, 12], sound: 'ES_CymbalRiseBassyBoomProcessed.mp3', label: 'Crescendo', color: 0xffA500 },
                { time: 52, position: [-6, 8, -10], sound: 'ES_ImpactLongEerieToneMetallicScrapeFalling .mp3', label: 'Dramatic Hit', color: 0xff6347 },
                { time: 67, position: [0, 6, 9], sound: 'ES_ScaryDissonantTone.mp3', label: 'Tension', color: 0xff4500 },
                { time: 82, position: [11, -6, -5], sound: 'ES_SynthBraamRiser.mp3', label: 'Power Surge', color: 0xffd700 },
                { time: 97, position: [-9, 4, 10], sound: 'ES_FullFrequencyReversedHitLogoSignature.mp3', label: 'Climax', color: 0xff8c00 },
                { time: 112, position: [7, 7, -9], sound: 'ES_CymbalRiseBassyBoomProcessed.mp3', label: 'Grand Finale', color: 0xffA500 },
                { time: 127, position: [-10, -4, 7], sound: 'ES_ImpactLongEerieToneMetallicScrapeFalling .mp3', label: 'Thunder Strike', color: 0xff6347 },
                { time: 142, position: [5, 3, 11], sound: 'ES_ScaryDissonantTone.mp3', label: 'Resolution', color: 0xff4500 }
            ],
            
            // Default fallback (10 hotspots)
            'default': [
                { time: 10, position: [10, 0, 0], sound: 'ES_TransitionTech.mp3', label: 'Hidden Sound 1', color: 0x00ffff },
                { time: 25, position: [-10, 3, 5], sound: 'ES_FireImpact.mp3', label: 'Hidden Sound 2', color: 0xff00ff },
                { time: 40, position: [0, -5, 10], sound: 'ES_BellsDistortedRiserReversed 01.mp3', label: 'Hidden Sound 3', color: 0x00ff00 },
                { time: 55, position: [8, 8, -8], sound: 'ES_SynthBraamRiser.mp3', label: 'Hidden Sound 4', color: 0xffff00 },
                { time: 70, position: [-8, -8, 8], sound: 'ES_AnimeRandomFrequencyResonance.mp3', label: 'Hidden Sound 5', color: 0xff6347 },
                { time: 85, position: [9, 2, -9], sound: 'ES_TransitionTech.mp3', label: 'Hidden Sound 6', color: 0x00ffff },
                { time: 100, position: [-7, 6, 7], sound: 'ES_FireImpact.mp3', label: 'Hidden Sound 7', color: 0xff00ff },
                { time: 115, position: [6, -7, -6], sound: 'ES_BellsDistortedRiserReversed 01.mp3', label: 'Hidden Sound 8', color: 0x00ff00 },
                { time: 130, position: [-9, 4, -10], sound: 'ES_SynthBraamRiser.mp3', label: 'Hidden Sound 9', color: 0xffff00 },
                { time: 145, position: [11, -3, 5], sound: 'ES_AnimeRandomFrequencyResonance.mp3', label: 'Hidden Sound 10', color: 0xff6347 }
            ]
        };
    }
    
    /**
     * Create a single hotspot
     */
    createHotspot(data, index) {
        const hotspot = {
            id: `hotspot_${index}`,
            time: data.time,
            position: new THREE.Vector3(...data.position),
            sound: data.sound,
            label: data.label,
            color: data.color,
            discovered: false,
            visible: false,
            active: false, // Track if hotspot is currently active/shown
            mesh: null,
            audio: null,
            glowMesh: null
        };
        
        // Create visual representation (pulsing sphere with glow)
        this.createHotspotVisual(hotspot);
        
        // Create spatial audio
        this.createHotspotAudio(hotspot);
        
        this.hotspots.push(hotspot);
    }
    
    /**
     * Create visual mesh for hotspot
     */
    createHotspotVisual(hotspot) {
        // Main sphere with elegant, ethereal look - darker and more sophisticated
        const geometry = new THREE.SphereGeometry(this.hotspotRadius, 32, 32); // Optimized poly count
        const material = new THREE.MeshStandardMaterial({
            color: hotspot.color,
            emissive: hotspot.color,
            emissiveIntensity: 0.8, // Subtle, not blown out
            metalness: 0.3, // Less metallic, more ethereal
            roughness: 0.4, // Slight roughness for depth
            transparent: true,
            opacity: 0.85, // Slightly transparent for ethereal look
            side: THREE.DoubleSide
        });
        hotspot.mesh = new THREE.Mesh(geometry, material);
        hotspot.mesh.position.copy(hotspot.position);
        hotspot.mesh.visible = false;
        hotspot.mesh.userData.hotspot = hotspot;
        this.scene.add(hotspot.mesh);
        
        // Create multiple glow layers for soft blur effect
        hotspot.glowLayers = [];
        // Safari optimization: reduce glow layers from 3 to 2
        const layerCount = this.isSafari ? 2 : 3;
        
        for (let i = 0; i < layerCount; i++) {
            const scale = 1.4 + (i * 0.4); // 1.4x, 1.8x, 2.2x
            const opacity = 0.35 - (i * 0.12); // 0.35, 0.23, 0.11 - more subtle
            
            const glowGeometry = new THREE.SphereGeometry(this.hotspotRadius * scale, 24, 24);
            const glowMaterial = new THREE.MeshStandardMaterial({
                color: hotspot.color,
                emissive: hotspot.color,
                emissiveIntensity: 1.2 - (i * 0.3), // Gentle glow
                transparent: true,
                opacity: opacity,
                side: THREE.DoubleSide,
                metalness: 0,
                roughness: 1,
                depthWrite: false,
                blending: THREE.AdditiveBlending
            });
            
            const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
            glowMesh.position.copy(hotspot.position);
            glowMesh.visible = false;
            glowMesh.renderOrder = -1 - i;
            glowMesh.userData.hotspot = hotspot; // CRITICAL: Add hotspot reference for VR raycasting
            
            this.scene.add(glowMesh);
            hotspot.glowLayers.push(glowMesh);
        }
        
        // Keep reference to first layer as main glow
        hotspot.glowMesh = hotspot.glowLayers[0];
        
        // Subtle point light - not too bright
        const pointLight = new THREE.PointLight(hotspot.color, 1.2, 8);
        pointLight.position.copy(hotspot.position);
        pointLight.visible = false;
        hotspot.pointLight = pointLight;
        this.scene.add(pointLight);
        
        // Particle ring effect - always create for consistency
        this.createHotspotParticles(hotspot);
    }
    
    /**
     * Create particle ring around hotspot with PBR materials
     */
    createHotspotParticles(hotspot) {
        // Safari optimization: reduce particles from 24 to 12
        const particleCount = this.isSafari ? 12 : 24;
        const particles = new THREE.Group();
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const radius = this.hotspotRadius * 2.5;
            
            // Create elegant, darker particles
            const particleGeometry = new THREE.SphereGeometry(0.12, 12, 12); // Smaller, optimized
            const particleMaterial = new THREE.MeshStandardMaterial({
                color: hotspot.color,
                emissive: hotspot.color,
                emissiveIntensity: 1.5, // Subtle glow
                metalness: 0.2,
                roughness: 0.3,
                transparent: true,
                opacity: 0.75 // More transparent
            });
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            
            particle.position.x = Math.cos(angle) * radius;
            particle.position.z = Math.sin(angle) * radius;
            particle.userData.angle = angle;
            particle.userData.radius = radius;
            particle.userData.originalRadius = radius;
            
            particles.add(particle);
        }
        
        particles.position.copy(hotspot.position);
        particles.visible = false;
        hotspot.particles = particles;
        this.scene.add(particles);
    }
    
    /**
     * Create spatial audio for hotspot
     */
    createHotspotAudio(hotspot) {
        if (!this.audioListener) {
            console.warn('⚠️ Audio listener not initialized yet');
            return;
        }
        
        // Use regular HTML5 Audio (like particle swoosh) for maximum volume
        const audio = new Audio(`/assets/sound/${hotspot.sound}`);
        
        // Apply current video volume/mute state immediately
        const videoMuted = this.video.muted;
        const videoVolume = this.video.volume;
        audio.volume = videoVolume; // Match video volume
        audio.muted = videoMuted; // Match video mute state
        audio.loop = true; // Enable looping
        audio.preload = 'auto';
        
        console.log(`🔊 Creating hotspot audio with video state: volume=${videoVolume}, muted=${videoMuted}`);
        
        // Load audio on user interaction for Safari compatibility
        const loadAudio = () => {
            if (audio.readyState < 2) {
                audio.load();
            }
        };
        
        document.addEventListener('click', loadAudio, { once: true });
        document.addEventListener('touchstart', loadAudio, { once: true });
        
        hotspot.audio = audio;
        hotspot.isRegularAudio = true; // Flag to indicate this is HTML5 Audio, not THREE.Audio
        
        console.log(`✅ Loaded regular audio: ${hotspot.sound}`);
    }
    
    /**
     * Update hotspot visibility based on video time
     * OPTIMIZED: Reduced update frequency for better performance
     */
    update(deltaTime) {
        if (!this.video) return;
        
        // Light throttle - only run every other frame to reduce CPU load (still smooth at 36fps)
        this.updateCounter = (this.updateCounter || 0) + 1;
        const shouldAnimate = this.updateCounter % 2 === 0;
        
        const currentTime = this.video.currentTime;
        
        // Only check proximity every 5 frames (moderate throttling)
        if (this.updateCounter % 5 === 0) {
            let maxProximity = 0;
            this.hotspots.forEach(hotspot => {
                if (hotspot.visible && !hotspot.discovered) {
                    const proximity = this.checkProximity(hotspot);
                    maxProximity = Math.max(maxProximity, proximity);
                }
            });
            
            // Play proximity audio cue if very close (throttled to once every 3 seconds)
            const now = Date.now();
            if (maxProximity > 0.7 && now - this.lastProximitySound > 3000) {
                // TEMPORARY FIX: Disable proximity sounds to prevent video muting
                // this.playProximitySound();
                console.log('🔕 Proximity sound disabled (preventing audio conflict)');
                this.lastProximitySound = now;
            }
        }
        
        // Show/hide hotspots based on video time
        this.hotspots.forEach(hotspot => {
            const shouldBeVisible = currentTime >= hotspot.time && 
                                   currentTime < hotspot.time + 120 && // Visible for 2 minutes
                                   !hotspot.discovered;
            
            if (shouldBeVisible && !hotspot.visible) {
                this.showHotspot(hotspot);
            } else if (!shouldBeVisible && hotspot.visible) {
                this.hideHotspot(hotspot);
            }
            
            // Animate visible hotspots - but only every other frame
            if (hotspot.visible && shouldAnimate) {
                this.animateHotspot(hotspot, deltaTime);
            }
        });
    }
    
    /**
     * Show hotspot with fade-in effect
     */
    showHotspot(hotspot) {
        hotspot.visible = true;
        hotspot.active = true; // Mark as active for raycaster detection
        hotspot.mesh.visible = true;
        
        // Show all glow layers
        if (hotspot.glowLayers) {
            hotspot.glowLayers.forEach(layer => layer.visible = true);
        }
        if (hotspot.glowMesh) hotspot.glowMesh.visible = true;
        
        if (hotspot.particles) hotspot.particles.visible = true;
        if (hotspot.pointLight) hotspot.pointLight.visible = true;
        
        if (!this.activeHotspots.includes(hotspot)) {
            this.activeHotspots.push(hotspot);
        }
        
        // Play appearance sound immediately when orb spawns
        this.playAppearanceSound();
        
        console.log(`✨ Hotspot appeared: ${hotspot.label} at ${hotspot.time}s`);
    }
    
    /**
     * Hide hotspot
     */
    hideHotspot(hotspot) {
        hotspot.visible = false;
        hotspot.active = false; // Mark as inactive
        hotspot.mesh.visible = false;
        
        // Hide all glow layers
        if (hotspot.glowLayers) {
            hotspot.glowLayers.forEach(layer => layer.visible = false);
        }
        if (hotspot.glowMesh) hotspot.glowMesh.visible = false;
        
        if (hotspot.particles) hotspot.particles.visible = false;
        if (hotspot.pointLight) hotspot.pointLight.visible = false;
        
        const index = this.activeHotspots.indexOf(hotspot);
        if (index > -1) {
            this.activeHotspots.splice(index, 1);
        }
    }
    
    /**
     * Animate hotspot (pulsing, rotation)
     */
    animateHotspot(hotspot, deltaTime) {
        // Safari optimization: throttle animation updates to every other frame
        if (this.isSafari) {
            this.safariAnimationCounter = (this.safariAnimationCounter || 0) + 1;
            if (this.safariAnimationCounter % 2 !== 0) return;
        }
        
        const time = Date.now() * 0.001 * this.pulseSpeed;
        
        // Check proximity to camera view
        const proximityLevel = this.checkProximity(hotspot);
        
        // Gentle, elegant pulsing - more subtle
        const baseScale = proximityLevel > 0 ? 1.15 : 1.0; // Slight size increase when in view
        const scale = baseScale + Math.sin(time * 1.5) * 0.15; // Slower, smaller pulse
        hotspot.mesh.scale.setScalar(scale);
        
        // Subtle emissive pulse - darker, more ethereal
        const baseIntensity = proximityLevel > 0 ? 1.2 : 0.8;
        hotspot.mesh.material.emissiveIntensity = baseIntensity + Math.sin(time * 2) * 0.4;
        
        // Animate all glow layers for soft ethereal blur
        if (hotspot.glowLayers) {
            hotspot.glowLayers.forEach((layer, i) => {
                const layerScale = (baseScale + Math.sin(time * 1.2 + i * 0.3) * 0.15) * (proximityLevel > 0 ? 1.2 : 1.0);
                layer.scale.setScalar(layerScale);
                
                // Gentle opacity pulse
                const baseOpacity = (0.35 - (i * 0.12)) * (proximityLevel > 0 ? 1.3 : 1.0);
                layer.material.opacity = baseOpacity + Math.sin(time * 1.5 + i * 0.4) * 0.08;
                layer.material.emissiveIntensity = (1.2 - i * 0.3) + Math.sin(time * 2 + i * 0.3) * 0.4 + (proximityLevel * 0.5);
                
                // Billboard effect
                layer.lookAt(this.camera.position);
            });
        }
        
        // Subtle light pulse
        if (hotspot.pointLight) {
            hotspot.pointLight.intensity = (1.2 + proximityLevel * 0.8) + Math.sin(time * 1.8) * 0.5;
        }
        
        // Smooth particle ring rotation - always visible and consistent
        if (hotspot.particles) {
            hotspot.particles.rotation.y += deltaTime * 1.2; // Elegant rotation
            
            // Gentle particle pulse - all particles animate together
            hotspot.particles.children.forEach((particle, i) => {
                const offset = (i / hotspot.particles.children.length) * Math.PI * 2;
                
                // Subtle brightness pulse
                particle.material.emissiveIntensity = 1.5 + Math.sin(time * 3 + offset) * 0.8;
                
                // Slight scale pulse for life
                const particleScale = 1 + Math.sin(time * 4 + offset * 1.5) * 0.12;
                particle.scale.setScalar(particleScale);
            });
        }
        
        // Billboard effect - always face camera
        hotspot.mesh.lookAt(this.camera.position);
        if (hotspot.glowMesh) hotspot.glowMesh.lookAt(this.camera.position);
    }
    
    /**
     * Check if camera is looking near a hotspot (proximity hint)
     * Returns 0 (not near) to 1 (very close to view direction)
     */
    checkProximity(hotspot) {
        if (!hotspot.visible || hotspot.discovered) return 0;
        
        // Get camera direction
        const cameraDirection = new THREE.Vector3();
        this.camera.getWorldDirection(cameraDirection);
        
        // Get direction from camera to hotspot
        const hotspotDirection = new THREE.Vector3();
        hotspotDirection.subVectors(hotspot.mesh.position, this.camera.position).normalize();
        
        // Calculate angle between camera direction and hotspot direction
        const dotProduct = cameraDirection.dot(hotspotDirection);
        
        // Convert to degrees
        const angleDegrees = Math.acos(dotProduct) * (180 / Math.PI);
        
        // Proximity levels:
        // 0-20 degrees: Very close (proximity = 1.0)
        // 20-45 degrees: Close (proximity = 0.5)
        // 45+ degrees: Far (proximity = 0)
        if (angleDegrees <= 20) {
            return 1.0;
        } else if (angleDegrees <= 45) {
            // Linear fade from 1.0 to 0 between 20 and 45 degrees
            return 1.0 - ((angleDegrees - 20) / 25);
        }
        
        return 0;
    }
    
    /**
     * Play subtle audio cue when camera is looking near a hotspot
     */
    playProximitySound() {
        if (!this.audioListener) return;
        
        // Respect video mute state
        if (this.video.muted) {
            console.log('🔇 Proximity sound skipped (video muted)');
            return;
        }
        
        // Create proximity audio if it doesn't exist
        if (!this.proximityAudio) {
            this.proximityAudio = new THREE.Audio(this.audioListener);
            
            // Use a simple beep/chime sound
            // For now, we'll use the AudioContext to generate a tone
            const context = this.audioListener.context;
            if (context.state === 'suspended') {
                context.resume();
            }
            
            // Create a simple oscillator-based chime sound
            const oscillator = context.createOscillator();
            const gainNode = context.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(context.destination);
            
            oscillator.frequency.value = 800; // High pitched chime
            oscillator.type = 'sine';
            
            // Apply video volume to gain - adjusted for video volume
            const videoVolume = this.video.volume;
            const adjustedVolume = 0.8 * videoVolume; // Scale by video volume
            
            // Quick fade in/out envelope
            gainNode.gain.setValueAtTime(0, context.currentTime);
            gainNode.gain.linearRampToValueAtTime(adjustedVolume, context.currentTime + 0.05); // Fade in
            gainNode.gain.linearRampToValueAtTime(0, context.currentTime + 0.3); // Fade out
            
            oscillator.start(context.currentTime);
            oscillator.stop(context.currentTime + 0.3);
            
            console.log(`🔔 Proximity audio cue played (volume: ${adjustedVolume.toFixed(2)})`);
        }
    }
    
    /**
     * Play sound when orb first appears
     */
    playAppearanceSound() {
        if (!this.audioListener) return;
        
        // Respect video mute state
        if (this.video.muted) {
            console.log('🔇 Appearance sound skipped (video muted)');
            return;
        }
        
        // TEMPORARY FIX: Disable appearance sounds to prevent video muting issue
        // The Web Audio API oscillator seems to interfere with video audio in VR
        console.log('🔕 Appearance sound disabled (preventing audio conflict)');
        return;
        
        const context = this.audioListener.context;
        if (context.state === 'suspended') {
            context.resume();
        }
        
        // Create a bright, clear notification chime
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(context.destination);
        
        oscillator.frequency.value = 1200; // Higher pitch than proximity sound
        oscillator.type = 'sine';
        
        // Apply video volume to gain
        const videoVolume = this.video.volume;
        const adjustedVolume = 1.0 * videoVolume; // Scale by video volume
        
        // Louder, clearer envelope for appearance
        gainNode.gain.setValueAtTime(0, context.currentTime);
        gainNode.gain.linearRampToValueAtTime(adjustedVolume, context.currentTime + 0.02); // Quick attack
        gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.5); // Gentle decay
        
        oscillator.start(context.currentTime);
        oscillator.stop(context.currentTime + 0.5);
        
        console.log(`✨ Orb appearance sound played (volume: ${adjustedVolume.toFixed(2)})`);
    }
    
    /**
     * Check for hotspot interaction (click/trigger)
     * Works for mouse, touch, and VR controllers
     */
    checkInteraction(origin, direction) {
        if (this.activeHotspots.length === 0) return null;
        
        this.raycaster.set(origin, direction);
        
        const meshes = this.activeHotspots.map(h => h.mesh);
        const intersects = this.raycaster.intersectObjects(meshes);
        
        if (intersects.length > 0) {
            const hotspot = intersects[0].object.userData.hotspot;
            if (hotspot && !hotspot.discovered) {
                return hotspot;
            }
        }
        
        return null;
    }
    
    /**
     * Trigger hotspot discovery
     */
    discoverHotspot(hotspot) {
        if (hotspot.discovered) return;
        
        console.log(`🎉 Discovered: ${hotspot.label}`);
        
        hotspot.discovered = true;
        this.discoveredHotspots.add(hotspot.id);
        
        // Show center screen notification with sound name
        this.showDiscoveryNotification(hotspot.label);
        
        // Track hotspot discovery
        if (window.trackVREvent) {
            window.trackVREvent('hotspot_discovered', hotspot.label, this.discoveredHotspots.size);
        }
        
        // Achievement: Check all milestones independently (no else if!)
        const count = this.discoveredHotspots.size;
        if (window.achievements) {
            if (count === 1) {
                window.achievements.unlock('first_discovery');
            }
            if (count === 5) {
                window.achievements.unlock('halfway_there');
            }
            if (count === 8) {
                window.achievements.unlock('sound_collector');
            }
        }
        
        // Stop previous looping audio
        if (this.currentLoopingAudio) {
            if (this.currentLoopingAudio.pause) {
                // Regular HTML5 Audio
                this.currentLoopingAudio.pause();
                this.currentLoopingAudio.currentTime = 0;
            } else if (this.currentLoopingAudio.isPlaying) {
                // THREE.Audio
                this.currentLoopingAudio.stop();
            }
            console.log('🔇 Stopped previous looping audio');
        }
        
        // Play new sound (looped)
        if (hotspot.audio) {
            // Apply current video mute/volume state to hotspot audio
            const videoMuted = this.video.muted;
            const videoVolume = this.video.volume;
            
            if (hotspot.isRegularAudio) {
                // Regular HTML5 Audio element
                hotspot.audio.currentTime = 0;
                hotspot.audio.muted = videoMuted;
                hotspot.audio.volume = videoVolume;
                hotspot.audio.play().catch(err => {
                    console.warn('Audio play failed:', err);
                });
            } else {
                // THREE.Audio
                if (hotspot.audio.buffer) {
                    hotspot.audio.setVolume(videoMuted ? 0 : videoVolume);
                    hotspot.audio.play();
                }
            }
            this.currentLoopingAudio = hotspot.audio;
            console.log(`🔊 Now looping: ${hotspot.label} (muted: ${videoMuted}, volume: ${videoVolume})`);
        }
        
        // Visual feedback - explosion effect
        this.createDiscoveryEffect(hotspot);
        
        // Hide visual hotspot after discovery (but keep audio playing)
        setTimeout(() => {
            this.hideHotspot(hotspot);
        }, 3000);
        
        // Callback for UI update
        if (this.onDiscoveryCallback) {
            console.log(`📊 Calling discovery callback: ${this.discoveredHotspots.size}/${this.totalHotspots}`);
            this.onDiscoveryCallback(hotspot, this.discoveredHotspots.size, this.totalHotspots);
        } else {
            console.warn('⚠️ No onDiscoveryCallback set!');
        }
        
        // Check if all hotspots discovered
        if (this.discoveredHotspots.size === this.totalHotspots) {
            console.log('🎊 All hotspots discovered!');
            if (window.trackVREvent) {
                window.trackVREvent('all_hotspots_completed', 'all_discovered', this.totalHotspots);
            }
            // Achievement: Completionist (found all sounds in one experience)
            // Delay achievement popup until after sound title disappears (6 seconds)
            if (window.achievements) {
                setTimeout(() => {
                    window.achievements.unlock('completionist');
                }, 6000);
            }
            
            // Fade out the last hotspot audio after 20 seconds
            console.log('⏱️ Last hotspot found - will fade out audio in 20 seconds');
            this.fadeOutLastHotspot(hotspot);
        }
    }
    
    /**
     * Show center screen notification when sound is discovered
     */
    showDiscoveryNotification(soundName) {
        // Check if in VR mode - try multiple detection methods
        const hasRenderer = !!this.renderer;
        const hasXR = hasRenderer && !!this.renderer.xr;
        const isPresenting = hasXR && this.renderer.xr.isPresenting;
        
        console.log(`📢 [Notification Debug] Sound: ${soundName}`);
        console.log(`   - Has renderer: ${hasRenderer}`);
        console.log(`   - Has XR: ${hasXR}`);
        console.log(`   - Is presenting: ${isPresenting}`);
        
        const isVRMode = isPresenting;
        console.log(`📢 [Notification] VR Mode: ${isVRMode}`);
        
        if (isVRMode) {
            // DISABLED: 3D text notification temporarily for performance
            console.log('✨ [Notification] 3D VR notification DISABLED for performance');
            // this.showVRNotification(soundName);
        } else {
            // Show DOM notification for desktop
            console.log('📱 [Notification] Creating DOM notification for desktop');
            const existing = document.querySelector('.hotspot-discovery-notification');
            if (existing) {
                existing.remove();
            }
            
            const notification = document.createElement('div');
            notification.className = 'hotspot-discovery-notification';
            notification.innerHTML = `
                <div class="sound-name">🎵 ${soundName} 🎵</div>
            `;
            
            document.body.appendChild(notification);
            
            // Animate in
            setTimeout(() => notification.classList.add('show'), 100);
            
            // Animate out and remove after 5 seconds (longer display time)
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 500);
            }, 5000);
        }
    }
    
    /**
     * Show 3D text notification in VR
     */
    showVRNotification(soundName) {
        console.log('🎨 [VR Notification] Creating 3D text for:', soundName);
        
        // Remove existing VR notification
        if (this.vrNotification) {
            this.scene.remove(this.vrNotification);
            this.vrNotification = null;
        }
        
        // Create canvas with text - OPTIMIZED: Reduced from 2048x512 to 1024x256
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 1024;  // Reduced by 50%
        canvas.height = 256;  // Reduced by 50%
        
        // Clear canvas
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw text with glow effect - adjusted font size
        context.fillStyle = '#ffffff';
        context.font = 'bold 60px Arial';  // Reduced from 120px
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        
        // Add text shadow for glow
        context.shadowColor = '#ff1493';
        context.shadowBlur = 15;  // Reduced from 30
        context.shadowOffsetX = 0;
        context.shadowOffsetY = 0;
        
        // Draw emoji and text
        context.fillText(`🎵 ${soundName} 🎵`, canvas.width / 2, canvas.height / 2);
        
        console.log('✅ [VR Notification] Canvas created with text');
        
        // Create texture from canvas
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        
        // Create plane for text - make it bigger and use DoubleSide
        const geometry = new THREE.PlaneGeometry(4, 1);
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            opacity: 0,
            side: THREE.DoubleSide,
            depthTest: false, // Render on top
            depthWrite: false
        });
        
        this.vrNotification = new THREE.Mesh(geometry, material);
        this.vrNotification.renderOrder = 999; // Render last (on top)
        
        // Position directly in front of camera in world space
        // Get camera world position and direction
        const cameraWorldPosition = new THREE.Vector3();
        this.camera.getWorldPosition(cameraWorldPosition);
        
        const cameraWorldDirection = new THREE.Vector3();
        this.camera.getWorldDirection(cameraWorldDirection);
        
        // Place text 2.5 meters in front of camera
        this.vrNotification.position.copy(cameraWorldPosition);
        this.vrNotification.position.add(cameraWorldDirection.multiplyScalar(2.5));
        
        // Make it face the camera
        this.vrNotification.lookAt(cameraWorldPosition);
        
        console.log('📍 [VR Notification] Positioned at:', this.vrNotification.position);
        console.log('👁️ [VR Notification] Camera at:', cameraWorldPosition);
        
        this.scene.add(this.vrNotification);
        console.log('✅ [VR Notification] Added to scene');
        
        // Fade in animation
        const fadeInDuration = 600;
        const displayDuration = 5000;
        const fadeOutDuration = 500;
        const startTime = Date.now();
        
        const animate = () => {
            if (!this.vrNotification) return; // Safety check
            
            const elapsed = Date.now() - startTime;
            
            if (elapsed < fadeInDuration) {
                // Fade in
                material.opacity = elapsed / fadeInDuration;
                requestAnimationFrame(animate);
            } else if (elapsed < fadeInDuration + displayDuration) {
                // Full opacity
                material.opacity = 1;
                requestAnimationFrame(animate);
            } else if (elapsed < fadeInDuration + displayDuration + fadeOutDuration) {
                // Fade out
                const fadeProgress = (elapsed - fadeInDuration - displayDuration) / fadeOutDuration;
                material.opacity = 1 - fadeProgress;
                requestAnimationFrame(animate);
            } else {
                // Remove
                console.log('🗑️ [VR Notification] Removing after animation complete');
                if (this.vrNotification) {
                    this.scene.remove(this.vrNotification);
                    this.vrNotification = null;
                }
            }
        };
        
        animate();
        console.log('✨ [VR] 3D notification animation started for:', soundName);
    }
    
    /**
     * Fade out the last hotspot audio after 20 seconds
     */
    fadeOutLastHotspot(hotspot) {
        // Wait 20 seconds before starting fade
        setTimeout(() => {
            console.log('🔉 Starting fade-out of last hotspot audio...');
            
            if (this.currentLoopingAudio) {
                // Determine if it's regular audio or THREE.Audio
                const isRegularAudio = hotspot.isRegularAudio;
                const audio = this.currentLoopingAudio;
                
                if (isRegularAudio) {
                    // Fade out HTML5 Audio over 3 seconds
                    const startVolume = audio.volume;
                    const fadeSteps = 30; // 30 steps over 3 seconds
                    const volumeStep = startVolume / fadeSteps;
                    let step = 0;
                    
                    const fadeInterval = setInterval(() => {
                        step++;
                        const newVolume = Math.max(0, startVolume - (volumeStep * step));
                        audio.volume = newVolume;
                        
                        if (step >= fadeSteps || newVolume <= 0) {
                            clearInterval(fadeInterval);
                            audio.pause();
                            audio.currentTime = 0;
                            this.currentLoopingAudio = null;
                            console.log('🔇 Last hotspot audio faded out completely');
                        }
                    }, 100); // Update every 100ms
                } else {
                    // Fade out THREE.Audio over 3 seconds
                    const startVolume = audio.getVolume();
                    const fadeSteps = 30;
                    const volumeStep = startVolume / fadeSteps;
                    let step = 0;
                    
                    const fadeInterval = setInterval(() => {
                        step++;
                        const newVolume = Math.max(0, startVolume - (volumeStep * step));
                        audio.setVolume(newVolume);
                        
                        if (step >= fadeSteps || newVolume <= 0) {
                            clearInterval(fadeInterval);
                            audio.stop();
                            this.currentLoopingAudio = null;
                            console.log('🔇 Last hotspot audio faded out completely');
                        }
                    }, 100);
                }
            }
        }, 20000); // Wait 20 seconds (20000ms)
    }
    
    /**
     * Create visual effect when hotspot is discovered
     */
    createDiscoveryEffect(hotspot) {
        // Dramatic scale burst on main orb
        const originalScale = hotspot.mesh.scale.x;
        hotspot.mesh.scale.setScalar(originalScale * 2.0);
        
        // Animate scale back down
        let scaleTime = 0;
        const scaleAnimation = () => {
            scaleTime += 0.05;
            if (scaleTime < 1) {
                const scale = originalScale * (2.0 - scaleTime);
                hotspot.mesh.scale.setScalar(scale);
                requestAnimationFrame(scaleAnimation);
            } else {
                hotspot.mesh.scale.setScalar(originalScale);
            }
        };
        scaleAnimation();
        
        // Intense brightness flash
        const originalIntensity = hotspot.mesh.material.emissiveIntensity;
        hotspot.mesh.material.emissiveIntensity = 15.0; // Super bright
        hotspot.glowMesh.material.emissiveIntensity = 15.0;
        
        if (hotspot.pointLight) {
            hotspot.pointLight.intensity = 10.0; // Intense flash
        }
        
        // Fade back to normal over 0.5 seconds
        let fadeTime = 0;
        const fadeAnimation = () => {
            fadeTime += 0.05;
            if (fadeTime < 1) {
                const intensity = 15.0 - (15.0 - originalIntensity) * fadeTime;
                hotspot.mesh.material.emissiveIntensity = intensity;
                hotspot.glowMesh.material.emissiveIntensity = intensity;
                if (hotspot.pointLight) {
                    hotspot.pointLight.intensity = 10.0 - 7.0 * fadeTime;
                }
                requestAnimationFrame(fadeAnimation);
            }
        };
        fadeAnimation();
        
        // Burst of particles
        const particleCount = 30;
        const particles = [];
        
        for (let i = 0; i < particleCount; i++) {
            const geometry = new THREE.SphereGeometry(0.15, 8, 8);
            const material = new THREE.MeshBasicMaterial({
                color: hotspot.color,
                transparent: true,
                opacity: 1
            });
            const particle = new THREE.Mesh(geometry, material);
            
            particle.position.copy(hotspot.position);
            
            const angle = (i / particleCount) * Math.PI * 2;
            const velocity = new THREE.Vector3(
                Math.cos(angle) * 3,
                (Math.random() - 0.5) * 2,
                Math.sin(angle) * 3
            );
            
            particle.userData.velocity = velocity;
            particle.userData.life = 1.0;
            
            this.scene.add(particle);
            particles.push(particle);
        }
        
        // Animate particles
        const animate = () => {
            let allDead = true;
            
            particles.forEach(particle => {
                if (particle.userData.life > 0) {
                    allDead = false;
                    
                    particle.position.add(particle.userData.velocity.clone().multiplyScalar(0.016));
                    particle.userData.velocity.multiplyScalar(0.95); // Slow down
                    particle.userData.life -= 0.015;
                    particle.material.opacity = particle.userData.life;
                    particle.scale.setScalar(particle.userData.life);
                }
            });
            
            if (!allDead) {
                requestAnimationFrame(animate);
            } else {
                particles.forEach(p => this.scene.remove(p));
            }
        };
        
        animate();
    }
    
    /**
     * Clear all hotspots
     */
    clearAllHotspots() {
        // Stop currently looping audio
        if (this.currentLoopingAudio) {
            if (this.currentLoopingAudio.pause) {
                // Regular HTML5 Audio
                this.currentLoopingAudio.pause();
                this.currentLoopingAudio.currentTime = 0;
            } else if (this.currentLoopingAudio.isPlaying) {
                // THREE.Audio
                this.currentLoopingAudio.stop();
            }
            this.currentLoopingAudio = null;
        }
        
        this.hotspots.forEach(hotspot => {
            if (hotspot.mesh) this.scene.remove(hotspot.mesh);
            if (hotspot.glowMesh) this.scene.remove(hotspot.glowMesh);
            if (hotspot.particles) this.scene.remove(hotspot.particles);
            if (hotspot.audio) {
                if (hotspot.isRegularAudio) {
                    // Regular HTML5 Audio
                    hotspot.audio.pause();
                    hotspot.audio.currentTime = 0;
                } else {
                    // THREE.Audio
                    hotspot.audio.stop();
                    hotspot.audio.disconnect();
                }
            }
        });
        
        this.hotspots = [];
        this.activeHotspots = [];
        this.discoveredHotspots.clear();
    }
    
    /**
     * Get discovery progress
     */
    getProgress() {
        return {
            discovered: this.discoveredHotspots.size,
            total: this.totalHotspots,
            percentage: this.totalHotspots > 0 ? 
                       Math.round((this.discoveredHotspots.size / this.totalHotspots) * 100) : 0
        };
    }
    
    /**
     * Find nearest hotspot to camera view (for Chroma features)
     */
    findNearestHotspot() {
        if (!this.camera || this.hotspots.length === 0) return null;
        
        let nearest = null;
        let minDistance = Infinity;
        
        // Get camera direction
        const cameraDirection = new THREE.Vector3();
        this.camera.getWorldDirection(cameraDirection);
        
        this.hotspots.forEach(hotspot => {
            if (!hotspot.mesh || hotspot.discovered) return;
            
            // Get direction to hotspot
            const hotspotDirection = hotspot.mesh.position.clone().normalize();
            
            // Calculate angle between camera and hotspot
            const angle = Math.acos(cameraDirection.dot(hotspotDirection));
            const angleDegrees = THREE.MathUtils.radToDeg(angle);
            
            if (angleDegrees < minDistance) {
                minDistance = angleDegrees;
                nearest = hotspot;
            }
        });
        
        return nearest ? { hotspot: nearest, distance: minDistance } : null;
    }
    
    /**
     * Reset discovery state
     */
    reset() {
        this.discoveredHotspots.clear();
        this.hotspots.forEach(hotspot => {
            hotspot.discovered = false;
        });
    }
}
