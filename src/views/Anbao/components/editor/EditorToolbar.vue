<template>
    <div class="editor-toolbar">
        <div style="font-weight:bold; color:var(--accent); margin-right:10px; display:flex; align-items:center;">
            方案编辑器</div>
        <button class="editor-btn" @click="addCameraKeyframe"><i class="fas fa-camera"></i> 记录镜头</button>
        <button class="editor-btn" @click="addObjectToTimeline('camera')"><i class="fas fa-video"></i>
            加监控</button>
        <button class="editor-btn" @click="addObjectToTimeline('guard')"><i class="fas fa-user-shield"></i>
            加保安</button>
        <button class="editor-btn" @click="addObjectToTimeline('barrier')"><i class="fas fa-bars"></i>
            加围栏</button>
        <div style="width:1px; background:#555; margin:0 5px;"></div>
        <button class="editor-btn" @click="savePlan"><i class="fas fa-save"></i> 保存方案</button>
        <button class="editor-btn danger" @click="exitEditor"><i class="fas fa-times"></i> 退出编辑</button>
        <div style="font-size:10px; color:#aaa; margin-left:10px; display:flex; align-items:center;">
            <i class="fas fa-mouse" style="margin-right:5px;"></i> 左键旋转 | 右键平移
        </div>
    </div>
</template>

<script setup lang="ts">
import { useEditorActions } from '../../composables/useEditorActions';

const { addCameraKeyframe, addObjectToTimeline, savePlan, exitEditor } = useEditorActions();
</script>

<style scoped>
.editor-toolbar {
    position: absolute;
    top: 70px;
    left: 20px;
    pointer-events: auto;
    background: rgba(15, 23, 42, 0.85);
    border: 1px solid rgba(59, 130, 246, 0.3);
    border-radius: 8px;
    padding: 10px;
    display: flex;
    gap: 10px;
    margin-top: 0;
}

.editor-btn {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: white;
    padding: 5px 15px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
}

.editor-btn:hover {
    background: #3b82f6;
}

.editor-btn.danger {
    border-color: #ef4444;
    color: #ef4444;
}

.editor-btn.danger:hover {
    background: #ef4444;
    color: white;
}
</style>
