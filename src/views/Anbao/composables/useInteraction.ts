import * as THREE from 'three';
import { useScene } from './useScene';
import { useAnbaoState } from './useAnbaoState';
import { usePlans } from './usePlans';
import { useEditorState } from './useEditorState';
import { ref, reactive } from 'vue';

const { scene, camera, renderer, controls, objects, dragPlane } = useScene();
const { currentMode, selectedObjectIndex } = useAnbaoState();
const { tempPlanData } = usePlans();
const { currentEditorTime } = useEditorState();

const selectedObjectPos = reactive({ x: 0, y: 0, z: 0 });
const selectedObjectScale = reactive({ x: 1, y: 1, z: 1 });
const selectedObjectLabel = ref('');

let isDrawingLine = false;
let lineStartPoint: THREE.Vector3 | null = null;
let currentDrawingType: string | null = null;
let linePreviewMesh: THREE.Mesh | null = null;
let onDrawCompleteCallback: ((type: string, start: THREE.Vector3, end: THREE.Vector3) => void) | null = null;

// --- Dragging State ---
let isDraggingObj = false;
let dragObject: THREE.Object3D | null = null;
let dragIndicator: THREE.Mesh | null = null;
// Store initial drag state
let dragStartPos = new THREE.Vector3();
let itemStartPos = new THREE.Vector3();
let itemStartEndPos = new THREE.Vector3();

export function useInteraction() {

    const selectObject = (index: number) => {
        selectedObjectIndex.value = index;
        const item = tempPlanData[index];

        objects.value.forEach(obj => {
            if (obj.userData.index === index) {
                // @ts-ignore
                if (obj.material && obj.material.emissive) obj.material.emissive.setHex(0x555555);
                // Handle groups
                if (obj.children) {
                    obj.children.forEach((child: any) => {
                         if (child.material && child.material.emissive) child.material.emissive.setHex(0x555555);
                    });
                }
            } else {
                // @ts-ignore
                if (obj.material && obj.material.emissive) obj.material.emissive.setHex(0x000000);
                if (obj.children) {
                    obj.children.forEach((child: any) => {
                         if (child.material && child.material.emissive) child.material.emissive.setHex(0x000000);
                    });
                }
            }
        });

        selectedObjectPos.x = item.pos.x;
        selectedObjectPos.y = item.pos.y;
        selectedObjectPos.z = item.pos.z;
        
        selectedObjectScale.x = item.scale?.x || 1;
        selectedObjectScale.y = item.scale?.y || 1;
        selectedObjectScale.z = item.scale?.z || 1;

        selectedObjectLabel.value = item.label;
    };

    const deselectObject = () => {
        selectedObjectIndex.value = -1;
        objects.value.forEach(obj => {
            // @ts-ignore
            if (obj.material && obj.material.emissive) obj.material.emissive.setHex(0x000000);
             if (obj.children) {
                obj.children.forEach((child: any) => {
                        if (child.material && child.material.emissive) child.material.emissive.setHex(0x000000);
                });
            }
        });
    };

    const updateObjectPos = () => {
        if (selectedObjectIndex.value === -1) return;

        const x = selectedObjectPos.x;
        const y = selectedObjectPos.y;
        const z = selectedObjectPos.z;

        const item = tempPlanData[selectedObjectIndex.value];
        
        // Calculate delta for line objects
        const dx = x - item.pos.x;
        const dy = y - item.pos.y;
        const dz = z - item.pos.z;
        
        item.pos = { x, y, z };
        
        if (item.endPos) {
            item.endPos.x += dx;
            item.endPos.y += dy;
            item.endPos.z += dz;
        }

        const mesh = objects.value.find(o => o.userData.index === selectedObjectIndex.value);
        if (mesh) mesh.position.set(x, y, z);
        
        selectObject(selectedObjectIndex.value);
    };

    const updateObjectScale = () => {
        if (selectedObjectIndex.value === -1) return;

        const x = selectedObjectScale.x;
        const y = selectedObjectScale.y;
        const z = selectedObjectScale.z;

        const item = tempPlanData[selectedObjectIndex.value];
        item.scale = { x, y, z };

        const mesh = objects.value.find(o => o.userData.index === selectedObjectIndex.value);
        if (mesh) mesh.scale.set(x, y, z);
        
        selectObject(selectedObjectIndex.value);
    };

    const updateObjectLabel = () => {
        if (selectedObjectIndex.value === -1) return;
        tempPlanData[selectedObjectIndex.value].label = selectedObjectLabel.value;
        // Label text update handled by Vue reactivity or manual refresh if needed
    };

    const onSceneClick = (event: MouseEvent) => {
        if (currentMode.value !== 'edit' || !renderer.value || !camera.value) return;

        const mouse = new THREE.Vector2();
        mouse.x = (event.clientX / renderer.value.domElement.clientWidth) * 2 - 1;
        mouse.y = - (event.clientY / renderer.value.domElement.clientHeight) * 2 + 1;

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera.value);

        const intersects = raycaster.intersectObjects(objects.value, true); // recursive

        if (intersects.length > 0) {
            let object = intersects[0].object;
            // Traverse up to find the Plan Object
            while(object.parent && !object.userData.isPlanObject && object.parent !== scene.value) {
                object = object.parent;
            }

            if (object.userData && object.userData.isPlanObject) {
                selectObject(object.userData.index);
                event.stopPropagation();
            }
        }
    };

    // --- Exposed Start Drawing Function ---
    const startDrawingLine = (type: string) => {
            isDrawingLine = true;
            currentDrawingType = type;
            if (controls.value) controls.value.enabled = false;
            document.body.style.cursor = 'crosshair';
    };

    const setupDragControls = () => {
        if (!renderer.value || !camera.value) return;

        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        // Create a visual indicator for dragging
        const indicatorGeo = new THREE.RingGeometry(2, 2.5, 32);
        indicatorGeo.rotateX(-Math.PI / 2);
        const indicatorMat = new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.8, side: THREE.DoubleSide });
        dragIndicator = new THREE.Mesh(indicatorGeo, indicatorMat);
        dragIndicator.visible = false;
        if (scene.value) scene.value.add(dragIndicator);

        renderer.value.domElement.addEventListener('mousedown', (e) => {
            if (currentMode.value !== 'edit' || !camera.value) return;

            mouse.x = (e.clientX / renderer.value!.domElement.clientWidth) * 2 - 1;
            mouse.y = - (e.clientY / renderer.value!.domElement.clientHeight) * 2 + 1;

            raycaster.setFromCamera(mouse, camera.value);
            
            if (isDrawingLine && currentDrawingType && dragPlane.value) {
                 const intersects = raycaster.intersectObject(dragPlane.value);
                 if (intersects.length > 0) {
                     lineStartPoint = intersects[0].point.clone();
                     // Snap
                     lineStartPoint.x = Math.round(lineStartPoint.x);
                     lineStartPoint.z = Math.round(lineStartPoint.z);
                     
                     // Create preview mesh
                     const geo = new THREE.BoxGeometry(1, 1, 1);
                     const mat = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
                     linePreviewMesh = new THREE.Mesh(geo, mat);
                     linePreviewMesh.position.copy(lineStartPoint);
                     scene.value?.add(linePreviewMesh);
                 }
                 return;
            }

            const intersects = raycaster.intersectObjects(objects.value, true);

            if (intersects.length > 0) {
                let obj = intersects[0].object;
                while(obj.parent && !obj.userData.isPlanObject && obj.parent !== scene.value) {
                    obj = obj.parent;
                }
                
                if (obj.userData.isPlanObject) {
                    isDraggingObj = true;
                    dragObject = obj;
                    if (controls.value) controls.value.enabled = false;
                    selectObject(dragObject.userData.index);
                    
                    // Capture start state
                    dragStartPos.copy(dragObject.position);
                    const item = tempPlanData[dragObject.userData.index];
                    itemStartPos.set(item.pos.x, item.pos.y, item.pos.z);
                    if (item.endPos) {
                        itemStartEndPos.set(item.endPos.x, item.endPos.y, item.endPos.z);
                    }
                    
                    if (dragIndicator) {
                        dragIndicator.visible = true;
                        dragIndicator.position.copy(dragObject.position);
                        dragIndicator.position.y = 0.5; 
                    }
                }
            }
        });

        window.addEventListener('mousemove', (e) => {
            if (!camera.value || !dragPlane.value) return;

            mouse.x = (e.clientX / renderer.value!.domElement.clientWidth) * 2 - 1;
            mouse.y = - (e.clientY / renderer.value!.domElement.clientHeight) * 2 + 1;

            raycaster.setFromCamera(mouse, camera.value);
            const intersects = raycaster.intersectObject(dragPlane.value);
            
            if (intersects.length > 0) {
                 const point = intersects[0].point;
                 const snapX = Math.round(point.x);
                 const snapZ = Math.round(point.z);
                 
                 if (isDrawingLine && lineStartPoint && linePreviewMesh) {
                     // Update preview
                     const currentEnd = new THREE.Vector3(snapX, point.y, snapZ);
                     const dist = lineStartPoint.distanceTo(currentEnd);
                     const mid = lineStartPoint.clone().lerp(currentEnd, 0.5);
                     
                     linePreviewMesh.position.copy(mid);
                     linePreviewMesh.lookAt(currentEnd);
                     linePreviewMesh.scale.set(1, 1, dist); // Scale along Z
                     return;
                 }

                if (isDraggingObj && dragObject) {
                    dragObject.position.set(snapX, dragObject.position.y, snapZ);

                    if (dragIndicator) {
                        dragIndicator.position.set(snapX, 0.5, snapZ);
                    }

                    selectedObjectPos.x = dragObject.position.x;
                    selectedObjectPos.z = dragObject.position.z;

                    const item = tempPlanData[dragObject.userData.index];
                    
                    // Update item pos
                    item.pos.x = dragObject.position.x;
                    item.pos.z = dragObject.position.z;
                    
                    // If line object, update endPos relative to start
                    if (item.endPos) {
                        // Calculate delta from start of drag
                        const dx = dragObject.position.x - itemStartPos.x;
                        const dz = dragObject.position.z - itemStartPos.z;
                        
                        item.endPos.x = itemStartEndPos.x + dx;
                        item.endPos.z = itemStartEndPos.z + dz;
                    }
                }
            }
        });

        window.addEventListener('mouseup', () => {
            if (isDrawingLine && lineStartPoint && linePreviewMesh) {
                // Finish drawing
                if (onDrawCompleteCallback) {
                     // Calculate end pos from preview mesh orientation
                     // The preview mesh is centered at mid, scaled by dist along Z (local)
                     // So end is mid + forward * dist/2
                     const mid = linePreviewMesh.position;
                     const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(linePreviewMesh.quaternion);
                     const halfDist = linePreviewMesh.scale.z / 2;
                     
                     // Actually simpler: lineStartPoint is start. 
                     // End is start + (mid-start)*2
                     const end = lineStartPoint.clone().add(mid.clone().sub(lineStartPoint).multiplyScalar(2));
                     
                     // Ensure start != end
                     if (lineStartPoint.distanceTo(end) > 1) {
                        onDrawCompleteCallback(currentDrawingType!, lineStartPoint, end);
                     }
                }
                
                scene.value?.remove(linePreviewMesh);
                linePreviewMesh = null;
                lineStartPoint = null;
                isDrawingLine = false;
                currentDrawingType = null;
                if (controls.value) controls.value.enabled = true;
                document.body.style.cursor = 'default';
                return;
            }

            if (isDraggingObj) {
                isDraggingObj = false;
                dragObject = null;
                if (controls.value) controls.value.enabled = true;
                if (dragIndicator) dragIndicator.visible = false;
                selectObject(selectedObjectIndex.value);
            }
        });
    };

    const setDrawCompleteCallback = (cb: any) => {
        onDrawCompleteCallback = cb;
    };

    return {
        selectedObjectPos,
        selectedObjectScale,
        selectedObjectLabel,
        currentEditorTime,
        selectObject,
        deselectObject,
        updateObjectPos,
        updateObjectScale,
        updateObjectLabel,
        onSceneClick,
        setupDragControls,
        startDrawingLine, // Now exposed correctly
        setDrawCompleteCallback
    };
}
