import * as THREE from 'three';

export class SimpleOrbitControls {
    camera: THREE.Camera;
    domElement: HTMLElement;
    target: THREE.Vector3;
    isDragging: boolean;
    state: string;
    prevPos: { x: number, y: number };
    radius: number;
    theta: number;
    phi: number;
    enabled: boolean;
    autoRotate: boolean;
    rotateSpeed: number;
    panSpeed: number;

    constructor(camera: THREE.Camera, domElement: HTMLElement) {
        this.camera = camera;
        this.domElement = domElement;
        this.target = new THREE.Vector3(0, 0, 0);
        this.isDragging = false;
        this.state = 'NONE';
        this.prevPos = { x: 0, y: 0 };
        this.radius = 150;
        this.theta = Math.PI / 4;
        this.phi = Math.PI / 3;
        this.enabled = true;
        this.autoRotate = true;
        this.rotateSpeed = 0.0005;
        this.panSpeed = 1.0;

        domElement.addEventListener('mousedown', e => this.onDown(e));
        window.addEventListener('mousemove', e => this.onMove(e));
        window.addEventListener('mouseup', () => {
            this.isDragging = false;
            this.state = 'NONE';
        });
        domElement.addEventListener('wheel', e => this.onWheel(e));
        domElement.addEventListener('contextmenu', e => e.preventDefault());
    }
    onDown(e: MouseEvent) {
        if (!this.enabled) return;
        // Check if target is domElement or label
        if (e.target !== this.domElement && !(e.target as HTMLElement).classList.contains('label-marker')) return;

        this.isDragging = true;
        this.prevPos = { x: e.clientX, y: e.clientY };

        if (e.button === 0) { // Left Click
            this.state = 'ROTATE';
        } else if (e.button === 2) { // Right Click
            this.state = 'PAN';
        }
    }
    onMove(e: MouseEvent) {
        if (!this.isDragging || !this.enabled) return;
        const dx = e.clientX - this.prevPos.x;
        const dy = e.clientY - this.prevPos.y;

        if (this.state === 'ROTATE') {
            this.theta -= dx * 0.005;
            this.phi -= dy * 0.005;
            this.phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.1, this.phi));
        } else if (this.state === 'PAN') {
            this.pan(-dx, dy);
        }

        this.update();
        this.prevPos = { x: e.clientX, y: e.clientY };
    }
    pan(deltaX: number, deltaY: number) {
        const offset = new THREE.Vector3().copy(this.camera.position).sub(this.target);
        const targetDistance = offset.length();
        const factor = 2 * targetDistance * Math.tan(((this.camera as THREE.PerspectiveCamera).fov / 2) * Math.PI / 180) / this.domElement.clientHeight;

        const vX = new THREE.Vector3();
        const vY = new THREE.Vector3();

        vX.setFromMatrixColumn(this.camera.matrix, 0); // Right
        vY.setFromMatrixColumn(this.camera.matrix, 1); // Up

        vX.multiplyScalar(deltaX * factor);
        vY.multiplyScalar(deltaY * factor);

        this.target.add(vX);
        this.target.add(vY);
    }
    onWheel(e: WheelEvent) {
        if (!this.enabled) return;
        this.radius += e.deltaY * 0.1;
        this.radius = Math.max(1, Math.min(500, this.radius));
        this.update();
    }
    update() {
        this.camera.position.x = this.target.x + this.radius * Math.sin(this.phi) * Math.sin(this.theta);
        this.camera.position.y = this.target.y + this.radius * Math.cos(this.phi);
        this.camera.position.z = this.target.z + this.radius * Math.sin(this.phi) * Math.cos(this.theta);
        this.camera.lookAt(this.target);
    }
}
