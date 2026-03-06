<template>
    <div class="header pointer-events-auto">
        <div class="logo">
            <i class="fas fa-shield-alt"></i> 
            <span class="main-title">智慧安保指挥平台</span>
            <span v-if="appliedPlanName" class="sub-title"> - {{ appliedPlanName }}</span>
        </div>
        <div class="right-section">
             <i class="fas fa-arrow-left back-icon" title="返回地图" @click="goBack" v-if="canGoBack"></i>
             <div class="clock" id="clock">{{ currentTime }}</div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useAnbaoState } from '../composables/useAnbaoState';
import { usePlans } from '../composables/usePlans';
import { useRouter, useRoute } from 'vue-router';
import { computed } from 'vue';

const { currentTime, updateClock } = useAnbaoState();
const { plans, appliedPlanId } = usePlans();
updateClock();

const router = useRouter();
const route = useRoute();

const canGoBack = computed(() => route.name === 'AnbaoVenue');

const appliedPlanName = computed(() => {
    if (appliedPlanId.value && plans[appliedPlanId.value]) {
        return plans[appliedPlanId.value].name;
    }
    return '';
});

const goBack = () => {
    router.push('/anbao/map');
};
</script>

<style scoped>
.header {
    height: 60px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: linear-gradient(180deg, rgba(0, 0, 0, 0.8) 0%, transparent 100%);
    margin: -20px -20px 20px -20px;
    padding: 0 30px;
    pointer-events: auto;
}

.logo {
    font-size: 24px;
    font-weight: bold;
    color: #3b82f6;
    text-shadow: 0 0 10px #3b82f6;
    display: flex;
    align-items: center;
    gap: 15px;
}

.sub-title {
    font-size: 18px;
    color: #f59e0b;
    font-weight: normal;
    text-shadow: none;
    margin-left: 5px;
}

.right-section {
    display: flex;
    align-items: center;
    gap: 20px;
}

.back-icon {
    font-size: 20px;
    color: #f59e0b;
    cursor: pointer;
    transition: all 0.3s;
}

.back-icon:hover {
    transform: scale(1.1);
    color: #fff;
}

.clock {
    font-family: monospace;
    color: #f59e0b;
    font-size: 16px;
}
</style>
