<template>
    <div v-show="currentMode === 'edit'" id="editor-ui">
        <EditorToolbar />
        <TimelineEditor />
        <TransformControls />
    </div>
</template>

<script setup lang="ts">
import EditorToolbar from './editor/EditorToolbar.vue';
import TimelineEditor from './editor/TimelineEditor.vue';
import TransformControls from './editor/TransformControls.vue';
import { useAnbaoState } from '../composables/useAnbaoState';

const { currentMode } = useAnbaoState();
</script>

<style scoped>
#editor-ui {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding: 20px;
    padding-bottom: 20px;
    z-index: 20;
}
</style>
