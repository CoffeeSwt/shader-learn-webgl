<template>
    <div class="dashboard-grid">
        <TrafficPanel />
        <VideoPanel />
        
        <!-- Center Spacer -->
        <div class="p-center"></div>

        <InfoPanel />
        <PlanListPanel />
    </div>
</template>

<script setup lang="ts">
import TrafficPanel from './panels/TrafficPanel.vue';
import VideoPanel from './panels/VideoPanel.vue';
import InfoPanel from './panels/InfoPanel.vue';
import PlanListPanel from './panels/PlanListPanel.vue';
</script>

<style scoped>
.dashboard-grid {
    flex: 1;
    display: grid;
    grid-template-columns: 350px 1fr 350px;
    grid-template-rows: 1fr 1fr;
    gap: 20px;
    min-height: 0;
}

.p-top-left { grid-column: 1; grid-row: 1; }
.p-bottom-left { grid-column: 1; grid-row: 2; }
.p-top-right { grid-column: 3; grid-row: 1; }
.p-bottom-right { grid-column: 3; grid-row: 2; }
.p-center {
    grid-column: 2;
    grid-row: 1 / span 2;
    pointer-events: none;
    position: relative;
}
</style>
