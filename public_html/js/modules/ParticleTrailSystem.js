/**
 * ParticleTrailSystem - Psychedelic particle trails with SVG icons
 * Creates trippy, holographic particle effects that follow mouse/controller movement
 */
import * as THREE from 'https://unpkg.com/three@0.153.0/build/three.module.js';

export class ParticleTrailSystem {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        
        // Particle systems for different icons
        this.particleSystems = [];
        this.trailHistory = []; // Store positions for trail effect
        this.maxTrailLength = 60; // Reduced from 150 to 60 for VR performance
        
        // Animation properties
        this.time = 0;
        this.isActive = false;
        
        // Drag overlay logo
        this.dragOverlay = null;
        this.isDragging = false;
        this.pulseTime = 0;
        
        // Audio system
        this.audioListener = null;
        this.positionalAudio = null;
        this.audioLoader = null;
        this.lastSoundPlayTime = 0;
        this.soundCooldown = 50; // ms between sound triggers (reduced for more frequent sounds)
        this.audioContextResumed = false; // Track if AudioContext has been resumed
        
        // SVG icon paths
        this.iconPaths = [
            'images/eyetripvr-icony.png', // Yellow
            'images/eyetripvr-iconp.png', // Pink
            'images/eyetripvr-icong.png', // Green
            'images/eyetripvr-iconb.png'  // Blue
        ];
        
        // Psychedelic colors (will be initialized in initialize method)
        this.psychedelicColors = null;
        
        this.currentColorIndex = 0;
        
        // Mouse/controller tracking (will be initialized in initialize method)
        this.lastPosition = null;
        this.currentPosition = null;
        
        console.log('🌈 ParticleTrailSystem initialized');
    }
    
    /**
     * Setup regular audio system for swoosh sounds
     */
    setupAudio() {
        console.log('🔊 Setting up regular audio system...');
        
        try {
            // Safari requires user interaction before playing audio
            // Create audio element but don't try to play yet
            this.regularAudio = new Audio('assets/sound/swoosh.mp3');
            this.regularAudio.volume = 0.9;
            this.regularAudio.preload = 'auto';
            
            // Safari-specific: Load the audio on user interaction
            const loadAudio = () => {
                if (this.regularAudio && this.regularAudio.readyState < 2) {
                    this.regularAudio.load();
                }
                document.removeEventListener('click', loadAudio);
                document.removeEventListener('touchstart', loadAudio);
            };
            
            document.addEventListener('click', loadAudio, { once: true });
            document.addEventListener('touchstart', loadAudio, { once: true });
            
            console.log('✅ Regular audio system ready at 90% volume (will load on user interaction for Safari)');
        } catch (error) {
            console.error('❌ Error setting up audio:', error);
        }
    }
    
    /**
     * Play swoosh sound at specific position
     */
    async playSwooshSound(worldPosition, velocity) {
        // Debug: Check if we have audio
        if (!this.regularAudio) {
            console.warn('⚠️ No regularAudio object');
            return;
        }
        
        // Resume AudioContext on first interaction (browser autoplay policy)
        if (!this.audioContextResumed) {
            this.audioContextResumed = true;
            console.log('🔊 Regular audio enabled at 90% volume!');
        }
        
        // Cooldown to prevent overlapping sounds
        const now = Date.now();
        const timeSinceLastSound = now - this.lastSoundPlayTime;
        if (timeSinceLastSound < this.soundCooldown) {
            return; // Skip without logging
        }
        
        // Stop and reset current sound if playing
        if (!this.regularAudio.paused) {
            this.regularAudio.pause();
            this.regularAudio.currentTime = 0;
        }
        
        // Calculate playback rate based on velocity for Doppler effect
        let playbackRate = 1.0;
        if (velocity) {
            const speed = velocity.length();
            // Map speed to playback rate (0.8 to 1.5)
            playbackRate = THREE.MathUtils.clamp(1.0 + speed * 2.0, 0.8, 1.5);
            this.regularAudio.playbackRate = playbackRate;
        }
        
        // Play the sound
        console.log(`🔊 SWOOSH! Rate: ${playbackRate.toFixed(2)}x`);
        this.regularAudio.play().catch(err => {
            console.error('❌ Failed to play sound:', err);
        });
        this.lastSoundPlayTime = now;
    }
    
    /**
     * Load SVG icons as textures and create particle systems
     */
    async initialize() {
        // Initialize THREE.js objects here after import is complete
        this.psychedelicColors = [
            new THREE.Color(0xFFFF00), // Electric Yellow
            new THREE.Color(0xFF00FF), // Magenta
            new THREE.Color(0x00FFFF), // Cyan
            new THREE.Color(0xFF1493), // Hot Pink
            new THREE.Color(0x00FF7F), // Mint Green
            new THREE.Color(0x9400D3)  // Purple
        ];
        
        // Initialize position tracking
        this.lastPosition = new THREE.Vector3();
        this.currentPosition = new THREE.Vector3();
        
        // Note: setupAudio() will be called later after camera is ready
        
        const loader = new THREE.TextureLoader();
        
        try {
            // Load all textures with timeout for Safari
            const texturePromises = this.iconPaths.map(path => {
                return new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => {
                        reject(new Error(`Texture loading timeout: ${path}`));
                    }, 10000); // 10 second timeout
                    
                    loader.load(
                        path,
                        (texture) => {
                            clearTimeout(timeout);
                            // Safari-friendly texture settings
                            texture.minFilter = THREE.LinearFilter;
                            texture.magFilter = THREE.LinearFilter;
                            resolve(texture);
                        },
                        undefined,
                        (error) => {
                            clearTimeout(timeout);
                            console.error(`Error loading texture ${path}:`, error);
                            reject(error);
                        }
                    );
                });
            });
            
            const textures = await Promise.all(texturePromises);
            
            // Create particle system for each texture
            textures.forEach((texture, index) => {
                const system = this.createParticleSystem(texture, index);
                this.particleSystems.push(system);
            });
            
            // Load specific image for drag overlay (white logo with transparent background)
            const overlayTexture = await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Overlay texture loading timeout'));
                }, 10000);
                
                loader.load(
                    'images/eyetripvr-icony.png',
                    (texture) => {
                        clearTimeout(timeout);
                        texture.minFilter = THREE.LinearFilter;
                        texture.magFilter = THREE.LinearFilter;
                        resolve(texture);
                    },
                    undefined,
                    (error) => {
                        clearTimeout(timeout);
                        reject(error);
                    }
                );
            });
            this.createDragOverlay(overlayTexture);
            
            console.log('✨ Particle systems created:', this.particleSystems.length);
            
        } catch (error) {
            console.error('❌ Failed to initialize particle trail system:', error);
            // Create fallback system with solid color particles
            console.log('⚠️ Creating fallback particle system...');
            this.createFallbackParticleSystem();
        }
    }
    
    /**
     * Create fallback particle system without textures (for Safari compatibility)
     */
    createFallbackParticleSystem() {
        console.log('🔧 Creating fallback particle system (no textures)');
        // Create a simple solid color particle system as fallback
        const particleCount = this.maxTrailLength;
        const geometry = new THREE.BufferGeometry();
        
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = 0;
            positions[i * 3 + 1] = 0;
            positions[i * 3 + 2] = 0;
            
            colors[i * 3] = 1.0;
            colors[i * 3 + 1] = 1.0;
            colors[i * 3 + 2] = 0.0;
            
            const normalizedPosition = i / particleCount;
            const sizeFalloff = Math.pow(1 - normalizedPosition, 2.2);
            sizes[i] = 6.0 * sizeFalloff;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        const material = new THREE.PointsMaterial({
            size: 0.1,
            vertexColors: true,
            transparent: true,
            opacity: 0.7,
            sizeAttenuation: true
        });
        
        const particleSystem = new THREE.Points(geometry, material);
        particleSystem.visible = false;
        this.scene.add(particleSystem);
        this.particleSystems.push(particleSystem);
        
        console.log('✅ Fallback particle system ready');
    }
    
    /**
     * Create the drag overlay logo sprite
     */
    createDragOverlay(texture) {
        // Create canvas to process the texture and remove white background
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas size to match texture
        canvas.width = texture.image.width;
        canvas.height = texture.image.height;
        
        // Draw the original texture
        ctx.drawImage(texture.image, 0, 0);
        
        // Get image data to process pixels
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Process each pixel to remove white background (keep natural colors)
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];
            
            // Check if pixel is very white (background)
            if (r > 230 && g > 230 && b > 230) {
                // Make completely transparent
                data[i + 3] = 0;
            }
            // Keep the natural yellow/colored logo as-is
        }
        
        // Put the processed image data back
        ctx.putImageData(imageData, 0, 0);
        
        // Create new texture from processed canvas
        const processedTexture = new THREE.CanvasTexture(canvas);
        processedTexture.needsUpdate = true;
        
        // Optimized shader material with 1-pixel white stroke outline
        const planeMaterial = new THREE.ShaderMaterial({
            uniforms: {
                map: { value: processedTexture },
                opacity: { value: 0 }
            },
            vertexShader: `
                precision highp float;
                
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                precision highp float;
                
                uniform sampler2D map;
                uniform float opacity;
                varying vec2 vUv;
                
                void main() {
                    vec2 uv = vUv;
                    vec4 texColor = texture2D(map, uv);
                    
                    // If fully transparent, check for white stroke outline
                    if (texColor.a < 0.05) {
                        // Sample surrounding pixels for edge detection
                        float strokeWidth = 0.003; // 1 pixel stroke
                        vec4 n = texture2D(map, uv + vec2(0.0, strokeWidth));
                        vec4 s = texture2D(map, uv + vec2(0.0, -strokeWidth));
                        vec4 e = texture2D(map, uv + vec2(strokeWidth, 0.0));
                        vec4 w = texture2D(map, uv + vec2(-strokeWidth, 0.0));
                        
                        // If any neighbor is opaque, draw white stroke
                        float edge = max(max(n.a, s.a), max(e.a, w.a));
                        if (edge > 0.3) {
                            gl_FragColor = vec4(1.0, 1.0, 1.0, edge * opacity * 0.9);
                            return;
                        }
                        discard;
                    }
                    
                    // Keep natural color of the logo
                    vec3 finalColor = texColor.rgb;
                    
                    gl_FragColor = vec4(finalColor, texColor.a * opacity);
                }
            `,
            transparent: true,
            depthWrite: false,
            depthTest: false,
            side: THREE.DoubleSide
        });
        
        // Create a plane mesh instead of sprite (billboarded manually)
        const planeGeometry = new THREE.PlaneGeometry(1.5, 1.5); // Larger for VR visibility
        this.dragOverlay = new THREE.Mesh(planeGeometry, planeMaterial);
        this.dragOverlay.visible = false;
        this.dragOverlay.renderOrder = 999; // Render last (on top)
        this.scene.add(this.dragOverlay);
        
        console.log('🖱️ Drag overlay created with natural yellow color and white glow');
    }
    
    /**
     * Create a particle system with specific texture and colors
     */
    createParticleSystem(texture, index) {
        const particleCount = this.maxTrailLength;
        const geometry = new THREE.BufferGeometry();
        
        // Particle positions (will be updated dynamically)
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        const alphas = new Float32Array(particleCount);
        
        // Initialize with invisible particles at origin
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = 0;
            positions[i * 3 + 1] = 0;
            positions[i * 3 + 2] = 0;
            
            // Color gradient from bright to dim
            const color = this.psychedelicColors[index % this.psychedelicColors.length];
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
            
            // Larger size at start, progressively smaller toward end (smooth tapering)
            // Use exponential falloff for smooth, natural tapering to the tip
            const normalizedPosition = i / particleCount;
            const sizeFalloff = Math.pow(1 - normalizedPosition, 2.2); // Stronger exponential for dramatic taper
            sizes[i] = 3.0 * sizeFalloff; // Reduced from 9.0 to 3.0 for smaller particles
            
            // Alpha decreases along trail (fade out)
            alphas[i] = 1 - (i / particleCount);
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        geometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));
        
        // Optimized shader material - no glitch, simple white stroke outline
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                pointTexture: { value: texture }
            },
            vertexShader: `
                precision highp float;
                
                attribute float size;
                attribute float alpha;
                attribute vec3 color;
                
                varying vec3 vColor;
                varying float vAlpha;
                uniform float time;
                
                void main() {
                    vColor = color;
                    vAlpha = alpha;
                    
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    float pointSize = size * 1500.0 / -mvPosition.z;
                    gl_PointSize = clamp(pointSize, 5.0, 64.0);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                precision mediump float;
                
                uniform sampler2D pointTexture;
                uniform float time;
                
                varying vec3 vColor;
                varying float vAlpha;
                
                void main() {
                    vec2 uv = vec2(gl_PointCoord.x, 1.0 - gl_PointCoord.y);
                    vec4 texColor = texture2D(pointTexture, uv);
                    
                    // Simple alpha test - much faster than stroke detection
                    if (texColor.a < 0.1) {
                        discard;
                    }
                    
                    // Remove white background if present
                    if (texColor.r > 0.9 && texColor.g > 0.9 && texColor.b > 0.9) {
                        discard;
                    }
                    
                    // Very subtle color shift for performance
                    vec3 finalColor = texColor.rgb * vColor;
                    float finalAlpha = texColor.a * vAlpha;
                    
                    gl_FragColor = vec4(finalColor, finalAlpha);
                }
            `,
            transparent: true,
            depthWrite: false,
            blending: THREE.NormalBlending
        });
        
        const particleSystem = new THREE.Points(geometry, material);
        particleSystem.userData.index = index;
        particleSystem.visible = false; // Start invisible
        
        // Add to scene!
        this.scene.add(particleSystem);
        
        return particleSystem;
    }
    
    /**
     * Update particle positions based on movement
     * @param {THREE.Vector3} worldPosition - Current position in world space
     * @param {boolean} isVRMode - Whether currently in VR mode
     */
    updateTrail(worldPosition, isVRMode = false) {
        // Safety check - ensure system is initialized
        if (!this.currentPosition || !this.lastPosition) {
            console.warn('⚠️ ParticleTrailSystem not fully initialized yet');
            return;
        }
        
        if (!worldPosition) {
            // If no position provided, fade out the trail
            this.fadeOutTrail();
            return;
        }
        
        this.currentPosition.copy(worldPosition);
        
        // Check if there's significant movement
        const distance = this.currentPosition.distanceTo(this.lastPosition);
        
        console.log(`📏 movement distance: ${distance.toFixed(4)}, VR: ${isVRMode}, isDragging: ${this.isDragging}`);
        
        if (distance > 0.001) { // Lower threshold for more sensitive sound triggering
            // Calculate velocity for Doppler effect
            const velocity = new THREE.Vector3().subVectors(this.currentPosition, this.lastPosition);
            const speed = velocity.length();
            
            // Sound logic: Only play if there's BOTH movement AND an active trail
            // This prevents sound on initial click before any movement
            let shouldPlaySound = false;
            
            if (isVRMode) {
                // VR mode: sound based on movement speed AND having an existing trail
                shouldPlaySound = speed > 0.08 && this.trailHistory.length > 2;
                if (shouldPlaySound) {
                    console.log(`🎵 ✅ VR SOUND - speed: ${speed.toFixed(4)}, trail: ${this.trailHistory.length}`);
                } else {
                    console.log(`🎵 ⏸️  VR no sound - speed: ${speed.toFixed(4)}, trail: ${this.trailHistory.length}`);
                }
            } else {
                // Desktop mode: sound only when dragging AND trail exists (movement happened)
                shouldPlaySound = this.isDragging && this.trailHistory.length > 2;
                if (shouldPlaySound) {
                    console.log(`🎵 ✅ DESKTOP SOUND - dragging with trail: ${this.trailHistory.length}`);
                } else {
                    console.log(`🎵 ❌ Desktop no sound - dragging: ${this.isDragging}, trail: ${this.trailHistory.length}`);
                }
            }
            
            if (shouldPlaySound) {
                this.playSwooshSound(worldPosition, velocity);
            }
            
            // Add new position to trail history
            this.trailHistory.unshift(this.currentPosition.clone());
            
            // Limit trail length
            if (this.trailHistory.length > this.maxTrailLength) {
                this.trailHistory.pop();
            }
            
            // Update all particle systems
            this.particleSystems.forEach((system, systemIndex) => {
                if (!system.visible) system.visible = true;
                
                const positions = system.geometry.attributes.position.array;
                const sizes = system.geometry.attributes.size.array;
                
                // Update particle positions from trail history
                for (let i = 0; i < this.trailHistory.length; i++) {
                    const trailPos = this.trailHistory[i];
                    
                    // Add subtle random offset for organic feel (reduced for smoother trail)
                    const offset = new THREE.Vector3(
                        (Math.random() - 0.5) * 0.02,
                        (Math.random() - 0.5) * 0.02,
                        (Math.random() - 0.5) * 0.02
                    );
                    
                    positions[i * 3] = trailPos.x + offset.x;
                    positions[i * 3 + 1] = trailPos.y + offset.y;
                    positions[i * 3 + 2] = trailPos.z + offset.z;
                    
                    // Smooth exponential size tapering toward the tip
                    const normalizedPosition = i / this.maxTrailLength;
                    const sizeFalloff = Math.pow(1 - normalizedPosition, 2.2);
                    sizes[i] = 1.5 * sizeFalloff; // Reduced from 4.0 to 1.5 for much smaller particles
                }
                
                system.geometry.attributes.position.needsUpdate = true;
                system.geometry.attributes.size.needsUpdate = true;
            });
            
            this.lastPosition.copy(this.currentPosition);
            this.isActive = true;
        } else {
            // No movement detected, fade out the trail
            this.fadeOutTrail();
        }
    }
    
    /**
     * Fade out trail when movement stops
     */
    fadeOutTrail() {
        if (this.trailHistory.length === 0) return;
        
        // Remove particles from the end of the trail (fade inward)
        this.trailHistory.pop();
        
        // Update all particle systems
        this.particleSystems.forEach((system, systemIndex) => {
            const positions = system.geometry.attributes.position.array;
            const sizes = system.geometry.attributes.size.array;
            const alphas = system.geometry.attributes.alpha.array;
            
            // Update remaining particles
            for (let i = 0; i < this.trailHistory.length; i++) {
                const trailPos = this.trailHistory[i];
                
                positions[i * 3] = trailPos.x;
                positions[i * 3 + 1] = trailPos.y;
                positions[i * 3 + 2] = trailPos.z;
                
                // Reduced from 6.0 to 1.0 for much smaller particles during fade
                sizes[i] = 1.0 * (1 - i / this.maxTrailLength) * 0.9;
                
                // Slower fade - higher alpha values
                alphas[i] = (1 - i / this.maxTrailLength) * 0.95;
            }
            
            // Hide unused particles
            for (let i = this.trailHistory.length; i < this.maxTrailLength; i++) {
                sizes[i] = 0;
                alphas[i] = 0;
            }
            
            system.geometry.attributes.position.needsUpdate = true;
            system.geometry.attributes.size.needsUpdate = true;
            system.geometry.attributes.alpha.needsUpdate = true;
            
            // Hide system when trail is empty
            if (this.trailHistory.length === 0) {
                system.visible = false;
            }
        });
        
        if (this.trailHistory.length === 0) {
            this.isActive = false;
        }
    }
    
    /**
     * Animate particle effects
     */
    animate() {
        this.time += 0.016; // ~60fps
        
        this.particleSystems.forEach((system, index) => {
            if (system.visible) {
                // Update shader uniforms (only time, no glitch)
                system.material.uniforms.time.value = this.time;
                
                // Rotate colors through psychedelic spectrum (less frequent updates for performance)
                if (Math.floor(this.time * 10) % 10 === 0) { // Update every 10 frames instead of 5
                    const colors = system.geometry.attributes.color.array;
                    const colorShift = Math.sin(this.time + index) * 0.5 + 0.5;
                    const baseColor = this.psychedelicColors[(index + Math.floor(this.time)) % this.psychedelicColors.length];
                    
                    for (let i = 0; i < this.maxTrailLength; i++) {
                        colors[i * 3] = baseColor.r * (0.7 + colorShift * 0.3);
                        colors[i * 3 + 1] = baseColor.g * (0.7 + colorShift * 0.3);
                        colors[i * 3 + 2] = baseColor.b * (0.7 + colorShift * 0.3);
                    }
                    
                    system.geometry.attributes.color.needsUpdate = true;
                }
            }
        });
    }
    
    /**
     * Clear/reset particle trails
     */
    clearTrails() {
        this.trailHistory = [];
        this.particleSystems.forEach(system => {
            system.visible = false;
        });
        this.isActive = false;
    }
    
    /**
     * Set particle intensity (0-1) - simplified, no glitch
     */
    setIntensity(intensity) {
        // Intensity control removed - no glitch effect anymore
        // Keep method for compatibility
    }
    
    /**
     * Start drag overlay (when mouse down)
     */
    startDragOverlay() {
        console.log('🎨 Starting drag overlay, dragOverlay exists:', !!this.dragOverlay);
        this.isDragging = true;
        if (this.dragOverlay) {
            this.dragOverlay.visible = true;
            console.log('🎨 Drag overlay set to visible');
        }
        
        // Reset sound cooldown to allow sound when movement actually starts
        this.lastSoundPlayTime = 0;
        
        // Don't play initial sound on drag start - only play when there's actual movement
        // Sound will trigger in updateTrail() when trail history builds up
    }
    
    /**
     * Stop drag overlay (when mouse up)
     */
    stopDragOverlay() {
        this.isDragging = false;
        if (this.dragOverlay) {
            this.dragOverlay.visible = false;
            this.dragOverlay.material.uniforms.opacity.value = 0;
        }
        
        // Stop any playing sound
        if (this.positionalAudio && this.positionalAudio.isPlaying) {
            this.positionalAudio.stop();
        }
    }
    
    /**
     * Update drag overlay position and pulse
     */
    updateDragOverlay(worldPosition) {
        if (!this.dragOverlay || !this.isDragging) return;
        
        // Safety check - ensure dragOverlay is fully initialized
        if (!this.dragOverlay.material || !this.dragOverlay.material.uniforms) {
            console.warn('⚠️ Drag overlay material not ready');
            return;
        }
        
        // Position overlay at cursor (if position provided)
        if (worldPosition) {
            this.dragOverlay.position.copy(worldPosition);
            console.log('🎨 Drag overlay position:', worldPosition.x.toFixed(2), worldPosition.y.toFixed(2), worldPosition.z.toFixed(2));
        }
        
        // Billboard effect - make plane face camera
        if (this.camera) {
            this.dragOverlay.quaternion.copy(this.camera.quaternion);
        }
        
        // Pulse effect - continues even when not moving
        this.pulseTime += 0.05; // Slow pulse
        const pulse = Math.sin(this.pulseTime) * 0.5 + 0.5; // 0 to 1
        
        // Fade in to full opacity
        const targetOpacity = 1.0;
        this.dragOverlay.material.uniforms.opacity.value += (targetOpacity - this.dragOverlay.material.uniforms.opacity.value) * 0.1;
        
        console.log('🎨 Drag overlay opacity:', this.dragOverlay.material.uniforms.opacity.value.toFixed(2));
        
        // Pulse scale
        const baseScale = 1.0;
        const scale = baseScale * (0.9 + pulse * 0.2); // 90% to 110%
        this.dragOverlay.scale.set(scale, scale, 1);
    }
}
