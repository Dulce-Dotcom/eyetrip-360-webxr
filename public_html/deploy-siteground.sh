#!/bin/bash

# EyeTrip VR - SiteGround SSH Deployment Script
# This script deploys the latest changes to SiteGround hosting

set -e  # Exit on any error

echo "🚀 EyeTrip VR - SiteGround Deployment"
echo "======================================"
echo ""

# SiteGround SSH Configuration
SITEGROUND_USER="u1578-zgb0uzlh1g5o"
SITEGROUND_HOST="ssh.eyetripvr.com"
SITEGROUND_PORT="18765"
SITEGROUND_PATH="/home/customer/public_html"
SSH_KEY="$HOME/.ssh/siteground_eyetripvr"
SSH_PASSPHRASE="=32\$1P2r?4hJ"

# Source directory (current directory)
SOURCE_DIR="."

echo "📋 Deployment Configuration:"
echo "   Host: ${SITEGROUND_HOST}"
echo "   User: ${SITEGROUND_USER}"
echo "   Port: ${SITEGROUND_PORT}"
echo "   Path: ${SITEGROUND_PATH}"
echo ""

# Check if sshpass is installed (for automated password entry)
if ! command -v sshpass &> /dev/null; then
    echo "⚠️  sshpass not found. Installing..."
    brew install hudochenkov/sshpass/sshpass
fi

# Use SSH key for authentication
USE_SSHPASS=true
SSH_CMD="sshpass -p \"${SSH_PASSPHRASE}\" ssh -i ${SSH_KEY} -p ${SITEGROUND_PORT} -o StrictHostKeyChecking=no"

# Confirm deployment
echo "⚠️  This will deploy the current directory to SiteGround."
read -p "Continue? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled."
    exit 1
fi

echo ""
echo "📦 Starting deployment..."
echo ""

# Deploy using rsync with SSH
if [ "$USE_SSHPASS" = true ]; then
    # Automated deployment with SSH key
    echo "🔐 Using SSH key authentication..."
    sshpass -p "${SSH_PASSPHRASE}" rsync -avz --progress \
        -e "ssh -i ${SSH_KEY} -p ${SITEGROUND_PORT} -o StrictHostKeyChecking=no" \
        --exclude 'node_modules' \
        --exclude '.git' \
        --exclude '.gitignore' \
        --exclude 'android' \
        --exclude 'ios' \
        --exclude 'capacitor' \
        --exclude '.env' \
        --exclude '.env.example' \
        --exclude '*.backup' \
        --exclude 'original-videos' \
        --exclude 'deploy*.sh' \
        --exclude 'build-*.sh' \
        --exclude 'create-*.sh' \
        --exclude 'optimize-*.sh' \
        --exclude 'process-*.sh' \
        --exclude 'video-*.sh' \
        --exclude '*.log' \
        --exclude '.DS_Store' \
        --exclude 'README.md' \
        --exclude 'package.json' \
        --exclude 'package-lock.json' \
        --exclude 'webpack.config.js' \
        "${SOURCE_DIR}/" "${SITEGROUND_USER}@${SITEGROUND_HOST}:${SITEGROUND_PATH}/"
else
    # Manual password entry (fallback)
    echo "🔐 Please enter your SSH key passphrase when prompted..."
    rsync -avz --progress \
        -e "ssh -i ${SSH_KEY} -p ${SITEGROUND_PORT}" \
        --exclude 'node_modules' \
        --exclude '.git' \
        --exclude '.gitignore' \
        --exclude 'android' \
        --exclude 'ios' \
        --exclude 'capacitor' \
        --exclude '.env' \
        --exclude '.env.example' \
        --exclude '*.backup' \
        --exclude 'original-videos' \
        --exclude 'deploy*.sh' \
        --exclude 'build-*.sh' \
        --exclude 'create-*.sh' \
        --exclude 'optimize-*.sh' \
        --exclude 'process-*.sh' \
        --exclude 'video-*.sh' \
        --exclude '*.log' \
        --exclude '.DS_Store' \
        --exclude 'README.md' \
        --exclude 'package.json' \
        --exclude 'package-lock.json' \
        --exclude 'webpack.config.js' \
        "${SOURCE_DIR}/" "${SITEGROUND_USER}@${SITEGROUND_HOST}:${SITEGROUND_PATH}/"
fi

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
    echo "   ✓ Assets (images, videos, sounds, fonts)"
    echo "   ✓ PWA files (manifest.json, sw.js)"
    echo ""
else
    echo ""
    echo "❌ Deployment failed!"
    echo "   Please check the error messages above."
    exit 1
fi

# Optional: Set permissions on SiteGround
echo "🔧 Setting file permissions..."
if [ "$USE_SSHPASS" = true ]; then
    sshpass -p "${SSH_PASSPHRASE}" ssh -i ${SSH_KEY} -p ${SITEGROUND_PORT} -o StrictHostKeyChecking=no \
        ${SITEGROUND_USER}@${SITEGROUND_HOST} \
        "cd ${SITEGROUND_PATH} && find . -type f -name '*.html' -exec chmod 644 {} \; && find . -type f -name '*.js' -exec chmod 644 {} \; && find . -type f -name '*.css' -exec chmod 644 {} \; && find . -type d -exec chmod 755 {} \;"
else
    ssh -i ${SSH_KEY} -p ${SITEGROUND_PORT} ${SITEGROUND_USER}@${SITEGROUND_HOST} \
        "cd ${SITEGROUND_PATH} && find . -type f -name '*.html' -exec chmod 644 {} \; && find . -type f -name '*.js' -exec chmod 644 {} \; && find . -type f -name '*.css' -exec chmod 644 {} \; && find . -type d -exec chmod 755 {} \;"
fi

echo "✅ Permissions set successfully!"
echo ""
echo "🎉 All done! Your EyeTrip VR experience is now live!"
