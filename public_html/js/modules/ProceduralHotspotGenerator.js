/**
 * ProceduralHotspotGenerator - Algorithmic hotspot placement
 * Poisson disc sampling, Fibonacci sphere, dynamic difficulty zones
 */
export class ProceduralHotspotGenerator {
    constructor(scene, audioContext) {
        this.scene = scene;
        this.audioContext = audioContext;
        
        // Generation parameters
        this.parameters = {
            minDistance: 25, // Minimum degrees between hotspots
            maxAttempts: 30,
            sphereRadius: 100,
            difficulty: 'medium' // easy, medium, hard, extreme
        };
        
        // Difficulty profiles
        this.difficultyProfiles = {
            easy: { count: 8, minDist: 35, size: 1.5, audioRange: 60 },
            medium: { count: 15, minDist: 25, size: 1.0, audioRange: 45 },
            hard: { count: 25, minDist: 18, size: 0.7, audioRange: 30 },
            extreme: { count: 40, minDist: 12, size: 0.5, audioRange: 20 }
        };
        
        console.log('🎲 ProceduralHotspotGenerator initialized');
    }
    
    /**
     * Generate hotspots using Poisson disc sampling
     */
    generatePoissonDisc(count, minDistance = 25) {
        const hotspots = [];
        const activeList = [];
        
        // Start with random initial point
        const initial = {
            lat: this.randomInRange(-60, 60),
            lon: this.randomInRange(-180, 180)
        };
        
        hotspots.push(initial);
        activeList.push(initial);
        
        // Generate points
        while (activeList.length > 0 && hotspots.length < count) {
            const randomIndex = Math.floor(Math.random() * activeList.length);
            const point = activeList[randomIndex];
            let found = false;
            
            // Try to find valid neighbor
            for (let i = 0; i < this.parameters.maxAttempts; i++) {
                const newPoint = this.randomPointAround(point, minDistance, minDistance * 2);
                
                // Check if point is valid
                if (this.isValidPoint(newPoint, hotspots, minDistance)) {
                    hotspots.push(newPoint);
                    activeList.push(newPoint);
                    found = true;
                    break;
                }
            }
            
            // Remove point if no neighbors found
            if (!found) {
                activeList.splice(randomIndex, 1);
            }
        }
        
        return this.createHotspotsFromPoints(hotspots);
    }
    
    /**
     * Generate hotspots using Fibonacci sphere
     */
    generateFibonacciSphere(count) {
        const hotspots = [];
        const phi = Math.PI * (3 - Math.sqrt(5)); // Golden angle
        
        for (let i = 0; i < count; i++) {
            const y = 1 - (i / (count - 1)) * 2; // -1 to 1
            const radius = Math.sqrt(1 - y * y);
            
            const theta = phi * i;
            
            const x = Math.cos(theta) * radius;
            const z = Math.sin(theta) * radius;
            
            // Convert to lat/lon
            const lat = Math.asin(y) * (180 / Math.PI);
            const lon = Math.atan2(z, x) * (180 / Math.PI);
            
            // Filter out extreme poles
            if (Math.abs(lat) < 75) {
                hotspots.push({ lat, lon });
            }
        }
        
        return this.createHotspotsFromPoints(hotspots);
    }
    
    /**
     * Generate hotspots in clusters (difficulty zones)
     */
    generateClustered(clusterCount, hotspotsPerCluster) {
        const hotspots = [];
        
        // Generate cluster centers
        const centers = this.generateFibonacciSphere(clusterCount).map(h => ({
            lat: h.position.lat,
            lon: h.position.lon
        }));
        
        // Generate hotspots around each center
        centers.forEach(center => {
            for (let i = 0; i < hotspotsPerCluster; i++) {
                const offset = {
                    lat: this.randomInRange(-15, 15),
                    lon: this.randomInRange(-15, 15)
                };
                
                hotspots.push({
                    lat: center.lat + offset.lat,
                    lon: center.lon + offset.lon
                });
            }
        });
        
        return this.createHotspotsFromPoints(hotspots);
    }
    
    /**
     * Generate hotspots along a path (narrative journey)
     */
    generatePath(waypoints, hotspotsPerSegment) {
        const hotspots = [];
        
        for (let i = 0; i < waypoints.length - 1; i++) {
            const start = waypoints[i];
            const end = waypoints[i + 1];
            
            // Interpolate between waypoints
            for (let j = 0; j < hotspotsPerSegment; j++) {
                const t = j / hotspotsPerSegment;
                
                hotspots.push({
                    lat: this.lerp(start.lat, end.lat, t),
                    lon: this.lerp(start.lon, end.lon, t)
                });
            }
        }
        
        return this.createHotspotsFromPoints(hotspots);
    }
    
    /**
     * Create hotspot objects from position data
     */
    createHotspotsFromPoints(points) {
        return points.map((point, index) => {
            const profile = this.difficultyProfiles[this.parameters.difficulty];
            
            return {
                id: `proc_${Date.now()}_${index}`,
                position: {
                    lat: point.lat,
                    lon: point.lon
                },
                label: this.generateLabel(index),
                audioUrl: this.selectRandomAudio(),
                size: profile.size,
                discovered: false,
                procedural: true
            };
        });
    }
    
    /**
     * Generate creative label
     */
    generateLabel(index) {
        const prefixes = [
            'Echoing', 'Mysterious', 'Hidden', 'Distant', 'Ethereal',
            'Whispered', 'Resonant', 'Ambient', 'Spectral', 'Celestial'
        ];
        
        const types = [
            'Voice', 'Melody', 'Rhythm', 'Harmony', 'Tone',
            'Sound', 'Note', 'Echo', 'Whisper', 'Song'
        ];
        
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const type = types[Math.floor(Math.random() * types.length)];
        
        return `${prefix} ${type} ${index + 1}`;
    }
    
    /**
     * Select random audio file
     */
    selectRandomAudio() {
        const audioFiles = [
            'assets/sound/ambient1.mp3',
            'assets/sound/ambient2.mp3',
            'assets/sound/ambient3.mp3',
            'assets/sound/chime.mp3',
            'assets/sound/drone.mp3'
        ];
        
        return audioFiles[Math.floor(Math.random() * audioFiles.length)];
    }
    
    /**
     * Random point around existing point
     */
    randomPointAround(point, minDist, maxDist) {
        const angle = Math.random() * 2 * Math.PI;
        const distance = minDist + Math.random() * (maxDist - minDist);
        
        return {
            lat: point.lat + Math.cos(angle) * distance,
            lon: point.lon + Math.sin(angle) * distance
        };
    }
    
    /**
     * Check if point is valid
     */
    isValidPoint(point, existingPoints, minDistance) {
        // Check bounds
        if (Math.abs(point.lat) > 85 || Math.abs(point.lon) > 180) {
            return false;
        }
        
        // Check distance to all existing points
        for (const existing of existingPoints) {
            const distance = this.calculateAngularDistance(point, existing);
            if (distance < minDistance) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Calculate angular distance between two points
     */
    calculateAngularDistance(p1, p2) {
        const dLat = p1.lat - p2.lat;
        const dLon = p1.lon - p2.lon;
        return Math.sqrt(dLat * dLat + dLon * dLon);
    }
    
    /**
     * Linear interpolation
     */
    lerp(start, end, t) {
        return start + (end - start) * t;
    }
    
    /**
     * Random in range
     */
    randomInRange(min, max) {
        return min + Math.random() * (max - min);
    }
    
    /**
     * Set difficulty
     */
    setDifficulty(difficulty) {
        if (this.difficultyProfiles[difficulty]) {
            this.parameters.difficulty = difficulty;
            console.log(`🎲 Procedural difficulty: ${difficulty}`);
        }
    }
    
    /**
     * Generate by difficulty
     */
    generateByDifficulty(difficulty = null) {
        const diff = difficulty || this.parameters.difficulty;
        const profile = this.difficultyProfiles[diff];
        
        return this.generatePoissonDisc(profile.count, profile.minDist);
    }
    
    /**
     * Generate infinite hotspots (progressive generation)
     */
    generateInfinite(discoveryCount) {
        // Increase difficulty as player progresses
        const difficulty = this.getDifficultyByProgress(discoveryCount);
        this.setDifficulty(difficulty);
        
        return this.generateByDifficulty();
    }
    
    /**
     * Get difficulty based on progress
     */
    getDifficultyByProgress(count) {
        if (count < 10) return 'easy';
        if (count < 25) return 'medium';
        if (count < 50) return 'hard';
        return 'extreme';
    }
}
