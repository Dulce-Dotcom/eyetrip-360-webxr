/**
 * VideoStreamManager.js
 * Handles adaptive video streaming for WebXR 360° experiences
 * Supports HLS streaming and quality switching based on device/bandwidth
 */

class VideoStreamManager {
    constructor() {
        this.videos = new Map();
        this.currentVideo = null;
        this.currentQuality = 'auto';
        this.videoCache = new Map();
        this.preloadQueue = [];
        this.isVR = false;
        
        // Video quality configurations
        this.qualities = {
            '4k': { width: 3840, height: 1920, bitrate: 15000000 },
            '1080p': { width: 2560, height: 1280, bitrate: 8000000 },
            '720p': { width: 1920, height: 960, bitrate: 4000000 },
            'preview': { width: 1280, height: 640, bitrate: 1000000 }
        };
        
        this.detectCapabilities();
    }

    /**
     * Detect device capabilities for optimal quality selection
     */
    detectCapabilities() {
        // Check if we're in VR mode
        this.isVR = navigator.xr !== undefined;
        
        // Detect connection speed (if Network Information API available)
        if (navigator.connection) {
            const connection = navigator.connection;
            const effectiveType = connection.effectiveType;
            
            // Auto-select quality based on connection
            if (effectiveType === '4g' || effectiveType === 'wifi') {
                this.currentQuality = '1080p'; // Start with 1080p
            } else if (effectiveType === '3g') {
                this.currentQuality = '720p';
            } else {
                this.currentQuality = 'preview';
            }
            
            console.log(`📡 Connection: ${effectiveType}, Auto-quality: ${this.currentQuality}`);
        } else {
            // Default to 1080p if we can't detect
            this.currentQuality = '1080p';
        }
        
        // REMOVED: GPU capabilities check that was creating extra WebGL contexts
        // Safari iOS has strict limits on concurrent contexts - let PanoramaPlayer handle it
        console.log('🎮 GPU detection skipped to preserve WebGL contexts');
    }

    /**
     * Get base URL for video files
     */
    getVideoBaseURL() {
        // Use relative path from the current page location
        const currentPath = window.location.pathname;
        const basePath = currentPath.substring(0, currentPath.lastIndexOf('/') + 1);
        return basePath + 'assets/videos/processed/';
    }

    /**
     * Load video metadata from info.json
     */
    async loadVideoInfo(videoName) {
        const infoURL = `${this.getVideoBaseURL()}${videoName}/info.json`;
        try {
            const response = await fetch(infoURL);
            if (!response.ok) throw new Error(`Failed to load video info: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('Error loading video info:', error);
            return null;
        }
    }

    /**
     * Create a video element with proper attributes for streaming
     */
    createVideoElement(src, quality = this.currentQuality) {
        const video = document.createElement('video');
        
        // Essential attributes for WebXR and streaming
        video.setAttribute('crossorigin', 'anonymous');
        video.setAttribute('preload', 'metadata');
        video.setAttribute('playsinline', '');
        video.setAttribute('data-quality', quality);
        
        video.loop = true;
        video.muted = true; // Start muted for autoplay
        video.playsInline = true;
        video.src = src;
        
        // Add error handling
        video.addEventListener('error', (e) => {
            console.error('Video error:', e, video.error);
        });
        
        // Monitor loading progress
        video.addEventListener('progress', () => {
            if (video.buffered.length > 0) {
                const buffered = video.buffered.end(0);
                const duration = video.duration;
                const percent = (buffered / duration) * 100;
                console.log(`📥 Buffered: ${percent.toFixed(1)}%`);
            }
        });
        
        return video;
    }

    /**
     * Get the appropriate video URL based on quality and video name
     */
    getVideoURL(videoName, quality = null) {
        const selectedQuality = quality || this.currentQuality;
        const baseURL = this.getVideoBaseURL();
        
        // For HLS streaming (if supported and quality is auto)
        if (selectedQuality === 'auto' && this.supportsHLS()) {
            return `${baseURL}${videoName}/master.m3u8`;
        }
        
        // For direct MP4 playback
        return `${baseURL}${videoName}/${videoName}_${selectedQuality}.mp4`;
    }

    /**
     * Check if HLS is supported
     */
    supportsHLS() {
        const video = document.createElement('video');
        return video.canPlayType('application/vnd.apple.mpegurl') !== '';
    }

    /**
     * Preload a video
     */
    async preloadVideo(videoName, quality = null) {
        const cacheKey = `${videoName}_${quality || this.currentQuality}`;
        
        if (this.videoCache.has(cacheKey)) {
            console.log(`✅ Video cached: ${videoName}`);
            return this.videoCache.get(cacheKey);
        }

        console.log(`⏳ Preloading video: ${videoName} (${quality || this.currentQuality})`);
        
        const videoURL = this.getVideoURL(videoName, quality);
        const video = this.createVideoElement(videoURL, quality || this.currentQuality);

        // Wait for metadata to load
        await new Promise((resolve, reject) => {
            video.addEventListener('loadedmetadata', () => {
                console.log(`✅ Metadata loaded: ${videoName} (${video.videoWidth}x${video.videoHeight})`);
                resolve();
            }, { once: true });
            
            video.addEventListener('error', (e) => {
                console.error(`❌ Video error:`, e);
                reject(new Error(`Video load error: ${e.message || 'Unknown error'}`));
            }, { once: true });
            
            // Increased timeout to 30 seconds for large 360 videos
            setTimeout(() => reject(new Error(`Preload timeout after 30s: ${videoPath}`)), 30000);
        });

        this.videoCache.set(cacheKey, video);
        return video;
    }

    /**
     * Switch to a different video
     */
    async switchVideo(videoName, quality = null) {
        console.log(`🔄 Switching to: ${videoName}`);
        
        // Pause current video
        if (this.currentVideo) {
            this.currentVideo.pause();
            this.currentVideo.currentTime = 0;
        }

        // Get or load new video
        try {
            const video = await this.preloadVideo(videoName, quality);
            this.currentVideo = video;

            // Start playing
            const playPromise = video.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.warn('Autoplay prevented, user interaction required:', error);
                });
            }

            return video;
        } catch (error) {
            console.error('Failed to switch video:', error);
            throw error;
        }
    }

    /**
     * Change quality of current video
     */
    async changeQuality(quality) {
        if (!this.qualities[quality]) {
            console.error(`Invalid quality: ${quality}`);
            return false;
        }

        console.log(`🎬 Changing quality to: ${quality}`);
        
        const currentTime = this.currentVideo ? this.currentVideo.currentTime : 0;
        const wasPlaying = this.currentVideo ? !this.currentVideo.paused : false;
        const currentVideoName = this.getCurrentVideoName();

        if (!currentVideoName) {
            console.error('No video currently playing');
            return false;
        }

        // Load new quality version
        try {
            const video = await this.preloadVideo(currentVideoName, quality);
            video.currentTime = currentTime;
            
            if (wasPlaying) {
                await video.play();
            }

            this.currentVideo = video;
            this.currentQuality = quality;
            
            console.log(`✅ Quality changed to: ${quality}`);
            return true;
        } catch (error) {
            console.error('Failed to change quality:', error);
            return false;
        }
    }

    /**
     * Get the name of the currently playing video
     */
    getCurrentVideoName() {
        if (!this.currentVideo || !this.currentVideo.src) return null;
        
        const matches = this.currentVideo.src.match(/\/([^\/]+)\/[^\/]+\.mp4$/);
        return matches ? matches[1] : null;
    }

    /**
     * Preload next videos in gallery (for smooth transitions)
     */
    preloadNextVideos(videoNames, maxPreload = 2) {
        console.log(`📥 Preloading next ${maxPreload} videos...`);
        
        videoNames.slice(0, maxPreload).forEach((videoName, index) => {
            setTimeout(() => {
                this.preloadVideo(videoName).catch(err => 
                    console.warn(`Preload failed for ${videoName}:`, err)
                );
            }, index * 1000); // Stagger preloads by 1 second
        });
    }

    /**
     * Get current video element
     */
    getCurrentVideo() {
        return this.currentVideo;
    }

    /**
     * Clean up resources
     */
    dispose() {
        if (this.currentVideo) {
            this.currentVideo.pause();
            this.currentVideo.src = '';
        }
        
        this.videoCache.forEach(video => {
            video.pause();
            video.src = '';
        });
        
        this.videoCache.clear();
        this.currentVideo = null;
    }

    /**
     * Get available qualities
     */
    getAvailableQualities() {
        return Object.keys(this.qualities);
    }

    /**
     * Get current quality setting
     */
    getCurrentQuality() {
        return this.currentQuality;
    }

    /**
     * Monitor network conditions and adjust quality
     */
    enableAdaptiveQuality() {
        if (!navigator.connection) return;

        navigator.connection.addEventListener('change', () => {
            const effectiveType = navigator.connection.effectiveType;
            let recommendedQuality = this.currentQuality;

            if (effectiveType === '4g' || effectiveType === 'wifi') {
                recommendedQuality = '1080p';
            } else if (effectiveType === '3g') {
                recommendedQuality = '720p';
            } else {
                recommendedQuality = 'preview';
            }

            if (recommendedQuality !== this.currentQuality) {
                console.log(`📡 Network changed to ${effectiveType}, recommending ${recommendedQuality}`);
                // You could auto-switch here or notify the user
            }
        });
    }
}

// Export for use in other modules
export default VideoStreamManager;
