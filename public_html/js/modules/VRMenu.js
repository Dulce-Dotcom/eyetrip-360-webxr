import * as THREE from 'three';
import ThreeMeshUI from 'https://unpkg.com/three-mesh-ui@6.5.4/build/three-mesh-ui.module.js';

/**
 * Modern VR Menu inspired by Meta Quest OS and Shapes XR
 * Uses three-mesh-ui for beautiful, readable 3D interfaces
 */
export default class VRMenu {
    constructor(scene, camera, panoramaPlayer) {
        this.scene = scene;
        this.camera = camera;
        this.panoramaPlayer = panoramaPlayer;
        this.video = panoramaPlayer.video; // Keep video reference for compatibility
        
        this.container = null;
        this.isVisible = false;
        this.buttons = [];
        this.selectedButton = null;
        this.volumeDisplayText = null; // Store reference to volume display
        
        // Style constants inspired by Meta Quest
        this.colors = {
            background: new THREE.Color(0x1a1a2e),
            panel: new THREE.Color(0x16213e),
            primary: new THREE.Color(0x00eeff), // Electric blue
            secondary: new THREE.Color(0xcd00ff), // Magenta
            text: new THREE.Color(0xf0f8ff),
            textDim: new THREE.Color(0x8899aa),
            hover: new THREE.Color(0x2a3f5f),
            active: new THREE.Color(0x00ccdd)
        };
        
        this.createMenu();
    }
    
    createMenu() {
        console.log('🎨 Creating modern VR menu with three-mesh-ui...');
        
        // Main container - floating panel (optimized height for content)
        this.container = new ThreeMeshUI.Block({
            width: 1.4,
            height: 1.35,
            padding: 0.04,
            justifyContent: 'start',
            contentDirection: 'column',
            backgroundOpacity: 0.92,
            backgroundColor: this.colors.panel,
            borderRadius: 0.04,
            fontFamily: './fonts/Roboto-msdf.json',
            fontTexture: './fonts/Roboto-msdf.png',
        });
        
        // Position menu in front of user
        this.container.position.set(0, 1.55, -2.2);
        this.container.rotation.x = -0.15; // Slight tilt for better viewing angle
        
        // Add subtle glow effect
        const glowGeometry = new THREE.BoxGeometry(1.46, 1.41, 0.02);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: this.colors.primary,
            transparent: true,
            opacity: 0.15
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.z = -0.02;
        this.container.add(glow);
        
        // Header
        this.createHeader();
        
        // Spacer
        this.createSpacer(0.02);
        
        // Video controls section
        this.createVideoControls();
        
        // Spacer
        this.createSpacer(0.02);
        
        // Navigation section
        this.createNavigationControls();
        
        // Spacer
        this.createSpacer(0.02);
        
        // Footer hint
        this.createFooter();
        
        this.scene.add(this.container);
        this.container.visible = false;
        
        console.log('✨ Modern VR menu created successfully');
    }
    
    createHeader() {
        const header = new ThreeMeshUI.Block({
            width: 1.28,
            height: 0.14,
            justifyContent: 'center',
            backgroundOpacity: 0,
            margin: 0.01
        });
        
        const title = new ThreeMeshUI.Text({
            content: 'EyeTrip VR',
            fontSize: 0.07,
            fontColor: this.colors.primary,
        });
        
        header.add(title);
        this.container.add(header);
    }
    
    createSpacer(height) {
        const spacer = new ThreeMeshUI.Block({
            width: 1.28,
            height: height,
            backgroundOpacity: 0
        });
        this.container.add(spacer);
    }
    
    createVideoControls() {
        // Section label
        const label = this.createLabel('Video Controls');
        this.container.add(label);
        
        this.createSpacer(0.02);
        
        // Button row container
        const buttonRow = new ThreeMeshUI.Block({
            width: 1.28,
            height: 0.16,
            contentDirection: 'row',
            justifyContent: 'space-around',
            backgroundOpacity: 0,
            margin: 0.01
        });
        
        // Play/Pause button
        const playText = this.video && !this.video.paused ? 'Pause' : 'Play';
        const playButton = this.createButton(playText, 0.38, () => {
            this.onPlayPauseClick();
        }, this.colors.primary);
        buttonRow.add(playButton);
        this.buttons.push({ button: playButton, action: 'playPause' });
        
        // Mute button
        const muteText = this.video && this.video.muted ? 'Unmute' : 'Mute';
        const muteButton = this.createButton(muteText, 0.38, () => {
            this.onMuteClick();
        }, this.colors.secondary);
        buttonRow.add(muteButton);
        this.buttons.push({ button: muteButton, action: 'mute' });
        
        // Restart button
        const restartButton = this.createButton('Restart', 0.38, () => {
            this.onRestartClick();
        }, this.colors.hover);
        buttonRow.add(restartButton);
        this.buttons.push({ button: restartButton, action: 'restart' });
        
        this.container.add(buttonRow);
        
        // Volume controls
        this.createSpacer(0.02);
        const volumeRow = new ThreeMeshUI.Block({
            width: 1.28,
            height: 0.12,
            contentDirection: 'row',
            justifyContent: 'center',
            backgroundOpacity: 0,
            margin: 0.01
        });
        
        const volumeDownButton = this.createButton('Vol -', 0.28, () => {
            this.onVolumeDown();
        }, this.colors.hover);
        volumeRow.add(volumeDownButton);
        this.buttons.push({ button: volumeDownButton, action: 'volumeDown' });
        
        // Volume display
        const volumePercent = this.video ? Math.round(this.video.volume * 100) : 100;
        const volumeDisplay = new ThreeMeshUI.Block({
            width: 0.4,
            height: 0.1,
            justifyContent: 'center',
            backgroundOpacity: 0.3,
            backgroundColor: this.colors.background,
            borderRadius: 0.02,
            margin: 0.02
        });
        const volumeText = new ThreeMeshUI.Text({
            content: `${volumePercent}%`,
            fontSize: 0.05,
            fontColor: this.colors.text
        });
        volumeDisplay.add(volumeText);
        volumeRow.add(volumeDisplay);
        
        // Store reference for updates
        this.volumeDisplayText = volumeText;
        
        const volumeUpButton = this.createButton('Vol +', 0.28, () => {
            this.onVolumeUp();
        }, this.colors.hover);
        volumeRow.add(volumeUpButton);
        this.buttons.push({ button: volumeUpButton, action: 'volumeUp' });
        
        this.container.add(volumeRow);
    }
    
    createNavigationControls() {
        // Section label
        const label = this.createLabel('Navigation');
        this.container.add(label);
        
        this.createSpacer(0.02);
        
        // Navigation buttons - only Exit VR button, centered
        const navRow = new ThreeMeshUI.Block({
            width: 1.28,
            height: 0.16,
            contentDirection: 'row',
            justifyContent: 'center',
            backgroundOpacity: 0,
            margin: 0.01
        });
        
        const exitButton = this.createButton('Exit VR', 0.5, () => {
            this.onExitVRClick();
        }, this.colors.secondary);
        navRow.add(exitButton);
        this.buttons.push({ button: exitButton, action: 'exitVR' });
        
        this.container.add(navRow);
    }
    
    createLabel(text) {
        const label = new ThreeMeshUI.Block({
            width: 1.28,
            height: 0.08,
            justifyContent: 'start',
            backgroundOpacity: 0,
            margin: 0.01,
            padding: 0.01
        });
        
        const labelText = new ThreeMeshUI.Text({
            content: text,
            fontSize: 0.045,
            fontColor: this.colors.textDim
        });
        
        label.add(labelText);
        return label;
    }
    
    createFooter() {
        const footer = new ThreeMeshUI.Block({
            width: 1.28,
            height: 0.06,
            justifyContent: 'center',
            backgroundOpacity: 0,
            margin: 0.005
        });
        
        const hint = new ThreeMeshUI.Text({
            content: 'Squeeze Grip to Toggle Menu',
            fontSize: 0.03,
            fontColor: this.colors.textDim
        });
        
        footer.add(hint);
        this.container.add(footer);
    }
    
    createButton(text, width, onClick, color) {
        const button = new ThreeMeshUI.Block({
            width: width,
            height: 0.12,
            justifyContent: 'center',
            backgroundOpacity: 0.95,
            backgroundColor: color,
            borderRadius: 0.03,
            margin: 0.02,
            padding: 0.02
        });
        
        const buttonText = new ThreeMeshUI.Text({
            content: text,
            fontSize: 0.045,
            fontColor: this.colors.text
        });
        
        button.add(buttonText);
        
        // Store callback
        button.userData.onClick = onClick;
        button.userData.originalColor = color;
        button.userData.textContent = text;
        
        // Add hover state capability
        button.userData.isHovered = false;
        
        return button;
    }
    
    // Button interaction methods
    onPlayPauseClick() {
        if (this.video) {
            if (this.video.paused) {
                this.video.play();
                console.log('▶️ Video playing');
            } else {
                this.video.pause();
                console.log('⏸️ Video paused');
            }
            this.updateButtonStates();
        }
    }
    
    onMuteClick() {
        if (this.panoramaPlayer?.toggleMute) {
            this.panoramaPlayer.toggleMute();
            console.log('🎮 VRMenu: Called panoramaPlayer.toggleMute()');
        } else if (this.video) {
            // Fallback
            this.video.muted = !this.video.muted;
            console.log(this.video.muted ? '🔇 Muted' : '🔊 Unmuted');
        }
        this.updateButtonStates();
    }
    
    onRestartClick() {
        if (this.video) {
            this.video.currentTime = 0;
            this.video.play();
            console.log('🔄 Video restarted');
        }
    }
    
    onVolumeDown() {
        if (this.panoramaPlayer?.setVolume) {
            const newVolume = Math.max(0, this.video.volume - 0.1);
            this.panoramaPlayer.setVolume(newVolume);
            console.log(`🎮 VRMenu: Called panoramaPlayer.setVolume(${Math.round(newVolume * 100)}%)`);
        } else if (this.video) {
            // Fallback
            this.video.volume = Math.max(0, this.video.volume - 0.1);
            console.log(`🔉 Volume: ${Math.round(this.video.volume * 100)}%`);
        }
        this.updateButtonStates();
    }
    
    onVolumeUp() {
        if (this.panoramaPlayer?.setVolume) {
            const newVolume = Math.min(1, this.video.volume + 0.1);
            this.panoramaPlayer.setVolume(newVolume);
            console.log(`🎮 VRMenu: Called panoramaPlayer.setVolume(${Math.round(newVolume * 100)}%)`);
        } else if (this.video) {
            // Fallback
            this.video.volume = Math.min(1, this.video.volume + 0.1);
            console.log(`🔊 Volume: ${Math.round(this.video.volume * 100)}%`);
        }
        this.updateButtonStates();
    }
    
    onGalleryClick() {
        console.log('🎬 Opening gallery modal...');
        // Pause the video
        if (this.video && !this.video.paused) {
            this.video.pause();
            console.log('⏸️ Video paused for gallery');
        }
        // TODO: Show VR gallery modal with scrollable content
        // For now, navigate to gallery page
        this.showGalleryModal();
    }
    
    onAboutClick() {
        console.log('ℹ️ Opening about modal...');
        // Pause the video
        if (this.video && !this.video.paused) {
            this.video.pause();
            console.log('⏸️ Video paused for about');
        }
        // TODO: Show VR about modal with scrollable content
        // For now, navigate to about page
        this.showAboutModal();
    }
    
    showGalleryModal() {
        // Placeholder for VR gallery modal
        console.log('📋 Gallery modal would show here with scrollable experiences');
        // For now, just navigate
        if (typeof window !== 'undefined') {
            window.location.href = 'gallery.html';
        }
    }
    
    showAboutModal() {
        // Placeholder for VR about modal
        console.log('📋 About modal would show here with scrollable info');
        // For now, just navigate
        if (typeof window !== 'undefined') {
            window.location.href = 'about.html';
        }
    }
    
    onExitVRClick() {
        console.log('🚪 Exiting VR...');
        // Get the WebXR session from window.panoramaPlayer
        if (window.panoramaPlayer && window.panoramaPlayer.renderer && window.panoramaPlayer.renderer.xr) {
            const session = window.panoramaPlayer.renderer.xr.getSession();
            if (session) {
                session.end().then(() => {
                    console.log('✅ VR session ended');
                }).catch((err) => {
                    console.error('❌ Error ending VR session:', err);
                });
            }
        }
    }
    
    updateButtonStates() {
        this.buttons.forEach(({ button, action }) => {
            const textChild = button.children.find(child => child.isUI && child.content !== undefined);
            
            if (!textChild) return;
            
            let newContent = textChild.content;
            
            if (action === 'playPause') {
                newContent = this.video && !this.video.paused ? 'Pause' : 'Play';
            } else if (action === 'mute') {
                newContent = this.video && this.video.muted ? 'Unmute' : 'Mute';
            }
            
            // Update content using set() method which triggers a refresh
            if (textChild.content !== newContent) {
                textChild.set({ content: newContent });
                button.userData.textContent = newContent;
            }
        });
        
        // Update volume display - find and update it
        this.updateVolumeDisplay();
    }
    
    updateVolumeDisplay() {
        if (this.volumeDisplayText && this.video) {
            const volumePercent = Math.round(this.video.volume * 100);
            this.volumeDisplayText.set({ content: `${volumePercent}%` });
        }
    }
    
    show() {
        if (this.container) {
            this.container.visible = true;
            this.isVisible = true;
            console.log('👁️ VR Menu shown');
        }
    }
    
    hide() {
        if (this.container) {
            this.container.visible = false;
            this.isVisible = false;
            console.log('👁️ VR Menu hidden');
        }
    }
    
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }
    
    // Update method - call this in your animation loop
    update() {
        if (this.container && this.isVisible) {
            ThreeMeshUI.update();
        }
    }
    
    // Check if a controller is pointing at a button
    checkIntersection(controller) {
        if (!this.isVisible || !controller) return null;
        
        const tempMatrix = new THREE.Matrix4();
        tempMatrix.identity().extractRotation(controller.matrixWorld);
        
        const raycaster = new THREE.Raycaster();
        raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
        raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
        
        const intersects = raycaster.intersectObjects(this.container.children, true);
        
        if (intersects.length > 0) {
            const intersectedObject = intersects[0].object;
            
            // Find the button this object belongs to
            for (const { button } of this.buttons) {
                if (this.isChildOf(intersectedObject, button)) {
                    return button;
                }
            }
        }
        
        return null;
    }
    
    isChildOf(child, parent) {
        let node = child;
        while (node) {
            if (node === parent) return true;
            node = node.parent;
        }
        return false;
    }
    
    highlightButton(button) {
        if (button && button.userData.originalColor) {
            button.set({
                backgroundColor: this.colors.active,
                backgroundOpacity: 1.0
            });
        }
    }
    
    unhighlightButton(button) {
        if (button && button.userData.originalColor) {
            button.set({
                backgroundColor: button.userData.originalColor,
                backgroundOpacity: 0.95
            });
        }
    }
    
    selectButton(button) {
        if (button && button.userData.onClick) {
            console.log('🎯 Button selected:', button.userData.textContent);
            button.userData.onClick();
        }
    }
    
    dispose() {
        if (this.container) {
            this.scene.remove(this.container);
            this.container = null;
        }
        this.buttons = [];
    }
}
