<template>
    <div v-show="showResetBtn" id="reset-btn" class="reset-btn" style="display: block;" @click="resetView">
        <i class="fas fa-undo"></i> 重置视角
    </div>
</template>

<script setup lang="ts">
import { useAnbaoState } from '../composables/useAnbaoState';
import { useScene } from '../composables/useScene';

const { showResetBtn } = useAnbaoState();
const { resetView } = useScene();
</script>

<style scoped>
.reset-btn {
    position: absolute;
    bottom: 180px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(239, 68, 68, 0.8);
    color: white;
    padding: 8px 20px;
    border-radius: 20px;
    cursor: pointer;
    border: 1px solid rgba(255, 255, 255, 0.3);
    pointer-events: auto;
    z-index: 20;
    transition: all 0.3s;
    box-shadow: 0 0 15px rgba(239, 68, 68, 0.5);
}

.reset-btn:hover {
    background: rgba(239, 68, 68, 1);
    transform: translateX(-50%) scale(1.05);
}
</style>
