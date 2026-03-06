import * as THREE from 'three';
import { ref, shallowRef, reactive, onUnmounted, nextTick } from 'vue';
import { SimpleOrbitControls } from '../core/SimpleOrbitControls';
import { usePlans } from './usePlans';
import { PlanItem } from '../types';

// Singleton state
const scene = shallowRef<THREE.Scene | null>(null);
const camera = shallowRef<THREE.PerspectiveCamera | null>(null);
const renderer = shallowRef<THREE.WebGLRenderer | null>(null);
const controls = shallowRef<SimpleOrbitControls | null>(null);
const objects = shallowRef<THREE.Mesh[]>([]);
const labels = shallowRef<any[]>([]);
const dragPlane = shallowRef<THREE.Mesh | null>(null);
const cameraHelpersGroup = shallowRef<THREE.Group | null>(null);

const layers = reactive({
    base: true,
    location: true,
    plan: true
});

const isAnimating = ref(false);
const autoRotate = ref(true);
const rotateSpeed = ref(2);

// Internal variables
let labelsContainerEl: HTMLElement | null = null;
let animationId: number;

export function useScene() {
    const { tempPlanData, tempCameraTrack, currentPlanDuration } = usePlans();

    const init3D = (container: HTMLElement, labelsContainer: HTMLElement) => {
        labelsContainerEl = labelsContainer;
        
        const scn = new THREE.Scene();
        scn.fog = new THREE.FogExp2(0x0f172a, 0.002);
        scene.value = scn;

        const cam = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 1, 1000);
        camera.value = cam;

        const rend = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        rend.setSize(container.clientWidth, container.clientHeight);
        container.appendChild(rend.domElement);
        renderer.value = rend;

        const ctrl = new SimpleOrbitControls(cam, rend.domElement);
        controls.value = ctrl;
        ctrl.update();

        // Lighting
        const amb = new THREE.AmbientLight(0xffffff, 0.5);
        scn.add(amb);
        const dir = new THREE.DirectionalLight(0xffffff, 0.8);
        dir.position.set(50, 100, 50);
        scn.add(dir);

        loadBaseScene();

        const helpers = new THREE.Group();
        cameraHelpersGroup.value = helpers;
        scn.add(helpers);

        const plane = new THREE.Mesh(
            new THREE.PlaneGeometry(500, 500),
            new THREE.MeshBasicMaterial({ visible: false })
        );
        plane.rotation.x = -Math.PI / 2;
        scn.add(plane);
        dragPlane.value = plane;

        window.addEventListener('resize', onWindowResize);
    };

    const loadBaseScene = () => {
        if (!scene.value) return;
        const grid = new THREE.GridHelper(200, 50, 0x3b82f6, 0x1e293b);
        scene.value.add(grid);

        const plane = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshPhongMaterial({ color: 0x0f172a, side: THREE.DoubleSide }));
        plane.rotation.x = -Math.PI / 2;
        scene.value.add(plane);

        const stadium = new THREE.Mesh(
            new THREE.TorusGeometry(50, 15, 16, 100),
            new THREE.MeshPhongMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.6, wireframe: true })
        );
        stadium.rotation.x = Math.PI / 2;
        stadium.position.y = 8;
        scene.value.add(stadium);
    };

    const createLabel = (pos: any, title: string, desc: string, type: string, onClick?: () => void) => {
        if (!labelsContainerEl) return;
        
        const div = document.createElement('div');
        div.className = `label-marker ${type === 'plan' ? 'plan-label' : ''}`;
        div.innerHTML = `
            <i class="fas ${type === 'plan' ? 'fa-shield-alt' : 'fa-map-marker-alt'}"></i> ${title}
            <div class="detail">${desc}</div>
        `;

        div.onclick = (e) => {
            e.stopPropagation();
            if (onClick) onClick();
            else {
                document.querySelectorAll('.label-marker').forEach(el => el.classList.remove('expanded'));
                div.classList.add('expanded');
                focusCamera(pos);
            }
        };

        labelsContainerEl.appendChild(div);

        labels.value.push({
            element: div,
            position: new THREE.Vector3(pos.x, pos.y, pos.z),
            type: type
        });
    };

    const addMesh = (pos: any, type: string) => {
        if (!scene.value) return;
        let geo, color;
        if (type === 'camera') { geo = new THREE.BoxGeometry(2, 2, 2); color = 0x3b82f6; }
        else if (type === 'guard') { geo = new THREE.CylinderGeometry(1, 1, 4); color = 0x10b981; }
        else { geo = new THREE.BoxGeometry(4, 2, 1); color = 0xf59e0b; }

        const mesh = new THREE.Mesh(geo, new THREE.MeshPhongMaterial({ color: color }));
        mesh.position.set(pos.x, pos.y, pos.z);
        scene.value.add(mesh);
        objects.value.push(mesh);
        return mesh;
    };

    const clearPlanObjects = () => {
        if (!scene.value) return;
        for (let i = objects.value.length - 1; i >= 0; i--) {
            scene.value.remove(objects.value[i]);
        }
        objects.value = [];

        labels.value = labels.value.filter(l => {
            if (l.type === 'plan') {
                l.element.remove();
                return false;
            }
            return true;
        });
    };

    const updateLabels = () => {
        if (!camera.value || !renderer.value) return;
        
        labels.value.forEach(label => {
            if (label.type === 'location' && !layers.location) {
                label.element.style.display = 'none';
                return;
            }
            if (label.type === 'plan' && !layers.plan) {
                label.element.style.display = 'none';
                return;
            }

            const vector = label.position.clone();
            vector.project(camera.value);

            const x = (vector.x * .5 + .5) * renderer.value!.domElement.clientWidth;
            const y = (-(vector.y * .5) + .5) * renderer.value!.domElement.clientHeight;

            if (vector.z > 1) {
                label.element.style.display = 'none';
            } else {
                label.element.style.display = 'block';
                label.element.style.left = x + 'px';
                label.element.style.top = y + 'px';
            }
        });
    };

    const animate = () => {
        animationId = requestAnimationFrame(animate);
        // @ts-ignore
        if (window.TWEEN) window.TWEEN.update();

        if (controls.value && !controls.value.isDragging && !isAnimating.value && controls.value.autoRotate && autoRotate.value) {
            controls.value.theta += controls.value.rotateSpeed;
            controls.value.update();
        }

        updateLabels();
        if (renderer.value && scene.value && camera.value) {
            renderer.value.render(scene.value, camera.value);
        }
    };

    const onWindowResize = () => {
        if (renderer.value && camera.value) {
            const width = renderer.value.domElement.parentElement?.clientWidth || window.innerWidth;
            const height = renderer.value.domElement.parentElement?.clientHeight || window.innerHeight;
            camera.value.aspect = width / height;
            camera.value.updateProjectionMatrix();
            renderer.value.setSize(width, height);
        }
    };

    const focusCamera = (targetPos: any) => {
        if (!controls.value) return;
        controls.value.autoRotate = false;
        autoRotate.value = false;
        // Logic to show reset btn can be handled by UI observing autoRotate or similar

        const startTarget = { x: controls.value.target.x, y: controls.value.target.y, z: controls.value.target.z };

        // @ts-ignore
        if (window.TWEEN) {
            // @ts-ignore
            new window.TWEEN.Tween(startTarget)
                .to({ x: targetPos.x, y: targetPos.y, z: targetPos.z }, 1000)
                // @ts-ignore
                .easing(window.TWEEN.Easing.Quadratic.Out)
                .onUpdate(() => {
                    controls.value?.target.set(startTarget.x, startTarget.y, startTarget.z);
                })
                .start();

            // @ts-ignore
            new window.TWEEN.Tween(controls.value)
                .to({ radius: 40, theta: controls.value.theta + 0.5 }, 1000)
                // @ts-ignore
                .easing(window.TWEEN.Easing.Quadratic.Out)
                .onUpdate(() => {
                    controls.value?.update();
                })
                .start();
        }
    };

    const resetView = () => {
        if (!controls.value) return;
        document.querySelectorAll('.label-marker').forEach(el => el.classList.remove('expanded'));

        const targetPos = { x: 0, y: 0, z: 0 };
        const duration = 1500;
        const startTarget = { x: controls.value.target.x, y: controls.value.target.y, z: controls.value.target.z };

        // @ts-ignore
        if (window.TWEEN) {
            // @ts-ignore
            new window.TWEEN.Tween(startTarget)
                .to(targetPos, duration)
                // @ts-ignore
                .easing(window.TWEEN.Easing.Quadratic.Out)
                .onUpdate(() => {
                    controls.value?.target.set(startTarget.x, startTarget.y, startTarget.z);
                })
                .start();

            // @ts-ignore
            new window.TWEEN.Tween(controls.value)
                .to({
                    radius: 150,
                    theta: Math.PI / 4,
                    phi: Math.PI / 3
                }, duration)
                // @ts-ignore
                .easing(window.TWEEN.Easing.Quadratic.Out)
                .onUpdate(() => {
                    controls.value?.update();
                })
                .onComplete(() => {
                    autoRotate.value = true;
                    if(controls.value) controls.value.autoRotate = true;
                })
                .start();
        }
    };

    // Camera Path Visuals
    const getCameraStateAtTime = (t: number) => {
        if (tempCameraTrack.length === 0) return null;

        let prev = tempCameraTrack[0];
        let next = tempCameraTrack[tempCameraTrack.length - 1];

        for (let i = 0; i < tempCameraTrack.length - 1; i++) {
            if (t >= tempCameraTrack[i].t && t < tempCameraTrack[i + 1].t) {
                prev = tempCameraTrack[i];
                next = tempCameraTrack[i + 1];
                break;
            }
        }

        const result = { pos: new THREE.Vector3(), target: new THREE.Vector3() };

        if (t >= next.t) {
            result.pos.copy(next.pos as any);
            result.target.copy(next.target as any);
        } else if (t <= prev.t) {
            result.pos.copy(prev.pos as any);
            result.target.copy(prev.target as any);
        } else {
            const duration = next.t - prev.t;
            const alpha = (t - prev.t) / duration;

            const ease = (k: number) => k < .5 ? 4 * k * k * k : (k - 1) * (2 * k - 2) * (2 * k - 2) + 1;
            const k = ease(alpha);

            result.pos.x = prev.pos.x + (next.pos.x - prev.pos.x) * k;
            result.pos.y = prev.pos.y + (next.pos.y - prev.pos.y) * k;
            result.pos.z = prev.pos.z + (next.pos.z - prev.pos.z) * k;

            result.target.x = prev.target.x + (next.target.x - prev.target.x) * k;
            result.target.y = prev.target.y + (next.target.y - prev.target.y) * k;
            result.target.z = prev.target.z + (next.target.z - prev.target.z) * k;
        }
        return result;
    };

    const updateCameraPathVisuals = (currentMode: string) => {
        if (!cameraHelpersGroup.value) return;
        while (cameraHelpersGroup.value.children.length > 0) {
            cameraHelpersGroup.value.remove(cameraHelpersGroup.value.children[0]);
        }

        if (currentMode !== 'edit' || tempCameraTrack.length === 0) return;

        tempCameraTrack.forEach((kf, i) => {
            const geometry = new THREE.ConeGeometry(2, 5, 4);
            geometry.rotateX(Math.PI / 2);
            const material = new THREE.MeshBasicMaterial({ color: 0x3b82f6, wireframe: true, transparent: true, opacity: 0.5 });
            const mesh = new THREE.Mesh(geometry, material);

            mesh.position.set(kf.pos.x, kf.pos.y, kf.pos.z);
            mesh.lookAt(kf.target.x, kf.target.y, kf.target.z);

            const sprite = makeTextSprite((i + 1).toString());
            sprite.position.set(0, 3, 0);
            mesh.add(sprite);

            cameraHelpersGroup.value?.add(mesh);
        });

        if (tempCameraTrack.length > 1) {
            const points = [];
            const steps = 100;
            for (let i = 0; i <= steps; i++) {
                const t = (i / steps) * currentPlanDuration.value;
                const state = getCameraStateAtTime(t);
                if (state) points.push(state.pos);
            }
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({ color: 0xffff00 });
            const line = new THREE.Line(geometry, material);
            cameraHelpersGroup.value.add(line);
        }
    };

    const makeTextSprite = (message: string) => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d')!;
        context.font = "Bold 40px Arial";
        context.fillStyle = "rgba(255,255,255,1)";
        context.fillText(message, 0, 40);

        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(5, 2.5, 1);
        return sprite;
    };

    const updateSceneAtTime = (t: number, currentMode: string, selectedObjectIndex = -1) => {
        const state = getCameraStateAtTime(t);
        if (state && controls.value) {
            controls.value.camera.position.copy(state.pos);
            controls.value.target.copy(state.target);
            controls.value.camera.lookAt(controls.value.target);
        }

        tempPlanData.forEach((item, idx) => {
            const mesh = objects.value.find(o => o.userData.index === idx);
            if (mesh) {
                const visible = t >= (item.time || 0);

                if (currentMode === 'edit') {
                    mesh.visible = true;
                    if (visible) {
                        // @ts-ignore
                        mesh.material.opacity = 1;
                        // @ts-ignore
                        mesh.material.transparent = false;
                    } else {
                        // @ts-ignore
                        mesh.material.opacity = 0.3;
                        // @ts-ignore
                        mesh.material.transparent = true;
                    }
                } else {
                    mesh.visible = visible;
                    // @ts-ignore
                    mesh.material.opacity = 1;
                    // @ts-ignore
                    mesh.material.transparent = false;
                }

                const label = labels.value.find(l =>
                    Math.abs(l.position.x - item.pos.x) < 0.1 &&
                    Math.abs(l.position.z - item.pos.z) < 0.1
                );
                if (label) {
                    label.element.style.display = visible ? 'block' : 'none';
                    if (currentMode === 'edit' && selectedObjectIndex === idx) {
                        label.element.style.display = 'block';
                        label.element.style.opacity = visible ? '1' : '0.5';
                    }
                }
            }
        });
    };

    const rebuildSceneFromPlan = (items: PlanItem[], mode: string, time: number) => {
        clearPlanObjects();
        items.forEach((item, idx) => {
            const mesh = addMesh(item.pos, item.type);
            if (mesh) {
                mesh.userData = { isPlanObject: true, index: idx };
                createLabel({ x: item.pos.x, y: item.pos.y + 5, z: item.pos.z }, item.label, item.desc, 'plan');
            }
        });
        updateSceneAtTime(time, mode);
    };

    return {
        scene, camera, renderer, controls, objects, labels, dragPlane, cameraHelpersGroup,
        isAnimating, autoRotate, rotateSpeed, layers,
        init3D, animate, addMesh, createLabel, clearPlanObjects, 
        focusCamera, resetView, updateCameraPathVisuals, updateSceneAtTime, rebuildSceneFromPlan,
        getCameraStateAtTime // exported for Editor to use
    };
}
