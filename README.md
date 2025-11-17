# 🌐 EyeTrip VR - Immersive 360° WebXR Experience

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://eyetripvr.com)
[![Three.js](https://img.shields.io/badge/Three.js-r170-blue)](https://threejs.org/)
[![WebXR](https://img.shields.io/badge/WebXR-compatible-purple)](https://immersiveweb.dev/)
[![License](https://img.shields.io/badge/license-All%20Rights%20Reserved-red)]()

> A cutting-edge immersive 360° video experience built with Three.js and WebXR, featuring interactive audio hotspots, particle effects, and full VR headset support.

**Live Site**: [https://eyetripvr.com](https://eyetripvr.com)

---

## ✨ Features

### 🎥 Immersive Video Playback
- **360° Equirectangular Video** - Full spherical panoramic video support
- **Adaptive Quality Streaming** - Dynamic quality switching (360p → 4K) based on device capability
- **Buffering Management** - Intelligent preloading and cache management
- **VR Headset Support** - Native WebXR for Meta Quest, Oculus, and other VR devices

### 🎧 Interactive Audio System
- **Spatial Audio Hotspots** - 3D positioned audio triggers throughout videos
- **Hidden Sound Discovery** - Achievement system for finding hidden audio elements
- **Affirmation System** - Personalized audio affirmations with AI text-to-speech (ElevenLabs)
- **Mute Controls** - Independent video and hotspot audio controls

### 🎨 Visual Effects
- **Particle Trail System** - Three independent particle systems with GPU optimization
- **Dynamic Particles** - React to user movement and camera rotation
- **Cinematic Camera** - Smooth transitions and automated camera movements
- **Mini-Map Navigation** - Real-time orientation guide

### 📱 Cross-Platform
- **Mobile Optimized** - iOS Safari 18.2+ and Android Chrome with touch controls
- **Desktop Support** - Mouse/keyboard navigation on all modern browsers
- **VR Mode** - Full WebXR immersion on Meta Quest and compatible headsets
- **PWA Ready** - Progressive Web App with offline support (VR headsets only)

### 🎯 Gamification
- **Achievement System** - Track discoveries, watch time, and exploration
- **Progress Tracking** - Session statistics and milestones
- **Hidden Discoveries** - Secret hotspots and easter eggs

---

## 🚀 Quick Start

### Prerequisites
```bash
# Node.js 16+ required
node --version

# Git
git --version
```

### Installation
```bash
# Clone the repository
git clone https://github.com/Dulce-Dotcom/eyetrip-360-webxr.git
cd eyetrip-360-webxr/public_html

# Install dependencies
npm install
```

### Development
```bash
# Start local development server
npm run dev
# Access at http://localhost:8080

# Or use Python simple server
python3 -m http.server 8080
```

### Deployment
```bash
# Deploy to SiteGround via SSH
./deploy-siteground.sh

# Deploy with videos (large transfer)
./deploy-siteground.sh --with-videos
```

---

## 🏗️ Project Structure

```
eyetrip-360-webxr/
├── public_html/                    # Main application directory
│   ├── index.html                  # Landing page
│   ├── gallery.html                # Video gallery selector
│   ├── video1.html                 # Main VR experience page
│   ├── video2-4.html               # Additional experience pages
│   ├── affirmation1.html           # Affirmation experience
│   │
│   ├── js/
│   │   ├── app.js                  # Main application entry point
│   │   ├── modules/
│   │   │   ├── PanoramaPlayer.js        # Core 360° video player (2376 lines)
│   │   │   ├── VideoStreamManager.js    # Adaptive quality streaming
│   │   │   ├── HotspotManager.js        # Interactive audio hotspots
│   │   │   ├── ParticleTrailSystem.js   # GPU particle effects
│   │   │   ├── AchievementSystem.js     # Gamification & progress
│   │   │   ├── ElevenLabsService.js     # AI voice synthesis
│   │   │   ├── WebXRHandler.js          # VR headset integration
│   │   │   ├── VRMenu.js                # In-VR UI controls
│   │   │   ├── MiniMap.js               # Navigation aid
│   │   │   └── PerformanceMonitor.js    # FPS & memory tracking
│   │   ├── utils/
│   │   │   ├── constants.js             # Global configuration
│   │   │   └── helpers.js               # Utility functions
│   │   └── vendor/
│   │       ├── VRButton.js              # Three.js VR button
│   │       └── XRControllerModelFactory.js  # VR controller stub
│   │
│   ├── css/
│   │   ├── eyetrip-style.css           # Main desktop styles
│   │   ├── experience-mobile.css       # Mobile responsive overrides
│   │   ├── mobile-fixes.css            # iOS Safari optimizations
│   │   └── wallet-widget.css           # Crypto wallet integration
│   │
│   ├── assets/
│   │   ├── videos/
│   │   │   ├── processed/              # Optimized multi-quality videos
│   │   │   │   ├── ShroomZoomLatlong_12/
│   │   │   │   │   ├── *_360p.mp4
│   │   │   │   │   ├── *_540p.mp4
│   │   │   │   │   ├── *_720p.mp4
│   │   │   │   │   ├── *_1080p.mp4
│   │   │   │   │   └── *_4k.mp4
│   │   │   └── original-videos/        # Source files
│   │   ├── sound/                       # Hotspot audio files
│   │   ├── thumbnails/                  # Video preview images
│   │   ├── icons/                       # PWA icons
│   │   └── models/                      # 3D assets (unused)
│   │
│   ├── deploy-siteground.sh            # Production deployment script
│   ├── optimize-video.sh               # Video transcoding script
│   ├── manifest.json                    # PWA manifest
│   ├── sw.js                            # Service Worker (VR only)
│   └── capacitor.config.json           # Mobile app config
│
├── DEPLOYMENT_CHECKLIST.md
├── VIDEO_STREAMING_SETUP.md
├── ADAPTIVE_VIDEO_QUALITY.md
├── INTERACTIVE_AUDIO_HOTSPOTS.md
└── README.md                           # This file
```

---

## 🎮 Usage

### Desktop Controls
- **Mouse Drag** - Look around 360° environment
- **Click Hotspots** - Trigger audio and interactions
- **Play/Pause** - Spacebar or on-screen button
- **Skip Forward/Back** - Arrow keys or buttons
- **Volume** - Scroll wheel or slider
- **Mute** - M key or button
- **Exit** - ESC key or X button

### Mobile Controls (iOS/Android)
- **Touch & Drag** - Look around sphere
- **Tap Hotspots** - Activate audio
- **Bottom Control Bar** - All playback controls
- **Pinch Zoom** - Not supported (360° is full sphere)

### VR Mode (Meta Quest / VR Headsets)
- **Point & Click** - Aim controller ray, pull trigger
- **VR Menu** - Toggle with left controller button
- **Look Around** - Natural head movement
- **Hotspot Interaction** - Point and select with controllers

---

## 📱 Mobile Optimization

### iOS Safari 18.2+ Support
- **WebGL 2 Context** - Full GPU acceleration
- **Touch Events** - `touch-action: manipulation` for instant clicks
- **Safe Area Insets** - Notch and home indicator support
- **Performance** - Service Worker disabled, GPU acceleration enabled
- **No PWA** - Disabled on mobile for faster loading

### Android Chrome
- **Adaptive Quality** - Starts at 540p, upgrades based on performance
- **Memory Management** - Automatic quality downgrade on low memory
- **Touch Optimization** - 44px minimum touch targets

---

## 🎬 Video Management

### Adding New Videos

1. **Place source video** in `assets/videos/original-videos/`
2. **Optimize with ffmpeg**:
   ```bash
   ./optimize-video.sh input.mp4
   ```
3. **Update video list** in `video1.html`:
   ```javascript
   const videosList = [
       'assets/videos/processed/YourVideo/video_1080p.mp4',
       // ...
   ];
   ```

### Video Optimization Script
```bash
# Creates 5 quality tiers: 360p, 540p, 720p, 1080p, 4K
./optimize-video.sh your-360-video.mp4

# Output: assets/videos/processed/YourVideo/
#   - your-360-video_360p.mp4   (fastest loading)
#   - your-360-video_540p.mp4   (mobile default)
#   - your-360-video_720p.mp4   (desktop default)
#   - your-360-video_1080p.mp4  (high quality)
#   - your-360-video_4k.mp4     (VR headsets)
```

### Adaptive Quality System
The `VideoStreamManager.js` automatically switches quality based on:
- **Device Type** - Mobile starts at 540p, desktop at 720p, VR at 1080p+
- **Network Speed** - Measures buffering and adjusts
- **GPU Performance** - FPS monitoring via `PerformanceMonitor`
- **Memory Usage** - Downgrades if memory pressure detected

---

## 🎧 Audio Hotspot System

### Configuration
Hotspots are defined in `video1.html`:
```javascript
const hotspotConfig = {
    'video1': [
        {
            position: { x: 2.5, y: 0.5, z: -3 },  // 3D world position
            soundUrl: 'assets/sound/ambient1.mp3',
            label: 'Hidden Sound 1',
            radius: 0.5,                          // Trigger distance
            color: 0x00ff00                       // Visual indicator
        }
    ]
};
```

### Adding New Hotspots
1. Play video in browser
2. Open browser console
3. Use `panoramaPlayer.camera.position` to find coordinates
4. Add hotspot to config
5. Test trigger radius

---

## 🔧 Configuration

### Performance Tuning (`js/utils/constants.js`)
```javascript
export const PERFORMANCE_CONFIG = {
    targetFPS: 60,                    // Desired framerate
    particleCount: 1000,              // GPU particles per system
    maxHotspots: 10,                  // Concurrent audio sources
    bufferAhead: 30                   // Seconds to preload
};
```

### Mobile Optimizations (`css/experience-mobile.css`)
```css
@media (max-width: 768px) {
    /* Compact controls, touch targets, safe areas */
}
```

---

## 🚢 Deployment

### SiteGround SSH Deployment
```bash
# Configure SSH credentials (first time)
# Edit deploy-siteground.sh with your details:
HOST="ssh.eyetripvr.com"
USER="your-username"
PORT="18765"

# Deploy code only (fast)
./deploy-siteground.sh

# Deploy everything including videos (slow, ~15GB)
./deploy-siteground.sh --with-videos
```

### What Gets Deployed
- ✅ HTML pages
- ✅ JavaScript modules
- ✅ CSS stylesheets
- ✅ Images, icons, thumbnails
- ✅ Audio files
- ⏭️ Videos (skipped by default, use `--with-videos`)

---

## 🐛 Troubleshooting

### iOS Safari WebGL Context Loss
**Issue**: "WebGL context lost" on iPhone/iPad  
**Solution**: Update to iOS 18.2+ (Apple fixed the bug)

### Slow Loading on Mobile
**Issue**: Page takes forever to load  
**Solution**: 
- Service Worker is disabled on mobile
- Check network tab for large file downloads
- Ensure videos are optimized

### WebXR Button Visible on Mobile
**Issue**: VR button shows on phone  
**Solution**: Already fixed in `experience-mobile.css`
```css
#VRButton { display: none !important; }
```

### Control Buttons Clipping at Screen Edge
**Issue**: Buttons cut off on mobile  
**Solution**: Increased padding with safe-area-inset support
```css
padding: 8px 24px;
padding-left: max(24px, env(safe-area-inset-left));
```

### Sounds Playing When Muted
**Issue**: Hotspot audio ignores mute  
**Solution**: Mute handler now calls `hotspotManager.setMuted()`

---

## 📊 Performance Monitoring

### Built-in FPS Monitor
Press **F** key to toggle FPS counter in top-left corner.

### Memory Tracking
Open browser DevTools → Performance tab → Record session

### Network Analysis
DevTools → Network tab → Filter by media type

---

## 🔐 Security & Privacy

- **No User Data Collection** - Achievement tracking is local only
- **No Cookies** - Session storage only
- **HTTPS Required** - For WebXR API access
- **Google Analytics** - Page views only (G-7Y1YJBXJ2X)

---

## 🛠️ Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| [Three.js](https://threejs.org/) | r170 | 3D rendering & WebGL |
| [WebXR Device API](https://immersiveweb.dev/) | Latest | VR headset support |
| [ElevenLabs API](https://elevenlabs.io/) | v1 | AI voice synthesis |
| Vanilla JavaScript | ES6+ | No framework overhead |
| CSS3 | Modern | Responsive design |
| Service Workers | v3 | PWA caching (VR only) |
| Google Analytics | GA4 | Anonymous analytics |

---

## 📝 Documentation

- [Video Streaming Setup](VIDEO_STREAMING_SETUP.md)
- [Adaptive Quality Guide](ADAPTIVE_VIDEO_QUALITY.md)
- [Interactive Hotspots](INTERACTIVE_AUDIO_HOTSPOTS.md)
- [Deployment Checklist](DEPLOYMENT_CHECKLIST.md)
- [Gallery Setup](GALLERY_SETUP.md)

---

## 🗓️ Changelog

### v2.0 - Mobile Optimization (Nov 2025)
- ✅ iOS Safari 18.2+ WebGL support
- ✅ Touch-optimized controls with safe-area-inset
- ✅ WebXR badge hidden on mobile
- ✅ Service Worker disabled on mobile
- ✅ Gallery button instant click (no delay)
- ✅ Hotspot audio mute integration

### v1.5 - Performance Update (Oct 2025)
- Three.js upgrade r153 → r170
- Adaptive video quality system
- GPU particle optimization
- Achievement system

### v1.0 - Initial Release (Sep 2025)
- 360° video playback
- WebXR VR mode
- Interactive hotspots
- PWA support

---

## 👥 Credits

**Development**: Dulce-Dotcom  
**Design**: EyeTrip Images  
**3D Engine**: Three.js Community  
**Voice AI**: ElevenLabs  

---

## 📄 License

**All Rights Reserved** © 2024-2025 EyeTrip Images

This project and all associated content, code, videos, and assets are proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.

---

## 🌟 Support

For questions, issues, or collaboration:
- **Website**: [https://eyetripvr.com](https://eyetripvr.com)
- **GitHub**: [Dulce-Dotcom/eyetrip-360-webxr](https://github.com/Dulce-Dotcom/eyetrip-360-webxr)

---

**Built with ❤️ for immersive experiences**
