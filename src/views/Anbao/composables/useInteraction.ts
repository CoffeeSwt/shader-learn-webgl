import * as THREE from 'three';
import { useScene } from './useScene';
import { useAnbaoState } from './useAnbaoState';
import { usePlans } from './usePlans';
import { useEditorState } from './useEditorState';
import { ref, reactive } from 'vue';

const { scene, camera, renderer, controls, objects, dragPlane, updateSceneAtTime } = useScene();
const { currentMode, selectedObjectIndex } = useAnbaoState();
const { tempPlanData, currentPlanDuration } = usePlans();
const { currentEditorTime } = useEditorState();

const selectedObjectPos = reactive({ x: 0, y: 0, z: 0 });
const selectedObjectLabel = ref('');

export function useInteraction() {

    const selectObject = (index: number) => {
        selectedObjectIndex.value = index;
        const item = tempPlanData[index];

        objects.value.forEach(obj => {
            if (obj.userData.index === index) {
                // @ts-ignore
                obj.material.emissive.setHex(0x555555);
            } else {
                // @ts-ignore
                if (obj.material.emissive) obj.material.emissive.setHex(0x000000);
            }
        });

        selectedObjectPos.x = item.pos.x;
        selectedObjectPos.y = item.pos.y;
        selectedObjectPos.z = item.pos.z;
        selectedObjectLabel.value = item.label;
    };

    const deselectObject = () => {
        selectedObjectIndex.value = -1;
        objects.value.forEach(obj => {
            // @ts-ignore
            if (obj.material.emissive) obj.material.emissive.setHex(0x000000);
        });
    };

    const updateObjectPos = () => {
        if (selectedObjectIndex.value === -1) return;

        const x = selectedObjectPos.x;
        const y = selectedObjectPos.y;
        const z = selectedObjectPos.z;

        const item = tempPlanData[selectedObjectIndex.value];
        item.pos = { x, y, z };

        const mesh = objects.value.find(o => o.userData.index === selectedObjectIndex.value);
        if (mesh) mesh.position.set(x, y, z);

        // Instead of full refresh, just update this one
        // refreshEditorScene(); // Need to call this if we want to update labels position too, but updateSceneAtTime does visibility/labels
        // Let's rely on reactivity or manual call
        // Actually, updateSceneAtTime updates label visibility, not position. label position is updated in animate loop via updateLabels.
        // So just moving mesh is enough for position.
        
        selectObject(selectedObjectIndex.value);
    };

    const updateObjectLabel = () => {
        if (selectedObjectIndex.value === -1) return;
        tempPlanData[selectedObjectIndex.value].label = selectedObjectLabel.value;
        // Label text update requires recreating label or updating innerHTML. 
        // In current implementation, labels are recreated on refreshEditorScene.
        // We might need to expose refreshEditorScene or similar logic.
        // For now, let's assume the user will save/reload or we can trigger a refresh.
    };

    const onSceneClick = (event: MouseEvent) => {
        if (currentMode.value !== 'edit' || !renderer.value || !camera.value) return;

        const mouse = new THREE.Vector2();
        mouse.x = (event.clientX / renderer.value.domElement.clientWidth) * 2 - 1;
        mouse.y = - (event.clientY / renderer.value.domElement.clientHeight) * 2 + 1;

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera.value);

        const intersects = raycaster.intersectObjects(objects.value);

        if (intersects.length > 0) {
            const object = intersects[0].object;
            if (object.userData && object.userData.isPlanObject) {
                selectObject(object.userData.index);
                event.stopPropagation();
            }
        }
    };

    const setupDragControls = () => {
        if (!renderer.value || !camera.value) return;

        let isDraggingObj = false;
        let dragObject: THREE.Object3D | null = null;

        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        renderer.value.domElement.addEventListener('mousedown', (e) => {
            if (currentMode.value !== 'edit' || !camera.value) return;

            mouse.x = (e.clientX / renderer.value!.domElement.clientWidth) * 2 - 1;
            mouse.y = - (e.clientY / renderer.value!.domElement.clientHeight) * 2 + 1;

            raycaster.setFromCamera(mouse, camera.value);
            const intersects = raycaster.intersectObjects(objects.value);

            if (intersects.length > 0 && intersects[0].object.userData.isPlanObject) {
                isDraggingObj = true;
                dragObject = intersects[0].object;
                if (controls.value) controls.value.enabled = false;
                selectObject(dragObject.userData.index);
            }
        });

        window.addEventListener('mousemove', (e) => {
            if (!isDraggingObj || !dragObject || !camera.value || !dragPlane.value) return;

            mouse.x = (e.clientX / renderer.value!.domElement.clientWidth) * 2 - 1;
            mouse.y = - (e.clientY / renderer.value!.domElement.clientHeight) * 2 + 1;

            raycaster.setFromCamera(mouse, camera.value);
            const intersects = raycaster.intersectObject(dragPlane.value);

            if (intersects.length > 0) {
                const point = intersects[0].point;
                dragObject.position.set(Math.round(point.x), dragObject.position.y, Math.round(point.z));

                selectedObjectPos.x = dragObject.position.x;
                selectedObjectPos.z = dragObject.position.z;

                const item = tempPlanData[dragObject.userData.index];
                item.pos.x = dragObject.position.x;
                item.pos.z = dragObject.position.z;
            }
        });

        window.addEventListener('mouseup', () => {
            if (isDraggingObj) {
                isDraggingObj = false;
                dragObject = null;
                if (controls.value) controls.value.enabled = true;
                // refreshEditorScene();
                selectObject(selectedObjectIndex.value);
            }
        });
    };

    return {
        selectedObjectPos,
        selectedObjectLabel,
        currentEditorTime,
        selectObject,
        deselectObject,
        updateObjectPos,
        updateObjectLabel,
        onSceneClick,
        setupDragControls
    };
}
