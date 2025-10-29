# Video Streaming Setup for EyeTrip VR WebXR

## Overview
This document outlines the complete video streaming solution implemented for the EyeTrip VR 360° WebXR experience.

## What Was Set Up

### 1. Video Optimization Script (`optimize-video.sh`)
Automatically processes 4K 360° videos into multiple quality versions:
- **4K (3840x1920)** @ 15Mbps - For high-end VR headsets
- **1080p (2560x1280)** @ 8Mbps - For standard viewing
- **720p (1920x960)** @ 4Mbps - For mobile/lower bandwidth
- **Preview (1280x640)** @ 1Mbps - 60-second preview for testing
- **HLS Streaming** - Adaptive bitrate streaming segments
- **Thumbnail** - JPEG thumbnail for gallery

### 2. Server Configuration (`.htaccess`)
Configured for optimal video delivery:
- **Range Request Support** - Enables video seeking and partial downloads
- **CORS Headers** - Required for WebXR video textures
- **Caching Strategy** - 1-week cache for videos, 1-minute for playlists
- **GZIP Compression** - For text files (not videos)
- **Proper MIME Types** - For MP4, WebM, M3U8, and TS files

### 3. VideoStreamManager Module (`js/modules/VideoStreamManager.js`)
Smart video management system:
- **Automatic Quality Detection** - Based on device and network
- **Preloading System** - Loads next videos for smooth transitions
- **Adaptive Streaming** - Switches quality based on bandwidth
- **Memory Management** - Caches and releases videos efficiently
- **WebXR Compatibility** - Proper attributes for VR playback

### 4. Gallery Configuration (`js/utils/videoGalleryConfig.js`)
Centralized video library management:
- Video metadata and descriptions
- Navigation helpers (next/previous)
- Tag-based filtering
- Easy to update and maintain

### 5. Deployment Script (`deploy-videos.sh`)
Automated deployment to SiteGround:
- Uploads processed videos
- Deploys .htaccess configuration
- Updates JavaScript modules
- Verifies deployment

## Videos Being Processed

1. ✅ **4klatlong_05b_offsetOverture1.mp4** (410MB → 320MB 4K + 288MB 1080p + 176MB 720p)
2. 🔄 **Scraptangle_latlong_05b_offsetOverture1.mp4** (processing...)
3. ⏳ **ShroomZoomLatlong_12.mp4** (pending...)
4. ⏳ **stumpy_latlong_01_waves_61Mbps-003.mp4** (pending...)

## File Structure

```
public_html/
├── .htaccess                          # Server configuration
├── optimize-video.sh                   # Video optimizer
├── process-all-videos.sh               # Batch processor
├── deploy-videos.sh                    # Deployment script
├── assets/
│   └── videos/
│       ├── processed/                  # Optimized videos
│       │   ├── 4klatlong_05b_offsetOverture1/
│       │   │   ├── master.m3u8         # HLS master playlist
│       │   │   ├── playlist_0.m3u8     # 720p playlist
│       │   │   ├── playlist_1.m3u8     # 1080p playlist
│       │   │   ├── playlist_2.m3u8     # 4K playlist
│       │   │   ├── segment_*.ts        # Video segments
│       │   │   ├── *_4k.mp4            # Direct 4K file
│       │   │   ├── *_1080p.mp4         # Direct 1080p file
│       │   │   ├── *_720p.mp4          # Direct 720p file
│       │   │   ├── *_preview.mp4       # Preview file
│       │   │   ├── *_thumb.jpg         # Thumbnail
│       │   │   └── info.json           # Metadata
│       │   ├── Scraptangle_latlong_05b_offsetOverture1/
│       │   ├── ShroomZoomLatlong_12/
│       │   └── stumpy_latlong_01_waves_61Mbps-003/
│       └── [original videos]
└── js/
    ├── modules/
    │   └── VideoStreamManager.js       # Video management
    └── utils/
        └── videoGalleryConfig.js       # Gallery config
```

## How to Use

### Processing Videos

**Process a single video:**
```bash
cd public_html
./optimize-video.sh assets/videos/your-video.mp4
```

**Process all videos:**
```bash
cd public_html
./process-all-videos.sh
```

### Using VideoStreamManager in Your Code

```javascript
import VideoStreamManager from './js/modules/VideoStreamManager.js';

// Initialize
const videoManager = new VideoStreamManager();

// Load and play a video
const video = await videoManager.switchVideo('4klatlong_05b_offsetOverture1');

// Use with Three.js videosphere
const videoTexture = new THREE.VideoTexture(video);
const geometry = new THREE.SphereGeometry(500, 60, 40);
geometry.scale(-1, 1, 1); // Invert for inside view
const material = new THREE.MeshBasicMaterial({ map: videoTexture });
const videosphere = new THREE.Mesh(geometry, material);
scene.add(videosphere);

// Change quality
await videoManager.changeQuality('1080p');

// Preload next videos
videoManager.preloadNextVideos(['Scraptangle_latlong_05b_offsetOverture1', 'ShroomZoomLatlong_12']);

// Enable adaptive quality
videoManager.enableAdaptiveQuality();
```

### Deploying to SiteGround

**After processing videos:**
```bash
cd public_html
./deploy-videos.sh
```

This will:
1. Upload all processed videos
2. Upload .htaccess configuration
3. Upload updated JavaScript modules
4. Verify deployment

## Performance Benefits

### Before Optimization:
- Single 4K file per video (400MB+)
- No quality options
- Slow loading on mobile
- Poor streaming support

### After Optimization:
- Multiple quality options (4K, 1080p, 720p, preview)
- HLS adaptive streaming
- Fast initial load with preview
- Proper browser caching
- Mobile-friendly sizes
- Smooth seeking with Range Requests

## Testing Checklist

- [ ] Test video playback in desktop browser
- [ ] Test in mobile browser
- [ ] Test in VR headset (Meta Quest, etc.)
- [ ] Test quality switching
- [ ] Test video seeking/scrubbing
- [ ] Test next/previous navigation
- [ ] Monitor bandwidth usage
- [ ] Check browser console for errors

## Server Requirements

✅ **SiteGround Hosting:**
- Supports `.htaccess` configuration
- Range Request support enabled
- CORS headers configured
- Sufficient bandwidth for video delivery

## Bandwidth Considerations

**Per video play (estimated):**
- Preview: ~9MB
- 720p: ~176MB (for full 5-6 min video)
- 1080p: ~288MB
- 4K: ~320MB

**With HLS:** Only necessary segments are downloaded, reducing bandwidth by 30-50%.

## Future Enhancements

- **Analytics:** Track which quality is most used
- **CDN Integration:** Consider CloudFlare for global delivery
- **Compression:** Explore AV1 codec for even smaller files
- **Auto-Quality:** More sophisticated bandwidth detection
- **Thumbnail Generation:** Create animated GIF previews

## Troubleshooting

**Videos won't play:**
- Check browser console for CORS errors
- Verify .htaccess is uploaded
- Check video file permissions on server

**Slow loading:**
- Use preview version for initial load
- Check user's internet speed
- Consider CDN for global users

**Quality switching not working:**
- Ensure all quality versions are uploaded
- Check VideoStreamManager console logs
- Verify info.json files are accessible

## Support

For issues or questions:
1. Check browser console for errors
2. Verify all files are uploaded to server
3. Test with a simple video first
4. Check SiteGround server logs

---

**Last Updated:** October 27, 2025
**Status:** Processing videos, ready for deployment after completion
