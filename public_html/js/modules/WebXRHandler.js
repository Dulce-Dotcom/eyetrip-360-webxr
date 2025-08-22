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
        if (!this.xrSupported) {
            throw new Error('WebXR not supported');
        }

        try {
            // If we're using inline fallback for development
            if (this.useInlineFallback) {
                return this.enterInlineFallback();
            }

            // Meta Quest optimized session creation
            const sessionOptions = this.getOptimalSessionOptions();
            
            try {
                console.log('Attempting WebXR session with options:', sessionOptions);
                this.xrSession = await navigator.xr.requestSession('immersive-vr', sessionOptions);
                console.log('WebXR session created successfully');
                
                await this.setupXRSession();
                return this.xrSession;
                
            } catch (e) {
                console.log('Primary WebXR session unavailable (no VR hardware detected)');
                
                // Try fallback with minimal options
                const fallbackOptions = {
                    requiredFeatures: [],
                    optionalFeatures: ['local', 'viewer']
                };
                
                try {
                    console.log('Attempting fallback WebXR session...');
                    this.xrSession = await navigator.xr.requestSession('immersive-vr', fallbackOptions);
                    console.log('Fallback WebXR session created');
                    
                    await this.setupXRSession();
                    return this.xrSession;
                    
                } catch (fallbackError) {
                    console.log('WebXR hardware not available - activating desktop VR simulation');
                    return this.createDesktopVRFallback();
                }
            }

        } catch (error) {
            console.error('Failed to enter VR:', error);
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

    async setupXRSession() {
        if (!this.xrSession) return;

        try {
            // Set up reference space (prefer local-floor for Meta Quest)
            const referenceSpaceTypes = ['local-floor', 'local', 'viewer'];
            
            for (const spaceType of referenceSpaceTypes) {
                try {
                    this.referenceSpace = await this.xrSession.requestReferenceSpace(spaceType);
                    console.log(`Reference space created: ${spaceType}`);
                    break;
                } catch (e) {
                    console.log(`${spaceType} reference space not supported`);
                }
            }

            // Configure renderer for XR
            this.renderer.xr.setReferenceSpaceType('local-floor');
            this.renderer.xr.setSession(this.xrSession);

            // Set up controllers for Meta Quest
            this.setupControllers();

            // Set up hand tracking if available
            if (this.supportsHandTracking) {
                this.setupHandTracking();
            }

            // Session event handlers
            this.xrSession.addEventListener('end', () => {
                console.log('WebXR session ended');
                this.cleanup();
            });

            this.xrSession.addEventListener('visibilitychange', (event) => {
                console.log('WebXR visibility changed:', event.session.visibilityState);
            });

            // Start render loop
            this.renderer.setAnimationLoop(this.render.bind(this));

        } catch (error) {
            console.error('Failed to set up XR session:', error);
            throw error;
        }
    }

    setupControllers() {
        // Clear existing controllers
        this.controllers.forEach(controller => {
            this.panoramaPlayer?.scene?.remove(controller);
        });
        this.controllers = [];
        this.controllerGrips = [];

        // Create controllers for Meta Quest Touch controllers
        for (let i = 0; i < 2; i++) {
            // Controller (pointing ray)
            const controller = this.renderer.xr.getController(i);
            controller.addEventListener('selectstart', this.onSelectStart.bind(this));
            controller.addEventListener('selectend', this.onSelectEnd.bind(this));
            controller.addEventListener('connected', (event) => {
                console.log(`Controller ${i} connected:`, event.data);
                controller.add(this.createControllerModel(event.data));
            });
            
            if (this.panoramaPlayer?.scene) {
                this.panoramaPlayer.scene.add(controller);
            }
            this.controllers.push(controller);

            // Controller grip (for hand position)
            const controllerGrip = this.renderer.xr.getControllerGrip(i);
            controllerGrip.addEventListener('connected', (event) => {
                console.log(`Controller grip ${i} connected`);
            });
            
            if (this.panoramaPlayer?.scene) {
                this.panoramaPlayer.scene.add(controllerGrip);
            }
            this.controllerGrips.push(controllerGrip);
        }
    }

    createControllerModel(inputSource) {
        // Simple controller representation
        const geometry = new THREE.BoxGeometry(0.05, 0.05, 0.2);
        const material = new THREE.MeshBasicMaterial({ color: 0x888888 });
        const mesh = new THREE.Mesh(geometry, material);
        return mesh;
    }

    onSelectStart(event) {
        console.log('Controller select start');
        // Handle controller button press
    }

    onSelectEnd(event) {
        console.log('Controller select end');
        // Handle controller button release
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
