import { usePlans } from './usePlans';
import { useScene } from './useScene';
import { useAnbaoState } from './useAnbaoState';
import { ref } from 'vue';

// Global demo state
const demoDuration = ref(30);
const demoElapsedTime = ref(0);
const isDemoPaused = ref(false);
let lastFrameTime = 0;

export function usePlanActions() {
    const { plans, appliedPlanId, loadPlanToEdit, createPlan: createPlanData, tempPlanData, tempCameraTrack } = usePlans();
    const { clearPlanObjects, addMesh, createLabel, updateSceneAtTime, controls, camera, isAnimating, rebuildSceneFromPlan } = useScene();
    const { currentMode, showResetBtn } = useAnbaoState();

    const applyPlan = (planId: string) => {
        clearPlanObjects();
        appliedPlanId.value = planId;
        const items = plans[planId].items;

        items.forEach((item: any) => {
            addMesh(item.pos, item.type);
            createLabel({ x: item.pos.x, y: item.pos.y + 5, z: item.pos.z }, item.label, item.desc, 'plan');
        });

        alert("方案 [" + plans[planId].name + "] 已加载！");
    };

    const cancelAppliedPlan = () => {
        if (!appliedPlanId.value) return;
        clearPlanObjects();
        appliedPlanId.value = null;
        alert("已取消方案应用，恢复默认场景。");
    };

    const refreshEditorScene = (time = 0) => {
        rebuildSceneFromPlan(tempPlanData, 'edit', time);
    };

    const editPlan = (planId: string) => {
        if (loadPlanToEdit(planId)) {
            currentMode.value = 'edit';
            refreshEditorScene();
            
            if (tempCameraTrack.length > 0 && controls.value) {
                const firstKey = tempCameraTrack[0];
                controls.value.camera.position.copy(firstKey.pos as any);
                controls.value.target.copy(firstKey.target as any);
                controls.value.update();
            }
            alert("进入编辑模式: " + plans[planId].name);
        }
    };

    const createPlan = () => {
        const id = createPlanData();
        editPlan(id);
    };

    const stopDemo = () => {
        isAnimating.value = false;
        currentMode.value = 'dashboard';

        const expanded = document.querySelector('.label-marker.expanded');
        if (expanded) {
            showResetBtn.value = true;
        }
    };

    const runDemoFrame = () => {
        if (!isAnimating.value) return;

        const now = Date.now();
        const delta = (now - lastFrameTime) / 1000;
        lastFrameTime = now;

        if (!isDemoPaused.value) {
            demoElapsedTime.value += delta;

            if (demoElapsedTime.value >= demoDuration.value) {
                demoElapsedTime.value = demoDuration.value;
                stopDemo();
                alert("演示结束");
                return;
            }

            updateSceneAtTime(demoElapsedTime.value, 'roam');
        }

        requestAnimationFrame(runDemoFrame);
    };

    const playDemo = (planId: string) => {
        const plan = plans[planId];
        if (!plan) return;

        demoDuration.value = (plan.duration && !isNaN(plan.duration) && plan.duration > 0) ? plan.duration : 30;

        // Load data to temp (reusing temp data structures for playback visualization if convenient, 
        // or we should have separate playback logic. index.vue used tempPlanData)
        tempPlanData.splice(0, tempPlanData.length, ...JSON.parse(JSON.stringify(plan.items || [])));
        tempCameraTrack.splice(0, tempCameraTrack.length, ...JSON.parse(JSON.stringify(plan.cameraTrack || [])));

        if (tempCameraTrack.length === 0 && camera.value && controls.value) {
            tempCameraTrack.push({
                t: 0,
                pos: { x: camera.value.position.x, y: camera.value.position.y, z: camera.value.position.z },
                target: { x: controls.value.target.x, y: controls.value.target.y, z: controls.value.target.z }
            });
        }

        clearPlanObjects();
        tempPlanData.forEach((item, idx) => {
            const mesh = addMesh(item.pos, item.type);
            if (mesh) {
                mesh.userData = { isPlanObject: true, index: idx };
                createLabel({ x: item.pos.x, y: item.pos.y + 5, z: item.pos.z }, item.label, item.desc, 'plan');
            }
        });

        isAnimating.value = true;
        currentMode.value = 'roam';
        showResetBtn.value = false;

        isDemoPaused.value = false;
        demoElapsedTime.value = 0;
        lastFrameTime = Date.now();

        requestAnimationFrame(runDemoFrame);
    };

    const toggleDemoPause = () => {
        isDemoPaused.value = !isDemoPaused.value;
        if (!isDemoPaused.value) lastFrameTime = Date.now();
    };

    return {
        applyPlan,
        cancelAppliedPlan,
        editPlan,
        createPlan,
        playDemo,
        stopDemo,
        toggleDemoPause,
        refreshEditorScene,
        demoDuration,
        demoElapsedTime,
        isDemoPaused
    };
}
