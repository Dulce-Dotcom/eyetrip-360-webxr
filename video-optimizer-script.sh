#!/bin/bash

# Video Optimization Script for 360° Videos
# This creates multiple quality versions and implements HLS streaming

echo "🎬 360° Video Optimization Tool"
echo "================================"

# Check if ffmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo "❌ ffmpeg is not installed. Please install it first:"
    echo "   brew install ffmpeg"
    exit 1
fi

# Input video file
INPUT_VIDEO="$1"

if [ -z "$INPUT_VIDEO" ]; then
    echo "Usage: ./optimize-video.sh <input-video.mp4>"
    exit 1
fi

if [ ! -f "$INPUT_VIDEO" ]; then
    echo "❌ File not found: $INPUT_VIDEO"
    exit 1
fi

# Get filename without extension
BASENAME=$(basename "$INPUT_VIDEO" .mp4)
OUTPUT_DIR="src/assets/videos/processed"

echo "📁 Creating output directory..."
mkdir -p "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR/$BASENAME"

# Function to create optimized versions
create_quality_version() {
    local quality=$1
    local resolution=$2
    local bitrate=$3
    local output_name="${BASENAME}_${quality}.mp4"
    
    echo "🔄 Creating $quality quality version ($resolution @ $bitrate)..."
    
    ffmpeg -i "$INPUT_VIDEO" \
        -s $resolution \
        -c:v libx264 \
        -preset fast \
        -crf 23 \
        -profile:v high \
        -level 4.2 \
        -b:v $bitrate \
        -maxrate $bitrate \
        -bufsize $(echo "$bitrate" | sed 's/M/*2M/g' | bc) \
        -pix_fmt yuv420p \
        -c:a aac \
        -b:a 128k \
        -ar 44100 \
        -movflags +faststart \
        -y \
        "$OUTPUT_DIR/$BASENAME/$output_name"
    
    echo "✅ $quality version created: $output_name"
}

# Create multiple quality versions
echo "🎥 Processing 360° video: $INPUT_VIDEO"
echo ""

# Ultra HD (4K) - for high-end VR headsets
create_quality_version "4k" "3840x1920" "15M"

# Full HD - for standard viewing
create_quality_version "1080p" "2560x1280" "8M"

# HD - for mobile/lower bandwidth
create_quality_version "720p" "1920x960" "4M"

# Create HLS streaming version for adaptive bitrate
echo ""
echo "📡 Creating HLS streaming version..."

# Create HLS playlist
ffmpeg -i "$INPUT_VIDEO" \
    -c:v libx264 \
    -preset fast \
    -crf 23 \
    -sc_threshold 0 \
    -g 48 \
    -keyint_min 48 \
    -c:a aac \
    -b:a 128k \
    -ar 44100 \
    -map 0:v:0 -map 0:a:0 \
    -b:v:0 4M -s:v:0 1920x960 \
    -map 0:v:0 -map 0:a:0 \
    -b:v:1 8M -s:v:1 2560x1280 \
    -map 0:v:0 -map 0:a:0 \
    -b:v:2 15M -s:v:2 3840x1920 \
    -var_stream_map "v:0,a:0 v:1,a:1 v:2,a:2" \
    -master_pl_name master.m3u8 \
    -f hls \
    -hls_time 10 \
    -hls_list_size 0 \
    -hls_segment_filename "$OUTPUT_DIR/$BASENAME/segment_%v_%03d.ts" \
    "$OUTPUT_DIR/$BASENAME/playlist_%v.m3u8"

echo "✅ HLS streaming files created"

# Create a preview/thumbnail version (1 minute, low quality)
echo ""
echo "🖼️ Creating preview version..."
ffmpeg -i "$INPUT_VIDEO" \
    -t 60 \
    -s 1280x640 \
    -c:v libx264 \
    -preset fast \
    -crf 28 \
    -b:v 1M \
    -c:a aac \
    -b:a 64k \
    -movflags +faststart \
    -y \
    "$OUTPUT_DIR/$BASENAME/${BASENAME}_preview.mp4"

# Generate thumbnail
echo "🖼️ Generating thumbnail..."
ffmpeg -i "$INPUT_VIDEO" \
    -ss 00:00:10 \
    -vframes 1 \
    -s 640x320 \
    -f image2 \
    "$OUTPUT_DIR/$BASENAME/${BASENAME}_thumb.jpg"

# Create info file with video metadata
echo ""
echo "📄 Creating metadata file..."
cat > "$OUTPUT_DIR/$BASENAME/info.json" << EOF
{
  "original": "$BASENAME.mp4",
  "qualities": {
    "4k": {
      "file": "${BASENAME}_4k.mp4",
      "resolution": "3840x1920",
      "bitrate": "15M"
    },
    "1080p": {
      "file": "${BASENAME}_1080p.mp4",
      "resolution": "2560x1280",
      "bitrate": "8M"
    },
    "720p": {
      "file": "${BASENAME}_720p.mp4",
      "resolution": "1920x960",
      "bitrate": "4M"
    },
    "preview": {
      "file": "${BASENAME}_preview.mp4",
      "resolution": "1280x640",
      "bitrate": "1M",
      "duration": "60s"
    }
  },
  "hls": {
    "master": "master.m3u8"
  },
  "thumbnail": "${BASENAME}_thumb.jpg"
}
EOF

# Show file sizes
echo ""
echo "📊 File size comparison:"
echo "Original: $(du -h "$INPUT_VIDEO" | cut -f1)"
echo "4K:       $(du -h "$OUTPUT_DIR/$BASENAME/${BASENAME}_4k.mp4" | cut -f1)"
echo "1080p:    $(du -h "$OUTPUT_DIR/$BASENAME/${BASENAME}_1080p.mp4" | cut -f1)"
echo "720p:     $(du -h "$OUTPUT_DIR/$BASENAME/${BASENAME}_720p.mp4" | cut -f1)"
echo "Preview:  $(du -h "$OUTPUT_DIR/$BASENAME/${BASENAME}_preview.mp4" | cut -f1)"

echo ""
echo "✅ Video optimization complete!"
echo "📁 Output location: $OUTPUT_DIR/$BASENAME/"
echo ""
echo "💡 Tips:"
echo "- Use the preview version for testing"
echo "- Implement quality switching based on network speed"
echo "- Use HLS streaming for best performance"