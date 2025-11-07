#!/bin/bash

# EyeTrip VR - SiteGround FTP Deployment Script
# This script deploys using FTPS (FTP over TLS)

set -e  # Exit on any error

echo "🚀 EyeTrip VR - SiteGround FTP Deployment"
echo "==========================================="
echo ""

# SiteGround FTP Configuration
FTP_HOST="ftp.eyetripvr.com"
FTP_USER="u1578-zgb0uzlh1g5o"
FTP_PASS="=32\$1P2r?4hJ"
FTP_PATH="/public_html"

# Source directory (current directory)
SOURCE_DIR="."

echo "📋 Deployment Configuration:"
echo "   Host: ${FTP_HOST}"
echo "   User: ${FTP_USER}"
echo "   Path: ${FTP_PATH}"
echo ""

# Check if lftp is installed
if ! command -v lftp &> /dev/null; then
    echo "⚠️  lftp not found. Installing..."
    brew install lftp
fi

# Confirm deployment
echo "⚠️  This will deploy the current directory to SiteGround via FTP."
read -p "Continue? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled."
    exit 1
fi

echo ""
echo "📦 Starting FTP deployment..."
echo ""

# Create lftp script
cat > /tmp/eyetrip-deploy.lftp << EOF
set ftp:ssl-force true
set ftp:ssl-protect-data true
set ssl:verify-certificate no
open -u ${FTP_USER},${FTP_PASS} ${FTP_HOST}
cd ${FTP_PATH}

# Mirror local directory to remote, excluding unnecessary files
mirror --reverse --delete --verbose --parallel=5 \\
    --exclude node_modules/ \\
    --exclude .git/ \\
    --exclude .gitignore \\
    --exclude android/ \\
    --exclude ios/ \\
    --exclude capacitor/ \\
    --exclude .env \\
    --exclude .env.example \\
    --exclude .backup \\
    --exclude original-videos/ \\
    --exclude deploy*.sh \\
    --exclude build-*.sh \\
    --exclude create-*.sh \\
    --exclude optimize-*.sh \\
    --exclude process-*.sh \\
    --exclude video-*.sh \\
    --exclude .log \\
    --exclude .DS_Store \\
    --exclude README.md \\
    --exclude package.json \\
    --exclude package-lock.json \\
    --exclude webpack.config.js \\
    ${SOURCE_DIR} .

bye
EOF

# Run lftp with the script
lftp -f /tmp/eyetrip-deploy.lftp

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

# Cleanup
rm -f /tmp/eyetrip-deploy.lftp

echo "🎉 All done! Your EyeTrip VR experience is now live!"
