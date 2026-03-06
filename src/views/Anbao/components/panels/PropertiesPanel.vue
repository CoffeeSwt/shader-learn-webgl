<template>
    <div class="properties-panel">
        <div class="panel-header">
            <span><i class="fas fa-sliders-h"></i> 属性面板</span>
        </div>
        
        <div v-if="selectedObjectIndex !== -1" class="properties-content">
            <div class="section-title">基本信息</div>
            <div class="control-row">
                <label>标签:</label>
                <input type="text" v-model="selectedObjectLabel" @change="updateObjectLabel" class="full-width">
            </div>

            <div class="section-title">位置 (Position)</div>
            <div class="control-group">
                <div class="control-item">
                    <label>X</label>
                    <input type="number" v-model.number="selectedObjectPos.x" step="1" @change="updateObjectPos">
                </div>
                <div class="control-item">
                    <label>Y</label>
                    <input type="number" v-model.number="selectedObjectPos.y" step="1" @change="updateObjectPos">
                </div>
                <div class="control-item">
                    <label>Z</label>
                    <input type="number" v-model.number="selectedObjectPos.z" step="1" @change="updateObjectPos">
                </div>
            </div>

            <div class="section-title">缩放 (Scale)</div>
            <div class="control-group">
                <div class="control-item">
                    <label>X</label>
                    <input type="number" v-model.number="selectedObjectScale.x" step="0.1" @change="updateObjectScale">
                </div>
                <div class="control-item">
                    <label>Y</label>
                    <input type="number" v-model.number="selectedObjectScale.y" step="0.1" @change="updateObjectScale">
                </div>
                <div class="control-item">
                    <label>Z</label>
                    <input type="number" v-model.number="selectedObjectScale.z" step="0.1" @change="updateObjectScale">
                </div>
            </div>
            
            <div class="control-row" style="margin-top:10px;">
                 <button class="action-btn" @click="deselectObject">取消选择</button>
            </div>
        </div>
        
        <!-- Show Animation Sequences when no object is selected -->
        <AnimationSequencesPanel v-else />
    </div>
</template>

<script setup lang="ts">
import { useAnbaoState } from '../../composables/useAnbaoState';
import { useInteraction } from '../../composables/useInteraction';
import AnimationSequencesPanel from './AnimationSequencesPanel.vue';

const { selectedObjectIndex } = useAnbaoState();
const { 
    selectedObjectPos, 
    selectedObjectScale, 
    selectedObjectLabel, 
    deselectObject, 
    updateObjectPos, 
    updateObjectScale, 
    updateObjectLabel 
} = useInteraction();
</script>

<style scoped>
.properties-panel {
    width: 100%;
    height: 100%;
    background: rgba(15, 23, 42, 0.95);
    border-left: 1px solid rgba(59, 130, 246, 0.3);
    display: flex;
    flex-direction: column;
    color: #f1f5f9;
    font-size: 12px;
}

.panel-header {
    padding: 10px 15px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    font-weight: bold;
    color: #3b82f6;
    background: rgba(0, 0, 0, 0.2);
}

.properties-content {
    padding: 15px;
    overflow-y: auto;
    flex: 1;
}

.empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #64748b;
    gap: 10px;
}

.empty-state i {
    font-size: 32px;
    opacity: 0.5;
}

.section-title {
    font-size: 11px;
    color: #94a3b8;
    margin: 15px 0 8px 0;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.section-title:first-child {
    margin-top: 0;
}

.control-row {
    margin-bottom: 10px;
}

.control-group {
    display: flex;
    gap: 5px;
    margin-bottom: 10px;
}

.control-item {
    flex: 1;
    display: flex;
    align-items: center;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 4px;
    padding: 2px 5px;
    border: 1px solid transparent;
}

.control-item:focus-within {
    border-color: #3b82f6;
}

.control-item label {
    color: #64748b;
    margin-right: 5px;
    font-size: 10px;
    cursor: ew-resize;
}

input[type="text"], input[type="number"] {
    background: transparent;
    border: none;
    color: white;
    width: 100%;
    outline: none;
    font-family: monospace;
    font-size: 12px;
}

input.full-width {
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 5px;
    border-radius: 4px;
}

input.full-width:focus {
    border-color: #3b82f6;
}

.action-btn {
    width: 100%;
    padding: 6px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: #f1f5f9;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
}

.action-btn:hover {
    background: rgba(255, 255, 255, 0.2);
}
</style>
