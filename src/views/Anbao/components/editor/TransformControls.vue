<template>
    <div v-show="selectedObjectIndex !== -1" id="transform-controls" class="transform-controls">
        <div class="panel-header">
            <span><i class="fas fa-arrows-alt"></i> 调整位置</span>
            <i class="fas fa-times" style="cursor:pointer;" @click="deselectObject"></i>
        </div>
        <div class="control-row">
            <label>X</label> <input type="number" v-model.number="selectedObjectPos.x" step="1"
                @change="updateObjectPos">
        </div>
        <div class="control-row">
            <label>Y</label> <input type="number" v-model.number="selectedObjectPos.y" step="1"
                @change="updateObjectPos">
        </div>
        <div class="control-row">
            <label>Z</label> <input type="number" v-model.number="selectedObjectPos.z" step="1"
                @change="updateObjectPos">
        </div>
        <div class="control-row" style="margin-top:5px; border-top:1px solid #333; padding-top:5px;">
            <label style="width:auto;">标签:</label>
            <input type="text" v-model="selectedObjectLabel" style="width:100px;" @change="updateObjectLabel">
        </div>
        <p style="font-size:10px; color:#888; margin-top:5px;">* 也可以在场景中直接拖拽</p>
    </div>
</template>

<script setup lang="ts">
import { useAnbaoState } from '../../composables/useAnbaoState';
import { useInteraction } from '../../composables/useInteraction';

const { selectedObjectIndex } = useAnbaoState();
const { selectedObjectPos, selectedObjectLabel, deselectObject, updateObjectPos, updateObjectLabel } = useInteraction();
</script>

<style scoped>
.transform-controls {
    position: absolute;
    bottom: 250px;
    right: 20px;
    background: rgba(15, 23, 42, 0.85);
    border: 1px solid rgba(59, 130, 246, 0.3);
    border-radius: 8px;
    padding: 10px;
    display: flex;
    flex-direction: column;
    gap: 5px;
    pointer-events: auto;
    width: 200px;
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

.control-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 12px;
}

.control-row label {
    color: #aaa;
    width: 20px;
}

.control-row input {
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid #555;
    color: white;
    width: 50px;
    padding: 2px 5px;
    border-radius: 4px;
}
</style>
