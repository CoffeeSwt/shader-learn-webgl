<template>
    <div class="back-to-map-btn" @click="goBack">
        <i class="fas fa-arrow-left"></i> 返回地图
    </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

const goBack = () => {
    router.push('/anbao/map');
};
</script>

<style scoped>
.back-to-map-btn {
    position: absolute;
    top: 20px;
    left: 20px;
    z-index: 100;
    background: rgba(15, 23, 42, 0.85);
    border: 1px solid rgba(59, 130, 246, 0.3);
    color: #f59e0b;
    padding: 8px 15px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
    pointer-events: auto;
    transition: all 0.3s;
}

.back-to-map-btn:hover {
    background: rgba(59, 130, 246, 0.2);
    border-color: #f59e0b;
    transform: translateX(2px);
}
</style>
