/**
 * PerformanceMonitor - Real-time performance overlay
 * FPS, memory, draw calls, optimization suggestions
 */
export class PerformanceMonitor {
    constructor(renderer, scene) {
        this.renderer = renderer;
        this.scene = scene;
        
        // Metrics
        this.metrics = {
            fps: 0,
            frameTime: 0,
            memory: 0,
            drawCalls: 0,
            triangles: 0,
            textures: 0,
            geometries: 0
        };
        
        // History
        this.fpsHistory = [];
        this.maxHistoryLength = 60;
        
        // Timing
        this.lastTime = performance.now();
        this.frames = 0;
        this.fpsUpdateInterval = 500; // ms
        this.lastFpsUpdate = 0;
        
        // Create overlay
        this.createOverlay();
        
        console.log('📊 PerformanceMonitor initialized');
    }
    
    /**
     * Update metrics
     */
    update() {
        const now = performance.now();
        this.frames++;
        
        // Update FPS
        if (now - this.lastFpsUpdate >= this.fpsUpdateInterval) {
            this.metrics.fps = Math.round((this.frames * 1000) / (now - this.lastFpsUpdate));
            this.metrics.frameTime = ((now - this.lastFpsUpdate) / this.frames).toFixed(2);
            
            // Add to history
            this.fpsHistory.push(this.metrics.fps);
            if (this.fpsHistory.length > this.maxHistoryLength) {
                this.fpsHistory.shift();
            }
            
            this.frames = 0;
            this.lastFpsUpdate = now;
        }
        
        // Update memory
        if (performance.memory) {
            this.metrics.memory = (performance.memory.usedJSHeapSize / 1048576).toFixed(2);
        }
        
        // Update renderer info
        if (this.renderer && this.renderer.info) {
            const info = this.renderer.info;
            this.metrics.drawCalls = info.render.calls;
            this.metrics.triangles = info.render.triangles;
            this.metrics.textures = info.memory.textures;
            this.metrics.geometries = info.memory.geometries;
        }
        
        // Update display
        this.updateDisplay();
    }
    
    /**
     * Create performance overlay
     */
    createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.id = 'performance-monitor';
        this.overlay.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: rgba(0, 0, 0, 0.9);
            color: #0f0;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            border-radius: 8px 0 0 8px;
            z-index: 10000;
            min-width: 250px;
            border: 1px solid rgba(0, 255, 0, 0.3);
            border-right: none;
            transition: transform 0.3s ease;
        `;
        
        this.overlay.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 15px; cursor: pointer;" id="perf-header">
                <span style="font-weight: bold; color: #0ff;">
                    <span id="perf-emoji">📊</span>
                    <span style="transition: opacity 0.3s ease;" id="perf-title"> Performance</span>
                </span>
                <span style="font-size: 18px; transition: transform 0.3s ease;" id="perf-toggle">◀</span>
            </div>
            <div id="perf-content" style="padding: 0 15px 15px 15px;">
                <canvas id="fps-graph" width="220" height="60" style="display: block; margin-bottom: 10px;"></canvas>
                <div id="perf-stats"></div>
            </div>
        `;
        
        document.body.appendChild(this.overlay);
        
        // Add collapse functionality with slide animation
        const header = document.getElementById('perf-header');
        const content = document.getElementById('perf-content');
        const toggle = document.getElementById('perf-toggle');
        const title = document.getElementById('perf-title');
        this.isCollapsed = false;
        
        header.addEventListener('click', () => {
            this.isCollapsed = !this.isCollapsed;
            if (this.isCollapsed) {
                // Slide out to the right
                content.style.display = 'none';
                title.style.opacity = '0';
                this.overlay.style.transform = 'translateX(calc(100% - 35px))';
                this.overlay.style.minWidth = '35px';
                this.overlay.style.borderRadius = '8px 0 0 8px';
                header.style.padding = '10px 8px';
                header.style.justifyContent = 'center';
                toggle.textContent = '▶';
            } else {
                // Slide in from the right
                content.style.display = 'block';
                title.style.opacity = '1';
                this.overlay.style.transform = 'translateX(0)';
                this.overlay.style.minWidth = '250px';
                header.style.padding = '15px';
                header.style.justifyContent = 'space-between';
                toggle.textContent = '◀';
            }
        });
        
        this.canvas = document.getElementById('fps-graph');
        this.ctx = this.canvas.getContext('2d');
        this.statsDiv = document.getElementById('perf-stats');
    }
    
    /**
     * Update display
     */
    updateDisplay() {
        // Draw FPS graph
        this.drawFPSGraph();
        
        // Update stats
        const fpsColor = this.getFPSColor(this.metrics.fps);
        
        this.statsDiv.innerHTML = `
            <div style="color: ${fpsColor};">FPS: ${this.metrics.fps}</div>
            <div>Frame: ${this.metrics.frameTime}ms</div>
            <div>Memory: ${this.metrics.memory} MB</div>
            <div>Draw Calls: ${this.metrics.drawCalls}</div>
            <div>Triangles: ${this.formatNumber(this.metrics.triangles)}</div>
            <div>Textures: ${this.metrics.textures}</div>
            <div>Geometries: ${this.metrics.geometries}</div>
            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(0,255,0,0.3);">
                ${this.getOptimizationSuggestion()}
            </div>
        `;
    }
    
    /**
     * Draw FPS graph
     */
    drawFPSGraph() {
        if (!this.ctx) return;
        
        const { width, height } = this.canvas;
        
        // Clear
        this.ctx.fillStyle = 'rgba(0, 20, 0, 0.3)';
        this.ctx.fillRect(0, 0, width, height);
        
        // Grid
        this.ctx.strokeStyle = 'rgba(0, 255, 0, 0.1)';
        this.ctx.lineWidth = 1;
        
        // 30 FPS line
        const y30 = height - (30 / 60 * height);
        this.ctx.beginPath();
        this.ctx.moveTo(0, y30);
        this.ctx.lineTo(width, y30);
        this.ctx.stroke();
        
        // 60 FPS line
        this.ctx.strokeStyle = 'rgba(0, 255, 0, 0.2)';
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(width, 0);
        this.ctx.stroke();
        
        // Draw FPS line
        if (this.fpsHistory.length > 1) {
            this.ctx.strokeStyle = '#0f0';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            
            const step = width / this.maxHistoryLength;
            
            this.fpsHistory.forEach((fps, i) => {
                const x = i * step;
                const y = height - (Math.min(fps, 60) / 60 * height);
                
                if (i === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            });
            
            this.ctx.stroke();
            
            // Fill under line
            this.ctx.lineTo(width, height);
            this.ctx.lineTo(0, height);
            this.ctx.closePath();
            
            const gradient = this.ctx.createLinearGradient(0, 0, 0, height);
            gradient.addColorStop(0, 'rgba(0, 255, 0, 0.3)');
            gradient.addColorStop(1, 'rgba(0, 255, 0, 0)');
            this.ctx.fillStyle = gradient;
            this.ctx.fill();
        }
        
        // Labels
        this.ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
        this.ctx.font = '10px monospace';
        this.ctx.fillText('60', 5, 10);
        this.ctx.fillText('30', 5, y30 + 10);
        this.ctx.fillText('0', 5, height - 3);
    }
    
    /**
     * Get FPS color
     */
    getFPSColor(fps) {
        if (fps >= 55) return '#0f0'; // Green
        if (fps >= 30) return '#ff0'; // Yellow
        return '#f00'; // Red
    }
    
    /**
     * Format large numbers
     */
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }
    
    /**
     * Get optimization suggestion
     */
    getOptimizationSuggestion() {
        const suggestions = [];
        
        if (this.metrics.fps < 30) {
            suggestions.push('⚠️ Low FPS detected');
        }
        
        if (this.metrics.drawCalls > 100) {
            suggestions.push('🔴 Too many draw calls');
        }
        
        if (this.metrics.triangles > 500000) {
            suggestions.push('🔴 High triangle count');
        }
        
        if (this.metrics.memory > 200) {
            suggestions.push('⚠️ High memory usage');
        }
        
        if (suggestions.length === 0) {
            return '<span style="color: #0f0;">✅ Performance good</span>';
        }
        
        return `<span style="color: #f00;">${suggestions.join('<br>')}</span>`;
    }
    
    /**
     * Get performance report
     */
    getReport() {
        const avgFps = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
        const minFps = Math.min(...this.fpsHistory);
        const maxFps = Math.max(...this.fpsHistory);
        
        return {
            current: this.metrics,
            averageFps: avgFps.toFixed(1),
            minFps,
            maxFps,
            performance: avgFps >= 55 ? 'excellent' : avgFps >= 30 ? 'good' : 'poor'
        };
    }
    
    /**
     * Toggle visibility
     */
    toggle() {
        if (this.overlay) {
            this.overlay.style.display = this.overlay.style.display === 'none' ? 'block' : 'none';
        }
    }
    
    /**
     * Cleanup
     */
    cleanup() {
        if (this.overlay) {
            this.overlay.remove();
        }
    }
}
