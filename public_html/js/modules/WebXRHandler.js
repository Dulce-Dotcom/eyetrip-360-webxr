import * as THREE from 'https://unpkg.com/three@0.153.0/build/three.module.js';

export class WebXRHandler {
    constructor(renderer) {
        this.renderer = renderer;
        this.panoramaPlayer = null; // Will be set by PanoramaPlayer
        this.xrSession = null;
        this.xrSupported = false;
        this.referenceSpace = null;
        this.controllers = [];
        this.controllerGrips = [];
        this.handModels = [];
        
        // Button state tracking for VR controllers
        this.aButtonPressed = false;
        this.bButtonPressed = false;
        
        // Meta Quest specific features
        this.supportsHandTracking = false;
        this.supportsLayers = false;
        this.isMetaQuest = false;
        
        this.checkSupport();
    }
    
    async checkSupport() {
        // Wait for polyfill to initialize if present
        await new Promise(resolve => setTimeout(resolve, 100));
        
        console.log('🔍 Checking WebXR support...');
        console.log('Navigator XR:', 'xr' in navigator);
        console.log('WebXR Polyfill:', !!window.WebXRPolyfill);
        console.log('WebXR Emulator:', !!window.WebXREmulator);
        console.log('User Agent:', navigator.userAgent);
        
        if ('xr' in navigator) {
            try {
                // First check for immersive-vr support
                this.xrSupported = await navigator.xr.isSessionSupported('immersive-vr');
                console.log('Native immersive-vr support:', this.xrSupported);
                
                // Detect Meta Quest Browser specifically
                this.isMetaQuest = this.detectMetaQuest();
                
                // Check Meta Quest specific features
                if (this.xrSupported && this.isMetaQuest) {
                    await this.checkMetaQuestFeatures();
                }
                
                // Check for WebXR Emulator or polyfill - be more specific
                if (window.WebXREmulator) {
                    console.log('🥽 WebXR Emulator extension detected');
                    this.xrSupported = true;
                } else if (window.WebXRPolyfill) {
                    console.log('📱 WebXR Polyfill detected');
                    this.xrSupported = true;
                } else if (!this.xrSupported) {
                    console.log('⚠️ No WebXR emulator or polyfill found');
                }
                
                // For development: try inline session as fallback
                if (!this.xrSupported) {
                    try {
                        this.xrSupported = await navigator.xr.isSessionSupported('inline');
                        if (this.xrSupported) {
                            console.log('WebXR inline session available - using as VR fallback');
                            this.useInlineFallback = true;
                        }
                    } catch (e) {
                        console.log('No WebXR inline session available');
                    }
                }
                
                // Force enable for development if polyfill is loaded
                if (!this.xrSupported && window.WebXRPolyfill) {
                    console.log('Enabling WebXR via polyfill');
                    this.xrSupported = true;
                }
                
                // Update UI badge with device-specific info
                this.updateUIBadge();
                
                return this.xrSupported;
            } catch (e) {
                console.error('WebXR support check failed:', e);
                this.updateUIBadge(false, 'WebXR Error');
                return false;
            }
        }
        
        console.log('❌ WebXR not available in navigator');
        // Fallback badge for no WebXR
        this.updateUIBadge(false, 'WebXR Not Available');
        return false;
    }

    detectMetaQuest() {
        const userAgent = navigator.userAgent.toLowerCase();
        const isOculusBrowser = userAgent.includes('oculusbrowser') || 
                               userAgent.includes('questbrowser') ||
                               userAgent.includes('meta quest');
        
        if (isOculusBrowser) {
            console.log('Meta Quest Browser detected');
            return true;
        }
        return false;
    }

    async checkMetaQuestFeatures() {
        try {
            // Check for hand tracking support
            this.supportsHandTracking = await navigator.xr.isSessionSupported('immersive-vr', {
                optionalFeatures: ['hand-tracking']
            });
            
            // Check for layers support (important for media playback performance)
            this.supportsLayers = await navigator.xr.isSessionSupported('immersive-vr', {
                optionalFeatures: ['layers']
            });
            
            console.log('Meta Quest features:', {
                handTracking: this.supportsHandTracking,
                layers: this.supportsLayers
            });
        } catch (e) {
            console.log('Could not check Meta Quest specific features:', e);
        }
    }

    updateUIBadge(supported = this.xrSupported, customText = null) {
        const badge = document.getElementById('webxrBadge');
        if (!badge) return;

        let text = customText;
        if (!text) {
            if (supported) {
                if (this.isMetaQuest) {
                    text = 'Meta Quest Ready';
                } else if (this.useInlineFallback) {
                    text = 'WebXR Ready (Fallback)';
                } else {
                    text = 'WebXR Ready';
                }
            } else {
                text = 'WebXR Not Supported';
            }
        }

        badge.textContent = text;
        // Remove any existing classes to prevent CSS conflicts
        badge.className = '';
        
        // Apply inline styles with !important to override any CSS
        badge.style.cssText = `
            display: block !important;
            position: fixed !important;
            bottom: 20px !important;
            left: 20px !important;
            top: auto !important;
            background: ${supported ? '#4CAF50' : '#f44336'} !important;
            color: white !important;
            padding: 4px 8px !important;
            border-radius: 4px !important;
            font-family: Arial, sans-serif !important;
            font-size: 11px !important;
            font-weight: normal !important;
            z-index: 1000 !important;
            max-width: 120px !important;
            width: auto !important;
            height: auto !important;
            text-align: center !important;
            pointer-events: none !important;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2) !important;
            margin: 0 !important;
            border: none !important;
            outline: none !important;
        `;
    }
    
    async enterVR() {
        console.log('🥽 [DEBUG] enterVR() called');
        
        if (!this.xrSupported) {
            console.error('❌ [DEBUG] WebXR not supported');
            throw new Error('WebXR not supported');
        }

        try {
            console.log('🥽 [DEBUG] Starting VR session request...');
            
            // If we're using inline fallback for development
            if (this.useInlineFallback) {
                console.log('🥽 [DEBUG] Using inline fallback');
                return this.enterInlineFallback();
            }

            // Meta Quest optimized session creation
            const sessionOptions = this.getOptimalSessionOptions();
            console.log('🥽 [DEBUG] Session options:', sessionOptions);
            
            try {
                console.log('🥽 [DEBUG] Requesting immersive-vr session...');
                this.xrSession = await navigator.xr.requestSession('immersive-vr', sessionOptions);
                console.log('✅ [DEBUG] WebXR session created successfully:', this.xrSession);
                
                console.log('🥽 [DEBUG] Calling setupXRSession...');
                await this.setupXRSession();
                console.log('✅ [DEBUG] setupXRSession completed');
                
                return this.xrSession;
                
            } catch (e) {
                console.log('❌ [DEBUG] Primary WebXR session failed:', e);
                console.log('🥽 [DEBUG] Trying fallback options...');
                
                // Try fallback with minimal options
                const fallbackOptions = {
                    requiredFeatures: [],
                    optionalFeatures: ['local', 'viewer']
                };
                
                try {
                    console.log('🥽 [DEBUG] Attempting fallback WebXR session...');
                    this.xrSession = await navigator.xr.requestSession('immersive-vr', fallbackOptions);
                    console.log('✅ [DEBUG] Fallback WebXR session created');
                    
                    console.log('🥽 [DEBUG] Calling setupXRSession (fallback)...');
                    await this.setupXRSession();
                    return this.xrSession;
                    
                } catch (fallbackError) {
                    console.log('❌ [DEBUG] Fallback session failed:', fallbackError);
                    console.log('🥽 [DEBUG] Activating desktop VR simulation');
                    return this.createDesktopVRFallback();
                }
            }

        } catch (error) {
            console.error('❌ [DEBUG] Failed to enter VR:', error);
            throw error;
        }
    }

    getOptimalSessionOptions() {
        const options = {
            requiredFeatures: [],
            optionalFeatures: []
        };

        // Meta Quest optimized features
        if (this.isMetaQuest) {
            // Local-floor is preferred for Meta Quest room-scale tracking
            options.optionalFeatures.push('local-floor', 'bounded-floor');
            
            // Add hand tracking if supported
            if (this.supportsHandTracking) {
                options.optionalFeatures.push('hand-tracking');
            }
            
            // Add layers for better video performance (if supported)
            if (this.supportsLayers) {
                options.optionalFeatures.push('layers');
            }
            
            // Meta Quest specific features
            options.optionalFeatures.push('viewer', 'local');
        } else {
            // Generic WebXR features for other devices
            options.optionalFeatures.push('local-floor', 'local', 'viewer', 'bounded-floor');
        }

        return options;
    }

    async setupXRSession(session = null) {
        console.log('🔧 [DEBUG] setupXRSession() started');
        
        // Use provided session or existing session
        const xrSession = session || this.xrSession;
        
        if (!xrSession) {
            console.error('❌ [DEBUG] No XR session available');
            return;
        }
        
        // Store the session reference
        this.xrSession = xrSession;

        try {
            console.log('🔧 [DEBUG] Setting up reference space...');
            // Set up reference space (prefer local-floor for Meta Quest)
            const referenceSpaceTypes = ['local-floor', 'local', 'viewer'];
            
            for (const spaceType of referenceSpaceTypes) {
                try {
                    this.referenceSpace = await this.xrSession.requestReferenceSpace(spaceType);
                    console.log(`✅ [DEBUG] Reference space created: ${spaceType}`);
                    break;
                } catch (e) {
                    console.log(`❌ [DEBUG] ${spaceType} reference space not supported:`, e);
                }
            }

            // Only configure renderer if session wasn't created by Three.js VRButton
            if (session) {
                console.log('🔧 [DEBUG] Session provided by Three.js VRButton - skipping renderer config');
            } else {
                console.log('🔧 [DEBUG] Configuring renderer for XR...');
                // Configure renderer for XR
                this.renderer.xr.setReferenceSpaceType('local-floor');
                this.renderer.xr.setSession(this.xrSession);
                console.log('✅ [DEBUG] Renderer configured for XR');
            }

            console.log('🎮 [DEBUG] Starting controller setup...');
            // CRITICAL: Set up controllers AFTER session is fully established
            this.setupVRControllers();
            
            // Track VR session start
            if (window.trackVREvent) {
                window.trackVREvent('vr_session_start', 'entered_vr', 1);
            }
            
            // Achievement: VR Pioneer (entered VR mode)
            if (window.achievements) {
                window.achievements.unlock('vr_pioneer');
            }

            console.log('👂 [DEBUG] Adding session event listeners...');
            // Listen for input source changes (when controllers connect/disconnect)
            this.xrSession.addEventListener('inputsourceschange', (event) => {
                console.log('🎮 [DEBUG] Input sources changed:', event);
                console.log('🎮 [DEBUG] Added sources:', event.added);
                console.log('🎮 [DEBUG] Removed sources:', event.removed);
                
                event.added.forEach((inputSource, i) => {
                    console.log(`🎮 [DEBUG] Controller added:`, inputSource);
                    console.log(`🎮 [DEBUG] - Target ray mode: ${inputSource.targetRayMode}`);
                    console.log(`🎮 [DEBUG] - Has gamepad: ${!!inputSource.gamepad}`);
                    console.log(`🎮 [DEBUG] - Handedness: ${inputSource.handedness}`);
                });
                event.removed.forEach((inputSource, i) => {
                    console.log(`🎮 [DEBUG] Controller removed:`, inputSource);
                });
            });

            // Session event handlers
            this.xrSession.addEventListener('end', () => {
                console.log('🔚 [DEBUG] WebXR session ended');
                
                // Track VR session end
                if (window.trackVREvent) {
                    window.trackVREvent('vr_session_end', 'exited_vr', 1);
                }
                
                this.cleanup();
            });

            this.xrSession.addEventListener('visibilitychange', (event) => {
                console.log('👁️ [DEBUG] WebXR visibility changed:', event.session.visibilityState);
            });

            console.log('🔄 [DEBUG] Starting render loop...');
            // Start render loop
            this.renderer.setAnimationLoop(() => {
                this.handleVRControllerInput();
                this.render();
            });
            
            console.log('✅ [DEBUG] VR session setup complete with proper controller handling');

            // Log current input sources
            setTimeout(() => {
                console.log('🎮 [DEBUG] Current input sources:', this.xrSession.inputSources);
                this.xrSession.inputSources.forEach((source, i) => {
                    console.log(`🎮 [DEBUG] Input source ${i}:`, {
                        targetRayMode: source.targetRayMode,
                        handedness: source.handedness,
                        hasGamepad: !!source.gamepad
                    });
                });
                
                // Auto-play video and show VR menu when entering VR
                if (this.panoramaPlayer) {
                    console.log('🎬 [VR] Auto-playing video on VR entry');
                    if (this.panoramaPlayer.video && this.panoramaPlayer.video.paused) {
                        this.panoramaPlayer.video.play().catch(err => {
                            console.error('Failed to auto-play video:', err);
                        });
                    }
                    
                    console.log('📋 [VR] Showing VR menu on entry');
                    this.panoramaPlayer.showVRMenu();
                }
            }, 1000);

        } catch (error) {
            console.error('❌ [DEBUG] Failed to set up XR session:', error);
            throw error;
        }
    }

    setupVRControllers() {
        console.log('🎮 [DEBUG] setupVRControllers() started');
        console.log('🎮 [DEBUG] Current session:', this.xrSession);
        console.log('🎮 [DEBUG] Current scene:', this.panoramaPlayer?.scene);
        
        // Clear existing controllers
        console.log('🎮 [DEBUG] Clearing existing controllers...');
        this.controllers.forEach((controller, i) => {
            console.log(`🎮 [DEBUG] Removing controller ${i} from scene`);
            if (this.panoramaPlayer?.scene) {
                this.panoramaPlayer.scene.remove(controller);
            }
        });
        this.controllers = [];
        this.controllerGrips = [];

        console.log('🎮 [DEBUG] Setting up 2 VR controllers...');
        // Set up controllers (Meta Quest supports 2 controllers)
        for (let i = 0; i < 2; i++) {
            console.log(`🎮 [DEBUG] Setting up controller ${i}...`);
            
            // Controller ray
            const controller = this.renderer.xr.getController(i);
            console.log(`🎮 [DEBUG] Got controller ${i}:`, controller);
            
            // Store controller index
            controller.userData.index = i;
            
            // Add event listeners with proper binding
            controller.addEventListener('selectstart', (event) => {
                console.log(`🎮 [DEBUG] Controller ${i} SELECT START (trigger pressed)`);
                console.log(`🎮 [DEBUG] Event:`, event);
                this.onVRControllerSelect(i, true);
            });
            
            controller.addEventListener('selectend', (event) => {
                console.log(`🎮 [DEBUG] Controller ${i} SELECT END (trigger released)`);
                this.onVRControllerSelect(i, false);
            });
            
            controller.addEventListener('connected', (event) => {
                console.log(`🎮 [DEBUG] Controller ${i} CONNECTED:`, event.data);
                const inputSource = event.data;
                controller.userData.inputSource = inputSource;
                controller.userData.handedness = inputSource.handedness; // Store handedness
                controller.userData.controllerIndex = i; // Store index
                
                console.log(`🎮 [DEBUG] Input source details:`, {
                    controllerIndex: i,
                    targetRayMode: inputSource.targetRayMode,
                    handedness: inputSource.handedness,
                    hasGamepad: !!inputSource.gamepad,
                    gamepadAxes: inputSource.gamepad?.axes?.length,
                    gamepadButtons: inputSource.gamepad?.buttons?.length
                });
                
                // Determine color based on controller index (not handedness, since WebXR mapping varies)
                // Controller 0 = LEFT = RED (0xff0000)
                // Controller 1 = RIGHT = GREEN (0x00ff00)
                const rayColor = i === 0 ? 0xff0000 : 0x00ff00;
                
                // Add visual ray to controller with appropriate color
                const ray = this.createVRControllerRay(rayColor);
                controller.add(ray);
                console.log(`🎮 [DEBUG] Added controller ${i} ray (${i === 0 ? 'LEFT/RED' : 'RIGHT/GREEN'}) color: ${rayColor.toString(16)}`);
                
                // Add controller model with appropriate color
                const controllerModel = this.createControllerModel(i);
                controller.add(controllerModel);
                console.log(`🎮 [DEBUG] Added controller model to controller ${i}`);
                
                console.log(`🎮 [DEBUG] Controller ${i} gamepad available:`, !!inputSource.gamepad);
            });

            controller.addEventListener('disconnected', () => {
                console.log(`🎮 [DEBUG] Controller ${i} DISCONNECTED`);
            });

            // Add to scene
            if (this.panoramaPlayer?.scene) {
                this.panoramaPlayer.scene.add(controller);
                console.log(`🎮 [DEBUG] Controller ${i} added to scene`);
            } else {
                console.error(`❌ [DEBUG] No scene available for controller ${i}`);
            }
            this.controllers.push(controller);

            // Controller grip for hand position
            const controllerGrip = this.renderer.xr.getControllerGrip(i);
            if (this.panoramaPlayer?.scene) {
                this.panoramaPlayer.scene.add(controllerGrip);
                console.log(`🎮 [DEBUG] Controller grip ${i} added to scene`);
            }
            this.controllerGrips.push(controllerGrip);
        }

        console.log('🎨 [DEBUG] VR menu creation moved to PanoramaPlayer (using modern VRMenu)');
        // Old menu system disabled - now using modern VRMenu in PanoramaPlayer
        // this.createVRMenu();
        
        console.log(`✅ [DEBUG] ${this.controllers.length} VR controllers set up complete`);
        
        // Expose debug function globally
        window.debugVRControllers = () => {
            console.log('🔍 [DEBUG] VR Controller Status:');
            console.log('- XR Session:', this.xrSession);
            console.log('- Controllers count:', this.controllers.length);
            console.log('- Input sources:', this.xrSession?.inputSources);
            this.controllers.forEach((controller, i) => {
                console.log(`- Controller ${i}:`, {
                    controller: controller,
                    inputSource: controller.userData.inputSource,
                    hasGamepad: !!controller.userData.inputSource?.gamepad
                });
            });
        };
    }

    createVRControllerRay(color = 0x00ff00) {
        const geometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, -5)
        ]);
        
        const material = new THREE.LineBasicMaterial({ 
            color: color,
            linewidth: 2
        });
        
        return new THREE.Line(geometry, material);
    }

    onVRControllerSelect(controllerIndex, isPressed) {
        if (isPressed) {
            console.log(`🎮 VR Controller ${controllerIndex} trigger pressed`);
            
            // Toggle VR menu
            if (this.vrMenuVisible) {
                this.hideVRMenu();
            } else {
                this.showVRMenu();
            }
        }
    }

    handleVRControllerInput() {
        if (!this.xrSession || !this.panoramaPlayer?.camera) {
            // Log occasionally why input handling is skipped
            if (Math.random() < 0.001) {
                console.log('🎮 [DEBUG] Skipping input - Session:', !!this.xrSession, 'Camera:', !!this.panoramaPlayer?.camera);
            }
            return;
        }
        
        let inputProcessed = false;
        
        // Process input from each controller
        this.controllers.forEach((controller, index) => {
            const inputSource = controller.userData.inputSource;
            if (!inputSource?.gamepad) {
                return;
            }
            
            const gamepad = inputSource.gamepad;
            const camera = this.panoramaPlayer.camera;
            
            // Handle thumbstick input for camera rotation
            if (gamepad.axes && gamepad.axes.length >= 2) {
                const xAxis = gamepad.axes[0]; // Left/right
                const yAxis = gamepad.axes[1]; // Up/down
                
                // Apply deadzone
                if (Math.abs(xAxis) > 0.2 || Math.abs(yAxis) > 0.2) {
                    inputProcessed = true;
                    const rotationSpeed = 0.02;
                    
                    // Rotate camera
                    camera.rotation.y -= xAxis * rotationSpeed;
                    camera.rotation.x -= yAxis * rotationSpeed;
                    
                    // Clamp vertical rotation
                    camera.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, camera.rotation.x));
                    
                    // Log occasionally
                    if (Math.random() < 0.02) {
                        console.log(`🎮 [DEBUG] Controller ${index} thumbstick input: ${xAxis.toFixed(2)}, ${yAxis.toFixed(2)}`);
                    }
                }
            }
            
            // Handle button presses
            if (gamepad.buttons) {
                // A button (usually index 0)
                if (gamepad.buttons[0]?.pressed && !this.aButtonPressed) {
                    this.aButtonPressed = true;
                    console.log('🎮 [DEBUG] A button pressed - calling togglePlayPause');
                    this.togglePlayPause();
                } else if (!gamepad.buttons[0]?.pressed) {
                    this.aButtonPressed = false;
                }
                
                // B button (usually index 1)
                if (gamepad.buttons[1]?.pressed && !this.bButtonPressed) {
                    this.bButtonPressed = true;
                    console.log('🎮 [DEBUG] B button pressed - calling toggleMute');
                    this.toggleMute();
                } else if (!gamepad.buttons[1]?.pressed) {
                    this.bButtonPressed = false;
                }
            }
        });
        
        // Log when we process input (occasionally to avoid spam)
        if (inputProcessed && Math.random() < 0.01) {
            console.log('🎮 [DEBUG] VR controller input processed successfully');
        }
    }

    createControllerModel(controllerIndex) {
        // Create a visible controller representation
        const group = new THREE.Group();
        
        // Determine color based on controller index: 0=LEFT=RED, 1=RIGHT=GREEN
        const handColor = controllerIndex === 0 ? 0xff0000 : 0x00ff00;
        
        // Controller body - visible box at the origin
        const bodyGeometry = new THREE.BoxGeometry(0.02, 0.02, 0.06);
        const bodyMaterial = new THREE.MeshBasicMaterial({ 
            color: handColor,
            transparent: true,
            opacity: 0.9
        });
        const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
        // Position exactly at origin (0, 0, 0) where the raycaster is
        bodyMesh.position.set(0, 0, 0);
        group.add(bodyMesh);
        
        // Small pointer dot at the end - matching hand color
        const dotGeometry = new THREE.SphereGeometry(0.02);
        const dotMaterial = new THREE.MeshBasicMaterial({ color: handColor });
        const dotMesh = new THREE.Mesh(dotGeometry, dotMaterial);
        dotMesh.position.z = -5;
        group.add(dotMesh);
        
        console.log(`🎮 Created controller model for index ${controllerIndex} with color ${handColor.toString(16)}`);
        
        return group;
    }

    onSelectStart(event) {
        console.log('🎮 Controller select start - trigger pressed');
        
        // First check for hotspot interactions
        const controller = event.target;
        const tempMatrix = new THREE.Matrix4();
        const raycaster = new THREE.Raycaster();
        
        // Get controller's world matrix
        tempMatrix.identity().extractRotation(controller.matrixWorld);
        
        // Set raycaster from controller's world position and direction
        raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
        raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
        
        console.log('🔍 [VR DEBUG] Controller raycaster:', {
            origin: raycaster.ray.origin.toArray(),
            direction: raycaster.ray.direction.toArray()
        });
        
        // Check if we're pointing at a hotspot
        if (this.panoramaPlayer?.hotspotManager?.hotspots) {
            const allHotspots = this.panoramaPlayer.hotspotManager.hotspots;
            console.log('🔍 [VR DEBUG] Total hotspots:', allHotspots.length);
            
            const activeHotspots = allHotspots.filter(h => h.active);
            console.log('🔍 [VR DEBUG] Active hotspots:', activeHotspots.length);
            
            const undiscoveredHotspots = allHotspots.filter(h => h.active && !h.discovered);
            console.log('🔍 [VR DEBUG] Undiscovered hotspots:', undiscoveredHotspots.length);
            
            const hotspotMeshes = allHotspots
                .filter(h => h.mesh && h.active && !h.discovered)
                .map(h => h.mesh);
            
            console.log('🔍 [VR DEBUG] Hotspot meshes to check:', hotspotMeshes.length);
            
            if (hotspotMeshes.length > 0) {
                console.log('🔍 [VR DEBUG] First hotspot mesh position:', hotspotMeshes[0].position.toArray());
            }
            
            const hotspotIntersects = raycaster.intersectObjects(hotspotMeshes, true);
            
            console.log('🔍 [VR DEBUG] Hotspot intersections found:', hotspotIntersects.length);
            
            if (hotspotIntersects.length > 0) {
                const intersectedMesh = hotspotIntersects[0].object;
                const hotspot = intersectedMesh.userData.hotspot;
                
                console.log('🎯 [VR DEBUG] Hotspot intersection details:', {
                    distance: hotspotIntersects[0].distance,
                    point: hotspotIntersects[0].point.toArray(),
                    hasHotspot: !!hotspot,
                    hotspotId: hotspot?.id,
                    discovered: hotspot?.discovered
                });
                
                if (hotspot && !hotspot.discovered) {
                    console.log('🎮 VR Controller discovered hotspot:', hotspot.id);
                    this.panoramaPlayer.hotspotManager.discoverHotspot(hotspot);
                    return; // Don't show menu if we discovered a hotspot
                }
            } else {
                console.log('⚠️ [VR DEBUG] No intersections found - controller may not be pointing at hotspots');
            }
        } else {
            console.error('❌ [VR DEBUG] No hotspotManager or hotspots available!');
        }
        
        // Handle VR menu interactions if no hotspot was discovered
        if (this.vrMenuVisible) {
            this.handleVRMenuInteraction(event);
        } else {
            // Show VR menu when trigger is pressed
            this.showVRMenu();
        }
    }

    onSelectEnd(event) {
        console.log('🎮 Controller select end - trigger released');
        // Handle controller button release
    }

    // Enhanced 3D VR Menu System
    createVRMenu() {
        console.log('🎨 Creating VR menu...');
        
        if (this.vrMenuGroup) {
            this.panoramaPlayer?.scene?.remove(this.vrMenuGroup);
        }

        this.vrMenuGroup = new THREE.Group();
        this.vrMenuGroup.position.set(0, 1.3, -2); // Lower to eye level for stationary viewing
        this.vrMenuVisible = false;

        // Create menu background panel (larger and more visible)
        const panelGeometry = new THREE.PlaneGeometry(4, 3);
        const panelMaterial = new THREE.MeshBasicMaterial({
            color: 0x111111,
            opacity: 0.9,
            transparent: true,
            side: THREE.DoubleSide
        });
        const menuPanel = new THREE.Mesh(panelGeometry, panelMaterial);
        this.vrMenuGroup.add(menuPanel);

        // Create menu title with bright color
        this.createVRMenuText('VR CONTROLS', 0, 1.0, 0.3, 0x00ff00);

        // Create menu buttons with better spacing
        this.vrMenuButtons = [];
        this.vrMenuButtons.push(this.createVRMenuButton('Play/Pause Video', 0, 0.4, () => this.togglePlayPause()));
        this.vrMenuButtons.push(this.createVRMenuButton('Mute/Unmute Audio', 0, 0, () => this.toggleMute()));
        this.vrMenuButtons.push(this.createVRMenuButton('Next Video', 0, -0.4, () => this.nextVideo()));
        this.vrMenuButtons.push(this.createVRMenuButton('Exit VR Mode', 0, -0.8, () => this.exitVR()));

        // Add border for visibility
        const borderGeometry = new THREE.EdgesGeometry(panelGeometry);
        const borderMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });
        const border = new THREE.LineSegments(borderGeometry, borderMaterial);
        this.vrMenuGroup.add(border);

        // Add to scene but initially hidden
        this.vrMenuGroup.visible = false;
        if (this.panoramaPlayer?.scene) {
            this.panoramaPlayer.scene.add(this.vrMenuGroup);
            console.log('✅ VR menu added to scene');
        } else {
            console.warn('❌ Scene not available for VR menu');
        }
        
        // Make menu testing function available globally
        window.testVRMenu = () => {
            console.log('🧪 Testing VR menu visibility');
            this.showVRMenu();
            setTimeout(() => this.hideVRMenu(), 3000);
        };
        
        console.log('🎨 VR menu created. Use window.testVRMenu() to test or press M key in VR');
    }

    createVRMenuText(text, x, y, size = 0.1, color = 0xffffff) {
        // Create text using basic geometry (in production, you'd use TextGeometry)
        const textGeometry = new THREE.PlaneGeometry(1, 0.2);
        const textMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true
        });
        const textMesh = new THREE.Mesh(textGeometry, textMaterial);
        textMesh.position.set(x, y, 0.01);
        
        // Store text for reference
        textMesh.userData = { text: text, isText: true };
        this.vrMenuGroup.add(textMesh);
        return textMesh;
    }

    createVRMenuButton(text, x, y, action) {
        // Button background (larger and more visible)
        const buttonGeometry = new THREE.PlaneGeometry(3, 0.4);
        const buttonMaterial = new THREE.MeshBasicMaterial({
            color: 0x333333,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide
        });
        const button = new THREE.Mesh(buttonGeometry, buttonMaterial);
        button.position.set(x, y, 0.02);
        
        // Button hover material (brighter)
        const hoverMaterial = new THREE.MeshBasicMaterial({
            color: 0x666666,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide
        });
        
        // Store button data
        button.userData = {
            isButton: true,
            label: text,
            text: text,
            action: action,
            defaultMaterial: buttonMaterial,
            hoverMaterial: hoverMaterial,
            isHovered: false
        };
        
        this.vrMenuGroup.add(button);

        // Add text label with better visibility
        const textLabel = this.createVRMenuText(text, x, y, 0.08, 0xffffff);
        textLabel.position.z = 0.03;
        
        // Add button border for better visibility
        const borderGeometry = new THREE.EdgesGeometry(buttonGeometry);
        const borderMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });
        const border = new THREE.LineSegments(borderGeometry, borderMaterial);
        border.position.set(x, y, 0.021);
        this.vrMenuGroup.add(border);
        
        return button;
    }

    showVRMenu() {
        console.log('🎨 Showing VR menu...');
        
        if (!this.vrMenuGroup) {
            console.log('🎨 VR menu not created yet, creating now...');
            this.createVRMenu();
        }
        
        this.vrMenuGroup.visible = true;
        this.vrMenuVisible = true;
        
        // Position menu in front of user's current position
        const camera = this.panoramaPlayer?.camera;
        if (camera) {
            const direction = new THREE.Vector3();
            camera.getWorldDirection(direction);
            direction.multiplyScalar(-3); // Move it further away for better visibility
            direction.add(camera.position);
            direction.y = camera.position.y - 0.2; // Lower slightly below eye level for comfort
            this.vrMenuGroup.position.copy(direction);
            this.vrMenuGroup.lookAt(camera.position);
            
            console.log('🎨 VR menu positioned at:', this.vrMenuGroup.position);
        } else {
            // Fallback position - lower for stationary viewing
            this.vrMenuGroup.position.set(0, 1.3, -3);
            console.log('🎨 VR menu at fallback position');
        }
        
        console.log('✅ VR Menu visible:', this.vrMenuGroup.visible);
        
        // Auto-hide after 10 seconds for testing
        setTimeout(() => {
            if (this.vrMenuVisible) {
                console.log('🎨 Auto-hiding VR menu after 10 seconds');
                this.hideVRMenu();
            }
        }, 10000);
    }

    hideVRMenu() {
        console.log('🎨 Hiding VR menu...');
        if (this.vrMenuGroup) {
            this.vrMenuGroup.visible = false;
            this.vrMenuVisible = false;
            console.log('✅ VR Menu hidden');
        }
    }

    handleVRMenuInteraction(event) {
        const controller = event.target;
        const tempMatrix = new THREE.Matrix4();
        const raycaster = new THREE.Raycaster();
        
        // Get controller's world matrix
        tempMatrix.identity().extractRotation(controller.matrixWorld);
        
        // Set raycaster from controller's world position and direction
        raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
        raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
        
        console.log('🎮 Raycasting from controller to menu, visible:', this.vrMenuVisible);
        
        // Check intersections with menu items
        const intersects = raycaster.intersectObject(this.vrMenuGroup, true);
        
        console.log('🎮 Menu intersections found:', intersects.length);
        
        if (intersects.length > 0) {
            const intersectedObject = intersects[0].object;
            console.log('🎮 Intersected object:', intersectedObject.userData);
            
            if (intersectedObject.userData.isButton) {
                console.log('🎮 Button clicked:', intersectedObject.userData.label);
                // Execute button action
                intersectedObject.userData.action();
                this.hideVRMenu();
            }
        }
    }

    // Update method to handle controller ray casting for hover effects
    updateControllerInteractions() {
        if (!this.vrMenuVisible || !this.vrMenuGroup) return;
        
        this.controllers.forEach(controller => {
            const direction = new THREE.Vector3();
            const raycaster = new THREE.Raycaster();
            
            controller.getWorldDirection(direction);
            raycaster.set(controller.position, direction);
            
            // Check intersections with menu items
            const intersects = raycaster.intersectObject(this.vrMenuGroup, true);
            
            // Reset all buttons to default state
            this.vrMenuGroup.children.forEach(child => {
                if (child.userData.isButton) {
                    child.material = child.userData.defaultMaterial;
                    child.userData.isHovered = false;
                }
            });
            
            // Highlight hovered button
            if (intersects.length > 0) {
                const intersectedObject = intersects[0].object;
                if (intersectedObject.userData.isButton) {
                    intersectedObject.material = intersectedObject.userData.hoverMaterial;
                    intersectedObject.userData.isHovered = true;
                }
            }
        });
    }

    // VR Menu Actions
    togglePlayPause() {
        if (this.panoramaPlayer?.video) {
            if (this.panoramaPlayer.video.paused) {
                this.panoramaPlayer.video.play();
            } else {
                this.panoramaPlayer.video.pause();
            }
        }
    }

    toggleMute() {
        if (this.panoramaPlayer?.video) {
            this.panoramaPlayer.video.muted = !this.panoramaPlayer.video.muted;
        }
    }

    nextVideo() {
        // Call scene manager to load next video
        if (window.app?.sceneManager) {
            window.app.sceneManager.nextScene();
        }
    }

    setupHandTracking() {
        if (!this.supportsHandTracking) return;
        
        console.log('Setting up hand tracking for Meta Quest');
        // Hand tracking implementation would go here
        // This requires additional Three.js hand tracking modules
    }

    render() {
        if (this.panoramaPlayer) {
            this.panoramaPlayer.update();
        }
    }

    handleControllerInput() {
        if (!this.xrSession || !this.panoramaPlayer?.camera) return;
        
        let hasInput = false;
        
        this.controllers.forEach((controller, index) => {
            const inputSource = controller.userData.inputSource;
            if (!inputSource || !inputSource.gamepad) {
                return;
            }
            
            const gamepad = inputSource.gamepad;
            const camera = this.panoramaPlayer.camera;
            
            // Log gamepad info periodically for debugging
            if (Math.random() < 0.01) { // Log ~1% of the time to avoid spam
                console.log(`Controller ${index} gamepad:`, {
                    axes: gamepad.axes.map(a => a.toFixed(2)),
                    buttons: gamepad.buttons.map(b => ({ pressed: b.pressed, value: b.value.toFixed(2) }))
                });
            }
            
            // Get thumbstick values
            let xAxis = 0;
            let yAxis = 0;
            
            if (gamepad.axes.length >= 2) {
                // Try different axis mappings for different controllers
                if (index === 1) { // Right controller
                    // Try axes 2,3 first (right thumbstick), then 0,1 as fallback
                    xAxis = gamepad.axes.length > 2 ? gamepad.axes[2] : gamepad.axes[0];
                    yAxis = gamepad.axes.length > 3 ? gamepad.axes[3] : gamepad.axes[1];
                } else { // Left controller
                    xAxis = gamepad.axes[0];
                    yAxis = gamepad.axes[1];
                }
            }
            
            // Apply rotation based on thumbstick input
            if (Math.abs(xAxis) > 0.15 || Math.abs(yAxis) > 0.15) { // Increased deadzone
                hasInput = true;
                const rotationSpeed = 0.03; // Slightly faster for better responsiveness
                
                // Rotate camera based on thumbstick input
                camera.rotation.y -= xAxis * rotationSpeed; // Horizontal rotation
                camera.rotation.x -= yAxis * rotationSpeed; // Vertical rotation
                
                // Clamp vertical rotation to prevent flipping
                camera.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, camera.rotation.x));
                
                if (Math.random() < 0.1) { // Log occasionally when there's input
                    console.log(`🎮 Controller ${index} input: x=${xAxis.toFixed(2)}, y=${yAxis.toFixed(2)}`);
                }
            }
            
            // Handle button presses
            if (gamepad.buttons.length > 0) {
                // A button (index 0) - show/hide menu
                if (gamepad.buttons[0] && gamepad.buttons[0].pressed) {
                    if (!this.aButtonPressed) {
                        this.aButtonPressed = true;
                        console.log('🎮 A button pressed - toggling VR menu');
                        if (this.vrMenuVisible) {
                            this.hideVRMenu();
                        } else {
                            this.showVRMenu();
                        }
                    }
                } else {
                    this.aButtonPressed = false;
                }
                
                // B button (index 1) - play/pause
                if (gamepad.buttons.length > 1 && gamepad.buttons[1] && gamepad.buttons[1].pressed) {
                    if (!this.bButtonPressed) {
                        this.bButtonPressed = true;
                        console.log('🎮 B button pressed - toggling play/pause');
                        this.togglePlayPause();
                    }
                } else {
                    this.bButtonPressed = false;
                }
                
                // Trigger button - menu interactions
                if (gamepad.buttons.length > 4 && gamepad.buttons[4] && gamepad.buttons[4].pressed) {
                    // This is handled by selectstart/selectend events
                }
            }
        });
        
        // Log when we detect controller activity
        if (hasInput && Math.random() < 0.05) {
            console.log('🎮 Controller input detected and applied to camera');
        }
    }

    cleanup() {
        this.xrSession = null;
        this.referenceSpace = null;
        this.renderer.xr.setSession(null);
        this.renderer.setAnimationLoop(null);
        
        // Clean up controllers
        this.controllers.forEach(controller => {
            this.panoramaPlayer?.scene?.remove(controller);
        });
        this.controllerGrips.forEach(grip => {
            this.panoramaPlayer?.scene?.remove(grip);
        });
        this.controllers = [];
        this.controllerGrips = [];
        
        // Clean up VR menu
        if (this.vrMenuGroup) {
            this.panoramaPlayer?.scene?.remove(this.vrMenuGroup);
            this.vrMenuGroup = null;
            this.vrMenuVisible = false;
        }
    }
    
    async enterInlineFallback() {
        console.log('Using WebXR inline session as VR fallback');
        try {
            this.xrSession = await navigator.xr.requestSession('inline', {
                requiredFeatures: [],
                optionalFeatures: ['local', 'bounded-floor', 'viewer']
            });
            
            // Enable VR-like experience in inline mode
            this.renderer.xr.setSession(this.xrSession);
            
            // Add mobile VR simulation
            this.addMobileVRControls();
            
            this.xrSession.addEventListener('end', () => {
                console.log('WebXR inline session ended');
                this.cleanup();
            });
            
            console.log('WebXR inline session started successfully');
            return this.xrSession;
            
        } catch (e) {
            console.error('Inline session failed:', e);
            throw e;
        }
    }

    // Add method for mobile VR controls simulation
    addMobileVRControls() {
        if (this.mobileVREnabled) return;
        this.mobileVREnabled = true;
        
        // Add device orientation controls for mobile VR simulation
        if (window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientation', (event) => {
                if (this.xrSession && this.panoramaPlayer) {
                    // Convert device orientation to camera rotation
                    const alpha = event.alpha * Math.PI / 180; // Z axis
                    const beta = event.beta * Math.PI / 180;   // X axis
                    const gamma = event.gamma * Math.PI / 180; // Y axis
                    
                    // Apply orientation to camera (simplified)
                    const camera = this.panoramaPlayer.camera;
                    if (camera) {
                        camera.rotation.set(beta, alpha, -gamma);
                    }
                }
            });
            console.log('Mobile VR device orientation controls enabled');
        }
    }
    
    // Create desktop VR simulation fallback
    createDesktopVRFallback() {
        console.log('🖥️ Starting desktop VR simulation...');
        
        // Create a fake session object for development
        const fakeSession = {
            mode: 'immersive-vr-fallback',
            addEventListener: (event, handler) => {
                if (event === 'end') {
                    this.endHandler = handler;
                }
            },
            end: () => {
                if (this.endHandler) this.endHandler();
                this.cleanup();
            }
        };
        
        this.xrSession = fakeSession;
        
        // Add keyboard controls for desktop VR simulation
        this.addKeyboardVRControls();
        
        // Show VR simulation notice
        this.showVRSimulationNotice();
        
        console.log('🎮 Desktop VR simulation ready - use WASD + mouse to explore');
        return fakeSession;
    }
    
    addKeyboardVRControls() {
        if (this.keyboardVREnabled) return;
        this.keyboardVREnabled = true;
        
        const camera = this.panoramaPlayer.camera;
        const speed = 0.05;
        
        const keys = {
            w: false, a: false, s: false, d: false,
            q: false, e: false
        };
        
        document.addEventListener('keydown', (event) => {
            if (!this.xrSession) return;
            const key = event.key.toLowerCase();
            if (key in keys) {
                keys[key] = true;
                event.preventDefault();
            }
        });
        
        document.addEventListener('keyup', (event) => {
            if (!this.xrSession) return;
            const key = event.key.toLowerCase();
            if (key in keys) {
                keys[key] = false;
                event.preventDefault();
            }
        });
        
        // Animation loop for keyboard controls
        const animate = () => {
            if (!this.xrSession || !camera) return;
            
            if (keys.w) camera.position.z -= speed;
            if (keys.s) camera.position.z += speed;
            if (keys.a) camera.position.x -= speed;
            if (keys.d) camera.position.x += speed;
            if (keys.q) camera.position.y += speed;
            if (keys.e) camera.position.y -= speed;
            
            requestAnimationFrame(animate);
        };
        animate();
        
        console.log('Keyboard VR controls enabled: WASD + Q/E + mouse');
    }

    showVRSimulationNotice() {
        // Remove any existing notices first
        const existingNotices = document.querySelectorAll('[data-vr-notice]');
        existingNotices.forEach(notice => notice.remove());

        const notice = document.createElement('div');
        notice.setAttribute('data-vr-notice', 'true');
        notice.style.cssText = `
            position: fixed;
            top: 50px;
            left: 10px;
            background: rgba(0,0,0,0.9);
            color: #fff;
            padding: 15px;
            border-radius: 8px;
            font-family: Arial, sans-serif;
            font-size: 12px;
            z-index: 1001;
            max-width: 350px;
            line-height: 1.4;
        `;
        notice.innerHTML = `
            <strong>🖥️ Desktop VR Simulation</strong><br><br>
            <strong>Controls:</strong><br>
            • WASD = Move around<br>
            • Q/E = Up/Down<br>
            • Mouse = Look around<br><br>
            <strong>For real WebXR testing:</strong><br>
            1. Install "WebXR API Emulator" extension<br>
            2. Or use Meta Quest Browser<br>
            3. Or visit on VR headset<br><br>
            <small>This notice will close automatically</small>
        `;
        
        document.body.appendChild(notice);
        
        // Remove notice after 10 seconds
        setTimeout(() => {
            if (notice.parentNode) {
                notice.parentNode.removeChild(notice);
            }
        }, 10000);
    }

    // Public method to set panorama player reference
    setPanoramaPlayer(panoramaPlayer) {
        this.panoramaPlayer = panoramaPlayer;
        console.log('WebXRHandler linked to PanoramaPlayer');
        
        // Make debug method available globally for testing
        window.checkVRControllers = () => this.checkControllerStatus();
    }

    // Exit VR session
    async exitVR() {
        if (this.xrSession) {
            try {
                if (this.xrSession.end) {
                    await this.xrSession.end();
                } else {
                    this.cleanup();
                }
            } catch (error) {
                console.error('Error exiting VR:', error);
                this.cleanup();
            }
        }
    }

    // Check if currently in VR
    isInVR() {
        return this.xrSession !== null;
    }
    
    // Debug method to check controller status
    checkControllerStatus() {
        console.log('🎮 Controller Status Check:');
        console.log(`- XR Session: ${this.xrSession ? 'Active' : 'None'}`);
        console.log(`- Controllers: ${this.controllers.length}`);
        
        this.controllers.forEach((controller, index) => {
            const inputSource = controller.userData.inputSource;
            console.log(`- Controller ${index}:`, {
                connected: !!inputSource,
                hasGamepad: !!(inputSource?.gamepad),
                axesCount: inputSource?.gamepad?.axes?.length || 0,
                buttonCount: inputSource?.gamepad?.buttons?.length || 0
            });
        });
    }
    
    exitVR() {
        if (this.xrSession) {
            this.xrSession.end();
        }
    }
    
    onSessionEnd() {
        this.xrSession = null;
        this.referenceSpace = null;
        
        const indicator = document.getElementById('vrIndicator');
        if (indicator) {
            indicator.classList.remove('active');
        }
    }
    
    isInVR() {
        return this.xrSession !== null;
    }
}
