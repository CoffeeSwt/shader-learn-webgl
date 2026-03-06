<template>
    <div v-if="appliedPlanId" id="applied-plan-badge" class="applied-plan-indicator" style="display: flex;">
        <i class="fas fa-check-circle"></i>
        <span id="applied-plan-name">当前方案: {{ plans[appliedPlanId]?.name }}</span>
        <i class="fas fa-times-circle" style="margin-left:10px; font-size:16px;" title="取消应用"
            @click="cancelAppliedPlan"></i>
    </div>
</template>

<script setup lang="ts">
import { usePlans } from '../composables/usePlans';
import { usePlanActions } from '../composables/usePlanActions';

const { plans, appliedPlanId } = usePlans();
const { cancelAppliedPlan } = usePlanActions();
</script>

<style scoped>
.applied-plan-indicator {
    position: absolute;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(16, 185, 129, 0.9);
    color: white;
    padding: 8px 20px;
    border-radius: 30px;
    border: 1px solid rgba(255, 255, 255, 0.3);
    align-items: center;
    gap: 10px;
    box-shadow: 0 0 15px rgba(16, 185, 129, 0.4);
    z-index: 25;
    pointer-events: auto;
    font-size: 14px;
}

.applied-plan-indicator i {
    cursor: pointer;
    opacity: 0.8;
}

.applied-plan-indicator i:hover {
    opacity: 1;
    transform: scale(1.1);
}
</style>
