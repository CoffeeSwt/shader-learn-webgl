<template>
    <div class="panel p-top-right pointer-events-auto" id="panel-info">
        <div class="panel-header">
            <span><i class="fas fa-info-circle"></i> 场馆/标签信息</span>
        </div>
        <div class="info-text" id="info-content" v-html="infoContent"></div>
    </div>
</template>

<script setup lang="ts">
import { useAnbaoState } from '../../composables/useAnbaoState';

const { infoContent } = useAnbaoState();
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

.info-text {
    font-size: 12px;
    line-height: 1.6;
    color: #ccc;
}

.pointer-events-auto {
    pointer-events: auto;
}
</style>
