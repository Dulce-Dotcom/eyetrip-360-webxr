# 4K 360° Video Streaming Solution for EyeTrip VR

## 1. Video Optimization Strategy

### Optimal Encoding Settings for 4K 360° Video

```bash
#!/bin/bash
# optimize-4k-360.sh - Optimized encoding for 4K 360° videos

INPUT="$1"
OUTPUT_DIR="optimized"
BASENAME=$(basename "$INPUT" .mp4)

mkdir -p "$OUTPUT_DIR"

# 4K Version (3840x1920) - High Quality for VR Headsets
ffmpeg -i "$INPUT" \
  -c:v libx264 \
  -preset slow \
  -crf 18 \
  -profile:v high \
  -level 5.1 \
  -b:v 20M \
  -maxrate 25M \
  -bufsize 40M \
  -pix_fmt yuv420p \
  -c:a aac \
  -b:a 192k \
  -ar 48000 \
  -movflags +faststart \
  -vf "scale=3840:1920" \
  "$OUTPUT_DIR/${BASENAME}_4k.mp4"

# 2K Version (2560x1280) - Desktop/Laptop
ffmpeg -i "$INPUT" \
  -c:v libx264 \
  -preset slow \
  -crf 20 \
  -profile:v high \
  -level 4.2 \
  -b:v 10M \
  -maxrate 12M \
  -bufsize 20M \
  -pix_fmt yuv420p \
  -c:a aac \
  -b:a 128k \
  -ar 48000 \
  -movflags +faststart \
  -vf "scale=2560:1280" \
  "$OUTPUT_DIR/${BASENAME}_2k.mp4"

# HD Version (1920x960) - Mobile/Low Bandwidth
ffmpeg -i "$INPUT" \
  -c:v libx264 \
  -preset slow \
  -crf 22 \
  -profile:v main \
  -level 4.1 \
  -b:v 5M \
  -maxrate 6M \
  -bufsize 10M \
  -pix_fmt yuv420p \
  -c:a aac \
  -b:a 128k \
  -ar 44100 \
  -movflags +faststart \
  -vf "scale=1920:960" \
  "$OUTPUT_DIR/${BASENAME}_hd.mp4"

# Preview Version (1280x640) - Quick Loading
ffmpeg -i "$INPUT" \
  -c:v libx264 \
  -preset fast \
  -crf 24 \
  -profile:v baseline \
  -level 3.1 \
  -b:v 2M \
  -maxrate 2.5M \
  -bufsize 4M \
  -pix_fmt yuv420p \
  -c:a aac \
  -b:a 96k \
  -ar 44100 \
  -movflags +faststart \
  -vf "scale=1280:640" \
  -t 60 \
  "$OUTPUT_DIR/${BASENAME}_preview.mp4"
```

## 2. HLS Adaptive Streaming Implementation

### Generate HLS Streams

```bash
#!/bin/bash
# create-hls-stream.sh - Create adaptive bitrate streaming

INPUT="$1"
OUTPUT_DIR="streaming"
BASENAME=$(basename "$INPUT" .mp4)

mkdir -p "$OUTPUT_DIR/$BASENAME"

# Create multiple bitrate versions and segment them
ffmpeg -i "$INPUT" \
  -filter_complex \
  "[0:v]split=4[v1][v2][v3][v4]; \
   [v1]scale=3840:1920[v1out]; \
   [v2]scale=2560:1280[v2out]; \
   [v3]scale=1920:960[v3out]; \
   [v4]scale=1280:640[v4out]" \
  -map "[v1out]" -c:v:0 libx264 -b:v:0 20M -maxrate:v:0 25M -bufsize:v:0 40M \
  -map "[v2out]" -c:v:1 libx264 -b:v:1 10M -maxrate:v:1 12M -bufsize:v:1 20M \
  -map "[v3out]" -c:v:2 libx264 -b:v:2 5M -maxrate:v:2 6M -bufsize:v:2 10M \
  -map "[v4out]" -c:v:3 libx264 -b:v:3 2M -maxrate:v:3 2.5M -bufsize:v:3 4M \
  -map a:0 -map a:0 -map a:0 -map a:0 -c:a aac -b:a 192k -ar 48000 \
  -f hls \
  -hls_time 4 \
  -hls_playlist_type vod \
  -hls_flags independent_segments \
  -hls_segment_type mpegts \
  -hls_segment_filename "$OUTPUT_DIR/$BASENAME/stream_%v/data_%03d.ts" \
  -master_pl_name master.m3u8 \
  -var_stream_map "v:0,a:0 v:1,a:1 v:2,a:2 v:3,a:3" \
  "$OUTPUT_DIR/$BASENAME/stream_%v/playlist.m3u8"
```

## 3. JavaScript Adaptive Streaming Player

```javascript
// src/js/modules/AdaptiveVideoPlayer.js
export class AdaptiveVideoPlayer {
    constructor(video, scene) {
        this.video = video;
        this.scene = scene;
        this.currentQuality = 'auto';
        this.bandwidthHistory = [];
        this.lastLoadTime = 0;
        this.lastLoadedBytes = 0;
        
        this.qualityLevels = [
            { name: '4K', width: 3840, bitrate: 20000000, url: '_4k.mp4' },
            { name: '2K', width: 2560, bitrate: 10000000, url: '_2k.mp4' },
            { name: 'HD', width: 1920, bitrate: 5000000, url: '_hd.mp4' },
            { name: 'SD', width: 1280, bitrate: 2000000, url: '_preview.mp4' }
        ];
        
        this.initializePlayer();
    }
    
    initializePlayer() {
        // Check if HLS is supported
        if (this.video.canPlayType('application/vnd.apple.mpegurl')) {
            // Native HLS support (Safari)
            this.loadHLS();
        } else if (Hls.isSupported()) {
            // Use HLS.js for other browsers
            this.loadHLSJS();
        } else {
            // Fallback to progressive download
            this.loadProgressive();
        }
        
        this.setupBandwidthMonitoring();
        this.setupQualitySelector();
    }
    
    loadHLS() {
        const hlsUrl = `streaming/${this.scene.basename}/master.m3u8`;
        this.video.src = hlsUrl;
    }
    
    loadHLSJS() {
        const hls = new Hls({
            startLevel: -1, // Auto quality
            capLevelToPlayerSize: true,
            maxBufferLength: 30,
            maxMaxBufferLength: 60,
            maxBufferSize: 60 * 1000 * 1000, // 60 MB
            maxBufferHole: 0.5
        });
        
        const hlsUrl = `streaming/${this.scene.basename}/master.m3u8`;
        hls.loadSource(hlsUrl);
        hls.attachMedia(this.video);
        
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
            console.log('HLS manifest loaded, quality levels:', hls.levels);
            this.video.play();
        });
        
        hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
            console.log(`Quality switched to level ${data.level}`);
        });
        
        this.hls = hls;
    }
    
    loadProgressive() {
        // Determine best quality based on connection
        const quality = this.selectQualityBasedOnBandwidth();
        const videoUrl = `optimized/${this.scene.basename}${quality.url}`;
        
        // Preload lower quality first, then upgrade
        this.loadWithPreloading(videoUrl);
    }
    
    async loadWithPreloading(url) {
        // Start with preview while loading higher quality
        const previewUrl = `optimized/${this.scene.basename}_preview.mp4`;
        
        // Load preview immediately
        this.video.src = previewUrl;
        this.video.play();
        
        // Prefetch higher quality
        const response = await fetch(url, { 
            headers: { 'Range': 'bytes=0-1048576' } // First 1MB
        });
        
        if (response.ok) {
            // Switch to higher quality
            setTimeout(() => {
                const currentTime = this.video.currentTime;
                this.video.src = url;
                this.video.currentTime = currentTime;
                this.video.play();
            }, 2000);
        }
    }
    
    setupBandwidthMonitoring() {
        let lastTime = Date.now();
        let lastLoaded = 0;
        
        this.video.addEventListener('progress', () => {
            if (this.video.buffered.length > 0) {
                const currentTime = Date.now();
                const currentLoaded = this.video.buffered.end(0);
                
                const timeDiff = (currentTime - lastTime) / 1000;
                const loadedDiff = currentLoaded - lastLoaded;
                
                if (timeDiff > 0) {
                    const bandwidth = (loadedDiff * 8) / timeDiff; // bits per second
                    this.bandwidthHistory.push(bandwidth);
                    
                    // Keep only last 10 measurements
                    if (this.bandwidthHistory.length > 10) {
                        this.bandwidthHistory.shift();
                    }
                    
                    lastTime = currentTime;
                    lastLoaded = currentLoaded;
                }
            }
        });
    }
    
    selectQualityBasedOnBandwidth() {
        const avgBandwidth = this.getAverageBandwidth();
        
        // Add 20% safety margin
        const safeBandwidth = avgBandwidth * 0.8;
        
        // Select highest quality that fits bandwidth
        for (let i = 0; i < this.qualityLevels.length; i++) {
            if (this.qualityLevels[i].bitrate <= safeBandwidth) {
                return this.qualityLevels[i];
            }
        }
        
        // Default to lowest quality
        return this.qualityLevels[this.qualityLevels.length - 1];
    }
    
    getAverageBandwidth() {
        if (this.bandwidthHistory.length === 0) {
            // Estimate based on connection type
            if ('connection' in navigator) {
                const connection = navigator.connection;
                const effectiveType = connection.effectiveType;
                
                switch(effectiveType) {
                    case '4g': return 10000000; // 10 Mbps
                    case '3g': return 2000000;  // 2 Mbps
                    case '2g': return 500000;   // 500 Kbps
                    default: return 5000000;    // 5 Mbps
                }
            }
            return 5000000; // Default 5 Mbps
        }
        
        return this.bandwidthHistory.reduce((a, b) => a + b) / this.bandwidthHistory.length;
    }
    
    setupQualitySelector() {
        // Add quality selector to UI
        const selector = document.createElement('select');
        selector.id = 'quality-selector';
        selector.innerHTML = `
            <option value="auto">Auto</option>
            <option value="4k">4K (20 Mbps)</option>
            <option value="2k">2K (10 Mbps)</option>
            <option value="hd">HD (5 Mbps)</option>
            <option value="sd">SD (2 Mbps)</option>
        `;
        
        selector.addEventListener('change', (e) => {
            this.switchQuality(e.target.value);
        });
        
        document.querySelector('.md-controls')?.appendChild(selector);
    }
    
    switchQuality(quality) {
        if (this.hls) {
            // HLS.js quality switching
            if (quality === 'auto') {
                this.hls.currentLevel = -1;
            } else {
                const levelIndex = this.qualityLevels.findIndex(q => q.name.toLowerCase() === quality);
                this.hls.currentLevel = levelIndex;
            }
        } else {
            // Progressive download switching
            const currentTime = this.video.currentTime;
            const qualityLevel = this.qualityLevels.find(q => q.name.toLowerCase() === quality);
            
            if (qualityLevel) {
                this.video.src = `optimized/${this.scene.basename}${qualityLevel.url}`;
                this.video.currentTime = currentTime;
                this.video.play();
            }
        }
    }
}
```

## 4. CDN Integration with SiteGround

### Option A: Use SiteGround's CDN
```apache
# .htaccess configuration for SiteGround CDN
<IfModule mod_headers.c>
    # Enable CORS for video files
    <FilesMatch "\.(mp4|webm|m3u8|ts)$">
        Header set Access-Control-Allow-Origin "*"
        Header set Access-Control-Allow-Methods "GET, OPTIONS"
        Header set Access-Control-Allow-Headers "Range"
    </FilesMatch>
    
    # Cache control for video files
    <FilesMatch "\.(mp4|webm)$">
        Header set Cache-Control "public, max-age=31536000"
    </FilesMatch>
    
    # Cache control for HLS files
    <FilesMatch "\.(m3u8)$">
        Header set Cache-Control "no-cache"
    </FilesMatch>
    
    <FilesMatch "\.(ts)$">
        Header set Cache-Control "public, max-age=31536000"
    </FilesMatch>
</IfModule>

# Enable range requests
<IfModule mod_headers.c>
    Header set Accept-Ranges bytes
</IfModule>

# Compression (don't compress video files)
<IfModule mod_deflate.c>
    SetEnvIfNoCase Request_URI \.(?:mp4|webm|m3u8|ts)$ no-gzip dont-vary
</IfModule>
```

### Option B: CloudFlare Integration
```javascript
// Use CloudFlare Stream API for video delivery
const CLOUDFLARE_ACCOUNT_ID = 'your-account-id';
const CLOUDFLARE_API_TOKEN = 'your-api-token';

async function uploadToCloudflareStream(videoFile) {
    const formData = new FormData();
    formData.append('file', videoFile);
    
    const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream`,
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`
            },
            body: formData
        }
    );
    
    const data = await response.json();
    return data.result.playback.hls; // Returns HLS URL
}
```

## 5. Lazy Loading & Preloading Strategy

```javascript
// src/js/modules/VideoPreloader.js
export class VideoPreloader {
    constructor() {
        this.preloadQueue = [];
        this.loadingVideos = new Map();
    }
    
    preloadVideo(url, priority = 0) {
        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            video.preload = 'metadata';
            video.muted = true;
            
            // Store in queue
            this.preloadQueue.push({ url, priority, video, resolve, reject });
            this.processQueue();
        });
    }
    
    async processQueue() {
        // Sort by priority
        this.preloadQueue.sort((a, b) => b.priority - a.priority);
        
        // Load top 3 simultaneously
        const toLoad = this.preloadQueue.slice(0, 3);
        
        for (const item of toLoad) {
            if (!this.loadingVideos.has(item.url)) {
                this.loadingVideos.set(item.url, item);
                this.loadVideo(item);
            }
        }
    }
    
    async loadVideo(item) {
        const { video, url, resolve, reject } = item;
        
        video.src = url;
        
        video.addEventListener('loadedmetadata', () => {
            console.log(`Preloaded: ${url}`);
            this.loadingVideos.delete(url);
            this.preloadQueue = this.preloadQueue.filter(i => i.url !== url);
            resolve(video);
        });
        
        video.addEventListener('error', (e) => {
            console.error(`Failed to preload: ${url}`);
            this.loadingVideos.delete(url);
            this.preloadQueue = this.preloadQueue.filter(i => i.url !== url);
            reject(e);
        });
        
        video.load();
    }
}
```

## 6. Performance Monitoring

```javascript
// Add to your app.js
class PerformanceMonitor {
    constructor() {
        this.metrics = {
            videoLoadTime: 0,
            bufferingEvents: 0,
            qualitySwitches: 0,
            averageBitrate: 0
        };
        
        this.startMonitoring();
    }
    
    startMonitoring() {
        // Monitor video performance
        const video = document.querySelector('video');
        
        if (video) {
            let loadStartTime = Date.now();
            
            video.addEventListener('loadstart', () => {
                loadStartTime = Date.now();
            });
            
            video.addEventListener('loadeddata', () => {
                this.metrics.videoLoadTime = Date.now() - loadStartTime;
                console.log(`Video load time: ${this.metrics.videoLoadTime}ms`);
                
                // Send to analytics
                if (window.gtag) {
                    gtag('event', 'video_load', {
                        'event_category': 'Performance',
                        'event_label': 'Load Time',
                        'value': this.metrics.videoLoadTime
                    });
                }
            });
            
            video.addEventListener('waiting', () => {
                this.metrics.bufferingEvents++;
                console.log('Buffering event detected');
            });
        }
    }
    
    reportMetrics() {
        return this.metrics;
    }
}
```

## 7. Deployment Script for SiteGround

```bash
#!/bin/bash
# deploy-to-siteground.sh

# Configuration
SITEGROUND_USER="your-username"
SITEGROUND_HOST="your-server.siteground.com"
SITEGROUND_PATH="/home/username/public_html/videos/"
LOCAL_VIDEO_DIR="./optimized"

# 1. Optimize videos
echo "🎬 Optimizing videos..."
for video in raw-videos/*.mp4; do
    ./optimize-4k-360.sh "$video"
done

# 2. Create HLS streams
echo "📡 Creating HLS streams..."
for video in raw-videos/*.mp4; do
    ./create-hls-stream.sh "$video"
done

# 3. Upload to SiteGround using rsync (incremental upload)
echo "📤 Uploading to SiteGround..."
rsync -avz --progress \
    --exclude '*.tmp' \
    --exclude '.DS_Store' \
    "$LOCAL_VIDEO_DIR/" \
    "${SITEGROUND_USER}@${SITEGROUND_HOST}:${SITEGROUND_PATH}"

rsync -avz --progress \
    "streaming/" \
    "${SITEGROUND_USER}@${SITEGROUND_HOST}:${SITEGROUND_PATH}/streaming/"

# 4. Set proper permissions
ssh "${SITEGROUND_USER}@${SITEGROUND_HOST}" << EOF
    cd ${SITEGROUND_PATH}
    find . -type f -name "*.mp4" -exec chmod 644 {} \;
    find . -type f -name "*.m3u8" -exec chmod 644 {} \;
    find . -type f -name "*.ts" -exec chmod 644 {} \;
EOF

echo "✅ Deployment complete!"
```

## 8. Recommended Architecture

```
eyetripvr.com/
├── videos/
│   ├── optimized/           # Progressive downloads
│   │   ├── scene1_4k.mp4    # 4K version
│   │   ├── scene1_2k.mp4    # 2K version
│   │   ├── scene1_hd.mp4    # HD version
│   │   └── scene1_preview.mp4 # Preview
│   └── streaming/            # HLS files
│       └── scene1/
│           ├── master.m3u8
│           └── stream_0/
│               ├── playlist.m3u8
│               └── *.ts files
├── js/
│   └── hls.min.js          # HLS.js library
└── .htaccess                # Configuration
```

## Implementation Priority:

1. **Immediate (Day 1):**
   - Implement multi-quality encoding (4K, 2K, HD, Preview)
   - Add bandwidth detection
   - Implement quality switching

2. **Short-term (Week 1):**
   - Set up HLS streaming
   - Implement preloading strategy
   - Add CloudFlare CDN

3. **Medium-term (Week 2-3):**
   - Add performance monitoring
   - Implement adaptive bitrate switching
   - Optimize for mobile devices

4. **Long-term:**
   - Consider CloudFlare Stream or AWS CloudFront
   - Implement edge caching
   - Add AI-based quality prediction

## Cost-Effective Alternative:

If bandwidth costs are a concern, consider using **Vimeo Pro** or **YouTube 360** for video hosting:

```javascript
// Vimeo Player API integration
const iframe = document.createElement('iframe');
iframe.src = 'https://player.vimeo.com/video/VIDEO_ID';
iframe.width = 640;
iframe.height = 360;
iframe.frameborder = 0;
iframe.allow = 'autoplay; fullscreen; picture-in-picture';
iframe.allowfullscreen = true;

// For 360° support
iframe.src += '?transparent=0&autopause=0&autoplay=1&loop=1&muted=1';
```

This approach offloads bandwidth costs while maintaining quality.