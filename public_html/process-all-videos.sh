#!/bin/bash

# Process all 360 videos at once
cd "$(dirname "$0")"

echo "🎬 Processing all 360° videos for WebXR streaming..."
echo "=================================================="
echo ""

# Array of videos to process
VIDEOS=(
    "assets/videos/4klatlong_05b_offsetOverture1.mp4"
    "assets/videos/Scraptangle_latlong_05b_offsetOverture1.mp4"
    "assets/videos/ShroomZoomLatlong_12.mp4"
    "assets/videos/stumpy_latlong_01_waves_61Mbps-003.mp4"
)

# Process each video
for VIDEO in "${VIDEOS[@]}"; do
    if [ -f "$VIDEO" ]; then
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "Processing: $(basename "$VIDEO")"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        ./optimize-video.sh "$VIDEO"
        echo ""
    else
        echo "⚠️  File not found: $VIDEO"
    fi
done

echo ""
echo "✅ All videos processed!"
echo ""
echo "📊 Summary of processed videos:"
ls -lh assets/videos/processed/
