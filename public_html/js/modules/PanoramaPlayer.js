// --- Three.js WebXR VR Panorama Player ---
// Refactored for official VRButton usage and best practices
import * as THREE from 'https://unpkg.com/three@0.153.0/build/three.module.js';
import VideoStreamManager from './VideoStreamManager.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.153.0/examples/jsm/loaders/GLTFLoader.js';
import { VRButton } from '../vendor/VRButton.js';
import VRMenu from './VRMenu.js';
import { ParticleTrailSystem } from './ParticleTrailSystem.js';

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
    this.controllerSelecting = [false, false]; // Track if controllers are selecting (clicking)
    // VR Menu properties
    this.vrMenu = null;
    this.vrMenuVisible = false;
    this.vrMenuButtons = [];
    this.hoveredButton = null;
    // Particle trail systems - one for each controller and one for mouse
    this.particleTrailSystem = null; // Desktop mouse trail
    this.vrParticleTrailSystems = []; // VR controller trails [left, right]
    this.mouseWorldPosition = new THREE.Vector3();
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.lastMouseMoveTime = 0; // Track when mouse last moved
    
    // Initialize video stream manager for adaptive quality
    this.videoManager = new VideoStreamManager();
    
    window.panoramaPlayer = this; // Ensure global access
    this.init();
    }

    // Initialize Three.js scene, camera, renderer, and VRButton
    init() {
        console.log('🎥 [PanoramaPlayer] init() called');
        if (!this.container) throw new Error('Container element is required');
        // Video playlist (up to 4 videos)
        this.videosList = [
            'assets/videos/stumpy_rect_16_9_4ktest.mp4',  // Try this one - might have audio
            'assets/videos/stumpy_sphereMap_4ktest1.mp4', // Or this one
            'assets/videos/stumpy_rect_16_9_4ktest_isVR.mp4'
        ];
        this.currentVideoIndex = 0;
        console.log('🎥 [PanoramaPlayer] Setting up scene, camera, renderer...');
        this.setupScene();
        this.setupCamera();
        this.setupRenderer();
        this.createSphere();
        this.setupEventListeners();
        
        // Add VRButton for WebXR entry - only for immersive VR devices (Meta Quest, etc.)
        this.setupVRButton();

        // Setup VR controllers
        this.setupControllers();
    }

    // Create Three.js scene
    setupScene() {
        this.scene = new THREE.Scene();
        // Iridescent gradient background (matches CSS)
        this.scene.background = new THREE.Color(0x667eea);
        
        // Add ambient light for controller models
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        this.scene.add(ambientLight);
        
        // Add directional light for better depth perception
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(0, 1, 0);
        this.scene.add(directionalLight);
        
        // Initialize particle trail system for desktop
        this.particleTrailSystem = new ParticleTrailSystem(this.scene, this.camera);
        this.particleTrailSystem.initialize().then(() => {
            console.log('🌈 Desktop particle trail system ready');
        });
        
        // Initialize VR particle trail systems for both controllers
        for (let i = 0; i < 2; i++) {
            const vrParticleSystem = new ParticleTrailSystem(this.scene, this.camera);
            vrParticleSystem.initialize().then(() => {
                console.log(`🌈 VR particle trail system ${i} ready`);
            });
            this.vrParticleTrailSystems[i] = vrParticleSystem;
        }
    }

    // Create camera at sphere center
    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 20); // Reduced near to 0.01, increased far to 20
        
        // Now that camera is ready, set up spatial audio for particle systems
        if (this.particleTrailSystem) {
            this.particleTrailSystem.camera = this.camera;
            this.particleTrailSystem.setupAudio();
        }
        
        // Set up audio for VR particle systems
        this.vrParticleTrailSystems.forEach((system, i) => {
            if (system) {
                system.camera = this.camera;
                system.setupAudio();
            }
        });
    }

    // Create renderer and enable WebXR
    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setClearColor(0x000000, 0); // Transparent background
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.xr.enabled = true;
        // Fix brightness/gamma for VR headsets (Meta Quest)
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 0.85; // Reduce brightness slightly
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.domElement.style.opacity = '0'; // Hide canvas initially
        this.renderer.domElement.style.transition = 'opacity 0.5s ease';
        this.container.appendChild(this.renderer.domElement);
        this.renderer.setAnimationLoop(this.animate.bind(this));
    }

    // Create sphere and apply video texture (or fallback)
    createSphere() {
        const geometry = new THREE.SphereGeometry(15, 60, 40); // Increased to 15 for roomier feel (far plane is 20)
        let material;
        if (this.texture) {
            material = new THREE.MeshBasicMaterial({ map: this.texture, side: THREE.BackSide });
        } else {
            // Iridescent purple instead of blue
            material = new THREE.MeshBasicMaterial({ color: 0x667eea, side: THREE.BackSide });
        }
        this.sphere = new THREE.Mesh(geometry, material);
        this.scene.add(this.sphere);
    }

    // Setup VR Button - only shows for WebXR-capable devices (Meta Quest, etc.)
    async setupVRButton() {
        // Check if WebXR is supported
        if (!navigator.xr) {
            console.log('[VR Button] WebXR not available - button will not be shown');
            return;
        }

        try {
            // Check if immersive-vr is supported
            const isSupported = await navigator.xr.isSessionSupported('immersive-vr');
            
            if (!isSupported) {
                console.log('[VR Button] Immersive VR not supported on this device');
                return;
            }

            console.log('[VR Button] WebXR immersive-vr supported - creating button');
            
            // Create VR button with Three.js VRButton helper
            const controlsBar = document.getElementById('controls');
            const vrBtn = VRButton.createButton(this.renderer);
            
            // Style the button
            vrBtn.style.position = 'static';
            vrBtn.style.marginLeft = '8px';
            vrBtn.style.width = 'auto';
            vrBtn.style.left = '';
            vrBtn.style.bottom = '';
            
            // Update button text to clarify it's for immersive VR headsets
            vrBtn.textContent = 'ENTER VR (Meta Quest)';
            vrBtn.title = 'Enter immersive VR mode - requires Meta Quest or compatible WebXR headset';
            
            // Add click logging
            vrBtn.addEventListener('click', () => {
                console.log('[VR Button] Initiating WebXR immersive-vr session');
            });
            
            if (controlsBar) {
                controlsBar.appendChild(vrBtn);
            } else {
                document.body.appendChild(vrBtn);
            }
            
        } catch (error) {
            console.error('[VR Button] Error checking WebXR support:', error);
        }
    }

    // Load video and create texture
    async loadVideo(url) {
        console.log('[DEBUG] loadVideo called with:', url);
        
        // Check if this is a processed video path
        const processedMatch = url.match(/assets\/videos\/processed\/([^\/]+)\//);
        
        if (processedMatch) {
            // Use VideoStreamManager for processed videos
            const videoName = processedMatch[1];
            console.log(`🎬 Loading processed video: ${videoName} with adaptive quality`);
            return this.loadProcessedVideo(videoName);
        } else {
            // Fall back to standard loading for non-processed videos
            console.log('📹 Loading standard video (no quality options)');
            return this.loadStandardVideo(url);
        }
    }
    
    // Load processed video using VideoStreamManager for adaptive quality
    async loadProcessedVideo(videoName) {
        return new Promise(async (resolve, reject) => {
            try {
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
                
                // Show loading overlay
                const loadingOverlay = document.getElementById('loadingOverlay');
                if (loadingOverlay) {
                    loadingOverlay.style.display = 'flex';
                    loadingOverlay.innerHTML = `
                        <div class="md-spinner"></div>
                        <div>Loading preview quality...</div>
                    `;
                }
                
                // Use VideoStreamManager to switch to this video
                // It will automatically start with preview quality and upgrade
                this.video = await this.videoManager.switchVideo(videoName);
                
                // Append video to DOM and configure for audio
                document.body.appendChild(this.video);
                this.video.style.display = 'none';
                this.video.muted = false; // Enable audio
                this.video.volume = 1.0;
                
                // Update loading overlay
                if (loadingOverlay) {
                    loadingOverlay.innerHTML = `
                        <div class="md-spinner"></div>
                        <div>Loading HD quality...</div>
                    `;
                }
                
                // Video element is created and managed by VideoStreamManager
                // We just need to create the texture and set up event handlers
                const handleLoaded = () => {
                    console.log('[DEBUG] Processed video loaded, creating texture');
                    
                    // Hide loading overlay
                    if (loadingOverlay) {
                        loadingOverlay.style.display = 'none';
                    }
                    
                    this.texture = new THREE.VideoTexture(this.video);
                    this.texture.minFilter = THREE.LinearFilter;
                    this.texture.magFilter = THREE.LinearFilter;
                    // Fix gamma/brightness for VR headsets - critical for Meta Quest
                    this.texture.colorSpace = THREE.SRGBColorSpace;
                    this.texture.encoding = THREE.sRGBEncoding;
                    
                    if (this.sphere && this.sphere.material) {
                        this.sphere.material.map = this.texture;
                        this.sphere.material.color.set(0xffffff);
                        this.sphere.material.needsUpdate = true;
                    }
                    
                    // Show canvas
                    if (this.renderer && this.renderer.domElement) {
                        this.renderer.domElement.style.opacity = '1';
                    }
                    
                    // Reset camera orientation - check for custom initial rotation
                    const initialRotation = sessionStorage.getItem('initialRotation');
                    this.lon = initialRotation ? parseFloat(initialRotation) : 0;
                    this.lat = 0;
                    
                    // Check if auto-play is requested
                    const shouldAutoPlay = sessionStorage.getItem('autoPlayVideo') === 'true';
                    
                    // Try to play (may require user interaction)
                    this.video.play().then(() => {
                        console.log('[DEBUG] Processed video auto-play succeeded');
                        if (shouldAutoPlay) {
                            this.isPlaying = true;
                        }
                    }).catch((err) => {
                        console.warn('[DEBUG] Processed video auto-play failed:', err);
                        
                        if (shouldAutoPlay) {
                            // For auto-play videos, try one more time after a brief user interaction
                            const attemptAutoPlay = () => {
                                this.video.play().then(() => {
                                    console.log('[DEBUG] Auto-play succeeded after interaction');
                                    this.isPlaying = true;
                                    // Hide play button if it's showing
                                    const playBtn = document.getElementById('playBtn');
                                    if (playBtn) playBtn.style.display = 'none';
                                }).catch(() => {
                                    // If still fails, show play button
                                    const playBtn = document.getElementById('playBtn');
                                    if (playBtn) {
                                        playBtn.classList.add('pulse-animation');
                                        playBtn.style.display = 'flex';
                                    }
                                });
                                document.removeEventListener('click', attemptAutoPlay);
                                document.removeEventListener('touchstart', attemptAutoPlay);
                            };
                            document.addEventListener('click', attemptAutoPlay, { once: true });
                            document.addEventListener('touchstart', attemptAutoPlay, { once: true });
                        } else {
                            // Show pulsing play button if auto-play fails
                            const playBtn = document.getElementById('playBtn');
                            if (playBtn) {
                                playBtn.classList.add('pulse-animation');
                                playBtn.style.display = 'flex';
                            }
                        }
                    });
                    
                    // Dispatch ready event
                    window.dispatchEvent(new Event('mainVideoReady'));
                    resolve();
                };
                
                // Check if metadata already loaded (sometimes switchVideo resolves after loadedmetadata)
                if (this.video.readyState >= 2) { // HAVE_METADATA or higher
                    handleLoaded();
                } else {
                    this.video.addEventListener('loadeddata', handleLoaded, { once: true });
                }
                
                // Add buffering indicators
                this.video.addEventListener('waiting', () => {
                    console.log('[Video] Buffering...');
                    if (loadingOverlay) {
                        loadingOverlay.style.display = 'flex';
                        loadingOverlay.innerHTML = `
                            <div class="md-spinner"></div>
                            <div>Buffering...</div>
                        `;
                    }
                });
                
                this.video.addEventListener('playing', () => {
                    console.log('[Video] Playing');
                    if (loadingOverlay) {
                        loadingOverlay.style.display = 'none';
                    }
                });
                
                this.video.addEventListener('error', (e) => {
                    console.error('[DEBUG] Processed video error:', e);
                    if (loadingOverlay) loadingOverlay.style.display = 'none';
                    reject(e);
                });
                
                // Enable adaptive quality switching based on network conditions
                this.videoManager.enableAdaptiveQuality();
                
            } catch (error) {
                console.error('Failed to load processed video:', error);
                reject(error);
            }
        });
    }

    // Load standard video (fallback for non-processed videos)
    async loadStandardVideo(url) {
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
            this.video.volume = 1.0; // Ensure full volume
            this.video.setAttribute('playsinline', '');
            this.video.style.display = 'none';
            console.log('[DEBUG] loadVideo called with:', url);
            this.video.src = url;
            this.video.load();
            // Don't auto-play - wait for user interaction
            console.log('[DEBUG] Video loaded, waiting for user interaction to play');
            // Show progress bar and loading overlay with percentage
            const progressBar = document.getElementById('videoProgressBar');
            const progressFill = document.getElementById('videoProgress');
            const loadingOverlay = document.getElementById('loadingOverlay');
            
            if (progressBar && progressFill) {
                progressBar.style.display = 'block';
                progressFill.style.width = '0';
            }
            
            // Update loading overlay to show percentage
            if (loadingOverlay) {
                loadingOverlay.style.display = 'flex';
                loadingOverlay.innerHTML = `
                    <div class="md-spinner"></div>
                    <div>Loading: <span id="loadProgress">0%</span></div>
                `;
            }
            
            // Listen for progress events
            this.video.addEventListener('progress', () => {
                if (this.video.buffered.length > 0 && this.video.duration > 0) {
                    const bufferedEnd = this.video.buffered.end(this.video.buffered.length - 1);
                    const percent = Math.min(100, Math.round((bufferedEnd / this.video.duration) * 100));
                    if (progressFill) progressFill.style.width = percent + '%';
                    
                    // Update loading overlay percentage
                    const loadProgress = document.getElementById('loadProgress');
                    if (loadProgress) loadProgress.textContent = `${percent}%`;
                    
                    console.log('[Video Progress Event] percent:', percent);
                }
            });
            
            // Show buffering indicator when video is waiting for data during playback
            this.video.addEventListener('waiting', () => {
                console.log('[Video] Buffering...');
                if (loadingOverlay) {
                    loadingOverlay.style.display = 'flex';
                    loadingOverlay.innerHTML = `
                        <div class="md-spinner"></div>
                        <div>Buffering...</div>
                    `;
                }
            });
            
            // Hide buffering indicator when video can play again
            this.video.addEventListener('canplay', () => {
                console.log('[Video] Can play');
                if (loadingOverlay && this.video.readyState >= 3) {
                    loadingOverlay.style.display = 'none';
                }
            });
            
            this.video.addEventListener('playing', () => {
                console.log('[Video] Playing');
                if (loadingOverlay) {
                    loadingOverlay.style.display = 'none';
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
                
                // Hide loading overlay when video is ready
                if (loadingOverlay) {
                    loadingOverlay.style.display = 'none';
                }
                
                this.texture = new THREE.VideoTexture(this.video);
                this.texture.minFilter = THREE.LinearFilter;
                this.texture.magFilter = THREE.LinearFilter;
                // Fix gamma/brightness for VR headsets - critical for Meta Quest
                this.texture.colorSpace = THREE.SRGBColorSpace;
                this.texture.encoding = THREE.sRGBEncoding;
                
                if (this.sphere && this.sphere.material) {
                    this.sphere.material.map = this.texture;
                    this.sphere.material.color.set(0xffffff);
                    this.sphere.material.needsUpdate = true;
                }
                // Show canvas now that video is loaded
                if (this.renderer && this.renderer.domElement) {
                    this.renderer.domElement.style.opacity = '1';
                }
                // Set initial camera orientation - check for custom initial rotation
                const initialRotation = sessionStorage.getItem('initialRotation');
                this.lon = initialRotation ? parseFloat(initialRotation) : 0;
                this.lat = 0;
                
                // Check if auto-play is requested
                const shouldAutoPlay = sessionStorage.getItem('autoPlayVideo') === 'true';
                
                // Try to play again in case autoplay was blocked
                this.video.play().then(() => {
                    console.log('[DEBUG] video.play() after loadeddata succeeded');
                    if (shouldAutoPlay) {
                        this.isPlaying = true;
                    }
                }).catch((err) => {
                    console.warn('[DEBUG] video.play() after loadeddata failed:', err);
                    
                    if (shouldAutoPlay) {
                        // For auto-play videos, try one more time after a brief user interaction
                        const attemptAutoPlay = () => {
                            this.video.play().then(() => {
                                console.log('[DEBUG] Auto-play succeeded after interaction');
                                this.isPlaying = true;
                                // Hide play button if it's showing
                                const playBtn = document.getElementById('playBtn');
                                if (playBtn) playBtn.style.display = 'none';
                            }).catch(() => {
                                // If still fails, show play button
                                const playBtn = document.getElementById('playBtn');
                                if (playBtn) {
                                    playBtn.classList.add('pulse-animation');
                                    playBtn.style.display = 'flex';
                                    console.log('[DEBUG] Auto-play failed, user interaction required');
                                }
                            });
                            document.removeEventListener('click', attemptAutoPlay);
                            document.removeEventListener('touchstart', attemptAutoPlay);
                        };
                        document.addEventListener('click', attemptAutoPlay, { once: true });
                        document.addEventListener('touchstart', attemptAutoPlay, { once: true });
                    } else {
                        // Show pulsing play button if auto-play fails
                        const playBtn = document.getElementById('playBtn');
                        if (playBtn) {
                            playBtn.classList.add('pulse-animation');
                            playBtn.style.display = 'flex';
                            console.log('[DEBUG] Auto-play failed, user interaction required');
                        }
                    }
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
            
            // Update particle trails with VR controller positions - one trail per controller
            if (this.vrParticleTrailSystems && this.controllerGrips) {
                this.controllerGrips.forEach((grip, index) => {
                    if (grip && this.vrParticleTrailSystems[index]) {
                        const worldPos = new THREE.Vector3();
                        grip.getWorldPosition(worldPos);
                        // Always update trail in VR - visibility will be handled by the particle system
                        this.vrParticleTrailSystems[index].updateTrail(worldPos, true); // Pass true for VR mode
                    }
                });
            }
            
            // Debug: Log controller positions every 60 frames (once per second at 60fps)
            if (!this.debugFrameCounter) this.debugFrameCounter = 0;
            this.debugFrameCounter++;
            if (this.debugFrameCounter % 60 === 0) {
                this.controllerGrips.forEach((grip, index) => {
                    if (grip && grip.visible) {
                        const pos = grip.position;
                        const rot = grip.rotation;
                        console.log(`🎮 Controller ${index}: pos(${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)}) rot(${(rot.x * 180/Math.PI).toFixed(0)}°, ${(rot.y * 180/Math.PI).toFixed(0)}°, ${(rot.z * 180/Math.PI).toFixed(0)}°)`);
                    }
                });
            }
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
        
        // Update VR menu if visible
        if (this.vrMenu && this.vrMenuVisible) {
            this.vrMenu.update();
            
            // Check controller intersections with menu
            this.controllers.forEach(controller => {
                if (controller) {
                    const intersectedButton = this.vrMenu.checkIntersection(controller);
                    
                    // Unhighlight previous button
                    if (this.hoveredButton && this.hoveredButton !== intersectedButton) {
                        this.vrMenu.unhighlightButton(this.hoveredButton);
                    }
                    
                    // Highlight current button
                    if (intersectedButton) {
                        this.vrMenu.highlightButton(intersectedButton);
                        this.hoveredButton = intersectedButton;
                    } else {
                        this.hoveredButton = null;
                    }
                }
            });
        }
        
        // Animate particle trails - both desktop and VR
        const isInVR = this.renderer.xr.isPresenting;
        
        if (isInVR) {
            // Animate VR particle systems
            this.vrParticleTrailSystems.forEach((system) => {
                if (system) {
                    system.animate();
                }
            });
        } else {
            // Animate desktop particle system
            if (this.particleTrailSystem) {
                this.particleTrailSystem.animate();
                
                // Update drag overlay pulse (even when not moving)
                if (this.particleTrailSystem.isDragging) {
                    this.particleTrailSystem.updateDragOverlay(this.mouseWorldPosition);
                }
                
                // Fade out trail if no movement for 200ms - slower fade (desktop mode)
                const timeSinceLastMove = Date.now() - this.lastMouseMoveTime;
                if (timeSinceLastMove > 200 && this.particleTrailSystem.isActive) {
                    this.particleTrailSystem.fadeOutTrail();
                }
            }
        }
        
        this.renderer.render(this.scene, this.camera);
    }

    // Handle VR mode transitions
    handleVRTransition(isVRMode) {
        console.log('🔄 [VR] Handling transition to:', isVRMode ? 'VR' : 'Desktop');
        
        // Show VR menu when entering VR mode
        if (isVRMode) {
            setTimeout(() => {
                this.showVRMenu();
            }, 1000); // Small delay to let VR session stabilize
        } else {
            // Hide VR menu when exiting VR
            this.hideVRMenu();
        }
        
        // Hide/show UI elements
        const controlsUI = document.querySelector('.md-ui-layer');
        if (controlsUI) {
            controlsUI.style.display = isVRMode ? 'none' : 'block';
            console.log('🎮 [VR] UI controls:', isVRMode ? 'hidden' : 'visible');
        }
        
        // DON'T auto-resume video - let user control with trigger
        
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
        const gltfLoader = new GLTFLoader();
        
        for (let i = 0; i < 2; i++) {
            // Get controller (target ray space)
            const controller = this.renderer.xr.getController(i);
            controller.addEventListener('selectstart', (event) => this.onSelectStart(event, i));
            controller.addEventListener('selectend', (event) => this.onSelectEnd(event, i));
            controller.addEventListener('squeezestart', (event) => this.onSqueezeStart(event, i));
            controller.addEventListener('squeezeend', (event) => this.onSqueezeEnd(event, i));
            this.addControllerRay(controller, i);
            this.scene.add(controller);
            this.controllers[i] = controller;

            // Get controller grip (for model)
            const controllerGrip = this.renderer.xr.getControllerGrip(i);
            
            // Load GLTF controller models
            // Controller 0 = LEFT = GREEN dot + CYAN tint (left-controller.glb)
            // Controller 1 = RIGHT = RED dot + PINK tint (right-controller.glb)
            const modelPath = i === 0 ? 'assets/models/left-controller.glb' : 'assets/models/right-controller.glb';
            const tintColor = i === 0 ? 0x00ffff : 0xffb6c1; // Cyan for left, light pink for right
            
            console.log(`🎮 Loading controller ${i} model: ${modelPath}`);
            
            gltfLoader.load(
                modelPath,
                (gltf) => {
                    console.log(`✅ Controller ${i} model loaded successfully`);
                    const model = gltf.scene;
                    
                    // Scale down the controller model to 50% of original size
                    model.scale.set(0.5, 0.5, 0.5);
                    
                    // Apply color tint to all meshes in the model
                    model.traverse((child) => {
                        if (child.isMesh) {
                            // Clone material and apply tint
                            if (child.material) {
                                child.material = child.material.clone();
                                child.material.color.set(tintColor);
                                child.material.emissive = new THREE.Color(tintColor);
                                child.material.emissiveIntensity = 0.2;
                            }
                        }
                    });
                    
                    // Add model to grip - it should be centered at origin
                    controllerGrip.add(model);
                    console.log(`🎮 Controller ${i} model added with ${i === 0 ? 'CYAN' : 'PINK'} tint at 50% scale`);
                },
                undefined,
                (error) => {
                    console.error(`❌ Error loading controller ${i} model:`, error);
                    // Fallback to simple box if model fails to load
                    const fallbackGeometry = new THREE.BoxGeometry(0.02, 0.02, 0.08);
                    const fallbackMaterial = new THREE.MeshBasicMaterial({ 
                        color: tintColor,
                        transparent: true,
                        opacity: 0.8
                    });
                    const fallbackMesh = new THREE.Mesh(fallbackGeometry, fallbackMaterial);
                    controllerGrip.add(fallbackMesh);
                    console.log(`🎮 Controller ${i} using fallback mesh`);
                }
            );
            
            this.scene.add(controllerGrip);
            this.controllerGrips[i] = controllerGrip;
            
            console.log(`🎮 Controller ${i} (${i === 0 ? 'LEFT/GREEN/CYAN' : 'RIGHT/RED/PINK'}) initialized`);
        }
    }

    addControllerRay(controller, controllerIndex) {
        const geometry = new THREE.BufferGeometry();
        geometry.setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, -1)
        ]);
        // Controller 0 = LEFT = GREEN, Controller 1 = RIGHT = RED
        const rayColor = controllerIndex === 0 ? 0x00ff00 : 0xff0000;
        const material = new THREE.LineBasicMaterial({ color: rayColor, transparent: true, opacity: 0.5 });
        const line = new THREE.Line(geometry, material);
        line.name = 'ray';
        line.scale.z = 5;
        controller.add(line);
        this.controllerRays.push(line);
    }

    // Event handlers for select/squeeze
    onSelectStart(event, i) {
        console.log('🎮 [VR] Trigger pressed on controller', i);
        
        if (this.renderer.xr.isPresenting) {
            // Don't start drag overlay in VR - we don't want click sounds, only movement sounds
            // Particles are already being generated by controller movement
            
            // If menu is visible and we're hovering a button, click it
            if (this.vrMenuVisible && this.hoveredButton) {
                console.log('🎯 [VR] Clicking menu button');
                this.vrMenu.selectButton(this.hoveredButton);
            } else {
                // Otherwise, play/pause video
                this.togglePlay();
                if (this.vrMenu) {
                    this.vrMenu.updateButtonStates();
                }
            }
        }
        
        // Visual feedback
        if (this.controllers[i]) {
            const ray = this.controllers[i].getObjectByName('ray');
            if (ray) ray.material.color.setHex(0xff0000);
        }
    }
    
    onSelectEnd(event, i) {
        console.log('🎮 [VR] Trigger released on controller', i);
        
        // Stop drag overlay on trigger release
        if (this.particleTrailSystem) {
            this.particleTrailSystem.stopDragOverlay();
        }
        
        // Visual feedback
        if (this.controllers[i]) {
            const ray = this.controllers[i].getObjectByName('ray');
            if (ray) ray.material.color.setHex(0x00ff00);
        }
    }
    
    onSqueezeStart(event, i) {
        console.log('🔥 [VR] SQUEEZE DETECTED on controller', i);
        console.log('🔥 [VR] Current menu visible state:', this.vrMenuVisible);
        // A button equivalent - toggle VR menu
        if (this.renderer.xr.isPresenting) {
            console.log('🔥 [VR] In VR mode, toggling menu...');
            this.toggleVRMenu();
        } else {
            console.log('🔥 [VR] Not in VR mode');
        }
    }
    
    onSqueezeEnd(event, i) {
        console.log('🎮 [VR] Squeeze (A button) released on controller', i);
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
            
            // Start drag overlay logo
            if (this.particleTrailSystem) {
                this.particleTrailSystem.startDragOverlay();
            }
        });

        dom.addEventListener('mousemove', (event) => {
            if (isUserInteracting) {
                // Desktop sensitivity remains at 0.1 for precise control
                this.lon = (onPointerDownMouseX - event.clientX) * 0.1 + onPointerDownLon;
                this.lat = (event.clientY - onPointerDownMouseY) * 0.1 + onPointerDownLat;
            }
            
            // Update particle trails based on mouse movement in desktop mode
            if (!this.renderer.xr.isPresenting && this.particleTrailSystem) {
                // Convert mouse position to normalized device coordinates
                this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
                this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
                
                // Raycast to get 3D position on sphere
                this.raycaster.setFromCamera(this.mouse, this.camera);
                const intersects = this.raycaster.intersectObject(this.sphere);
                
                if (intersects.length > 0) {
                    this.mouseWorldPosition.copy(intersects[0].point);
                    
                    // Always update trail on mouse move
                    this.particleTrailSystem.updateTrail(this.mouseWorldPosition);
                    this.lastMouseMoveTime = Date.now();
                    
                    // Update drag overlay position if dragging
                    if (isUserInteracting) {
                        this.particleTrailSystem.updateDragOverlay(this.mouseWorldPosition);
                    }
                }
            }
        });

        dom.addEventListener('mouseup', () => {
            isUserInteracting = false;
            
            // Stop drag overlay
            if (this.particleTrailSystem) {
                this.particleTrailSystem.stopDragOverlay();
            }
        });

        dom.addEventListener('mouseleave', () => {
            isUserInteracting = false;
            
            // Stop drag overlay
            if (this.particleTrailSystem) {
                this.particleTrailSystem.stopDragOverlay();
            }
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
                // Reduced sensitivity for mobile touch (0.3 instead of 0.1)
                this.lon = (onPointerDownMouseX - event.touches[0].clientX) * 0.3 + onPointerDownLon;
                this.lat = (event.touches[0].clientY - onPointerDownMouseY) * 0.3 + onPointerDownLat;
            }
        });

        dom.addEventListener('touchend', () => {
            isUserInteracting = false;
        });
    }

    togglePlay() {
        if (this.video) {
            if (this.video.paused) {
                // FORCE AUDIO ON
                this.video.muted = false;
                this.video.volume = 1.0;
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

    // VR Menu Methods
    createVRMenu() {
        console.log('🎮 [VR] Creating modern VR menu...');
        // Always create menu in VR mode
        if (this.vrMenu) {
            console.log('⚠️ [VR] Menu already exists, not recreating');
            return;
        }
        
        // Create new modern VR menu
        this.vrMenu = new VRMenu(this.scene, this.camera, this.video);
        this.vrMenu.show();
        this.vrMenuVisible = true;
        
        console.log('✨ [VR] Modern VR menu created');
    }
    
    showVRMenu() {
        // Always show menu in VR mode
        if (!this.vrMenu) {
            this.createVRMenu();
        } else {
            this.vrMenu.show();
            this.vrMenuVisible = true;
        }
        console.log('🎮 [VR] Menu shown');
    }
    
    hideVRMenu() {
        if (this.vrMenu) {
            this.vrMenu.hide();
            this.vrMenuVisible = false;
        }
        console.log('🎮 [VR] Menu hidden');
    }
    
    toggleVRMenu() {
        console.log('🔥 [VR] toggleVRMenu called, current state:', this.vrMenuVisible);
        
        // Always allow toggle in VR mode
        if (this.vrMenuVisible) {
            console.log('🔥 [VR] Hiding menu...');
            this.hideVRMenu();
        } else {
            console.log('🔥 [VR] Showing menu...');
            this.showVRMenu();
        }
        console.log('🔥 [VR] Menu toggled - now', this.vrMenuVisible ? 'visible' : 'hidden');
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