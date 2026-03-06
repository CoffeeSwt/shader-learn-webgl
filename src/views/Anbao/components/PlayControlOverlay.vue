<template>
    <div v-show="isAnimating" id="play-control-overlay">
        <div class="play-ctrl-btn" @click="toggleDemoPause" title="暂停/继续">
            <i :class="isDemoPaused ? 'fas fa-play' : 'fas fa-pause'" id="demo-pause-icon"></i>
        </div>
        <div class="play-ctrl-btn danger" @click="stopDemo" title="停止演示">
            <i class="fas fa-stop"></i>
        </div>
        <div style="color:white; font-size:12px; display:flex; align-items:center; margin-left:10px;">
            <span id="demo-time">{{ formatTime(demoElapsedTime) }}</span> / <span id="demo-total">{{
                formatTime(demoDuration) }}</span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useScene } from '../composables/useScene';
import { usePlanActions } from '../composables/usePlanActions';

const { isAnimating } = useScene();
const { toggleDemoPause, stopDemo, isDemoPaused, demoElapsedTime, demoDuration } = usePlanActions();

const formatTime = (t: number) => {
    const s = Math.floor(t);
    const ms = Math.floor((t - s) * 10);
    return s.toString().padStart(2, '0') + ':' + ms + '0';
};
</script>

<style scoped>
#play-control-overlay {
    position: absolute;
    bottom: 120px;
    left: 50%;
    transform: translateX(-50%);
    gap: 15px;
    pointer-events: auto;
    z-index: 30;
    background: rgba(0, 0, 0, 0.7);
    padding: 10px 20px;
    border-radius: 30px;
    border: 1px solid #3b82f6;
    display: flex;
}

.play-ctrl-btn {
    color: white;
    font-size: 20px;
    cursor: pointer;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    transition: all 0.2s;
}

.play-ctrl-btn:hover {
    background: #3b82f6;
    transform: scale(1.1);
}

.play-ctrl-btn.danger:hover {
    background: #ef4444;
}
</style>
