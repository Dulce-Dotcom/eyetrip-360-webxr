#!/bin/bash

# Deploy optimized videos and updated code to SiteGround
# Usage: ./deploy-videos.sh

echo "🚀 EyeTrip VR - Video Deployment Script"
echo "========================================"
echo ""

# Configuration
SSH_HOST="ssh.eyetripvr.com"
SSH_USER="u1578-zgb0uzlh1g5o"
SSH_PORT="18765"
SSH_KEY="$HOME/.ssh/siteground_eyetripvr"
REMOTE_PATH="public_html"
LOCAL_PATH="/Users/dulce303/eyetrip-360-webxr/public_html"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if SSH key exists
if [ ! -f "$SSH_KEY" ]; then
    echo -e "${RED}❌ SSH key not found: $SSH_KEY${NC}"
    echo "Please set up your SSH key first."
    exit 1
fi

echo -e "${YELLOW}📋 Deployment Checklist:${NC}"
echo "  ✓ SSH Host: $SSH_HOST"
echo "  ✓ Remote Path: ~/$REMOTE_PATH"
echo "  ✓ Local Path: $LOCAL_PATH"
echo ""

# Function to upload files
upload_files() {
    local source=$1
    local dest=$2
    local description=$3
    
    echo -e "${YELLOW}📤 Uploading: $description${NC}"
    
    scp -i "$SSH_KEY" -P "$SSH_PORT" -r "$source" "$SSH_USER@$SSH_HOST:$dest"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Success: $description uploaded${NC}"
        return 0
    else
        echo -e "${RED}❌ Failed: $description upload failed${NC}"
        return 1
    fi
}

# Function to run remote command
run_remote() {
    local command=$1
    ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "$command"
}

# Confirm deployment
echo -e "${YELLOW}⚠️  This will upload optimized videos and code to the live server.${NC}"
read -p "Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 0
fi

echo ""
echo "🚀 Starting deployment..."
echo ""

# Step 1: Upload .htaccess
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 1: Uploading .htaccess configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
upload_files "$LOCAL_PATH/.htaccess" "$REMOTE_PATH/" ".htaccess file"

# Step 2: Upload processed videos
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 2: Uploading processed videos"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if processed videos exist
if [ ! -d "$LOCAL_PATH/assets/videos/processed" ]; then
    echo -e "${RED}❌ Processed videos directory not found!${NC}"
    echo "Please run ./process-all-videos.sh first."
    exit 1
fi

# Create remote directory structure
echo "Creating remote directory structure..."
run_remote "mkdir -p $REMOTE_PATH/assets/videos/processed"

# Upload each processed video folder
for video_folder in "$LOCAL_PATH/assets/videos/processed"/*; do
    if [ -d "$video_folder" ]; then
        folder_name=$(basename "$video_folder")
        echo ""
        echo "📹 Uploading: $folder_name"
        upload_files "$video_folder" "$REMOTE_PATH/assets/videos/processed/" "$folder_name"
    fi
done

# Step 3: Upload updated JavaScript modules
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 3: Uploading JavaScript modules"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

run_remote "mkdir -p $REMOTE_PATH/js/modules"
run_remote "mkdir -p $REMOTE_PATH/js/utils"

upload_files "$LOCAL_PATH/js/modules/VideoStreamManager.js" "$REMOTE_PATH/js/modules/" "VideoStreamManager.js"
upload_files "$LOCAL_PATH/js/utils/videoGalleryConfig.js" "$REMOTE_PATH/js/utils/" "videoGalleryConfig.js"

# Step 4: Verify deployment
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 4: Verifying deployment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "Checking remote files..."
run_remote "ls -lah $REMOTE_PATH/assets/videos/processed/"

# Check .htaccess
if run_remote "[ -f $REMOTE_PATH/.htaccess ] && echo 'exists'" | grep -q "exists"; then
    echo -e "${GREEN}✅ .htaccess file verified${NC}"
else
    echo -e "${RED}❌ .htaccess file missing${NC}"
fi

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Deployment Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🌐 Your site: https://eyetripvr.com"
echo ""
echo "Next steps:"
echo "  1. Test video playback at https://eyetripvr.com"
echo "  2. Check browser console for any errors"
echo "  3. Test in VR headset"
echo "  4. Monitor server bandwidth"
echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
