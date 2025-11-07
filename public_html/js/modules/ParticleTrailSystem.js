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
        this.maxTrailLength = 100; // Even longer trail - 100 particles
        
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
        try {
            console.log('🔊 Setting up regular audio system...');
            
            // Create regular HTML5 Audio element
            this.regularAudio = new Audio('assets/sound/swoosh.mp3');
            this.regularAudio.volume = 0.9; // 90% volume
            this.regularAudio.preload = 'auto';
            
            console.log('✅ Regular audio system ready at 90% volume!');
            
        } catch (error) {
            console.error('❌ Failed to setup regular audio:', error);
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
        
        // Load all textures
        const texturePromises = this.iconPaths.map(path => {
            return new Promise((resolve, reject) => {
                loader.load(path, resolve, undefined, reject);
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
            loader.load('images/eyetripvr-icony.png', resolve, undefined, reject);
        });
        this.createDragOverlay(overlayTexture);
        
        console.log('✨ Particle systems created:', this.particleSystems.length);
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
        
        // Use ShaderMaterial to add white glow effect
        const planeMaterial = new THREE.ShaderMaterial({
            uniforms: {
                map: { value: processedTexture },
                opacity: { value: 0 }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform sampler2D map;
                uniform float opacity;
                varying vec2 vUv;
                
                void main() {
                    // Use UV coordinates directly (no flip)
                    vec2 uv = vUv;
                    vec4 texColor = texture2D(map, uv);
                    
                    // Calculate distance from center for glow effect
                    vec2 center = vec2(0.5, 0.5);
                    float dist = distance(uv, center);
                    
                    // If transparent, check if we should draw glow
                    if (texColor.a < 0.1) {
                        // Create subtle white glow around the logo (reduced)
                        float glowRadius = 0.5;
                        float glowIntensity = smoothstep(glowRadius, glowRadius * 0.7, dist);
                        
                        if (glowIntensity > 0.0) {
                            // Draw subtle white glow (reduced from 0.5 to 0.25)
                            gl_FragColor = vec4(1.0, 1.0, 1.0, glowIntensity * opacity * 0.25);
                            return;
                        }
                        discard;
                    }
                    
                    // Keep natural color of the logo
                    vec3 finalColor = texColor.rgb;
                    
                    // Add subtle white glow at the edges (reduced from 0.6 to 0.3)
                    float glowRadius = 0.5;
                    float glowIntensity = smoothstep(glowRadius * 0.7, glowRadius, dist);
                    finalColor = mix(finalColor, vec3(1.0, 1.0, 1.0), glowIntensity * 0.3);
                    
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
            
            // Larger size at start, progressively smaller toward end
            // Use exponential falloff for more dramatic size reduction
            const normalizedPosition = i / particleCount;
            const sizeFalloff = Math.pow(1 - normalizedPosition, 1.5); // Exponential falloff
            sizes[i] = 8.0 * sizeFalloff; // Start larger to show full logo
            
            // Alpha decreases along trail (fade out)
            alphas[i] = 1 - (i / particleCount);
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        geometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));
        
        // Custom shader material for holographic effect
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                pointTexture: { value: texture },
                glitchAmount: { value: 0.0 }
            },
            vertexShader: `
                attribute float size;
                attribute float alpha;
                attribute vec3 color;
                
                varying vec3 vColor;
                varying float vAlpha;
                uniform float time;
                uniform float glitchAmount;
                
                void main() {
                    vColor = color;
                    vAlpha = alpha;
                    
                    vec3 pos = position;
                    
                    // Glitchy movement
                    pos.x += sin(time * 10.0 + position.y * 5.0) * glitchAmount * 0.02;
                    pos.y += cos(time * 15.0 + position.x * 5.0) * glitchAmount * 0.02;
                    
                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    float pointSize = size * 2000.0 / -mvPosition.z;
                    gl_PointSize = clamp(pointSize, 10.0, 256.0); // Larger min/max for VR visibility
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform sampler2D pointTexture;
                uniform float time;
                
                varying vec3 vColor;
                varying float vAlpha;
                
                void main() {
                    // Flip the texture vertically by inverting Y coordinate
                    vec2 uv = vec2(gl_PointCoord.x, 1.0 - gl_PointCoord.y);
                    vec4 texColor = texture2D(pointTexture, uv);
                    
                    // Calculate distance from center for glow effect
                    vec2 center = vec2(0.5, 0.5);
                    float dist = distance(gl_PointCoord, center);
                    
                    // If transparent, check if we should draw glow
                    if (texColor.a < 0.1) {
                        // Create subtle white glow around the particle (reduced intensity)
                        float glowRadius = 0.5; // Size of glow area
                        float glowIntensity = smoothstep(glowRadius, glowRadius * 0.7, dist);
                        
                        if (glowIntensity > 0.0) {
                            // Draw subtle white glow (reduced from 0.4 to 0.2)
                            gl_FragColor = vec4(1.0, 1.0, 1.0, glowIntensity * vAlpha * 0.2);
                            return;
                        }
                        discard;
                    }
                    
                    // Remove white background if present
                    float isWhite = step(0.9, texColor.r) * step(0.9, texColor.g) * step(0.9, texColor.b);
                    if (isWhite > 0.5) {
                        // Even on white background, draw the subtle glow
                        float glowRadius = 0.5;
                        float glowIntensity = smoothstep(glowRadius, glowRadius * 0.7, dist);
                        
                        if (glowIntensity > 0.0) {
                            gl_FragColor = vec4(1.0, 1.0, 1.0, glowIntensity * vAlpha * 0.2);
                            return;
                        }
                        discard;
                    }
                    
                    // Holographic color shift
                    vec3 rainbowColor = vColor;
                    rainbowColor.r += sin(time * 2.0) * 0.15;
                    rainbowColor.g += sin(time * 2.0 + 2.0) * 0.15;
                    rainbowColor.b += sin(time * 2.0 + 4.0) * 0.15;
                    
                    // Apply psychedelic tint with reduced brightness
                    vec3 finalColor = texColor.rgb * rainbowColor * 0.7;
                    float finalAlpha = texColor.a * vAlpha * 0.7;
                    
                    // Add subtle white glow at the edges (reduced from 0.6 to 0.3)
                    float glowRadius = 0.5;
                    float glowIntensity = smoothstep(glowRadius * 0.7, glowRadius, dist);
                    finalColor = mix(finalColor, vec3(1.0, 1.0, 1.0), glowIntensity * 0.3);
                    
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
     */
    updateTrail(worldPosition) {
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
        
        console.log(`📏 isDragging: ${this.isDragging}, distance: ${distance.toFixed(4)}`);
        
        if (distance > 0.001) { // Lower threshold for more sensitive sound triggering
            // Calculate velocity for Doppler effect
            const velocity = new THREE.Vector3().subVectors(this.currentPosition, this.lastPosition);
            
            // Play swoosh sound if dragging
            if (this.isDragging) {
                console.log(`🎵 ✅ PLAYING SOUND - distance: ${distance.toFixed(4)}`);
                this.playSwooshSound(worldPosition, velocity);
            } else {
                console.log(`🎵 ❌ NOT dragging, no sound`);
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
                    
                    // Add some random offset for variety
                    const offset = new THREE.Vector3(
                        (Math.random() - 0.5) * 0.05,
                        (Math.random() - 0.5) * 0.05,
                        (Math.random() - 0.5) * 0.05
                    );
                    
                    positions[i * 3] = trailPos.x + offset.x;
                    positions[i * 3 + 1] = trailPos.y + offset.y;
                    positions[i * 3 + 2] = trailPos.z + offset.z;
                    
                    // Larger size to show more of the image (increased for VR)
                    sizes[i] = 6.0 * (1 - i / this.maxTrailLength) * (0.8 + Math.random() * 0.4);
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
                
                // Larger size to show more of the image (increased for VR)
                sizes[i] = 6.0 * (1 - i / this.maxTrailLength) * 0.9;
                
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
                // Update shader uniforms
                system.material.uniforms.time.value = this.time;
                
                // Add glitch effect randomly
                if (Math.random() < 0.05) { // 5% chance per frame
                    system.material.uniforms.glitchAmount.value = Math.random();
                } else {
                    system.material.uniforms.glitchAmount.value *= 0.9; // Fade out glitch
                }
                
                // Rotate colors through psychedelic spectrum
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
     * Set particle intensity (0-1)
     */
    setIntensity(intensity) {
        this.particleSystems.forEach(system => {
            system.material.uniforms.glitchAmount.value = intensity;
        });
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
        
        // Reset sound cooldown to allow immediate sound on drag start
        this.lastSoundPlayTime = 0;
        
        // Play initial sound on drag start
        if (this.currentPosition) {
            const initialVelocity = new THREE.Vector3(0, 0, 0);
            console.log('🎵 Playing initial drag sound');
            this.playSwooshSound(this.currentPosition, initialVelocity);
        }
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
