// --- Three.js WebXR VR Panorama Player ---
// Refactored for official VRButton usage and best practices
import * as THREE from 'three';
import { VRButton } from '../vendor/VRButton.js';
import { XRControllerModelFactory } from '../vendor/XRControllerModelFactory.js';

export class PanoramaPlayer {
    constructor(container) {
        this.container = container;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.sphere = null;
        this.video = null;
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
    this.init();
    }

    // Initialize Three.js scene, camera, renderer, and VRButton
    init() {
        if (!this.container) throw new Error('Container element is required');
        this.setupScene();
        this.setupCamera();
        this.setupRenderer();
        this.createSphere();
        this.setupEventListeners();
        // Add VRButton for WebXR entry, place in controls bar
        const controlsBar = document.getElementById('controls');
        if (controlsBar) {
            const vrBtn = VRButton.createButton(this.renderer);
            vrBtn.classList.add('md-button');
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
            if (!this.video) {
                this.video = document.createElement('video');
                this.video.crossOrigin = 'anonymous';
                this.video.loop = true;
                this.video.muted = true;
                this.video.setAttribute('playsinline', '');
                this.video.style.display = 'none';
                document.body.appendChild(this.video);
            }
            this.video.src = url;
            this.video.load();
            this.video.addEventListener('loadeddata', () => {
                this.texture = new THREE.VideoTexture(this.video);
                this.texture.minFilter = THREE.LinearFilter;
                this.texture.magFilter = THREE.LinearFilter;
                this.texture.format = THREE.RGBFormat;
                if (this.sphere && this.sphere.material) {
                    this.sphere.material.map = this.texture;
                    this.sphere.material.color.set(0xffffff);
                    this.sphere.material.needsUpdate = true;
                }
                // Set initial camera orientation to look at the front (try lon=90)
                this.lon = 96;
                this.lat = 0;
                resolve();
            });
            this.video.addEventListener('error', (e) => {
                reject(e);
            });
        });
    }

    // Animation loop: update camera, handle XR controllers
    animate() {
        if (!this.camera) return;
        // Clamp latitude
        this.lat = Math.max(-85, Math.min(85, this.lat));
        let renderLon = this.lon;
        if (this.renderer.xr.isPresenting) {
            renderLon = -this.lon;
            console.log('[VR MODE] renderLon:', renderLon, 'lat:', this.lat);
        } else {
            console.log('[DESKTOP MODE] renderLon:', renderLon, 'lat:', this.lat);
        }
        // Camera fixed at sphere center for 360° video
        this.camera.position.set(0, 0, 0);
        // Only use lookAt for orientation
        const phi = THREE.MathUtils.degToRad(90 - this.lat);
        const theta = THREE.MathUtils.degToRad(renderLon);
        const radius = 1; // camera stays at center, only rotates
        // Calculate direction vector
        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.cos(phi);
        const z = radius * Math.sin(phi) * Math.sin(theta);
        console.log('Camera lookAt:', x, y, z);
        this.camera.lookAt(x, y, z);
        this.camera.updateMatrixWorld(true);
        // Debug camera rotation
        console.log('Camera rot:', this.camera.rotation.x, this.camera.rotation.y, this.camera.rotation.z, 'lon:', this.lon, 'lat:', this.lat);
        // Handle XR controller input for rotation
        if (this.renderer.xr.isPresenting) {
            this.pollControllerThumbsticks();
        }
        this.renderer.render(this.scene, this.camera);
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

    // Poll thumbstick axes for movement
    pollControllerThumbsticks() {
    let debugText = '';
    console.log('[pollControllerThumbsticks] called, lon:', this.lon, 'lat:', this.lat);
        const session = this.renderer.xr.getSession();
        if (!session) return;
        const inputSources = session.inputSources;
        const deadzone = 0.1;
        for (let i = 0; i < inputSources.length; i++) {
            const inputSource = inputSources[i];
            if (inputSource && inputSource.gamepad && inputSource.gamepad.axes) {
                const axes = inputSource.gamepad.axes;
                const handedness = inputSource.handedness || 'unknown';
                debugText += `Controller ${i} (${handedness}): axes=[${axes.map(a => a.toFixed(2)).join(', ')}]`;
                let moved = false;
                // Use axes[2], axes[3] for movement (swap mapping)
                let x2 = Math.abs(axes[2]) > deadzone ? axes[2] : 0;
                let y2 = Math.abs(axes[3]) > deadzone ? axes[3] : 0;
                if (x2 || y2) {
                    this.lon += x2 * 8.0;
                    this.lat -= y2 * 8.0;
                    debugText += ` | stick (axes[2],[3]) used | MOVED (lon: ${this.lon.toFixed(2)}, lat=${this.lat.toFixed(2)})`;
                    moved = true;
                    console.log(`Controller ${i} (${handedness}) stick: x=${x2}, y=${y2} | Camera lon=${this.lon}, lat=${this.lat}`);
                }
                // Optionally, log left stick for debugging but do not use for movement
                let x1 = Math.abs(axes[0]) > deadzone ? axes[0] : 0;
                let y1 = Math.abs(axes[1]) > deadzone ? axes[1] : 0;
                if (x1 || y1) {
                    debugText += ` | left stick detected (x=${x1}, y=${y1})`;
                    console.log(`Controller ${i} (${handedness}) left stick: x=${x1}, y=${y1}`);
                }
                debugText += moved ? '' : ' | NO MOVEMENT';
                debugText += '\n';
            }
            // No direct manipulation of XR camera. Only update main camera's rotation.
        }
        // Show debug overlay
        const overlay = document.getElementById('debugOverlay');
        if (overlay) overlay.textContent = debugText;
    }

    // Event handlers for select/squeeze
    onSelectStart(event, i) {
        const ray = this.controllers[i].getObjectByName('ray');
        if (ray) ray.material.color.setHex(0xff0000);
    }
    onSelectEnd(event, i) {
        const ray = this.controllers[i].getObjectByName('ray');
        if (ray) ray.material.color.setHex(0x00ff00);
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