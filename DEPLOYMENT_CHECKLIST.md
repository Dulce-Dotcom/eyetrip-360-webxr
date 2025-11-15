# EyeTrip VR - Deployment Checklist 🚀

## Pre-Deployment Testing

### ✅ Local Testing (Required)
- [ ] Test all 6 videos with hotspot systems
- [ ] Verify desktop click interaction works
- [ ] Test mobile touch interaction on iOS/Android
- [ ] Test VR controller interaction in Meta Quest browser
- [ ] Verify discovery UI appears and updates correctly
- [ ] Check toast notifications display properly
- [ ] Test completion message "All Sounds Found!"
- [ ] Verify spatial audio works (sounds come from correct directions)
- [ ] Check particle effects render without lag
- [ ] Test across Chrome, Firefox, Edge, Safari

### 🎮 VR-Specific Testing
- [ ] Meta Quest: Controller trigger discovers hotspots
- [ ] Meta Quest: Yellow ray flash on discovery
- [ ] Meta Quest: Audio is positional (turn head to hear direction)
- [ ] Meta Quest: Discovery UI readable in VR
- [ ] Meta Quest: No performance issues with particles
- [ ] WebXR Emulator: Basic functionality works

### 🎵 Audio Testing
- [ ] All 15 sound files load correctly
- [ ] Spatial audio positioning accurate
- [ ] No audio clipping or distortion
- [ ] Volume levels comfortable (0.8 default)
- [ ] Sounds play only once per hotspot
- [ ] No conflicts with video soundtrack

### 🖥️ Cross-Browser Testing
- [ ] Chrome (desktop): All features work
- [ ] Firefox (desktop): All features work
- [ ] Safari (macOS): All features work
- [ ] Edge (desktop): All features work
- [ ] Chrome (Android): Touch works, audio works
- [ ] Safari (iOS): Touch works, audio works

## Deployment Steps

### 1. Backup Current Production
```bash
# Create backup of current live site
cd /path/to/production
tar -czf eyetripvr-backup-$(date +%Y%m%d).tar.gz public_html/
```

### 2. Deploy New Files
```bash
# Deploy modified/new files
cd /Users/dulce303/eyetrip-360-webxr

# New file
scp public_html/js/modules/HotspotManager.js user@server:/path/to/public_html/js/modules/

# Modified files
scp public_html/js/modules/PanoramaPlayer.js user@server:/path/to/public_html/js/modules/
scp public_html/css/app.css user@server:/path/to/public_html/css/

# Documentation (optional)
scp INTERACTIVE_AUDIO_HOTSPOTS.md user@server:/path/to/docs/
```

### 3. Verify Sound Assets
```bash
# Ensure all sound files are present on server
ls -lh /path/to/public_html/assets/sound/

# Should see 16 files (15 for hotspots + swoosh.mp3)
# chime.mp3, chime2.mp3, clank.mp3, hum.mp3, pulse.mp3, pulse2.mp3
# rumble.mp3, rumble2.mp3, scan.mp3, scan2.mp3, screech.mp3
# sparkle.mp3, swoosh.mp3, tone.mp3, tone2.mp3, woosh.mp3, woosh2.mp3, zap.mp3
```

### 4. Clear CDN/Cache (if applicable)
```bash
# Clear any CDN caches
# CloudFlare example:
curl -X POST "https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache" \
     -H "Authorization: Bearer {api_token}" \
     -H "Content-Type: application/json" \
     --data '{"purge_everything":true}'

# Or purge specific files:
# - /js/modules/PanoramaPlayer.js
# - /js/modules/HotspotManager.js
# - /css/app.css
```

### 5. Post-Deployment Verification
- [ ] Load video1.html (Matrix Caracas) - verify hotspots appear
- [ ] Click a hotspot - verify audio plays and toast shows
- [ ] Check browser console - no JavaScript errors
- [ ] Verify discovery UI shows "0/5" initially
- [ ] Discover all 5 hotspots - verify completion message
- [ ] Test on mobile device - touch interaction works
- [ ] Test in Meta Quest browser - VR controller works

## Rollback Plan (If Issues Found)

### Quick Rollback
```bash
# Restore from backup
cd /path/to/production
tar -xzf eyetripvr-backup-YYYYMMDD.tar.gz

# Or restore individual files
cp backup/js/modules/PanoramaPlayer.js public_html/js/modules/
cp backup/css/app.css public_html/css/
rm public_html/js/modules/HotspotManager.js  # Remove new file
```

## Monitoring Post-Launch

### 🔍 Check These Metrics
- [ ] Browser console errors (check Sentry/logging if available)
- [ ] Audio loading errors (check network tab)
- [ ] User engagement time (analytics)
- [ ] Discovery completion rates
- [ ] Mobile vs desktop usage
- [ ] VR headset usage percentage

### 📊 Analytics Events to Track (Future)
- Hotspot discovered (which video, which hotspot)
- Completion time (how fast user finds all 5)
- Platform used (desktop/mobile/VR)
- Browser type and version
- Discovery UI shown count
- Toast notification appearances

## Known Issues / Limitations

### ⚠️ Current Limitations
1. **iOS Safari Audio**: May require user gesture before spatial audio works
2. **VR Performance**: Particle effects may lag on older Quest devices
3. **Browser Support**: Spatial audio requires Web Audio API (all modern browsers)
4. **Discovery State**: Not persisted - resets on page reload
5. **Hotspot Positioning**: Fixed positions, not dynamically calculated

### 🐛 Potential Issues to Monitor
- Audio loading failures (check network connectivity)
- Raycaster false positives (clicking near but not on hotspot)
- UI z-index conflicts with other overlays
- Mobile keyboard covering discovery UI
- VR controller ray not detecting small hotspots

## Support Resources

### 📚 Documentation
- `INTERACTIVE_AUDIO_HOTSPOTS.md` - Full implementation details
- `HotspotManager.js` - Inline code comments
- `PanoramaPlayer.js` - Integration documentation

### 🔧 Debug Tools
- Browser DevTools Console - Check for errors
- Three.js Inspector - Visualize scene hierarchy
- WebXR Emulator - Test VR without headset
- Network Tab - Verify asset loading

### 💬 User Feedback Channels
- Contact form on site
- Social media mentions
- Browser console error reporting
- Analytics behavior tracking

## Version Information
- **Phase**: 2 - Interactive Audio Hotspots
- **Release Date**: TBD
- **Version**: 2.0.0
- **Previous Version**: 1.x (VR fixes + SEO)
- **Files Changed**: 3 (1 new, 2 modified)
- **Sound Assets**: 15 files (+ 1 existing)

## Success Criteria

### ✅ Deployment Successful When:
1. All 6 video configurations load hotspots
2. Desktop click/touch interaction works smoothly
3. VR controller trigger discovers hotspots
4. Discovery UI appears and updates correctly
5. Spatial audio plays from correct positions
6. No JavaScript console errors
7. Page load time < 3 seconds
8. Works on iOS, Android, Desktop, VR

### 🎯 User Experience Goals:
- Users discover at least 3/5 hotspots per video
- Average completion time: 30-60 seconds
- Discovery UI provides clear progress feedback
- Audio enhances immersion without overwhelming
- Cross-platform experience is consistent

---

**Deployment Status**: 🟡 **READY FOR TESTING**  
**Production Status**: 🔴 **NOT YET DEPLOYED**  
**Recommended Deploy Time**: Off-peak hours (low traffic period)
