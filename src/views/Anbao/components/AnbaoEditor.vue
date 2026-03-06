<template>
    <div v-show="currentMode === 'edit'" id="editor-layout">
        <!-- Top Toolbar -->
        <div class="layout-header">
            <EditorToolbar />
        </div>

        <!-- Main Content Area (Split: Viewport | Properties) -->
        <div class="layout-body">
            <!-- Viewport Overlay (Transparent, passes events to canvas below) -->
            <div class="viewport-area">
                <!-- TransformControls integrated into PropertiesPanel now, but keeping slot if needed -->
                <!-- 3D Canvas is behind this layer in index.vue -->
            </div>

            <!-- Properties Panel (Right Sidebar) -->
            <div class="properties-area">
                <PropertiesPanel />
            </div>
        </div>

        <!-- Bottom Timeline -->
        <div class="layout-footer">
            <TimelineEditor />
        </div>
    </div>
</template>

<script setup lang="ts">
import EditorToolbar from './editor/EditorToolbar.vue';
import TimelineEditor from './editor/TimelineEditor.vue';
import PropertiesPanel from './panels/PropertiesPanel.vue';
import { useAnbaoState } from '../composables/useAnbaoState';

const { currentMode } = useAnbaoState();
</script>

<style scoped>
#editor-layout {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none; /* Let clicks pass through to canvas where no UI exists */
    display: flex;
    flex-direction: column;
    z-index: 20;
    background: transparent;
}

.layout-header {
    height: 50px;
    pointer-events: auto;
    display: flex;
    align-items: center;
    background: transparent; 
}

.layout-body {
    flex: 1;
    display: flex;
    overflow: hidden;
}

.viewport-area {
    flex: 1;
    position: relative;
    /* Transparent so we see the 3D scene */
}

.properties-area {
    width: 250px;
    background: rgba(15, 23, 42, 0.9);
    pointer-events: auto;
    border-left: 1px solid rgba(59, 130, 246, 0.3);
    display: flex;
    flex-direction: column;
    backdrop-filter: blur(5px);
}

.layout-footer {
    height: 200px; /* Fixed height for timeline */
    background: rgba(15, 23, 42, 0.95);
    border-top: 1px solid rgba(59, 130, 246, 0.3);
    pointer-events: auto;
}
</style>
