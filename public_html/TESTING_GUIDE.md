# 🚀 Testing Guide - Localhost

## Quick Start

1. **Start local server** (if not already running):
   ```bash
   cd /Users/dulce303/eyetrip-360-webxr/public_html
   python3 -m http.server 8000
   ```

2. **Open in browser**:
   ```
   http://localhost:8000/index.html
   ```

---

## 🎮 Keyboard Shortcuts for Testing Features

### Chroma Awards Features:
- **Shift + P**: Toggle Performance Monitor (FPS graph, memory, draw calls)
- **Shift + A**: Toggle Accessibility Menu (screen reader, high contrast, etc.)
- **Shift + I**: Play Cinematic Intro Sequence
- **Shift + O**: Toggle Orbit Camera (auto-rotate)
- **Shift + V**: Toggle Audio-Reactive Particles
- **Shift + T**: Test Haptic Feedback (vibration burst)

### Standard Controls:
- **Spacebar**: Play/Pause video
- **F**: Fullscreen
- **M**: Mute/Unmute
- **Arrow Keys**: Switch scenes/look around
- **Escape**: Exit VR mode

---

## ✅ What to Test

### 1. Performance Monitor
- Press **Shift + P** to show FPS graph
- Check that FPS is 55-60 (green)
- Watch memory usage
- Look for optimization suggestions at bottom

### 2. Accessibility System
- Press **Shift + A** to open menu
- Toggle options:
  - ✅ Screen Reader (ARIA announcements in console)
  - ✅ High Contrast (yellow/green hotspots)
  - ✅ Reduced Motion (no animations)
  - ✅ Keyboard Navigation (arrow keys + Enter)
  - ✅ Audio Descriptions (voice narration)
  - ✅ Large Text (120% font size)

### 3. Cinematic Camera
- Press **Shift + I** for intro sequence (starts at top, descends while rotating)
- Press **Shift + O** to start/stop orbital rotation
- Camera should move smoothly with GSAP animations

### 4. Audio-Reactive Particles
- Press **Shift + V** to show particles
- **10,000 particles** should appear as colorful sphere
- Play video/audio - particles should react to sound
- Bass = red, Mid = green, Treble = blue

### 5. Haptic Feedback
- Press **Shift + T** on mobile to feel vibration
- Get close to hotspots - should vibrate stronger as you approach
- Discovery should trigger celebration pattern

### 6. PWA Support
- Look for **"📱 Install App"** button at bottom-right
- Click to install as PWA
- Test offline mode (disconnect wifi, reload)

### 7. Adaptive Difficulty
- Play through experience
- Find hotspots quickly → difficulty increases (smaller, harder to find)
- Miss hotspots → difficulty decreases (larger, easier to find)
- Check console for difficulty adjustments
- Top-right shows current level: "Beginner 🎈" to "Expert 🔥"

### 8. Procedural Hotspot Generator
- Open console
- Type: `window.app.procedural.generateByDifficulty('medium')`
- Should see algorithmically placed hotspots
- Try different patterns:
  - `window.app.procedural.generateFibonacciSphere(20)`
  - `window.app.procedural.generateClustered(5, 4)`

### 9. Collaborative Mode (Optional)
- Currently commented out in app.js
- Uncomment lines in `initializeChromaFeatures()` to enable
- Open 2+ browser tabs to test multiplayer
- See other players as 3D cursors with names

---

## 📊 Expected Results

### Console Output:
```
🚀 Initializing EyeTrip 360° Experience...
📹 Setting up panorama player...
🥽 Checking WebXR support...
🎬 Setting up scene manager...
🎮 Setting up UI controls...
🏆 Setting up achievement system...
🎬 Setting up experience ending...
🏆 Initializing Chroma Awards features...
📊 Initializing Performance Monitor...
📱 Initializing PWA Support...
📳 Initializing Haptic Feedback...
♿ Initializing Accessibility...
🎯 Initializing Adaptive Difficulty...
🎬 Initializing Cinematic Camera...
🎨 Initializing Audio-Reactive Particles...
🎲 Initializing Procedural Generator...
✅ All Chroma Awards features initialized!

🎮 Chroma Features Keyboard Shortcuts:
• Shift+P: Toggle Performance Monitor
• Shift+A: Toggle Accessibility Menu
• Shift+I: Play Cinematic Intro
• Shift+O: Toggle Orbit Camera
• Shift+V: Toggle Audio Particles
• Shift+T: Test Haptic Feedback
```

### Visual Indicators:
- ✅ Performance overlay in top-right
- ✅ Accessibility menu in top-left
- ✅ Install PWA button at bottom-right
- ✅ Difficulty level indicator when active
- ✅ Audio particles visible when toggled
- ✅ Smooth cinematic camera movements

---

## 🐛 Troubleshooting

### Audio Particles Not Showing
- Check console for: "⚠️ Skipping Audio-Reactive Particles (no audio context)"
- Solution: Play video first to initialize audio context
- Then press Shift+V

### No Vibration on Mobile
- Check console: "📳 HapticFeedbackSystem initialized"
- Browser must support Vibration API
- iOS Safari doesn't support vibration

### Performance Monitor Not Updating
- Check that renderer exists: `window.app.perfMonitor`
- FPS should update every 500ms
- If stuck at 0, renderer might not be initialized

### Cinematic Camera Not Moving
- Check console for errors
- GSAP might not be loaded (CinematicCamera imports GSAP)
- Try: `import { gsap } from 'gsap'` - may need to install GSAP

---

## 📝 Known Dependencies

### GSAP (for CinematicCamera)
If you see import errors:
```bash
npm install gsap
# or
yarn add gsap
```

### Service Worker (for PWA)
- Expects `/sw.js` file to exist
- Currently using existing sw.js from project
- Only registers in production (not localhost)

---

## 🎯 Success Criteria

All features working if you see:
- ✅ FPS graph showing 55-60 FPS
- ✅ Particles reacting to audio
- ✅ Camera moving smoothly with Shift+I/O
- ✅ Vibration on mobile (Shift+T)
- ✅ Accessibility menu toggles options
- ✅ Install button appears (non-localhost)
- ✅ Hotspots adapt to your skill level
- ✅ No console errors

---

## 🚀 Next Steps After Testing

1. **Test all features thoroughly**
2. **Note any bugs or issues**
3. **Take screenshots/recordings**
4. **Decide which features to enable by default**
5. **Deploy to production when ready**

---

## 💡 Pro Tips

- **Open DevTools Console** (F12) to see detailed logs
- **Mobile Testing**: Use Chrome Remote Debugging for mobile
- **VR Testing**: Use Meta Quest browser or similar
- **Performance**: Disable features you don't want (comment out in app.js)
- **Collaborative Mode**: Enable when ready to test multiplayer

---

## 📞 Feature Status

All 9 Chroma Awards features are:
- ✅ Built locally
- ✅ Integrated into app.js
- ✅ Ready for testing
- ⏸️ Not deployed yet (as requested)

**Ready to test on localhost now!** 🎉
