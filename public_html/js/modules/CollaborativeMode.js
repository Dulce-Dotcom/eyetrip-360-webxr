import * as THREE from 'three';

/**
 * CollaborativeMode - Real-time multiplayer discovery experience
 * Share camera positions, discoveries, and compete with others
 */
export class CollaborativeMode {
    constructor(panoramaPlayer, hotspotManager, videoId) {
        this.panoramaPlayer = panoramaPlayer;
        this.hotspotManager = hotspotManager;
        this.videoId = videoId;
        
        // WebSocket connection (using public echo server for demo)
        this.socket = null;
        this.isConnected = false;
        
        // Room management
        this.roomId = `eyetrip_${videoId}_${Math.floor(Date.now() / 60000)}`; // 1min rooms
        this.playerId = this.generatePlayerId();
        this.playerName = this.generatePlayerName();
        
        // Player tracking
        this.players = new Map();
        this.playerCursors = new Map();
        
        // Stats
        this.leaderboard = [];
        
        console.log(`👥 CollaborativeMode initialized - Room: ${this.roomId}, Player: ${this.playerName}`);
    }
    
    /**
     * Connect to WebSocket server
     */
    async connect() {
        try {
            // Using public WebSocket echo server for demo
            // In production, use your own Socket.io server
            this.socket = new WebSocket('wss://echo.websocket.org');
            
            this.socket.addEventListener('open', () => {
                console.log('✅ Connected to collaborative server');
                this.isConnected = true;
                this.joinRoom();
                this.startBroadcasting();
            });
            
            this.socket.addEventListener('message', (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleMessage(data);
                } catch (e) {
                    // Echo server returns raw messages, filter our own
                }
            });
            
            this.socket.addEventListener('close', () => {
                console.log('❌ Disconnected from collaborative server');
                this.isConnected = false;
                this.cleanup();
            });
            
            this.socket.addEventListener('error', (error) => {
                console.error('❌ WebSocket error:', error);
            });
            
        } catch (error) {
            console.error('❌ Failed to connect:', error);
        }
    }
    
    /**
     * Generate unique player ID
     */
    generatePlayerId() {
        return `player_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * Generate random player name
     */
    generatePlayerName() {
        const adjectives = ['Swift', 'Bold', 'Keen', 'Bright', 'Sharp', 'Quick', 'Wise', 'Clever'];
        const nouns = ['Explorer', 'Seeker', 'Hunter', 'Finder', 'Scout', 'Wanderer', 'Tracker', 'Voyager'];
        
        const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
        const noun = nouns[Math.floor(Math.random() * nouns.length)];
        
        return `${adj} ${noun}`;
    }
    
    /**
     * Join a room
     */
    joinRoom() {
        this.send({
            type: 'join-room',
            roomId: this.roomId,
            playerId: this.playerId,
            playerName: this.playerName,
            timestamp: Date.now()
        });
        
        this.showJoinNotification();
    }
    
    /**
     * Start broadcasting camera position
     */
    startBroadcasting() {
        // Broadcast camera position every 200ms
        this.broadcastInterval = setInterval(() => {
            if (!this.isConnected || !this.panoramaPlayer) return;
            
            const cameraData = {
                type: 'camera-update',
                roomId: this.roomId,
                playerId: this.playerId,
                playerName: this.playerName,
                lon: this.panoramaPlayer.lon,
                lat: this.panoramaPlayer.lat,
                timestamp: Date.now()
            };
            
            this.send(cameraData);
        }, 200);
    }
    
    /**
     * Send message to server
     */
    send(data) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(data));
        }
    }
    
    /**
     * Handle incoming messages
     */
    handleMessage(data) {
        if (data.roomId !== this.roomId) return; // Not our room
        if (data.playerId === this.playerId) return; // Our own message
        
        switch (data.type) {
            case 'join-room':
                this.handlePlayerJoined(data);
                break;
            case 'camera-update':
                this.handleCameraUpdate(data);
                break;
            case 'hotspot-discovered':
                this.handleHotspotDiscovered(data);
                break;
            case 'leave-room':
                this.handlePlayerLeft(data);
                break;
        }
    }
    
    /**
     * Handle player joined
     */
    handlePlayerJoined(data) {
        if (!this.players.has(data.playerId)) {
            this.players.set(data.playerId, {
                name: data.playerName,
                discoveries: 0,
                joinTime: data.timestamp
            });
            
            // Create cursor for this player
            this.createPlayerCursor(data.playerId, data.playerName);
            
            // Show notification
            this.showNotification(`${data.playerName} joined the session`, '#00ff88');
            
            console.log(`👋 Player joined: ${data.playerName}`);
        }
    }
    
    /**
     * Handle camera update from other player
     */
    handleCameraUpdate(data) {
        if (!this.players.has(data.playerId)) {
            this.handlePlayerJoined(data);
        }
        
        // Update player cursor position
        this.updatePlayerCursor(data.playerId, data.lon, data.lat);
    }
    
    /**
     * Handle hotspot discovered by another player
     */
    handleHotspotDiscovered(data) {
        // Update player stats
        const player = this.players.get(data.playerId);
        if (player) {
            player.discoveries++;
            this.updateLeaderboard();
        }
        
        // Show notification
        this.showNotification(
            `${data.playerName} discovered: ${data.hotspotLabel}!`,
            '#ffd700'
        );
        
        console.log(`🎯 ${data.playerName} discovered ${data.hotspotLabel}`);
    }
    
    /**
     * Handle player left
     */
    handlePlayerLeft(data) {
        this.players.delete(data.playerId);
        this.removePlayerCursor(data.playerId);
        
        this.showNotification(`${data.playerName} left the session`, '#ff6b6b');
    }
    
    /**
     * Broadcast discovery to other players
     */
    broadcastDiscovery(hotspot) {
        this.send({
            type: 'hotspot-discovered',
            roomId: this.roomId,
            playerId: this.playerId,
            playerName: this.playerName,
            hotspotLabel: hotspot.label,
            timestamp: Date.now()
        });
        
        // Update own stats
        const myStats = this.players.get(this.playerId) || { discoveries: 0 };
        myStats.discoveries++;
        this.players.set(this.playerId, myStats);
        this.updateLeaderboard();
    }
    
    /**
     * Create 3D cursor for other player
     */
    createPlayerCursor(playerId, playerName) {
        // Create a glowing sphere cursor
        const geometry = new THREE.SphereGeometry(0.15, 16, 16);
        const material = new THREE.MeshBasicMaterial({
            color: this.getPlayerColor(playerId),
            transparent: true,
            opacity: 0.8,
            emissive: this.getPlayerColor(playerId),
            emissiveIntensity: 2
        });
        
        const cursor = new THREE.Mesh(geometry, material);
        cursor.userData = { playerId, playerName };
        
        // Add glow
        const glowGeometry = new THREE.SphereGeometry(0.25, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: this.getPlayerColor(playerId),
            transparent: true,
            opacity: 0.3,
            side: THREE.BackSide
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        cursor.add(glow);
        
        // Add text label (HTML overlay)
        this.createPlayerLabel(playerId, playerName);
        
        this.panoramaPlayer.scene.add(cursor);
        this.playerCursors.set(playerId, cursor);
        
        console.log(`🎯 Created cursor for ${playerName}`);
    }
    
    /**
     * Update player cursor position
     */
    updatePlayerCursor(playerId, lon, lat) {
        const cursor = this.playerCursors.get(playerId);
        if (!cursor) return;
        
        // Convert lon/lat to 3D position on sphere
        const phi = THREE.MathUtils.degToRad(90 - lat);
        const theta = THREE.MathUtils.degToRad(lon);
        const radius = 4.8; // Just inside our sphere
        
        cursor.position.x = radius * Math.sin(phi) * Math.cos(theta);
        cursor.position.y = radius * Math.cos(phi);
        cursor.position.z = radius * Math.sin(phi) * Math.sin(theta);
        
        // Update label position
        this.updatePlayerLabel(playerId, cursor.position);
    }
    
    /**
     * Remove player cursor
     */
    removePlayerCursor(playerId) {
        const cursor = this.playerCursors.get(playerId);
        if (cursor) {
            this.panoramaPlayer.scene.remove(cursor);
            this.playerCursors.delete(playerId);
        }
        
        // Remove label
        const label = document.getElementById(`player-label-${playerId}`);
        if (label) label.remove();
    }
    
    /**
     * Get unique color for each player
     */
    getPlayerColor(playerId) {
        // Hash playerId to HSL color
        let hash = 0;
        for (let i = 0; i < playerId.length; i++) {
            hash = playerId.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        const hue = hash % 360;
        return new THREE.Color().setHSL(hue / 360, 0.8, 0.6);
    }
    
    /**
     * Create HTML label for player
     */
    createPlayerLabel(playerId, playerName) {
        const label = document.createElement('div');
        label.id = `player-label-${playerId}`;
        label.className = 'player-label';
        label.textContent = playerName;
        label.style.cssText = `
            position: fixed;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: bold;
            pointer-events: none;
            z-index: 1000;
            backdrop-filter: blur(10px);
            border: 1px solid ${this.getPlayerColor(playerId).getStyle()};
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
        `;
        document.body.appendChild(label);
    }
    
    /**
     * Update player label position (project 3D to 2D)
     */
    updatePlayerLabel(playerId, position3D) {
        const label = document.getElementById(`player-label-${playerId}`);
        if (!label) return;
        
        // Project 3D position to 2D screen
        const vector = position3D.clone();
        vector.project(this.panoramaPlayer.camera);
        
        const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
        const y = (vector.y * -0.5 + 0.5) * window.innerHeight;
        
        // Hide if behind camera
        if (vector.z > 1) {
            label.style.display = 'none';
        } else {
            label.style.display = 'block';
            label.style.left = `${x}px`;
            label.style.top = `${y - 30}px`;
        }
    }
    
    /**
     * Update leaderboard
     */
    updateLeaderboard() {
        // Sort players by discoveries
        this.leaderboard = Array.from(this.players.entries())
            .map(([id, data]) => ({
                id,
                name: data.name,
                discoveries: data.discoveries || 0
            }))
            .sort((a, b) => b.discoveries - a.discoveries);
        
        this.displayLeaderboard();
    }
    
    /**
     * Display leaderboard UI
     */
    displayLeaderboard() {
        let board = document.getElementById('collaborative-leaderboard');
        
        if (!board) {
            board = document.createElement('div');
            board.id = 'collaborative-leaderboard';
            board.style.cssText = `
                position: fixed;
                top: 320px;
                right: 20px;
                width: 200px;
                background: rgba(0, 0, 0, 0.85);
                border: 2px solid rgba(255, 255, 255, 0.2);
                border-radius: 12px;
                padding: 15px;
                z-index: 1000;
                backdrop-filter: blur(10px);
                color: white;
                font-family: 'Roboto', sans-serif;
            `;
            document.body.appendChild(board);
        }
        
        const html = `
            <div style="font-size: 14px; font-weight: bold; margin-bottom: 10px; text-align: center; color: #ffd700;">
                🏆 Leaderboard
            </div>
            ${this.leaderboard.slice(0, 5).map((player, i) => `
                <div style="display: flex; justify-content: space-between; margin: 8px 0; padding: 6px; background: rgba(255, 255, 255, 0.05); border-radius: 6px; ${player.id === this.playerId ? 'border: 1px solid #00ff88;' : ''}">
                    <span style="font-size: 12px;">
                        ${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                        ${player.name}
                    </span>
                    <span style="font-size: 12px; font-weight: bold; color: #ffd700;">
                        ${player.discoveries}🎵
                    </span>
                </div>
            `).join('')}
        `;
        
        board.innerHTML = html;
    }
    
    /**
     * Show notification
     */
    showNotification(message, color = '#00ff88') {
        const notification = document.createElement('div');
        notification.className = 'collaborative-notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-size: 14px;
            z-index: 10000;
            border-left: 4px solid ${color};
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
            animation: slideInRight 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    /**
     * Show join notification
     */
    showJoinNotification() {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 30px;
            border-radius: 12px;
            font-size: 16px;
            font-weight: bold;
            z-index: 10000;
            box-shadow: 0 6px 30px rgba(0, 0, 0, 0.4);
            animation: bounceIn 0.5s ease-out;
        `;
        notification.innerHTML = `
            <div style="text-align: center;">
                <div style="font-size: 24px; margin-bottom: 5px;">🌐</div>
                <div>Collaborative Mode Active</div>
                <div style="font-size: 12px; opacity: 0.9; margin-top: 5px;">
                    Compete with others in real-time!
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'fadeOut 0.5s ease-in';
            setTimeout(() => notification.remove(), 500);
        }, 4000);
    }
    
    /**
     * Leave room
     */
    leave() {
        this.send({
            type: 'leave-room',
            roomId: this.roomId,
            playerId: this.playerId,
            playerName: this.playerName,
            timestamp: Date.now()
        });
        
        this.cleanup();
    }
    
    /**
     * Cleanup
     */
    cleanup() {
        if (this.broadcastInterval) {
            clearInterval(this.broadcastInterval);
        }
        
        if (this.socket) {
            this.socket.close();
        }
        
        // Remove all player cursors
        this.playerCursors.forEach((cursor, playerId) => {
            this.removePlayerCursor(playerId);
        });
        
        // Remove leaderboard
        const board = document.getElementById('collaborative-leaderboard');
        if (board) board.remove();
        
        console.log('🧹 CollaborativeMode cleaned up');
    }
}
