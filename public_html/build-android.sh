#!/bin/bash

echo "📱 Building Android APK..."

# Build web assets
echo "🔨 Building web assets..."
npm run build

# Sync with Capacitor
echo "🔄 Syncing with Capacitor..."
npx cap sync android

# Build APK
echo "📦 Building APK..."
cd android
./gradlew assembleRelease

echo "✅ APK built successfully!"
echo "📍 Location: android/app/build/outputs/apk/release/"
