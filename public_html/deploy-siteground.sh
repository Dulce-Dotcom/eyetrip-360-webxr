#!/bin/bash

# EyeTrip VR - SiteGround SSH Deployment Script
# This script deploys the latest changes to SiteGround hosting
# By default, videos are EXCLUDED to save bandwidth
# Use --with-videos flag to include video files

set -e  # Exit on any error

echo "🚀 EyeTrip VR - SiteGround Deployment"
echo "======================================"
echo ""

# SiteGround SSH Configuration
SITEGROUND_USER="u1578-zgb0uzlh1g5o"
SITEGROUND_HOST="ssh.eyetripvr.com"
SITEGROUND_PORT="18765"
SITEGROUND_PATH="www/eyetripvr.com/public_html"
SSH_KEY="$HOME/.ssh/siteground_vr"

# Source directory (current directory)
SOURCE_DIR="."

# Deployment mode (with or without videos)
DEPLOY_VIDEOS=false

# Check for --with-videos flag
if [[ "$1" == "--with-videos" ]]; then
    DEPLOY_VIDEOS=true
    echo "� Video deployment ENABLED"
else
    echo "📹 Video deployment DISABLED (use --with-videos to include)"
fi

echo ""
echo "�📋 Deployment Configuration:"
echo "   Host: ${SITEGROUND_HOST}"
echo "   User: ${SITEGROUND_USER}"
echo "   Port: ${SITEGROUND_PORT}"
echo "   Path: ${SITEGROUND_PATH}"
echo ""

# Confirm deployment
echo "⚠️  This will deploy code changes to SiteGround."
if [ "$DEPLOY_VIDEOS" = true ]; then
    echo "⚠️  WARNING: This will also upload ALL video files (large transfer!)"
fi
read -p "Continue? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled."
    exit 1
fi

echo ""
echo "📦 Starting deployment..."
echo ""

# Build exclude list
EXCLUDE_ARGS=(
    --exclude 'node_modules'
    --exclude '.git'
    --exclude '.gitignore'
    --exclude 'android'
    --exclude 'ios'
    --exclude 'capacitor'
    --exclude '.env'
    --exclude '.env.example'
    --exclude '*.backup'
    --exclude 'original-videos'
    --exclude 'deploy*.sh'
    --exclude 'build-*.sh'
    --exclude 'create-*.sh'
    --exclude 'optimize-*.sh'
    --exclude 'process-*.sh'
    --exclude 'video-*.sh'
    --exclude '*.log'
    --exclude '.DS_Store'
    --exclude 'README.md'
    --exclude 'package.json'
    --exclude 'package-lock.json'
    --exclude 'webpack.config.js'
)

# Exclude videos unless explicitly requested
if [ "$DEPLOY_VIDEOS" = false ]; then
    EXCLUDE_ARGS+=(
        --exclude 'assets/videos/processed/'
        --exclude 'assets/videos/*.mp4'
        --exclude 'assets/videos/*.webm'
    )
    echo "⏭️  Skipping video files..."
fi

echo "🔐 Using SSH key authentication..."
rsync -avz --progress \
    -e "ssh -i ${SSH_KEY} -p ${SITEGROUND_PORT}" \
    "${EXCLUDE_ARGS[@]}" \
    "${SOURCE_DIR}/" "${SITEGROUND_USER}@${SITEGROUND_HOST}:${SITEGROUND_PATH}/"

# Check if deployment was successful
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deployment completed successfully!"
    echo ""
    echo "🌐 Your site should now be live at:"
    echo "   https://eyetripvr.com"
    echo ""
    echo "📝 Deployed files:"
    echo "   ✓ HTML files (index.html, gallery.html, video*.html, etc.)"
    echo "   ✓ JavaScript modules (js/)"
    echo "   ✓ CSS stylesheets (css/)"
    echo "   ✓ Assets (images, sounds, fonts, icons)"
    if [ "$DEPLOY_VIDEOS" = true ]; then
        echo "   ✓ Videos (processed HLS streams)"
    else
        echo "   ⏭️  Videos (skipped - use --with-videos to deploy)"
    fi
    echo ""
else
    echo ""
    echo "❌ Deployment failed!"
    echo "   Please check the error messages above."
    exit 1
fi

# Optional: Set permissions on SiteGround
echo "🔧 Setting file permissions..."
ssh -i ${SSH_KEY} -p ${SITEGROUND_PORT} ${SITEGROUND_USER}@${SITEGROUND_HOST} \
    "cd ${SITEGROUND_PATH} && find . -type f -name '*.html' -exec chmod 644 {} \; && find . -type f -name '*.js' -exec chmod 644 {} \; && find . -type f -name '*.css' -exec chmod 644 {} \; && find . -type d -exec chmod 755 {} \;"

echo "✅ Permissions set successfully!"
echo ""
echo "🎉 All done! Your EyeTrip VR experience is now live!"
echo ""
if [ "$DEPLOY_VIDEOS" = false ]; then
    echo "💡 Tip: To deploy videos, use: bash deploy-siteground.sh --with-videos"
fi
