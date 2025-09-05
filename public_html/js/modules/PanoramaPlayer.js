// --- Three.js WebXR VR Panorama Player ---
// Refactored for official VRButton usage and best practices
import * as THREE from 'https://unpkg.com/three@0.153.0/build/three.module.js';
import { VRButton } from '../vendor/VRButton.js';
import { XRControllerModelFactory } from '../vendor/XRControllerModelFactory.js';

export class PanoramaPlayer {
    // Play video by index (always reloads, even if same)
    playVideoByIndex(idx) {
        if (!this.videosList || idx < 0 || idx >= this.videosList.length) return;
        this.currentVideoIndex = idx;
        this.loadVideo(this.videosList[idx]);
    }
    constructor(container) {
    this.container = container;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.sphere = null;
    this.video = null;
    this.texture = null;
    this.lastVRMode = false; // Track VR mode changes
    this.texture = null;
    this.isPlaying = false;
    // Camera controls
    this.lon = 0;
    this.lat = 0;
    this.phi = 0;
    this.theta = 0;
    this.distance = 0.5;
    this.controllers = [];
    this.controllerGrips = [];
    this.controllerModels = [];
    this.controllerRays = [];
    window.panoramaPlayer = this; // Ensure global access
    this.init();
    }

    // Initialize Three.js scene, camera, renderer, and VRButton
    init() {
        if (!this.container) throw new Error('Container element is required');
        // Video playlist (up to 4 videos)
        this.videosList = [
            '/assets/videos/stumpy_rect_2_1_4ktest_isVR.mp4',
            // Add more video paths here as needed
        ];
        this.currentVideoIndex = 0;
        this.setupScene();
        this.setupCamera();
        this.setupRenderer();
        this.createSphere();
        this.setupEventListeners();
        // Add VRButton for WebXR entry, place in controls bar
        const controlsBar = document.getElementById('controls');
        if (controlsBar) {
            const vrBtn = VRButton.createButton(this.renderer);
            vrBtn.style.position = 'static';
            vrBtn.style.marginLeft = '8px';
            vrBtn.style.width = 'auto';
            vrBtn.style.left = '';
            vrBtn.style.bottom = '';
            controlsBar.appendChild(vrBtn);
        } else {
            document.body.appendChild(VRButton.createButton(this.renderer));
        }

        // Setup VR controllers
        this.setupControllers();
    }

    // Create Three.js scene
    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);
    }

    // Create camera at sphere center
    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.25, 10);
    }

    // Create renderer and enable WebXR
    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.xr.enabled = true;
        this.container.appendChild(this.renderer.domElement);
        this.renderer.setAnimationLoop(this.animate.bind(this));
    }

    // Create sphere and apply video texture (or fallback)
    createSphere() {
        const geometry = new THREE.SphereGeometry(5, 60, 40);
        let material;
        if (this.texture) {
            material = new THREE.MeshBasicMaterial({ map: this.texture, side: THREE.BackSide });
        } else {
            material = new THREE.MeshBasicMaterial({ color: 0x0000ff, side: THREE.BackSide });
        }
        this.sphere = new THREE.Mesh(geometry, material);
        this.scene.add(this.sphere);
    }

    // Load video and create texture
    async loadVideo(url) {
        return new Promise((resolve, reject) => {
            // Remove previous video element if it exists
            if (this.video && this.video instanceof HTMLVideoElement) {
                this.video.pause();
                this.video.src = '';
                this.video.removeAttribute('src');
                this.video.load();
                if (this.video.parentNode) {
                    this.video.parentNode.removeChild(this.video);
                }
                this.video = null;
            }
            // Create new video element
            this.video = document.createElement('video');
            document.body.appendChild(this.video);
            // Always set video properties before use
            this.video.crossOrigin = 'anonymous';
            this.video.loop = false;
            this.video.muted = false; // Ensure audio is not muted by default
            this.video.setAttribute('playsinline', '');
            this.video.style.display = 'none';
            console.log('[DEBUG] loadVideo called with:', url);
            this.video.src = url;
            this.video.load();
            // Force play after load
            this.video.play().then(() => {
                console.log('[DEBUG] video.play() succeeded');
            }).catch((err) => {
                console.warn('[DEBUG] video.play() failed:', err);
            });
            // Show progress bar
            const progressBar = document.getElementById('videoProgressBar');
            const progressFill = document.getElementById('videoProgress');
            if (progressBar && progressFill) {
                progressBar.style.display = 'block';
                progressFill.style.width = '0';
            }
            // Listen for progress events
            this.video.addEventListener('progress', () => {
                if (this.video.buffered.length > 0 && this.video.duration > 0) {
                    const bufferedEnd = this.video.buffered.end(this.video.buffered.length - 1);
                    const percent = Math.min(100, Math.round((bufferedEnd / this.video.duration) * 100));
                    if (progressFill) progressFill.style.width = percent + '%';
                    console.log('[Video Progress Event] percent:', percent);
                }
            });
            // Fallback: if loadeddata fires before any progress, set bar to 100%
            this.video.addEventListener('loadeddata', () => {
                console.log('[DEBUG] loadeddata fired, video duration:', this.video.duration, 'currentTime:', this.video.currentTime, 'video:', this.video);
                console.log('[DEBUG] video.muted:', this.video.muted, 'video.volume:', this.video.volume);
                if (progressBar && progressFill) {
                    progressFill.style.width = '100%';
                    setTimeout(() => { progressBar.style.display = 'none'; }, 400);
                }
                this.texture = new THREE.VideoTexture(this.video);
                this.texture.minFilter = THREE.LinearFilter;
                this.texture.magFilter = THREE.LinearFilter;
                if (this.sphere && this.sphere.material) {
                    this.sphere.material.map = this.texture;
                    this.sphere.material.color.set(0xffffff);
                    this.sphere.material.needsUpdate = true;
                }
                // Set initial camera orientation to look at the center
                this.lon = 0;
                this.lat = 0;
                // Try to play again in case autoplay was blocked
                this.video.play().then(() => {
                    console.log('[DEBUG] video.play() after loadeddata succeeded');
                }).catch((err) => {
                    console.warn('[DEBUG] video.play() after loadeddata failed:', err);
                });
                // Dispatch custom event for main video ready
                window.dispatchEvent(new Event('mainVideoReady'));
                resolve();
            });
            this.video.addEventListener('error', (e) => {
                console.error('[DEBUG] video error:', e);
                if (progressBar) progressBar.style.display = 'none';
                reject(e);
            });
        });
    }

    // Animation loop: update camera, handle XR controllers
    animate() {
        if (!this.camera) return;
        
        // Simple VR mode detection
        const isVRMode = this.renderer.xr.isPresenting;
        
        // Handle UI visibility
        if (isVRMode !== this.lastVRMode) {
            console.log('🔄 [VR] Mode changed to:', isVRMode ? 'VR' : 'Desktop');
            this.handleVRTransition(isVRMode);
            this.lastVRMode = isVRMode;
        }
        
        // Clamp latitude
        this.lat = Math.max(-85, Math.min(85, this.lat));
        let renderLon = this.lon;
        
        if (isVRMode) {
            renderLon = -this.lon; // Invert for VR mode
            this.handleVRControllers();
        }
        // Debug: log lon/lat before lookAt calculation
        if (isVRMode && (this.lon !== 0 || this.lat !== 0)) {
            console.log('[VR Camera] lon:', this.lon.toFixed(1), 'lat:', this.lat.toFixed(1), 'renderLon:', renderLon.toFixed(1));
        }
        // Camera fixed at sphere center for 360° video
        this.camera.position.set(0, 0, 0);
        
        if (isVRMode) {
            // In VR mode, rotate the video sphere instead of the camera
            // because WebXR controls the camera based on head tracking
            if (this.sphere) {
                // Convert lon/lat to sphere rotation
                // Invert rotations to match expected behavior
                this.sphere.rotation.y = THREE.MathUtils.degToRad(-this.lon);
                this.sphere.rotation.x = THREE.MathUtils.degToRad(this.lat);
                
                if (this.lon !== 0 || this.lat !== 0) {
                    console.log('[VR Sphere] rotY:', (-this.lon).toFixed(1) + '°', 'rotX:', this.lat.toFixed(1) + '°');
                }
            }
        } else {
            // Non-VR mode: use traditional camera lookAt
            const phi = THREE.MathUtils.degToRad(90 - this.lat);
            const theta = THREE.MathUtils.degToRad(renderLon);
            const radius = 1;
            // Swap x and z axes to match Three.js coordinate system
            const x = radius * Math.sin(phi) * Math.sin(theta);
            const y = radius * Math.cos(phi);
            const z = radius * Math.sin(phi) * Math.cos(theta);
            
            this.camera.lookAt(x, y, z);
        }
        
        this.camera.updateMatrixWorld(true);
        
        this.renderer.render(this.scene, this.camera);
    }

    // Handle VR mode transitions
    handleVRTransition(isVRMode) {
        console.log('🔄 [VR] Handling transition to:', isVRMode ? 'VR' : 'Desktop');
        
        // Hide/show UI elements
        const controlsUI = document.querySelector('.md-ui-layer');
        if (controlsUI) {
            controlsUI.style.display = isVRMode ? 'none' : 'block';
            console.log('� [VR] UI controls:', isVRMode ? 'hidden' : 'visible');
        }
        
        // Ensure video continues playing
        if (this.video && this.video.paused) {
            console.log('🎬 [VR] Resuming video playback...');
            this.video.play().catch(err => console.warn('🎬 [VR] Video play failed:', err));
        }
        
        // Force texture update
        if (this.texture) {
            this.texture.needsUpdate = true;
        }
        
        // Ensure sphere is properly configured
        if (this.sphere && this.sphere.material && this.texture) {
            this.sphere.material.map = this.texture;
            this.sphere.material.needsUpdate = true;
        }
        
        // Reset sphere rotation when exiting VR mode
        if (!isVRMode && this.sphere) {
            console.log('🔄 [VR] Resetting sphere rotation for desktop mode');
            this.sphere.rotation.y = 0;
            this.sphere.rotation.x = 0;
        }
    }

    // Simplified VR controller handling
    handleVRControllers() {
        const session = this.renderer.xr.getSession();
        if (!session || !session.inputSources) return;
        
        for (let i = 0; i < session.inputSources.length; i++) {
            const inputSource = session.inputSources[i];
            if (inputSource && inputSource.gamepad && inputSource.gamepad.axes) {
                const axes = inputSource.gamepad.axes;
                const deadzone = 0.2;
                
                // Try both axis mappings: [2,3] and [0,1]
                let x = 0, y = 0;
                if (axes.length >= 4 && (Math.abs(axes[2]) > deadzone || Math.abs(axes[3]) > deadzone)) {
                    x = axes[2];
                    y = axes[3];
                } else if (axes.length >= 2 && (Math.abs(axes[0]) > deadzone || Math.abs(axes[1]) > deadzone)) {
                    x = axes[0];
                    y = axes[1];
                }
                
                if (x !== 0 || y !== 0) {
                    this.lon += x * 3.0;
                    this.lat -= y * 3.0;
                    console.log('🎮 [VR] Controller movement:', {
                        x: x.toFixed(2), 
                        y: y.toFixed(2), 
                        newLon: this.lon.toFixed(1), 
                        newLat: this.lat.toFixed(1)
                    });
                }
            }
        }
    }

    // Three.js best practice: setup controllers and models
    setupControllers() {
        const controllerModelFactory = new XRControllerModelFactory();
        for (let i = 0; i < 2; i++) {
            // Get controller (target ray space)
            const controller = this.renderer.xr.getController(i);
            controller.addEventListener('selectstart', (event) => this.onSelectStart(event, i));
            controller.addEventListener('selectend', (event) => this.onSelectEnd(event, i));
            controller.addEventListener('squeezestart', (event) => this.onSqueezeStart(event, i));
            controller.addEventListener('squeezeend', (event) => this.onSqueezeEnd(event, i));
            this.addControllerRay(controller);
            this.scene.add(controller);
            this.controllers[i] = controller;

            // Get controller grip (for model)
            const controllerGrip = this.renderer.xr.getControllerGrip(i);
            const controllerModel = controllerModelFactory.createControllerModel(controllerGrip);
            controllerGrip.add(controllerModel);
            this.scene.add(controllerGrip);
            this.controllerGrips[i] = controllerGrip;
            this.controllerModels[i] = controllerModel;
        }
    }

    addControllerRay(controller) {
        const geometry = new THREE.BufferGeometry();
        geometry.setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, -1)
        ]);
        const material = new THREE.LineBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.5 });
        const line = new THREE.Line(geometry, material);
        line.name = 'ray';
        line.scale.z = 5;
        controller.add(line);
        this.controllerRays.push(line);
    }

        // Three.js best practice: setup controllers and models
    setupControllers() {
        console.log('🎮 [VR] Setting up basic VR controllers...');
        // Simplified controller setup - let Three.js handle the heavy lifting
        
        const controllerModelFactory = new XRControllerModelFactory();
        
        // Basic controller setup for triggers only
        for (let i = 0; i < 2; i++) {
            const controller = this.renderer.xr.getController(i);
            controller.addEventListener('selectstart', (event) => this.onSelectStart(event, i));
            controller.addEventListener('selectend', (event) => this.onSelectEnd(event, i));
            this.scene.add(controller);
            
            const controllerGrip = this.renderer.xr.getControllerGrip(i);
            controllerGrip.add(controllerModelFactory.createControllerModel(controllerGrip));
            this.scene.add(controllerGrip);
        }
    }

    // Event handlers for select/squeeze
    onSelectStart(event, i) {
        console.log('🎮 [VR] Select start on controller', i);
        // Safety check before accessing ray
        if (this.controllers[i]) {
            const ray = this.controllers[i].getObjectByName('ray');
            if (ray) ray.material.color.setHex(0xff0000);
        }
    }
    onSelectEnd(event, i) {
        console.log('🎮 [VR] Select end on controller', i);
        // Safety check before accessing ray
        if (this.controllers[i]) {
            const ray = this.controllers[i].getObjectByName('ray');
            if (ray) ray.material.color.setHex(0x00ff00);
        }
    }
    onSqueezeStart(event, i) {
        // Custom logic for grip button
    }
    onSqueezeEnd(event, i) {
        // Custom logic for grip button release
    }

    // Setup window resize and pointer controls (future extensibility)
    setupEventListeners() {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        // Desktop mouse/touch navigation for 360°
        let isUserInteracting = false, onPointerDownMouseX = 0, onPointerDownMouseY = 0, onPointerDownLon = 0, onPointerDownLat = 0;
        const dom = this.renderer.domElement;

        dom.addEventListener('mousedown', (event) => {
            isUserInteracting = true;
            onPointerDownMouseX = event.clientX;
            onPointerDownMouseY = event.clientY;
            onPointerDownLon = this.lon;
            onPointerDownLat = this.lat;
        });

        dom.addEventListener('mousemove', (event) => {
            if (isUserInteracting) {
                this.lon = (onPointerDownMouseX - event.clientX) * 0.1 + onPointerDownLon;
                this.lat = (event.clientY - onPointerDownMouseY) * 0.1 + onPointerDownLat;
            }
        });

        dom.addEventListener('mouseup', () => {
            isUserInteracting = false;
        });

        dom.addEventListener('mouseleave', () => {
            isUserInteracting = false;
        });

        // Touch events for mobile
        dom.addEventListener('touchstart', (event) => {
            if (event.touches.length === 1) {
                isUserInteracting = true;
                onPointerDownMouseX = event.touches[0].clientX;
                onPointerDownMouseY = event.touches[0].clientY;
                onPointerDownLon = this.lon;
                onPointerDownLat = this.lat;
            }
        });

        dom.addEventListener('touchmove', (event) => {
            if (isUserInteracting && event.touches.length === 1) {
                this.lon = (onPointerDownMouseX - event.touches[0].clientX) * 0.1 + onPointerDownLon;
                this.lat = (event.touches[0].clientY - onPointerDownMouseY) * 0.1 + onPointerDownLat;
            }
        });

        dom.addEventListener('touchend', () => {
            isUserInteracting = false;
        });
    }

    togglePlay() {
        if (this.video) {
            if (this.video.paused) {
                this.video.play();
            } else {
                this.video.pause();
            }
        }
    }

    // Mute/unmute audio for experience video
    toggleMute() {
        if (this.video) {
            this.video.muted = !this.video.muted;
            this.isMuted = this.video.muted;
        }
    }
    // Set volume for experience video
    setVolume(val) {
        if (this.video) {
            this.video.volume = val;
        }
    }

    dispose() {
        // Stop animation loop if needed
        this.isPlaying = false;
        // Remove renderer from DOM
        if (this.renderer && this.renderer.domElement && this.renderer.domElement.parentNode) {
            this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
        }
        // Dispose Three.js objects
        if (this.texture) this.texture.dispose();
        if (this.sphere && this.sphere.geometry) this.sphere.geometry.dispose();
        if (this.sphere && this.sphere.material) this.sphere.material.dispose();
        if (this.renderer) this.renderer.dispose();
        // Remove video element
        if (this.video && this.video.parentNode) {
            this.video.pause();
            this.video.src = '';
            this.video.parentNode.removeChild(this.video);
        }
        // Null references
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.sphere = null;
        this.video = null;
        this.texture = null;
    }

    update() {
        // Optionally put animation or state update logic here
    }
}
// --- End Three.js WebXR VR Panorama Player ---