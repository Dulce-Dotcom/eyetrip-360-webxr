// Custom XRControllerModelFactory with GLB model support
import * as THREE from 'https://unpkg.com/three@0.153.0/build/three.module.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.153.0/examples/jsm/loaders/GLTFLoader.js';

export class XRControllerModelFactory {
    constructor() {
        this.loader = new GLTFLoader();
        this.loadedModels = new Map(); // Cache loaded models
    }

    createControllerModel(controllerGrip, handedness = 'right') {
        // Create container group for the controller model
        const controllerModel = new THREE.Group();
        controllerModel.userData.handedness = handedness; // Store handedness for later use
        
        // Add simple placeholder geometry while loading
        const placeholderGeometry = new THREE.CylinderGeometry(0.01, 0.02, 0.1, 8);
        const placeholderMaterial = new THREE.MeshBasicMaterial({ 
            color: handedness === 'left' ? 0x88ff88 : 0x8888ff,
            transparent: true,
            opacity: 0.5
        });
        const placeholder = new THREE.Mesh(placeholderGeometry, placeholderMaterial);
        placeholder.rotation.x = Math.PI / 2;
        placeholder.name = 'placeholder';
        controllerModel.add(placeholder);
        
        // Determine which model to load
        const modelPath = handedness === 'left' 
            ? 'assets/models/left-controller.glb'
            : 'assets/models/right-controller.glb';
        
        // Load the GLB model
        this.loadControllerModel(modelPath, controllerModel, placeholder, handedness);
        
        return controllerModel;
    }
    
    loadControllerModel(path, parentGroup, placeholder, handedness) {
        // Check cache first
        if (this.loadedModels.has(path)) {
            const cachedModel = this.loadedModels.get(path);
            const clone = cachedModel.clone();
            parentGroup.add(clone);
            if (placeholder && placeholder.parent) {
                placeholder.parent.remove(placeholder);
            }
            console.log(`✅ Loaded cached controller model: ${path}`);
            return;
        }
        
        // Load new model
        this.loader.load(
            path,
            (gltf) => {
                console.log(`✅ Loaded controller model: ${path}`);
                const model = gltf.scene;
                
                // Debug model info
                console.log('Model bounding box:', model);
                console.log('Model children:', model.children.length);
                
                // Scale the model to proper size for VR controllers
                model.scale.set(0.5, 0.5, 0.5);
                
                // Minimal position adjustment - just center on grip point
                model.position.set(0, 0, 0);
                
                // Minimal rotation adjustment - just rotate 90 degrees around Y to face forward
                // Many GLB controller models are exported sideways
                model.rotation.set(
                    0,              // No X tilt yet
                    Math.PI / 2,    // Rotate 90° around Y axis (face forward instead of sideways)
                    0               // No roll
                );
                
                console.log(`Controller model setup (${handedness}) - Position: ${model.position.toArray()}, Rotation: ${(model.rotation.y * 180/Math.PI).toFixed(0)}° Y-rotation`);
                
                // Make model visible and update materials for proper lighting
                model.visible = true;
                
                // Color tint for identification - cyan for left, magenta for right
                const tintColor = handedness === 'left' ? new THREE.Color(0x00ffff) : new THREE.Color(0xff00ff);
                
                model.traverse((child) => {
                    if (child.isMesh) {
                        child.visible = true;
                        child.castShadow = true;
                        child.receiveShadow = true;
                        
                        // Fix materials - use MeshStandardMaterial for proper lighting
                        if (child.material) {
                            if (child.material.isMeshStandardMaterial || child.material.isMeshPhysicalMaterial) {
                                // Keep existing PBR materials but add color tint and ensure they're lit
                                child.material.color.multiply(tintColor);
                                child.material.emissive = tintColor;
                                child.material.emissiveIntensity = 0.3; // Moderate glow
                                child.material.needsUpdate = true;
                            } else {
                                // Replace basic materials with standard materials
                                const oldMaterial = child.material;
                                child.material = new THREE.MeshStandardMaterial({
                                    color: tintColor,
                                    metalness: 0.3,
                                    roughness: 0.7,
                                    emissive: tintColor,
                                    emissiveIntensity: 0.3
                                });
                            }
                        }
                    }
                });
                
                console.log(`✨ Controller tinted: ${handedness} = ${handedness === 'left' ? 'CYAN' : 'MAGENTA'}`);
                
                // Cache the model
                this.loadedModels.set(path, model);
                
                // Add to parent group
                const clone = model.clone();
                clone.visible = true;
                parentGroup.add(clone);
                
                console.log('✅ Controller model added to scene at scale 0.5, children:', parentGroup.children.length);
                
                // Remove placeholder
                if (placeholder && placeholder.parent) {
                    placeholder.parent.remove(placeholder);
                    console.log('Placeholder removed');
                }
            },
            (progress) => {
                // Loading progress
                const percent = (progress.loaded / progress.total * 100).toFixed(0);
                console.log(`Loading controller model: ${percent}%`);
            },
            (error) => {
                console.error(`❌ Error loading controller model ${path}:`, error);
                // Keep placeholder on error
            }
        );
    }
}
