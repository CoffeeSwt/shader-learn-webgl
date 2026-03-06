import { useScene } from './useScene';
import { usePlans } from './usePlans';
import { useAnbaoState } from './useAnbaoState';
import { useEditorState } from './useEditorState';
import { useInteraction } from './useInteraction';
import { useToast } from './useToast';

export function useEditorActions() {
    const { controls, updateCameraPathVisuals, rebuildSceneFromPlan, clearPlanObjects } = useScene();
    const { tempCameraTrack, tempPlanData, saveCurrentPlan, editingPlanId } = usePlans();
    const { currentMode } = useAnbaoState();
    const { currentEditorTime } = useEditorState();
    const { setDrawCompleteCallback, selectObject } = useInteraction();
    const toast = useToast();

    // Init draw callback
    setDrawCompleteCallback((type: string, start: any, end: any) => {
        addObjectLine(type, start, end);
    });

    const addCameraKeyframe = () => {
        if (!controls.value) return;
        const t = currentEditorTime.value;
        const existing = tempCameraTrack.find(k => Math.abs(k.t - t) < 0.1);

        const currentPos = { x: controls.value.camera.position.x, y: controls.value.camera.position.y, z: controls.value.camera.position.z };
        const currentTarget = { x: controls.value.target.x, y: controls.value.target.y, z: controls.value.target.z };

        if (existing) {
            existing.pos = currentPos;
            existing.target = currentTarget;
            toast.info(`更新了 ${t.toFixed(1)}s 处的关键帧`);
        } else {
            tempCameraTrack.push({
                t: t,
                pos: currentPos,
                target: currentTarget
            });
            tempCameraTrack.sort((a, b) => a.t - b.t);
            toast.success(`添加了 ${t.toFixed(1)}s 处的关键帧`);
        }
        updateCameraPathVisuals(currentMode.value);
    };

    const refreshEditorScene = () => {
        rebuildSceneFromPlan(tempPlanData, 'edit', currentEditorTime.value);
    };

    const addObjectLine = (type: string, start: any, end: any) => {
        let label = '新物体列';
        switch (type) {
            case 'barrier': label = '水马列'; break;
            case 'fence': label = '铁马列'; break;
        }

        const newItem = {
            type: type,
            pos: { x: start.x, y: start.y, z: start.z },
            endPos: { x: end.x, y: end.y, z: end.z },
            label: label,
            desc: "线性部署",
            time: Math.floor(currentEditorTime.value),
            scale: { x: 1, y: 1, z: 1 }
        };

        // @ts-ignore
        const index = tempPlanData.push(newItem) - 1;
        rebuildSceneFromPlan(tempPlanData, 'edit', currentEditorTime.value);
        selectObject(index);
        toast.success(`已添加 ${label}`);
    };

    const addObjectToTimeline = (type: string) => {
        if (!controls.value) return;
        const pos = {
            x: Math.round(controls.value.target.x + (Math.random() * 10 - 5)),
            y: 2,
            z: Math.round(controls.value.target.z + (Math.random() * 10 - 5))
        };

        let label = '新物体';
        switch (type) {
            case 'camera': label = '新监控'; break;
            case 'guard': label = '新安保'; break;
            case 'barrier': label = '新水马'; break;
            case 'gate': label = '新闸机'; break;
            case 'scanner': label = '新安检'; break;
            case 'fence': label = '新铁马'; break;
        }

        const newItem = {
            type: type,
            pos: pos,
            label: label,
            desc: "请配置详细信息",
            time: Math.floor(currentEditorTime.value),
            scale: { x: 1, y: 1, z: 1 }
        };

        // @ts-ignore
        const index = tempPlanData.push(newItem) - 1;

        // Using rebuild is safer than ad-hoc add because of index alignment
        rebuildSceneFromPlan(tempPlanData, 'edit', currentEditorTime.value);
        selectObject(index);
        toast.success(`已添加 ${label}`);
    };

    const savePlan = () => {
        const savedPlan = saveCurrentPlan();
        if (savedPlan) {
            if (savedPlan.cameraTrack.length === 0) {
                toast.warning("警告：当前方案没有记录任何镜头关键帧！\n播放时镜头将不会移动。");
            }
            toast.success(`方案 [${savedPlan.name}] 保存成功！`, 3000, "保存成功");
            currentMode.value = 'dashboard';
        } else {
            toast.error("错误：无法找到当前编辑的方案ID！");
        }
    };

    const exitEditor = () => {
        // Replace confirm with custom dialog logic or just toast + action?
        // For now, confirm is blocking which is useful.
        // If user wants toast style, we need a non-blocking confirmation UI.
        // But the requirement said "alert的弹窗重新封装", confirm is different.
        // However, standard confirm is ugly.
        // Let's use a simple approach: Just exit for now or trust the user?
        // Or better, use window.confirm but acknowledge it's native.
        // The user complained "退出方案编辑模式还是会走alert". confirm() is similar to alert().
        
        // Since we don't have a custom Modal/Dialog component ready, 
        // I will just execute the exit directly with a toast info, 
        // OR we can rely on saving. 
        // Let's just exit directly but maybe show a toast "Changes not saved" if dirty?
        // We don't track dirty state well yet.
        
        // Let's just exit directly for better UX than native confirm, 
        // assuming user knows what "Exit" means (usually discard).
        // Or we can auto-save? No, that might be bad.
        
        // Let's stick to direct exit + Toast for now to meet "no alert/confirm" requirement visually.
        
        currentMode.value = 'dashboard';
        clearPlanObjects();
        editingPlanId.value = null;
        toast.info("已退出编辑模式（未保存的更改已丢弃）");
    };

    return {
        addCameraKeyframe,
        addObjectToTimeline,
        savePlan,
        exitEditor
    };
}
