<template>
    <div class="track-editor">
        <div class="track-controls">
            <button class="editor-btn" @click="togglePlayEditor">
                <i :class="isEditorPlaying ? 'fas fa-pause' : 'fas fa-play'" id="play-icon"></i>
                <span id="play-text">{{ isEditorPlaying ? '暂停' : '播放预览' }}</span>
            </button>
            <button class="editor-btn" @click="stopEditor"><i class="fas fa-stop"></i> 停止</button>
            <div class="time-display" id="time-display">{{ formattedEditorTime }}</div>
            
            <div class="sequence-badge" v-if="tempSequences.length > 0">
                <i class="fas fa-film"></i> {{ currentSequenceName }}
            </div>

            <div style="flex:1;"></div>

            <!-- Duration Control -->
            <div style="display:flex; align-items:center; gap:5px; margin-right:15px; font-size:12px; color:#888;">
                <span>总时长(s):</span>
                <input type="number" v-model.number="currentPlanDuration" min="5" max="120"
                    style="width:50px; background:rgba(0,0,0,0.3); border:1px solid #555; color:white; padding:2px 5px; border-radius:4px;"
                    @change="updateDuration">
            </div>
        </div>
        <div class="tracks-container">
            <div class="track-headers" id="track-headers">
                <div class="track-header" style="height:20px;"></div> <!-- Ruler spacer -->
                <div class="track-header">镜头轨道</div>
                <!-- Dynamic Object Headers -->
                <div v-for="(item, idx) in tempPlanData" :key="idx" class="track-header"
                    :style="{ color: selectedObjectIndex === idx ? 'var(--primary)' : '' }" @click="selectObject(idx)">
                    {{ item.label }}
                </div>
            </div>
            <div class="timeline-area" id="timeline-area" ref="timelineAreaRef" @mousedown="startScrub">
                <div class="timeline-ruler" id="timeline-ruler">
                    <!-- Ruler Marks -->
                    <div v-for="i in Math.floor(currentPlanDuration / 5) + 1" :key="i" class="ruler-mark"
                        :style="{ left: ((i - 1) * 5 / currentPlanDuration * 100) + '%' }">
                        {{ (i - 1) * 5 }}s
                    </div>
                </div>
                <div id="track-lanes">
                    <div class="track-lane" id="camera-lane">
                        <div v-for="(key, idx) in tempCameraTrack" :key="idx" class="keyframe camera-key"
                            :style="{ left: (key.t / currentPlanDuration * 100) + '%' }" :title="`Camera: ${key.t}s`"
                            @click.stop="jumpToCameraKeyframe(key)"
                            @mousedown.stop="startDragCameraKeyframe($event, idx)"
                            @contextmenu.prevent="deleteCameraKeyframe(idx)"></div>
                    </div>
                    <!-- Dynamic Object Lanes -->
                    <div v-for="(item, idx) in tempPlanData" :key="idx" class="track-lane"
                        :style="{ background: selectedObjectIndex === idx ? 'rgba(59, 130, 246, 0.1)' : '' }">
                        <div class="keyframe" :style="{ left: ((item.time || 0) / currentPlanDuration * 100) + '%' }"
                            :title="`${item.label} appear @ ${item.time}s`"
                            @mousedown.stop="startDragKeyframe($event, idx)"></div>
                    </div>
                </div>
                <div class="playhead" id="playhead"
                    :style="{ left: (currentEditorTime / currentPlanDuration * 100) + '%' }">
                    <div class="playhead-handle"></div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted, computed } from 'vue';
import { usePlans } from '../../composables/usePlans';
import { useEditorState } from '../../composables/useEditorState';
import { useAnbaoState } from '../../composables/useAnbaoState';
import { useScene } from '../../composables/useScene';
import { useInteraction } from '../../composables/useInteraction';

const { tempPlanData, tempCameraTrack, currentPlanDuration, tempSequences, currentSequenceIndex } = usePlans();
const { currentEditorTime, isEditorPlaying, editorStartTime, formattedEditorTime } = useEditorState();
const { selectedObjectIndex } = useAnbaoState();
const { updateSceneAtTime, updateCameraPathVisuals, controls } = useScene();
const { selectObject } = useInteraction();

const timelineAreaRef = ref<HTMLElement | null>(null);

const currentSequenceName = computed(() => {
    if (tempSequences.length > 0 && currentSequenceIndex.value >= 0) {
        return tempSequences[currentSequenceIndex.value].name;
    }
    return '默认序列';
});

const jumpToTime = (t: number) => {
    currentEditorTime.value = Math.max(0, Math.min(t, currentPlanDuration.value));
    updateSceneAtTime(currentEditorTime.value, 'edit');
};

const updateDuration = () => {
    if (currentPlanDuration.value < 5) currentPlanDuration.value = 5;
};

const jumpToCameraKeyframe = (key: any) => {
    jumpToTime(key.t);
    if (controls.value) {
        controls.value.camera.position.set(key.pos.x, key.pos.y, key.pos.z);
        controls.value.target.set(key.target.x, key.target.y, key.target.z);
        controls.value.update();
    }
};

const deleteCameraKeyframe = (idx: number) => {
    if (confirm("删除这个镜头关键帧?")) {
        tempCameraTrack.splice(idx, 1);
        updateCameraPathVisuals('edit');
    }
};

// Playback Logic
let animationFrameId: number;

const togglePlayEditor = () => {
    if (isEditorPlaying.value) {
        stopEditor();
    } else {
        isEditorPlaying.value = true;
        editorStartTime.value = Date.now() - currentEditorTime.value * 1000;
        loop();
    }
};

const stopEditor = () => {
    isEditorPlaying.value = false;
    cancelAnimationFrame(animationFrameId);
};

const loop = () => {
    if (!isEditorPlaying.value) return;

    const now = Date.now();
    let t = (now - editorStartTime.value) / 1000;

    if (t > currentPlanDuration.value) {
        t = currentPlanDuration.value;
        stopEditor();
    }

    jumpToTime(t);
    animationFrameId = requestAnimationFrame(loop);
};

onUnmounted(() => {
    cancelAnimationFrame(animationFrameId);
});

// Drag Logic
const startScrub = (e: MouseEvent) => {
    if (isEditorPlaying.value) return;
    const updateScrub = (evt: MouseEvent) => {
        if (!timelineAreaRef.value) return;
        const rect = timelineAreaRef.value.getBoundingClientRect();
        let x = evt.clientX - rect.left;
        x = Math.max(0, Math.min(x, rect.width));
        const t = (x / rect.width) * currentPlanDuration.value;
        jumpToTime(t);
    };
    updateScrub(e);

    const onMove = (evt: MouseEvent) => updateScrub(evt);
    const onUp = () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
};

const startDragKeyframe = (e: MouseEvent, itemIndex: number) => {
    const onMove = (evt: MouseEvent) => {
        if (!timelineAreaRef.value) return;
        const rect = timelineAreaRef.value.getBoundingClientRect();
        let x = evt.clientX - rect.left;
        x = Math.max(0, Math.min(x, rect.width));
        const t = (x / rect.width) * currentPlanDuration.value;

        tempPlanData[itemIndex].time = Math.round(t * 10) / 10;
        updateSceneAtTime(currentEditorTime.value, 'edit');
    };
    const onUp = () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
};

const startDragCameraKeyframe = (e: MouseEvent, keyIndex: number) => {
    const onMove = (evt: MouseEvent) => {
        if (!timelineAreaRef.value) return;
        const rect = timelineAreaRef.value.getBoundingClientRect();
        let x = evt.clientX - rect.left;
        x = Math.max(0, Math.min(x, rect.width));
        const t = (x / rect.width) * currentPlanDuration.value;

        tempCameraTrack[keyIndex].t = Math.round(t * 10) / 10;
        tempCameraTrack.sort((a, b) => a.t - b.t);
        updateSceneAtTime(currentEditorTime.value, 'edit');
    };
    const onUp = () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
};
</script>

<style scoped>
.track-editor {
    pointer-events: auto;
    background: transparent; /* Background handled by parent */
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%; /* Fill container */
    position: relative;
    border: none; /* Border handled by parent */
}

.track-controls {
    pointer-events: auto;
    height: 40px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    padding: 0 15px;
    gap: 15px;
    background: rgba(0, 0, 0, 0.3);
}

.sequence-badge {
    background: rgba(59, 130, 246, 0.2);
    color: #93c5fd;
    padding: 3px 8px;
    border-radius: 12px;
    font-size: 11px;
    border: 1px solid rgba(59, 130, 246, 0.4);
    margin-left: 10px;
}

.time-display {
    font-family: monospace;
    color: #3b82f6;
    font-size: 14px;
    min-width: 60px;
}

.tracks-container {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    position: relative;
    display: flex;
}

.track-headers {
    width: 120px;
    border-right: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(0, 0, 0, 0.2);
    flex-shrink: 0;
}

.track-header {
    height: 30px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    display: flex;
    align-items: center;
    padding-left: 10px;
    font-size: 11px;
    color: #ccc;
    cursor: pointer;
}

.timeline-area {
    flex: 1;
    position: relative;
    overflow: hidden;
    cursor: crosshair;
}

.timeline-ruler {
    height: 20px;
    background: rgba(255, 255, 255, 0.05);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    position: relative;
}

.ruler-mark {
    position: absolute;
    top: 0;
    bottom: 0;
    border-left: 1px solid rgba(255, 255, 255, 0.2);
    font-size: 9px;
    color: #888;
    padding-left: 2px;
}

.track-lane {
    height: 30px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    position: relative;
}

.keyframe {
    position: absolute;
    top: 5px;
    width: 8px;
    height: 20px;
    background: #f59e0b;
    border-radius: 2px;
    cursor: pointer;
    transform: translateX(-50%);
    z-index: 2;
}

.keyframe:hover {
    background: white;
    z-index: 3;
}

.keyframe.camera-key {
    background: #3b82f6;
    border-radius: 50%;
    width: 12px;
    height: 12px;
    top: 9px;
}

.playhead {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 2px;
    background: #ef4444;
    z-index: 10;
    pointer-events: none;
}

.playhead-handle {
    position: absolute;
    top: 0;
    left: -5px;
    width: 12px;
    height: 12px;
    background: #ef4444;
    transform: rotate(45deg);
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
</style>


