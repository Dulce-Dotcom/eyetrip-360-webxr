#!/bin/bash

# Deploy all hotspot-related files to server
echo "🚀 Deploying hotspot system files..."

SSH_KEY="~/.ssh/siteground_vr"
PORT="18765"
USER="u1578-zgb0uzlh1g5o"
HOST="ssh.eyetripvr.com"
REMOTE_PATH="www/eyetripvr.com/public_html"

# Deploy JavaScript modules
echo "📦 Deploying JavaScript modules..."
scp -i $SSH_KEY -P $PORT \
    js/modules/HotspotManager.js \
    js/modules/PanoramaPlayer.js \
    js/modules/WebXRHandler.js \
    $USER@$HOST:$REMOTE_PATH/js/modules/

# Deploy video gallery config
echo "📚 Deploying video config..."
scp -i $SSH_KEY -P $PORT \
    js/utils/videoGalleryConfig.js \
    $USER@$HOST:$REMOTE_PATH/js/utils/

# Deploy CSS
echo "🎨 Deploying CSS..."
scp -i $SSH_KEY -P $PORT \
    css/app.css \
    $USER@$HOST:$REMOTE_PATH/css/

echo "✅ Deployment complete!"
echo ""
echo "🎯 ALL QA FIXES DEPLOYED:"
echo "  ✅ Discovery counter updates correctly"
echo "  ✅ iOS/Safari video support with unmute button"
echo "  ✅ First-time tutorial overlay"
echo "  ✅ Narrative story system (5 experiences)"
echo "  ✅ Adaptive touch controls (5x slower on mobile)"
echo "  ✅ VR controller hotspot discovery"
echo ""
echo "🔄 Hard refresh your browser (Cmd+Shift+R) to see changes"
echo "🔍 Test on: Desktop, iOS Safari, Android Chrome, Meta Quest"
