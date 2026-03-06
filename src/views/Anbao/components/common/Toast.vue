<template>
    <div :class="['anbao-toast', type]">
        <div class="toast-icon">
            <i v-if="type === 'success'" class="fas fa-check-circle"></i>
            <i v-else-if="type === 'error'" class="fas fa-exclamation-circle"></i>
            <i v-else-if="type === 'warning'" class="fas fa-exclamation-triangle"></i>
            <i v-else class="fas fa-info-circle"></i>
        </div>
        <div class="toast-content">
            <div v-if="title" class="toast-title">{{ title }}</div>
            <div class="toast-message">{{ message }}</div>
        </div>
        <div class="toast-close" @click="$emit('close')">
            <i class="fas fa-times"></i>
        </div>
        <div class="toast-progress" v-if="duration > 0" :style="{ animationDuration: duration + 'ms' }"></div>
    </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue';

defineProps<{
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    duration: number;
    title?: string;
}>();
</script>

<style scoped>
.anbao-toast {
    position: relative;
    display: flex;
    align-items: flex-start;
    width: 320px;
    background: rgba(15, 23, 42, 0.95);
    border: 1px solid rgba(59, 130, 246, 0.2);
    border-left-width: 4px;
    border-radius: 4px;
    padding: 12px 16px;
    margin-bottom: 10px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
    color: #f1f5f9;
    backdrop-filter: blur(4px);
    overflow: hidden;
    pointer-events: auto;
}

.anbao-toast.success { border-left-color: #10b981; }
.anbao-toast.error { border-left-color: #ef4444; }
.anbao-toast.warning { border-left-color: #f59e0b; }
.anbao-toast.info { border-left-color: #3b82f6; }

.toast-icon {
    margin-right: 12px;
    font-size: 18px;
    padding-top: 2px;
}

.success .toast-icon { color: #10b981; }
.error .toast-icon { color: #ef4444; }
.warning .toast-icon { color: #f59e0b; }
.info .toast-icon { color: #3b82f6; }

.toast-content {
    flex: 1;
}

.toast-title {
    font-weight: bold;
    font-size: 14px;
    margin-bottom: 4px;
    color: #fff;
}

.toast-message {
    font-size: 13px;
    color: #cbd5e1;
    line-height: 1.4;
}

.toast-close {
    cursor: pointer;
    opacity: 0.5;
    transition: opacity 0.2s;
    margin-left: 10px;
    padding-top: 2px;
}

.toast-close:hover {
    opacity: 1;
}

.toast-progress {
    position: absolute;
    bottom: 0;
    left: 0;
    height: 2px;
    background: rgba(255, 255, 255, 0.3);
    animation: progress linear forwards;
}

@keyframes progress {
    from { width: 100%; }
    to { width: 0%; }
}
</style>