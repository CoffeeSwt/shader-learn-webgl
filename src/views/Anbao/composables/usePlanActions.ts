import { usePlans } from './usePlans';
import { useScene } from './useScene';
import { useAnbaoState } from './useAnbaoState';
import { useToast } from './useToast';
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
    const toast = useToast();

    const applyPlan = (planId: string) => {
        clearPlanObjects();
        appliedPlanId.value = planId;
        const items = plans[planId].items;

        // Use rebuildSceneFromPlan for consistency (handles lines/groups)
        rebuildSceneFromPlan(items, 'dashboard', 0);
        
        toast.success(`方案 [${plans[planId].name}] 已加载！`);
    };

    const cancelAppliedPlan = () => {
        if (!appliedPlanId.value) return;
        clearPlanObjects();
        appliedPlanId.value = null;
        toast.info("已取消方案应用，恢复默认场景。");
    };

    const refreshEditorScene = (time = 0) => {
        rebuildSceneFromPlan(tempPlanData, 'edit', time);
    };

    const editPlan = (planId: string) => {
        if (loadPlanToEdit(planId)) {
            currentMode.value = 'edit';
            refreshEditorScene();
            
            // Stop auto-rotate when entering edit mode
            if (controls.value) {
                controls.value.autoRotate = false;
            }
            // Also update the reactive state if exposed
            // But useScene doesn't expose a setter for autoRotate ref directly, but exposes the ref itself.
            // Let's check useScene exports.
            // It exports autoRotate ref.
            
            if (tempCameraTrack.length > 0 && controls.value) {
                const firstKey = tempCameraTrack[0];
                controls.value.camera.position.copy(firstKey.pos as any);
                controls.value.target.copy(firstKey.target as any);
                controls.value.update();
            }
            toast.info(`进入编辑模式: ${plans[planId].name}`);
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

    const playDemo = (planId: string) => {
        const plan = plans[planId];
        if (!plan) return;

        let sequenceToPlay: any = null;

        // 1. Check sequences
        if (plan.sequences && plan.sequences.length > 0) {
            sequenceToPlay = plan.sequences[0];
        } 
        // 2. Fallback to legacy
        else if (plan.cameraTrack && plan.cameraTrack.length > 0) {
             sequenceToPlay = {
                 track: plan.cameraTrack,
                 duration: plan.duration || 30
             };
        }

        if (!sequenceToPlay || !sequenceToPlay.track || sequenceToPlay.track.length === 0) {
             toast.error("该方案没有包含任何动画序列！\n请先进入编辑模式创建镜头动画。");
             return;
        }

        // Setup Playback State
        tempPlanData.splice(0, tempPlanData.length, ...JSON.parse(JSON.stringify(plan.items || [])));
        // We use tempCameraTrack for playback visualization
        tempCameraTrack.splice(0, tempCameraTrack.length, ...JSON.parse(JSON.stringify(sequenceToPlay.track)));
        demoDuration.value = sequenceToPlay.duration || 30;
        
        // Clear scene and rebuild static items
        clearPlanObjects();
        tempPlanData.forEach((item, idx) => {
            // Re-use rebuild logic or manual add
            // Manual add for now to ensure labels
             const mesh = addMesh(item.pos, item.type);
             if (mesh) {
                 // Check for line object logic (simplified here or reuse rebuildSceneFromPlan)
                 // Let's use rebuildSceneFromPlan logic if possible, but it depends on 'edit' mode usually.
                 // Actually rebuildSceneFromPlan is not exported from useScene, but we have access to it?
                 // No, useScene exports it.
                 // But here we are inside usePlanActions which imports useScene.
                 
                 // However, rebuildSceneFromPlan clears objects first.
                 // Let's use rebuildSceneFromPlan to handle complex objects like fences correctly.
             }
        });
        
        // Better approach: Use rebuildSceneFromPlan
        rebuildSceneFromPlan(tempPlanData, 'roam', 0);

        // Start Animation Loop
        isAnimating.value = true;
        currentMode.value = 'roam';
        showResetBtn.value = false;
        isDemoPaused.value = false;
        demoElapsedTime.value = 0;
        lastFrameTime = Date.now();
        
        requestAnimationFrame(runDemoLoop);
    };

    const runDemoLoop = () => {
        if (!isAnimating.value) return;

        const now = Date.now();
        const delta = (now - lastFrameTime) / 1000;
        lastFrameTime = now;

        if (!isDemoPaused.value) {
            demoElapsedTime.value += delta;

            if (demoElapsedTime.value >= demoDuration.value) {
                demoElapsedTime.value = demoDuration.value;
                isAnimating.value = false; // Stop loop
                toast.info("演示结束");
                currentMode.value = 'dashboard'; // Exit roam
                showResetBtn.value = true;
                return;
            }

            updateSceneAtTime(demoElapsedTime.value, 'roam');
        }

        requestAnimationFrame(runDemoLoop);
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
