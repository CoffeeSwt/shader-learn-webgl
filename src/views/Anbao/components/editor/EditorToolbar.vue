<template>
    <div class="editor-toolbar-container">
        <div class="brand">
            <i class="fas fa-shield-alt"></i> 安保方案编辑器
        </div>
        
        <div class="divider"></div>

        <div class="tool-group">
            <button class="tool-btn" @click="addObjectToTimeline('camera')" title="添加监控">
                <i class="fas fa-video"></i>
            </button>
            <button class="tool-btn" @click="addObjectToTimeline('guard')" title="添加保安">
                <i class="fas fa-user-shield"></i>
            </button>
            <button class="tool-btn" @click="addObjectToTimeline('gate')" title="添加闸机">
                <i class="fas fa-door-open"></i>
            </button>
            <button class="tool-btn" @click="addObjectToTimeline('scanner')" title="添加安检">
                <i class="fas fa-tablet-alt"></i>
            </button>
        </div>

        <div class="divider"></div>

        <div class="tool-group">
            <button class="tool-btn" @click="startDrawLine('barrier')" title="画水马 (拖拽绘制)">
                <i class="fas fa-road"></i>
            </button>
            <button class="tool-btn" @click="startDrawLine('fence')" title="画铁马 (拖拽绘制)">
                <i class="fas fa-th"></i>
            </button>
        </div>

        <div class="divider"></div>

        <div class="tool-group">
            <button class="tool-btn" @click="addCameraKeyframe" title="记录当前镜头视角">
                <i class="fas fa-camera"></i>
            </button>
        </div>

        <div class="spacer"></div>

        <div class="tool-group right">
            <button class="tool-btn primary" @click="savePlan">
                <i class="fas fa-save"></i> 保存
            </button>
            <button class="tool-btn danger" @click="exitEditor">
                <i class="fas fa-times"></i> 退出
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useEditorActions } from '../../composables/useEditorActions';
import { useInteraction } from '../../composables/useInteraction';

const { addCameraKeyframe, addObjectToTimeline, savePlan, exitEditor } = useEditorActions();
const { startDrawingLine } = useInteraction();

const startDrawLine = (type: string) => {
    startDrawingLine(type);
};
</script>

<style scoped>
.editor-toolbar-container {
    width: 100%;
    height: 100%;
    background: #1e293b;
    display: flex;
    align-items: center;
    padding: 0 20px;
    border-bottom: 1px solid #334155;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.brand {
    font-weight: bold;
    color: #f59e0b;
    display: flex;
    align-items: center;
    gap: 10px;
    margin-right: 10px;
    font-size: 16px;
}

.divider {
    width: 1px;
    height: 24px;
    background: #475569;
    margin: 0 15px;
}

.tool-group {
    display: flex;
    gap: 5px;
}

.tool-btn {
    width: 36px;
    height: 36px;
    border-radius: 6px;
    border: 1px solid transparent;
    background: rgba(255, 255, 255, 0.05);
    color: #cbd5e1;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
}

.tool-btn:hover {
    background: #3b82f6;
    color: white;
    transform: translateY(-1px);
}

.tool-btn:active {
    transform: translateY(0);
}

.tool-btn.primary {
    background: #3b82f6;
    color: white;
    width: auto;
    padding: 0 15px;
    font-size: 13px;
    gap: 5px;
}

.tool-btn.primary:hover {
    background: #2563eb;
}

.tool-btn.danger {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
    border: 1px solid rgba(239, 68, 68, 0.2);
    width: auto;
    padding: 0 15px;
    font-size: 13px;
    gap: 5px;
}

.tool-btn.danger:hover {
    background: #ef4444;
    color: white;
}

.spacer {
    flex: 1;
}
</style>
