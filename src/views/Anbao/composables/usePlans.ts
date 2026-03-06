import { reactive, ref } from 'vue';
import type { Plans, PlanItem, CameraKeyframe } from '../types';

// Singleton state
const plans = reactive<Plans>({
    'plan1': {
        name: "常规安保方案 A",
        duration: 16,
        cameraTrack: [
            { t: 0, pos: { x: 120, y: 120, z: 120 }, target: { x: 0, y: 0, z: 0 } },
            { t: 3, pos: { x: 40, y: 20, z: 40 }, target: { x: 30, y: 2, z: 30 } },
            { t: 5, pos: { x: 20, y: 15, z: 40 }, target: { x: 30, y: 2, z: 30 } },
            { t: 7, pos: { x: 0, y: 5, z: 0 }, target: { x: -20, y: 2, z: -20 } },
            { t: 9, pos: { x: -15, y: 2, z: -10 }, target: { x: -20, y: 4, z: -20 } },
            { t: 11, pos: { x: 15, y: 8, z: 50 }, target: { x: 0, y: 1, z: 40 } },
            { t: 16, pos: { x: 0, y: 150, z: 100 }, target: { x: 0, y: 0, z: 0 } }
        ],
        items: [
            { type: 'camera', pos: { x: 30, y: 2, z: 30 }, label: "入口监控1", desc: "覆盖主入口区域", time: 3.5 },
            { type: 'guard', pos: { x: -20, y: 2, z: -20 }, label: "安保岗A", desc: "车辆引导", time: 7.5 },
            { type: 'barrier', pos: { x: 0, y: 1, z: 40 }, label: "限流围栏", desc: "防止人流", time: 11.5 }
        ]
    },
    'plan2': {
        name: "VIP特勤方案 B",
        duration: 13,
        cameraTrack: [
            { t: 0, pos: { x: -80, y: 30, z: 0 }, target: { x: 0, y: 10, z: 0 } },
            { t: 2.5, pos: { x: 40, y: 5, z: 0 }, target: { x: 50, y: 2, z: 0 } },
            { t: 4.5, pos: { x: 45, y: 8, z: 15 }, target: { x: 50, y: 2, z: 0 } },
            { t: 6, pos: { x: 30, y: 6, z: 15 }, target: { x: 40, y: 2, z: 0 } },
            { t: 9, pos: { x: 30, y: 6, z: -15 }, target: { x: 40, y: 2, z: 0 } },
            { t: 13, pos: { x: 45, y: 100, z: 0 }, target: { x: 45, y: 0, z: 0 } }
        ],
        items: [
            { type: 'camera', pos: { x: 50, y: 2, z: 0 }, label: "VIP通道监控", desc: "高精度全景", time: 2.5 },
            { type: 'guard', pos: { x: 40, y: 2, z: 0 }, label: "特勤小组", desc: "3人小组", time: 6.5 }
        ]
    }
});

const appliedPlanId = ref<string | null>(null);
const editingPlanId = ref<string | null>(null);

// Temp state for editing
const tempPlanData = reactive<PlanItem[]>([]);
const tempCameraTrack = reactive<CameraKeyframe[]>([]);
const currentPlanDuration = ref(30);

export function usePlans() {
    const createPlan = () => {
        const id = 'plan_' + Date.now();
        plans[id] = { name: "新建安保方案", items: [], cameraTrack: [], duration: 30 };
        return id;
    };

    const loadPlanToEdit = (planId: string) => {
        const plan = plans[planId];
        if (!plan) return false;
        
        editingPlanId.value = planId;
        tempPlanData.splice(0, tempPlanData.length, ...JSON.parse(JSON.stringify(plan.items || [])));
        tempCameraTrack.splice(0, tempCameraTrack.length, ...JSON.parse(JSON.stringify(plan.cameraTrack || [])));
        currentPlanDuration.value = plan.duration || 30;
        return true;
    };

    const saveCurrentPlan = () => {
        if (!editingPlanId.value || !plans[editingPlanId.value]) return false;
        
        plans[editingPlanId.value].items = JSON.parse(JSON.stringify(tempPlanData));
        plans[editingPlanId.value].cameraTrack = JSON.parse(JSON.stringify(tempCameraTrack));
        plans[editingPlanId.value].duration = currentPlanDuration.value;
        return plans[editingPlanId.value];
    };

    return {
        plans,
        appliedPlanId,
        editingPlanId,
        tempPlanData,
        tempCameraTrack,
        currentPlanDuration,
        createPlan,
        loadPlanToEdit,
        saveCurrentPlan
    };
}
