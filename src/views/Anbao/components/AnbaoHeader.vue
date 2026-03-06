<template>
    <div class="header pointer-events-auto">
        <div class="logo"><i class="fas fa-shield-alt"></i> 智慧安保指挥平台</div>
        <div class="clock" id="clock">{{ currentTime }}</div>
    </div>
</template>

<script setup lang="ts">
import { useAnbaoState } from '../composables/useAnbaoState';

const { currentTime, updateClock } = useAnbaoState();
updateClock();
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
}

.logo {
    font-size: 24px;
    font-weight: bold;
    color: #3b82f6;
    text-shadow: 0 0 10px #3b82f6;
}

.clock {
    font-family: monospace;
    color: #f59e0b;
    font-size: 16px;
}

.pointer-events-auto {
    pointer-events: auto;
}
</style>
