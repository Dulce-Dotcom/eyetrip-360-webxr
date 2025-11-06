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
        this.maxTrailLength = 50; // Number of particles in trail
        
        // Animation properties
        this.time = 0;
        this.isActive = false;
        
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
     * Load SVG icons as textures and create particle systems
     */
    async initialize() {
        // Initialize THREE.js objects here after import is complete
        this.psychedelicColors = [
            new THREE.Color(0xffff00), // Electric yellow
            new THREE.Color(0xff00ff), // Magenta
            new THREE.Color(0x00ffff), // Cyan
            new THREE.Color(0xff0088), // Hot pink
            new THREE.Color(0x00ff88), // Mint green
            new THREE.Color(0x8800ff)  // Purple
        ];
        
        this.lastPosition = new THREE.Vector3();
        this.currentPosition = new THREE.Vector3();
        const textureLoader = new THREE.TextureLoader();
        
        try {
            // Load all SVG textures
            const texturePromises = this.iconPaths.map(path => 
                new Promise((resolve, reject) => {
                    textureLoader.load(
                        path,
                        (texture) => {
                            console.log(`✅ Loaded particle texture: ${path}`);
                            resolve(texture);
                        },
                        undefined,
                        (error) => {
                            console.warn(`⚠️ Could not load ${path}, using fallback`);
                            resolve(null);
                        }
                    );
                })
            );
            
            const textures = await Promise.all(texturePromises);
            
            // Create particle system for each texture
            textures.forEach((texture, index) => {
                const particleSystem = this.createParticleSystem(texture, index);
                this.particleSystems.push(particleSystem);
                this.scene.add(particleSystem);
            });
            
            console.log(`🎨 Created ${this.particleSystems.length} particle systems`);
            
        } catch (error) {
            console.error('❌ Error loading particle textures:', error);
        }
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
            
            // Much larger size to show full logo
            sizes[i] = 3.0 * (1 - i / particleCount);
            
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
                    float pointSize = size * 5000.0 / -mvPosition.z;
                    gl_PointSize = clamp(pointSize, 1.0, 256.0); // Increased max to 256px for larger particles
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform sampler2D pointTexture;
                uniform float time;
                
                varying vec3 vColor;
                varying float vAlpha;
                
                void main() {
                    // Center the texture properly using gl_PointCoord
                    // gl_PointCoord goes from (0,0) at top-left to (1,1) at bottom-right
                    vec4 texColor = texture2D(pointTexture, gl_PointCoord);
                    
                    // If transparent, discard
                    if (texColor.a < 0.1) discard;
                    
                    // Remove white background if present
                    float isWhite = step(0.9, texColor.r) * step(0.9, texColor.g) * step(0.9, texColor.b);
                    if (isWhite > 0.5) discard;
                    
                    // Holographic color shift
                    vec3 rainbowColor = vColor;
                    rainbowColor.r += sin(time * 2.0) * 0.15;
                    rainbowColor.g += sin(time * 2.0 + 2.0) * 0.15;
                    rainbowColor.b += sin(time * 2.0 + 4.0) * 0.15;
                    
                    // Apply psychedelic tint with reduced brightness
                    vec3 finalColor = texColor.rgb * rainbowColor * 0.7;
                    float finalAlpha = texColor.a * vAlpha * 0.7;
                    
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
        
        return particleSystem;
    }
    
    /**
     * Update particle positions based on movement
     * @param {THREE.Vector3} worldPosition - Current position in world space
     */
    updateTrail(worldPosition) {
        if (!worldPosition) return;
        
        this.currentPosition.copy(worldPosition);
        
        // Check if there's significant movement
        const distance = this.currentPosition.distanceTo(this.lastPosition);
        
        if (distance > 0.01) { // Minimum movement threshold
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
                    
                    // Much larger to show full eye logo detail
                    sizes[i] = 3.5 * (1 - i / this.maxTrailLength) * (0.8 + Math.random() * 0.4);
                }
                
                system.geometry.attributes.position.needsUpdate = true;
                system.geometry.attributes.size.needsUpdate = true;
            });
            
            this.lastPosition.copy(this.currentPosition);
            this.isActive = true;
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
}
