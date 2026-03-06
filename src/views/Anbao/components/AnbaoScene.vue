<template>
    <div class="anbao-container-inner">
        <!-- 3D Background -->
        <div ref="canvasContainer" id="canvas-container" @click="handleClick"></div>
        <!-- HTML Labels Container -->
        <div ref="labelsContainer" id="labels-container"></div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useScene } from '../composables/useScene';
import { useInteraction } from '../composables/useInteraction';

const canvasContainer = ref<HTMLDivElement | null>(null);
const labelsContainer = ref<HTMLDivElement | null>(null);

const { init3D, animate } = useScene();
const { onSceneClick, setupDragControls } = useInteraction();

const handleClick = (e: MouseEvent) => {
    onSceneClick(e);
};

onMounted(() => {
    if (canvasContainer.value && labelsContainer.value) {
        init3D(canvasContainer.value, labelsContainer.value);
        setupDragControls();
        animate();
    }
});
</script>

<style scoped>
.anbao-container-inner {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
}

#canvas-container {
    width: 100%;
    height: 100%;
    background: radial-gradient(circle at center, #1e293b 0%, #000 100%);
}

#labels-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
}
</style>
