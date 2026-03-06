import { useScene } from './useScene';
import { usePlans } from './usePlans';
import { useAnbaoState } from './useAnbaoState';
import { useEditorState } from './useEditorState';
import { useInteraction } from './useInteraction';

export function useEditorActions() {
    const { controls, updateCameraPathVisuals, rebuildSceneFromPlan, clearPlanObjects } = useScene();
    const { tempCameraTrack, tempPlanData, saveCurrentPlan, editingPlanId } = usePlans();
    const { currentMode } = useAnbaoState();
    const { currentEditorTime } = useEditorState();
    const { selectObject } = useInteraction();

    const addCameraKeyframe = () => {
        if (!controls.value) return;
        const t = currentEditorTime.value;
        const existing = tempCameraTrack.find(k => Math.abs(k.t - t) < 0.1);

        const currentPos = { x: controls.value.camera.position.x, y: controls.value.camera.position.y, z: controls.value.camera.position.z };
        const currentTarget = { x: controls.value.target.x, y: controls.value.target.y, z: controls.value.target.z };

        if (existing) {
            existing.pos = currentPos;
            existing.target = currentTarget;
        } else {
            tempCameraTrack.push({
                t: t,
                pos: currentPos,
                target: currentTarget
            });
            tempCameraTrack.sort((a, b) => a.t - b.t);
        }
        updateCameraPathVisuals(currentMode.value);
    };

    const refreshEditorScene = () => {
        rebuildSceneFromPlan(tempPlanData, 'edit', currentEditorTime.value);
    };

    const addObjectToTimeline = (type: string) => {
        if (!controls.value) return;
        const pos = {
            x: Math.round(controls.value.target.x + (Math.random() * 10 - 5)),
            y: 2,
            z: Math.round(controls.value.target.z + (Math.random() * 10 - 5))
        };

        const label = type === 'camera' ? '新监控' : (type === 'guard' ? '新安保' : '新围栏');

        const newItem = {
            type: type,
            pos: pos,
            label: label,
            desc: "请配置详细信息",
            time: Math.floor(currentEditorTime.value)
        };

        // @ts-ignore
        const index = tempPlanData.push(newItem) - 1;

        // Using rebuild is safer than ad-hoc add because of index alignment
        rebuildSceneFromPlan(tempPlanData, 'edit', currentEditorTime.value);
        selectObject(index);
    };

    const savePlan = () => {
        const savedPlan = saveCurrentPlan();
        if (savedPlan) {
            if (savedPlan.cameraTrack.length === 0) {
                alert("警告：当前方案没有记录任何镜头关键帧！\n播放时镜头将不会移动。");
            }
            alert(`方案 [${savedPlan.name}] 保存成功！\n时长: ${savedPlan.duration}s\n安保点位: ${savedPlan.items.length}\n镜头关键帧: ${savedPlan.cameraTrack.length}`);
            currentMode.value = 'dashboard';
        } else {
            alert("错误：无法找到当前编辑的方案ID！");
        }
    };

    const exitEditor = () => {
        if (confirm("确定退出编辑吗？未保存的更改将丢失。")) {
            currentMode.value = 'dashboard';
            clearPlanObjects();
            editingPlanId.value = null;
        }
    };

    return {
        addCameraKeyframe,
        addObjectToTimeline,
        savePlan,
        exitEditor
    };
}
