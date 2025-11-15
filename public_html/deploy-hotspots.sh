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
    $USER@$HOST:$REMOTE_PATH/js/modules/

# Deploy CSS
echo "🎨 Deploying CSS..."
scp -i $SSH_KEY -P $PORT \
    css/app.css \
    $USER@$HOST:$REMOTE_PATH/css/

echo "✅ Deployment complete!"
echo ""
echo "🔄 Hard refresh your browser (Cmd+Shift+R) to see changes"
echo "🔍 Look for: '🎵 Hidden Sounds: 0/10' counter at bottom"
