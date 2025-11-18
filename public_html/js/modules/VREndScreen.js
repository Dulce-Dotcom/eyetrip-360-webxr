import * as THREE from 'three';
import ThreeMeshUI from 'https://unpkg.com/three-mesh-ui@6.5.4/build/three-mesh-ui.module.js';

/**
 * VR End Screen - Shows achievements and provides restart/gallery options
 * Appears when video completes in VR mode
 */
export default class VREndScreen {
    constructor(scene, camera, panoramaPlayer) {
        this.scene = scene;
        this.camera = camera;
        this.panoramaPlayer = panoramaPlayer;
        
        this.container = null;
        this.isVisible = false;
        this.buttons = [];
        
        // Style constants matching VR Menu
        this.colors = {
            background: new THREE.Color(0x1a1a2e),
            panel: new THREE.Color(0x16213e),
            primary: new THREE.Color(0x00eeff),
            secondary: new THREE.Color(0xcd00ff),
            text: new THREE.Color(0xf0f8ff),
            textDim: new THREE.Color(0x8899aa),
            hover: new THREE.Color(0x2a3f5f),
            active: new THREE.Color(0x00ccdd),
            gold: new THREE.Color(0xFFD700)
        };
    }
    
    create() {
        console.log('🎬 Creating VR end screen with achievements...');
        
        // Remove existing if any
        if (this.container) {
            this.scene.remove(this.container);
        }
        
        // Main container - larger panel for end screen
        this.container = new ThreeMeshUI.Block({
            width: 1.6,
            height: 1.8,
            padding: 0.05,
            justifyContent: 'start',
            contentDirection: 'column',
            backgroundOpacity: 0.95,
            backgroundColor: this.colors.panel,
            borderRadius: 0.05,
            fontFamily: './fonts/Roboto-msdf.json',
            fontTexture: './fonts/Roboto-msdf.png',
        });
        
        // Position in front of camera
        this.container.position.set(0, 1.6, -2.5);
        this.container.rotation.x = -0.1;
        
        // Add glow effect
        const glowGeometry = new THREE.BoxGeometry(1.66, 1.86, 0.02);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: this.colors.primary,
            transparent: true,
            opacity: 0.2
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.z = -0.02;
        this.container.add(glow);
        
        // Header
        this.createHeader();
        
        // Spacer
        this.createSpacer(0.02);
        
        // Stats section
        this.createStats();
        
        // Spacer
        this.createSpacer(0.02);
        
        // Achievements section
        this.createAchievements();
        
        // Spacer
        this.createSpacer(0.03);
        
        // Action buttons
        this.createButtons();
        
        this.scene.add(this.container);
        this.container.visible = false;
        
        console.log('✨ VR end screen created successfully');
    }
    
    createHeader() {
        const header = new ThreeMeshUI.Block({
            width: 1.48,
            height: 0.16,
            justifyContent: 'center',
            backgroundOpacity: 0,
            margin: 0.01
        });
        
        const titleText = new ThreeMeshUI.Text({
            content: '🎉 Experience Complete 🎉',
            fontSize: 0.065,
            fontColor: this.colors.text
        });
        
        header.add(titleText);
        this.container.add(header);
    }
    
    createSpacer(height) {
        const spacer = new ThreeMeshUI.Block({
            width: 1.48,
            height: height,
            backgroundOpacity: 0
        });
        this.container.add(spacer);
    }
    
    createStats() {
        const statsBlock = new ThreeMeshUI.Block({
            width: 1.48,
            height: 0.25,
            padding: 0.02,
            justifyContent: 'center',
            contentDirection: 'column',
            backgroundOpacity: 0.3,
            backgroundColor: this.colors.background,
            borderRadius: 0.02
        });
        
        // Get hotspot stats
        const totalHotspots = this.panoramaPlayer.hotspotManager?.hotspots?.length || 0;
        const discoveredHotspots = this.panoramaPlayer.hotspotManager?.discoveredHotspots?.size || 0;
        const completionRate = totalHotspots > 0 ? Math.round((discoveredHotspots / totalHotspots) * 100) : 0;
        
        const statsText = new ThreeMeshUI.Text({
            content: `Hotspots Discovered: ${discoveredHotspots} / ${totalHotspots}\n${completionRate}% Complete`,
            fontSize: 0.05,
            fontColor: completionRate === 100 ? this.colors.gold : this.colors.text,
            textAlign: 'center'
        });
        
        statsBlock.add(statsText);
        this.container.add(statsBlock);
    }
    
    createAchievements() {
        const achievementsBlock = new ThreeMeshUI.Block({
            width: 1.48,
            height: 0.7,
            padding: 0.03,
            justifyContent: 'start',
            contentDirection: 'column',
            backgroundOpacity: 0.3,
            backgroundColor: this.colors.background,
            borderRadius: 0.02
        });
        
        // Header
        const achievementHeader = new ThreeMeshUI.Text({
            content: '🏆 Achievements',
            fontSize: 0.05,
            fontColor: this.colors.primary
        });
        achievementsBlock.add(achievementHeader);
        
        // Spacer
        const spacer1 = new ThreeMeshUI.Block({
            width: 1.4,
            height: 0.015,
            backgroundOpacity: 0
        });
        achievementsBlock.add(spacer1);
        
        // Get unlocked achievements
        const unlockedAchievements = this.getUnlockedAchievements();
        
        if (unlockedAchievements.length > 0) {
            unlockedAchievements.forEach(achievement => {
                const achievementText = new ThreeMeshUI.Text({
                    content: `${achievement.icon} ${achievement.name}`,
                    fontSize: 0.038,
                    fontColor: this.colors.text
                });
                achievementsBlock.add(achievementText);
                
                // Small spacer between achievements
                const spacer = new ThreeMeshUI.Block({
                    width: 1.4,
                    height: 0.01,
                    backgroundOpacity: 0
                });
                achievementsBlock.add(spacer);
            });
        } else {
            const noAchievements = new ThreeMeshUI.Text({
                content: 'No achievements unlocked yet',
                fontSize: 0.04,
                fontColor: this.colors.textDim
            });
            achievementsBlock.add(noAchievements);
        }
        
        this.container.add(achievementsBlock);
    }
    
    getUnlockedAchievements() {
        if (!window.achievements) return [];
        
        const unlocked = [];
        const achievementList = [
            { id: 'vr_pioneer', name: 'VR Pioneer', icon: '🥽' },
            { id: 'first_discovery', name: 'First Discovery', icon: '🎯' },
            { id: 'halfway_there', name: 'Halfway There', icon: '⭐' },
            { id: 'sound_collector', name: 'Sound Collector', icon: '🎵' },
            { id: 'completionist', name: 'Completionist', icon: '💎' }
        ];
        
        achievementList.forEach(achievement => {
            if (window.achievements.isUnlocked(achievement.id)) {
                unlocked.push(achievement);
            }
        });
        
        return unlocked;
    }
    
    createButtons() {
        const buttonsRow = new ThreeMeshUI.Block({
            width: 1.48,
            height: 0.18,
            contentDirection: 'row',
            justifyContent: 'space-around',
            backgroundOpacity: 0
        });
        
        // Restart button
        const restartButton = this.createButton('🔄 Restart', () => {
            console.log('🔄 Restarting video from end screen');
            this.hide();
            if (this.panoramaPlayer.video) {
                this.panoramaPlayer.video.currentTime = 0;
                this.panoramaPlayer.video.play();
            }
        });
        
        // Gallery button
        const galleryButton = this.createButton('🏠 Gallery', () => {
            console.log('🏠 Returning to gallery from end screen');
            window.location.href = 'gallery.html';
        });
        
        buttonsRow.add(restartButton);
        buttonsRow.add(galleryButton);
        
        this.container.add(buttonsRow);
        
        this.buttons.push(
            { button: restartButton, type: 'restart' },
            { button: galleryButton, type: 'gallery' }
        );
    }
    
    createButton(text, onClick) {
        const button = new ThreeMeshUI.Block({
            width: 0.65,
            height: 0.14,
            padding: 0.02,
            margin: 0.01,
            justifyContent: 'center',
            backgroundOpacity: 0.95,
            backgroundColor: this.colors.primary,
            borderRadius: 0.03
        });
        
        const buttonText = new ThreeMeshUI.Text({
            content: text,
            fontSize: 0.045,
            fontColor: new THREE.Color(0xffffff)
        });
        
        button.add(buttonText);
        
        // Store click handler
        button.userData.onClick = onClick;
        button.userData.originalColor = this.colors.primary;
        button.userData.textContent = text;
        
        return button;
    }
    
    show() {
        if (this.container) {
            this.container.visible = true;
            this.isVisible = true;
            console.log('✅ VR end screen shown');
        }
    }
    
    hide() {
        if (this.container) {
            this.container.visible = false;
            this.isVisible = false;
            console.log('🔒 VR end screen hidden');
        }
    }
    
    update() {
        if (this.container && this.isVisible) {
            ThreeMeshUI.update();
        }
    }
    
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
            console.log('🎯 End screen button selected:', button.userData.textContent);
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
