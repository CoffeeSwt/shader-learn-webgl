<template>
    <div class="panel p-bottom-right pointer-events-auto" id="panel-plans">
        <div class="panel-header">
            <span><i class="fas fa-clipboard-list"></i> 安保方案管理</span>
            <i class="fas fa-plus-circle" style="cursor:pointer; color:var(--primary)" title="新建方案"
                @click="createPlan"></i>
        </div>
        <div class="plan-list" id="plan-list-container">
            <div v-for="(plan, id) in plans" :key="id" class="plan-item">
                <span :style="{ color: appliedPlanId === id ? 'var(--primary)' : '' }">
                    {{ plan.name }} <small style="color:#666; font-size:10px;">({{ plan.duration || 30
                        }}s)</small> {{ appliedPlanId === id ? '(当前)' : '' }}
                </span>
                <div class="plan-actions">
                    <i class="fas fa-edit" title="编辑" @click="editPlan(id as string)"></i>
                    <i :class="['fas', appliedPlanId === id ? 'fa-ban' : 'fa-check-circle']"
                        :title="appliedPlanId === id ? '取消应用' : '应用方案'"
                        :style="{ color: appliedPlanId === id ? 'var(--danger)' : '' }"
                        @click="appliedPlanId === id ? cancelAppliedPlan() : applyPlan(id as string)"></i>
                    <i class="fas fa-play" title="演示" @click="playDemo(id as string)"></i>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { usePlans } from '../../composables/usePlans';
import { usePlanActions } from '../../composables/usePlanActions';

const { plans, appliedPlanId } = usePlans();
const { applyPlan, cancelAppliedPlan, editPlan, createPlan, playDemo } = usePlanActions();
</script>

<style scoped>
.panel {
    background: rgba(15, 23, 42, 0.85);
    border: 1px solid rgba(59, 130, 246, 0.3);
    border-radius: 8px;
    padding: 15px;
    backdrop-filter: blur(10px);
    display: flex;
    flex-direction: column;
    transition: opacity 0.3s, transform 0.3s;
}

.panel-header {
    font-size: 14px;
    color: #3b82f6;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    padding-bottom: 8px;
    margin-bottom: 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.plan-list {
    flex: 1;
    overflow-y: auto;
}

.plan-item {
    padding: 10px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.plan-item:hover {
    background: rgba(255, 255, 255, 0.05);
}

.plan-actions i {
    margin-left: 8px;
    color: #aaa;
    cursor: pointer;
}

.plan-actions i:hover {
    color: #3b82f6;
}

.pointer-events-auto {
    pointer-events: auto;
}
</style>
