#!/bin/bash

# EyeTrip 360 Deployment Script

echo "🚀 Starting deployment process..."

# Build production assets
echo "📦 Building production assets..."
npm run build

# Compress videos (optional)
echo "🎬 Optimizing videos..."
for video in dist/assets/videos/*.mp4; do
  if [ -f "$video" ]; then
    echo "Optimizing: $video"
    # Uncomment to enable compression
    # ffmpeg -i "$video" -c:v libx264 -crf 23 -preset fast -c:a aac -b:a 128k "${video%.mp4}-optimized.mp4"
    # mv "${video%.mp4}-optimized.mp4" "$video"
  fi
done

# Deploy to SiteGround
if [ -f .env ]; then
  source .env
  echo "📤 Deploying to SiteGround..."
  rsync -avz --delete \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude 'android' \
    --exclude 'ios' \
    --exclude '.env' \
    dist/ ${SITEGROUND_USER}@${SITEGROUND_HOST}:${SITEGROUND_PATH}
  echo "✅ Deployment complete!"
else
  echo "⚠️  .env file not found. Please create it from .env.example"
fi
