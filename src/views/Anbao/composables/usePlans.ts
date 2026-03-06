import { reactive, ref, computed } from 'vue';
import type { Plans, PlanItem, CameraKeyframe, AnimationSequence } from '../types';

// Singleton state
const plans = reactive<Plans>({
    'plan1': {
        name: "常规安保方案 A",
        duration: 16,
        cameraTrack: [], // Keep empty or legacy, sequences will be primary
        sequences: [
            {
                name: "默认巡视路线",
                duration: 16,
                track: [
                    { t: 0, pos: { x: 120, y: 120, z: 120 }, target: { x: 0, y: 0, z: 0 } },
                    { t: 3, pos: { x: 40, y: 20, z: 40 }, target: { x: 30, y: 2, z: 30 } },
                    { t: 5, pos: { x: 20, y: 15, z: 40 }, target: { x: 30, y: 2, z: 30 } },
                    { t: 7, pos: { x: 0, y: 5, z: 0 }, target: { x: -20, y: 2, z: -20 } },
                    { t: 9, pos: { x: -15, y: 2, z: -10 }, target: { x: -20, y: 4, z: -20 } },
                    { t: 11, pos: { x: 15, y: 8, z: 50 }, target: { x: 0, y: 1, z: 40 } },
                    { t: 16, pos: { x: 0, y: 150, z: 100 }, target: { x: 0, y: 0, z: 0 } }
                ]
            }
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
        cameraTrack: [],
        sequences: [
            {
                name: "VIP进场路线",
                duration: 13,
                track: [
                    { t: 0, pos: { x: -80, y: 30, z: 0 }, target: { x: 0, y: 10, z: 0 } },
                    { t: 2.5, pos: { x: 40, y: 5, z: 0 }, target: { x: 50, y: 2, z: 0 } },
                    { t: 4.5, pos: { x: 45, y: 8, z: 15 }, target: { x: 50, y: 2, z: 0 } },
                    { t: 6, pos: { x: 30, y: 6, z: 15 }, target: { x: 40, y: 2, z: 0 } },
                    { t: 9, pos: { x: 30, y: 6, z: -15 }, target: { x: 40, y: 2, z: 0 } },
                    { t: 13, pos: { x: 45, y: 100, z: 0 }, target: { x: 45, y: 0, z: 0 } }
                ]
            }
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
const tempSequences = reactive<AnimationSequence[]>([]);
const currentSequenceIndex = ref(0);
const tempCameraTrack = reactive<CameraKeyframe[]>([]); // Current sequence track
const currentPlanDuration = ref(30);

export function usePlans() {
    const createPlan = () => {
        const id = 'plan_' + Date.now();
        // @ts-ignore
        plans[id] = { 
            name: "新建安保方案", 
            items: [], 
            cameraTrack: [], 
            sequences: [
                { name: "默认序列", duration: 30, track: [] }
            ],
            duration: 30 
        };
        return id;
    };

    const loadPlanToEdit = (planId: string) => {
        const plan = plans[planId];
        if (!plan) return false;
        
        editingPlanId.value = planId;
        tempPlanData.splice(0, tempPlanData.length, ...JSON.parse(JSON.stringify(plan.items || [])));
        
        // Handle sequences
        tempSequences.splice(0, tempSequences.length);
        if (plan.sequences && plan.sequences.length > 0) {
            tempSequences.push(...JSON.parse(JSON.stringify(plan.sequences)));
        } else {
            // Migration for old plans
            const track = plan.cameraTrack && plan.cameraTrack.length > 0 
                ? JSON.parse(JSON.stringify(plan.cameraTrack)) 
                : [];
            tempSequences.push({
                name: "默认序列",
                duration: plan.duration || 30,
                track: track
            });
        }
        
        currentSequenceIndex.value = 0;
        loadSequenceToTrack(0);
        
        return true;
    };

    const loadSequenceToTrack = (index: number) => {
        if (index < 0 || index >= tempSequences.length) return;
        const seq = tempSequences[index];
        tempCameraTrack.splice(0, tempCameraTrack.length, ...JSON.parse(JSON.stringify(seq.track || [])));
        currentPlanDuration.value = seq.duration;
    };

    const switchSequence = (index: number) => {
        // Save current track to sequence before switching
        if (currentSequenceIndex.value >= 0 && currentSequenceIndex.value < tempSequences.length) {
            tempSequences[currentSequenceIndex.value].track = JSON.parse(JSON.stringify(tempCameraTrack));
            tempSequences[currentSequenceIndex.value].duration = currentPlanDuration.value;
        }
        
        currentSequenceIndex.value = index;
        loadSequenceToTrack(index);
    };

    const addSequence = () => {
        const newSeq: AnimationSequence = {
            name: `序列 ${tempSequences.length + 1}`,
            duration: 30,
            track: []
        };
        tempSequences.push(newSeq);
        // Switch to new sequence
        switchSequence(tempSequences.length - 1);
    };

    const removeSequence = (index: number) => {
        if (tempSequences.length <= 1) {
            alert("至少保留一个序列");
            return;
        }
        
        tempSequences.splice(index, 1);
        
        // Adjust index if needed
        if (currentSequenceIndex.value >= index) {
            currentSequenceIndex.value = Math.max(0, currentSequenceIndex.value - 1);
        }
        
        // Force reload current track
        loadSequenceToTrack(currentSequenceIndex.value);
    };
    
    const updateSequenceName = (index: number, name: string) => {
        if (index >= 0 && index < tempSequences.length) {
            tempSequences[index].name = name;
        }
    };

    const saveCurrentPlan = () => {
        if (!editingPlanId.value || !plans[editingPlanId.value]) return false;
        
        // Save current track back to sequence first
        if (currentSequenceIndex.value >= 0 && currentSequenceIndex.value < tempSequences.length) {
            tempSequences[currentSequenceIndex.value].track = JSON.parse(JSON.stringify(tempCameraTrack));
            tempSequences[currentSequenceIndex.value].duration = currentPlanDuration.value;
        }

        plans[editingPlanId.value].items = JSON.parse(JSON.stringify(tempPlanData));
        plans[editingPlanId.value].sequences = JSON.parse(JSON.stringify(tempSequences));
        
        // Update deprecated fields for compatibility if needed, or just set to first sequence
        if (tempSequences.length > 0) {
            plans[editingPlanId.value].cameraTrack = JSON.parse(JSON.stringify(tempSequences[0].track));
            plans[editingPlanId.value].duration = tempSequences[0].duration;
        }
        
        return plans[editingPlanId.value];
    };

    return {
        plans,
        appliedPlanId,
        editingPlanId,
        tempPlanData,
        tempSequences,
        currentSequenceIndex,
        tempCameraTrack,
        currentPlanDuration,
        createPlan,
        loadPlanToEdit,
        saveCurrentPlan,
        switchSequence,
        addSequence,
        removeSequence,
        updateSequenceName
    };
}
