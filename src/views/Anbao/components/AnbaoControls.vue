<template>
    <div class="center-controls-container" id="center-controls">
        <!-- Reset View Button (Visible in Dashboard Mode) -->
        <button v-show="showResetBtn && currentMode !== 'edit'" class="reset-btn" @click="resetView">
            <i class="fas fa-undo"></i> 重置视角
        </button>

        <!-- Main Controls (Only visible in Dashboard/Roam mode) -->
        <div v-show="currentMode !== 'edit'" class="controls-group">
            <!-- Layer Control -->
            <div class="layer-control">
                <div :class="['layer-item', { active: layers.location }]" @click="toggleLayer('location')"><i
                        class="fas fa-map-marker-alt"></i> 地点标签</div>
                <div :class="['layer-item', { active: layers.plan }]" @click="toggleLayer('plan')"><i
                        class="fas fa-shield-alt"></i> 安保方案</div>
            </div>

            <!-- Rotation Control -->
            <div v-show="currentMode === 'dashboard'" class="rotate-control" id="rotate-ui">
                <label><input type="checkbox" v-model="autoRotate" @change="toggleAutoRotate"> 自动巡航</label>
                <span style="border-left:1px solid #555; height:15px; margin:0 5px;"></span>
                <i class="fas fa-tachometer-alt"></i>
                <input type="range" min="1" max="10" v-model.number="rotateSpeed" @input="setRotateSpeed">
            </div>

            <!-- Mode Switcher -->
            <div class="mode-switcher">
                <button class="mode-btn" @click="setMode('dashboard')">指挥看板</button>
                <button class="mode-btn" @click="setMode('roam')">自由漫游</button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useScene } from '../composables/useScene';
import { useAnbaoState } from '../composables/useAnbaoState';

const { layers, autoRotate, rotateSpeed, controls, objects, cameraHelpersGroup, resetView, setCallbacks } = useScene();
const { currentMode, showResetBtn } = useAnbaoState();

onMounted(() => {
    setCallbacks(
        () => { showResetBtn.value = true; },
        () => { showResetBtn.value = false; }
    );
});

const toggleLayer = (layer: 'base' | 'location' | 'plan') => {
    layers[layer] = !layers[layer];
    if (layer === 'plan') {
        objects.value.forEach(o => o.visible = layers[layer]);
    }
};

const toggleAutoRotate = () => {
    if (controls.value) controls.value.autoRotate = autoRotate.value;
};

const setRotateSpeed = () => {
    if (controls.value) controls.value.rotateSpeed = rotateSpeed.value * 0.001;
};

const setMode = (mode: string) => {
    currentMode.value = mode;
    if (cameraHelpersGroup.value) cameraHelpersGroup.value.visible = (mode === 'edit');
};
</script>

<style scoped>
.center-controls-container {
    position: absolute;
    bottom: 30px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 15px;
    z-index: 15;
    pointer-events: none;
    transition: opacity 0.3s;
}

.controls-group {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 15px;
    pointer-events: none; /* Let children handle events */
}

.controls-group > * {
    pointer-events: auto;
}

.reset-btn {
    background: rgba(239, 68, 68, 0.8);
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 20px;
    cursor: pointer;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
    transition: all 0.2s;
    animation: fadeIn 0.3s ease-out;
    pointer-events: auto; /* Ensure it is clickable */
}

.reset-btn:hover {
    background: rgba(239, 68, 68, 1);
    transform: scale(1.05);
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}

.layer-control {
    background: rgba(0, 0, 0, 0.6);
    padding: 5px 15px;
    border-radius: 20px;
    border: 1px solid #555;
    display: flex;
    gap: 15px;
}

.layer-item {
    font-size: 12px;
    color: #ccc;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 5px;
}

.layer-item.active {
    color: #3b82f6;
    font-weight: bold;
}

.rotate-control {
    background: rgba(0, 0, 0, 0.6);
    padding: 5px 15px;
    border-radius: 20px;
    border: 1px solid #555;
    display: flex;
    gap: 15px;
    align-items: center;
    font-size: 12px;
    color: #ccc;
}

.rotate-control input[type="range"] {
    width: 100px;
    accent-color: #3b82f6;
}

.mode-switcher {
    display: flex;
    gap: 10px;
}

.mode-btn {
    padding: 8px 20px;
    background: rgba(0, 0, 0, 0.6);
    border: 1px solid #3b82f6;
    color: #3b82f6;
    border-radius: 20px;
    cursor: pointer;
    font-size: 14px;
    transition: 0.2s;
}

.mode-btn:hover {
    background: #3b82f6;
    color: white;
}
</style>
