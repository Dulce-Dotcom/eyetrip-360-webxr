# EyeTrip Images 360° WebXR Experience

## Features
- 360° panoramic video playback
- WebXR support for VR headsets
- Material Design UI
- Progressive Web App (PWA)
- Android APK export via Capacitor
- Responsive design
- Touch/mouse/VR controller support

## Quick Start

### Install Dependencies
```bash
npm install
```

### Development Server
```bash
npm run dev
```
Access at https://localhost:8080

### Production Build
```bash
npm run build
```

### Android APK Build
```bash
# Initialize Capacitor (first time only)
npx cap init "EyeTrip 360" "com.eyetripimages.vr360"
npx cap add android

# Build APK
npm run build:android
```

### Deploy to SiteGround
```bash
npm run deploy:siteground
```

## Adding Videos

Place your 360° videos in `assets/videos/` and update the scenes array in `js/modules/SceneManager.js`.

### Video Optimization
```bash
ffmpeg -i input.mp4 -c:v libx264 -crf 23 -preset fast -profile:v baseline -level 3.0 -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart output.mp4
```

## WebXR Testing

1. Install WebXR Emulator Extension for Chrome/Firefox
2. Run development server with HTTPS
3. Select device emulation (e.g., Meta Quest 2)
4. Test VR mode entry/exit

## Project Structure
```
├── public_html/                # Source files
│   ├── js/            # JavaScript modules
│   ├── css/           # Stylesheets
│   ├── assets/        # Videos, images, icons
│   └── index.html     # Main HTML
├── dist/              # Production build
├── android/           # Android project
└── capacitor/         # Capacitor config
```

## License
Copyright © 2024 EyeTrip Images. All rights reserved.
