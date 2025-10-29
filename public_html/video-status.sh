#!/bin/bash

# Check Video Processing Status
# Shows which videos have been processed and which are pending

echo "🎬 EyeTrip VR - Video Processing Status"
echo "======================================="
echo ""

VIDEOS_DIR="/Users/dulce303/eyetrip-360-webxr/public_html/assets/videos"
PROCESSED_DIR="$VIDEOS_DIR/processed"

# Videos to process
VIDEOS=(
    "4klatlong_05b_offsetOverture1.mp4"
    "Scraptangle_latlong_05b_offsetOverture1.mp4"
    "ShroomZoomLatlong_12.mp4"
    "stumpy_latlong_01_waves_61Mbps-003.mp4"
)

echo "📹 Original Videos:"
for video in "${VIDEOS[@]}"; do
    if [ -f "$VIDEOS_DIR/$video" ]; then
        size=$(du -h "$VIDEOS_DIR/$video" | cut -f1)
        echo "  ✓ $video ($size)"
    else
        echo "  ✗ $video (not found)"
    fi
done

echo ""
echo "📊 Processed Videos:"
echo ""

for video in "${VIDEOS[@]}"; do
    video_name="${video%.mp4}"
    processed_path="$PROCESSED_DIR/$video_name"
    
    if [ -d "$processed_path" ]; then
        echo "✅ $video_name"
        
        # Check for key files
        if [ -f "$processed_path/${video_name}_4k.mp4" ]; then
            size_4k=$(du -h "$processed_path/${video_name}_4k.mp4" | cut -f1)
            echo "   ├─ 4K: $size_4k"
        fi
        
        if [ -f "$processed_path/${video_name}_1080p.mp4" ]; then
            size_1080p=$(du -h "$processed_path/${video_name}_1080p.mp4" | cut -f1)
            echo "   ├─ 1080p: $size_1080p"
        fi
        
        if [ -f "$processed_path/${video_name}_720p.mp4" ]; then
            size_720p=$(du -h "$processed_path/${video_name}_720p.mp4" | cut -f1)
            echo "   ├─ 720p: $size_720p"
        fi
        
        if [ -f "$processed_path/${video_name}_preview.mp4" ]; then
            size_preview=$(du -h "$processed_path/${video_name}_preview.mp4" | cut -f1)
            echo "   ├─ Preview: $size_preview"
        fi
        
        if [ -f "$processed_path/master.m3u8" ]; then
            segment_count=$(ls -1 "$processed_path"/segment_*.ts 2>/dev/null | wc -l)
            echo "   ├─ HLS: master.m3u8 ($segment_count segments)"
        fi
        
        if [ -f "$processed_path/${video_name}_thumb.jpg" ]; then
            echo "   └─ Thumbnail: ✓"
        fi
        
        echo ""
    else
        echo "⏳ $video_name (not processed yet)"
        echo ""
    fi
done

# Summary
total_videos=${#VIDEOS[@]}
processed_count=0

for video in "${VIDEOS[@]}"; do
    video_name="${video%.mp4}"
    if [ -d "$PROCESSED_DIR/$video_name" ]; then
        ((processed_count++))
    fi
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📈 Summary: $processed_count / $total_videos videos processed"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $processed_count -eq $total_videos ]; then
    echo ""
    echo "✅ All videos processed!"
    echo ""
    echo "Next steps:"
    echo "  1. Test locally: open public_html/index.html"
    echo "  2. Deploy: ./deploy-videos.sh"
    echo "  3. Test live: https://eyetripvr.com"
elif [ $processed_count -gt 0 ]; then
    remaining=$((total_videos - processed_count))
    echo ""
    echo "⏳ $remaining video(s) remaining"
    echo ""
    echo "To process remaining videos:"
    echo "  ./process-all-videos.sh"
else
    echo ""
    echo "⚠️  No videos processed yet"
    echo ""
    echo "To start processing:"
    echo "  ./process-all-videos.sh"
fi
