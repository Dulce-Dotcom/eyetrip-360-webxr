import * as THREE from 'https://unpkg.com/three@0.153.0/build/three.module.js';

/**
 * MiniMap - 2D navigation aid for 360° experiences
 * Shows: explored areas, hotspot positions, current view direction
 */
export class MiniMap {
    constructor(camera, hotspotManager) {
        this.camera = camera;
        this.hotspotManager = hotspotManager;
        
        // Canvas setup
        this.size = 200;
        this.canvas = null;
        this.ctx = null;
        this.container = null;
        
        // Tracking
        this.exploredAngles = new Set(); // Track which angles have been viewed
        this.angleResolution = 5; // Degrees per segment
        
        console.log('🗺️ MiniMap initialized');
    }
    
    /**
     * Create and show the mini-map UI
     */
    create() {
        // Create container
        this.container = document.createElement('div');
        this.container.id = 'mini-map-container';
        this.container.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            width: ${this.size}px;
            height: ${this.size}px;
            background: rgba(0, 0, 0, 0.8);
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            overflow: hidden;
            z-index: 1000;
            backdrop-filter: blur(10px);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        `;
        
        // Create canvas
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.size;
        this.canvas.height = this.size;
        this.canvas.style.cssText = `
            display: block;
            width: 100%;
            height: 100%;
        `;
        
        this.container.appendChild(this.canvas);
        document.body.appendChild(this.container);
        
        this.ctx = this.canvas.getContext('2d');
        
        console.log('✅ MiniMap created');
    }
    
    /**
     * Update the mini-map based on current camera orientation
     */
    update() {
        if (!this.ctx) return;
        
        const center = this.size / 2;
        const radius = this.size / 2 - 10;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.size, this.size);
        
        // Draw background circle
        this.ctx.fillStyle = 'rgba(10, 10, 30, 0.9)';
        this.ctx.beginPath();
        this.ctx.arc(center, center, radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Get camera direction (yaw angle)
        const cameraDirection = new THREE.Vector3();
        this.camera.getWorldDirection(cameraDirection);
        
        // Calculate angle (0-360)
        const angleRad = Math.atan2(cameraDirection.x, cameraDirection.z);
        const angleDeg = ((angleRad * 180 / Math.PI) + 360) % 360;
        
        // Mark current angle as explored
        const angleSegment = Math.floor(angleDeg / this.angleResolution);
        this.exploredAngles.add(angleSegment);
        
        // Draw explored areas (blue gradient wedges)
        this.exploredAngles.forEach(segment => {
            const startAngle = (segment * this.angleResolution) * Math.PI / 180;
            const endAngle = ((segment + 1) * this.angleResolution) * Math.PI / 180;
            
            this.ctx.fillStyle = 'rgba(0, 150, 255, 0.3)';
            this.ctx.beginPath();
            this.ctx.moveTo(center, center);
            this.ctx.arc(center, center, radius, startAngle - Math.PI / 2, endAngle - Math.PI / 2);
            this.ctx.closePath();
            this.ctx.fill();
        });
        
        // Draw hotspot positions
        if (this.hotspotManager && this.hotspotManager.hotspots) {
            this.hotspotManager.hotspots.forEach(hotspot => {
                if (!hotspot.mesh) return;
                
                // Get hotspot position relative to camera
                const hotspotPos = hotspot.mesh.position.clone();
                const hotspotAngle = Math.atan2(hotspotPos.x, hotspotPos.z);
                const hotspotAngleDeg = ((hotspotAngle * 180 / Math.PI) + 360) % 360;
                
                // Convert to canvas coordinates
                const angleRad = (hotspotAngleDeg - 90) * Math.PI / 180;
                const dotRadius = radius * 0.7; // Place dots 70% from center
                const x = center + Math.cos(angleRad) * dotRadius;
                const y = center + Math.sin(angleRad) * dotRadius;
                
                // Color based on discovery status
                if (hotspot.discovered) {
                    this.ctx.fillStyle = '#00ff00'; // Green for discovered
                    this.ctx.shadowColor = '#00ff00';
                    this.ctx.shadowBlur = 10;
                } else if (hotspot.visible) {
                    this.ctx.fillStyle = '#ffff00'; // Yellow for active
                    this.ctx.shadowColor = '#ffff00';
                    this.ctx.shadowBlur = 8;
                } else {
                    this.ctx.fillStyle = 'rgba(255, 255, 0, 0.3)'; // Dim yellow for upcoming
                    this.ctx.shadowBlur = 0;
                }
                
                // Draw hotspot dot
                this.ctx.beginPath();
                this.ctx.arc(x, y, 5, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.shadowBlur = 0;
            });
        }
        
        // Draw current view direction (white wedge/arrow)
        const viewAngle = (angleDeg - 90) * Math.PI / 180;
        const fov = 30; // Field of view in degrees
        const fovRad = fov * Math.PI / 180;
        
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        
        this.ctx.beginPath();
        this.ctx.moveTo(center, center);
        this.ctx.arc(center, center, radius, viewAngle - fovRad / 2, viewAngle + fovRad / 2);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
        
        // Draw center dot (camera position)
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(center, center, 4, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Add compass directions (N, S, E, W)
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        this.ctx.fillText('N', center, center - radius + 15);
        this.ctx.fillText('S', center, center + radius - 15);
        this.ctx.fillText('E', center + radius - 15, center);
        this.ctx.fillText('W', center - radius + 15, center);
    }
    
    /**
     * Remove the mini-map from DOM
     */
    cleanup() {
        if (this.container) {
            this.container.remove();
            this.container = null;
            this.canvas = null;
            this.ctx = null;
        }
        this.exploredAngles.clear();
        console.log('🗑️ MiniMap cleaned up');
    }
    
    /**
     * Reset explored areas (for new video/experience)
     */
    reset() {
        this.exploredAngles.clear();
        console.log('🔄 MiniMap reset');
    }
}
