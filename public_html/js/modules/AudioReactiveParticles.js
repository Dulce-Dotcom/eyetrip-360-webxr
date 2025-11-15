/**
 * AudioReactiveParticles - Frequency-based particle visualization
 * 10k particle system that responds to audio spectrum analysis
 */
import * as THREE from 'three';

export class AudioReactiveParticles {
    constructor(scene, audioContext, audioElement) {
        this.scene = scene;
        this.audioContext = audioContext;
        this.audioElement = audioElement;
        
        // Particle system
        this.particleCount = 10000;
        this.particles = null;
        this.particleGeometry = null;
        this.particleMaterial = null;
        
        // Audio analysis
        this.analyser = null;
        this.dataArray = null;
        this.frequencyBands = 128;
        
        // Parameters
        this.parameters = {
            size: 0.5,
            spread: 200,
            speed: 0.5,
            reactivity: 2.0,
            colorIntensity: 1.0
        };
        
        // Setup audio analysis
        this.setupAudioAnalysis();
        
        // Create particle system
        this.createParticleSystem();
        
        console.log('🎨 AudioReactiveParticles initialized');
    }
    
    /**
     * Setup audio analysis
     */
    setupAudioAnalysis() {
        if (!this.audioContext) {
            console.warn('⚠️ No audio context provided');
            return;
        }
        
        // Create analyser
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 256;
        this.analyser.smoothingTimeConstant = 0.8;
        
        this.frequencyBands = this.analyser.frequencyBinCount;
        this.dataArray = new Uint8Array(this.frequencyBands);
        
        // Connect audio element
        if (this.audioElement) {
            const source = this.audioContext.createMediaElementSource(this.audioElement);
            source.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);
        }
    }
    
    /**
     * Create particle system
     */
    createParticleSystem() {
        // Geometry
        this.particleGeometry = new THREE.BufferGeometry();
        
        const positions = new Float32Array(this.particleCount * 3);
        const colors = new Float32Array(this.particleCount * 3);
        const sizes = new Float32Array(this.particleCount);
        const velocities = new Float32Array(this.particleCount * 3);
        
        // Initialize particles in spiral pattern
        for (let i = 0; i < this.particleCount; i++) {
            const i3 = i * 3;
            
            // Fibonacci sphere distribution
            const phi = Math.acos(1 - 2 * (i + 0.5) / this.particleCount);
            const theta = Math.PI * (1 + Math.sqrt(5)) * i;
            
            const radius = this.parameters.spread;
            
            positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i3 + 2] = radius * Math.cos(phi);
            
            // Initial colors (will be updated by audio)
            colors[i3] = Math.random();
            colors[i3 + 1] = Math.random();
            colors[i3 + 2] = Math.random();
            
            // Random sizes
            sizes[i] = Math.random() * 2 + 1;
            
            // Random velocities
            velocities[i3] = (Math.random() - 0.5) * 0.1;
            velocities[i3 + 1] = (Math.random() - 0.5) * 0.1;
            velocities[i3 + 2] = (Math.random() - 0.5) * 0.1;
        }
        
        this.particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        this.particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        // Store velocities
        this.velocities = velocities;
        
        // Material
        this.particleMaterial = new THREE.PointsMaterial({
            size: this.parameters.size,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            sizeAttenuation: true
        });
        
        // Create points
        this.particles = new THREE.Points(this.particleGeometry, this.particleMaterial);
        this.scene.add(this.particles);
        
        console.log('✅ Particle system created:', this.particleCount, 'particles');
    }
    
    /**
     * Update particle system
     */
    update(deltaTime = 0.016) {
        if (!this.particles || !this.analyser) return;
        
        // Get frequency data
        this.analyser.getByteFrequencyData(this.dataArray);
        
        // Calculate audio metrics
        const bassAvg = this.getFrequencyAverage(0, 10);
        const midAvg = this.getFrequencyAverage(10, 50);
        const trebleAvg = this.getFrequencyAverage(50, 128);
        const overallAvg = this.getFrequencyAverage(0, 128);
        
        // Update particles
        const positions = this.particleGeometry.attributes.position.array;
        const colors = this.particleGeometry.attributes.color.array;
        const sizes = this.particleGeometry.attributes.size.array;
        
        for (let i = 0; i < this.particleCount; i++) {
            const i3 = i * 3;
            
            // Map particle to frequency band
            const bandIndex = Math.floor((i / this.particleCount) * this.frequencyBands);
            const frequency = this.dataArray[bandIndex] / 255.0;
            
            // Update position based on frequency
            const reactivity = this.parameters.reactivity * frequency;
            
            positions[i3] += this.velocities[i3] * reactivity;
            positions[i3 + 1] += this.velocities[i3 + 1] * reactivity;
            positions[i3 + 2] += this.velocities[i3 + 2] * reactivity;
            
            // Keep particles within bounds (sphere)
            const distance = Math.sqrt(
                positions[i3] * positions[i3] +
                positions[i3 + 1] * positions[i3 + 1] +
                positions[i3 + 2] * positions[i3 + 2]
            );
            
            if (distance > this.parameters.spread) {
                const factor = this.parameters.spread / distance;
                positions[i3] *= factor;
                positions[i3 + 1] *= factor;
                positions[i3 + 2] *= factor;
                
                // Reverse velocity
                this.velocities[i3] *= -0.5;
                this.velocities[i3 + 1] *= -0.5;
                this.velocities[i3 + 2] *= -0.5;
            }
            
            // Update colors based on frequency bands
            if (i < this.particleCount / 3) {
                // Bass = Red
                colors[i3] = 1.0 * bassAvg * this.parameters.colorIntensity;
                colors[i3 + 1] = 0.2 * bassAvg;
                colors[i3 + 2] = 0.2 * bassAvg;
            } else if (i < (this.particleCount * 2) / 3) {
                // Mid = Green
                colors[i3] = 0.2 * midAvg;
                colors[i3 + 1] = 1.0 * midAvg * this.parameters.colorIntensity;
                colors[i3 + 2] = 0.2 * midAvg;
            } else {
                // Treble = Blue
                colors[i3] = 0.2 * trebleAvg;
                colors[i3 + 1] = 0.2 * trebleAvg;
                colors[i3 + 2] = 1.0 * trebleAvg * this.parameters.colorIntensity;
            }
            
            // Update size based on frequency
            sizes[i] = (this.parameters.size + frequency * 3) * (1 + overallAvg);
        }
        
        // Mark for update
        this.particleGeometry.attributes.position.needsUpdate = true;
        this.particleGeometry.attributes.color.needsUpdate = true;
        this.particleGeometry.attributes.size.needsUpdate = true;
        
        // Rotate entire system slowly
        this.particles.rotation.y += 0.0005 * (1 + overallAvg * 2);
        this.particles.rotation.x += 0.0003 * (1 + midAvg * 2);
    }
    
    /**
     * Get average frequency in range
     */
    getFrequencyAverage(startIndex, endIndex) {
        if (!this.dataArray) return 0;
        
        let sum = 0;
        let count = 0;
        
        for (let i = startIndex; i < endIndex && i < this.dataArray.length; i++) {
            sum += this.dataArray[i];
            count++;
        }
        
        return count > 0 ? (sum / count) / 255.0 : 0;
    }
    
    /**
     * Trigger particle burst
     */
    burst(intensity = 1.0) {
        if (!this.particles) return;
        
        for (let i = 0; i < this.particleCount; i++) {
            const i3 = i * 3;
            
            // Add outward velocity
            const direction = new THREE.Vector3(
                this.particleGeometry.attributes.position.array[i3],
                this.particleGeometry.attributes.position.array[i3 + 1],
                this.particleGeometry.attributes.position.array[i3 + 2]
            ).normalize();
            
            this.velocities[i3] += direction.x * intensity;
            this.velocities[i3 + 1] += direction.y * intensity;
            this.velocities[i3 + 2] += direction.z * intensity;
        }
    }
    
    /**
     * Set particle count
     */
    setParticleCount(count) {
        this.particleCount = count;
        
        // Recreate system
        this.cleanup();
        this.createParticleSystem();
    }
    
    /**
     * Set reactivity
     */
    setReactivity(reactivity) {
        this.parameters.reactivity = reactivity;
    }
    
    /**
     * Set spread
     */
    setSpread(spread) {
        this.parameters.spread = spread;
    }
    
    /**
     * Toggle visibility
     */
    setVisible(visible) {
        if (this.particles) {
            this.particles.visible = visible;
        }
    }
    
    /**
     * Morphing patterns
     */
    morphToShape(shape = 'sphere') {
        const positions = this.particleGeometry.attributes.position.array;
        
        for (let i = 0; i < this.particleCount; i++) {
            const i3 = i * 3;
            let targetX, targetY, targetZ;
            
            switch (shape) {
                case 'sphere':
                    const phi = Math.acos(1 - 2 * (i + 0.5) / this.particleCount);
                    const theta = Math.PI * (1 + Math.sqrt(5)) * i;
                    targetX = this.parameters.spread * Math.sin(phi) * Math.cos(theta);
                    targetY = this.parameters.spread * Math.sin(phi) * Math.sin(theta);
                    targetZ = this.parameters.spread * Math.cos(phi);
                    break;
                    
                case 'cube':
                    targetX = (Math.random() - 0.5) * this.parameters.spread * 2;
                    targetY = (Math.random() - 0.5) * this.parameters.spread * 2;
                    targetZ = (Math.random() - 0.5) * this.parameters.spread * 2;
                    break;
                    
                case 'ring':
                    const angle = (i / this.particleCount) * Math.PI * 2;
                    targetX = Math.cos(angle) * this.parameters.spread;
                    targetY = (Math.random() - 0.5) * 20;
                    targetZ = Math.sin(angle) * this.parameters.spread;
                    break;
                    
                default:
                    return;
            }
            
            // Smooth transition
            this.velocities[i3] = (targetX - positions[i3]) * 0.01;
            this.velocities[i3 + 1] = (targetY - positions[i3 + 1]) * 0.01;
            this.velocities[i3 + 2] = (targetZ - positions[i3 + 2]) * 0.01;
        }
    }
    
    /**
     * Get frequency spectrum data
     */
    getSpectrum() {
        if (!this.analyser || !this.dataArray) return null;
        
        this.analyser.getByteFrequencyData(this.dataArray);
        return Array.from(this.dataArray);
    }
    
    /**
     * Cleanup
     */
    cleanup() {
        if (this.particles) {
            this.scene.remove(this.particles);
        }
        
        if (this.particleGeometry) {
            this.particleGeometry.dispose();
        }
        
        if (this.particleMaterial) {
            this.particleMaterial.dispose();
        }
    }
}
