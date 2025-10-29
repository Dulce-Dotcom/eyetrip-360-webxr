#!/bin/bash

# Create Thumbnails from Video Midpoints
# Generates gallery thumbnails from the middle frame of each video

echo "🖼️  Creating Thumbnails from Video Midpoints"
echo "============================================"

# Array of videos to process
VIDEOS=(
    "4klatlong_05b_offsetOverture1.mp4"
    "Scraptangle_latlong_05b_offsetOverture1.mp4"
    "ShroomZoomLatlong_12.mp4"
    "stumpy_latlong_01_waves_61Mbps-003.mp4"
)

VIDEOS_DIR="assets/videos"
PROCESSED_DIR="assets/videos/processed"

for VIDEO in "${VIDEOS[@]}"; do
    VIDEO_PATH="$VIDEOS_DIR/$VIDEO"
    BASENAME="${VIDEO%.mp4}"
    OUTPUT_DIR="$PROCESSED_DIR/$BASENAME"
    
    echo ""
    echo "📹 Processing: $VIDEO"
    
    # Check if video exists
    if [ ! -f "$VIDEO_PATH" ]; then
        echo "   ⚠️  Video not found: $VIDEO_PATH"
        continue
    fi
    
    # Create output directory if it doesn't exist
    mkdir -p "$OUTPUT_DIR"
    
    # Get video duration in seconds
    DURATION=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$VIDEO_PATH")
    
    # Calculate midpoint
    MIDPOINT=$(echo "$DURATION / 2" | bc -l)
    
    echo "   ⏱️  Duration: ${DURATION}s, Midpoint: ${MIDPOINT}s"
    
    # Extract frame from midpoint at 640x320 resolution
    THUMB_PATH="$OUTPUT_DIR/${BASENAME}_thumb.jpg"
    
    echo "   🎬 Extracting thumbnail..."
    ffmpeg -y -ss "$MIDPOINT" -i "$VIDEO_PATH" \
        -vframes 1 \
        -vf "scale=640:320" \
        -q:v 2 \
        "$THUMB_PATH" \
        2>&1 | grep -E "(frame=|error|Invalid)" || true
    
    if [ -f "$THUMB_PATH" ]; then
        SIZE=$(ls -lh "$THUMB_PATH" | awk '{print $5}')
        echo "   ✅ Thumbnail created: $SIZE"
    else
        echo "   ❌ Failed to create thumbnail"
    fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Thumbnail generation complete!"
echo ""
echo "📂 Thumbnails saved to:"
for VIDEO in "${VIDEOS[@]}"; do
    BASENAME="${VIDEO%.mp4}"
    echo "   $PROCESSED_DIR/$BASENAME/${BASENAME}_thumb.jpg"
done
