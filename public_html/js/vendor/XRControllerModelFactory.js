// Minimal stub for XRControllerModelFactory for local use
// In production, use: import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';
import * as THREE from 'three';

export class XRControllerModelFactory {
    createControllerModel(controllerGrip) {
        // Simple geometry for demo
        const geometry = new THREE.CylinderGeometry(0.01, 0.02, 0.1, 8);
        const material = new THREE.MeshBasicMaterial({ color: 0x8888ff });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.rotation.x = Math.PI / 2;
        return mesh;
    }
}
