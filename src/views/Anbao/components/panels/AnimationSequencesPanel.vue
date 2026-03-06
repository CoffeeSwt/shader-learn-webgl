<template>
    <div class="animation-sequences-panel">
        <div class="panel-header">
            <span><i class="fas fa-film"></i> 动画序列管理</span>
        </div>
        
        <div class="sequences-list">
            <div 
                v-for="(seq, index) in tempSequences" 
                :key="index"
                :class="['sequence-item', { active: currentSequenceIndex === index }]"
                @click="switchSequence(index)"
            >
                <div class="seq-info">
                    <div class="seq-name" v-if="editingNameIndex !== index" @dblclick="startRename(index)">
                        {{ seq.name }}
                    </div>
                    <input 
                        v-else 
                        ref="nameInput"
                        type="text" 
                        v-model="seq.name" 
                        class="name-input"
                        @blur="finishRename"
                        @keyup.enter="finishRename"
                    >
                    <div class="seq-meta">
                        <i class="fas fa-clock"></i> {{ seq.duration }}s | 
                        <i class="fas fa-key"></i> {{ seq.track ? seq.track.length : 0 }} 帧
                    </div>
                </div>
                
                <div class="seq-actions">
                    <i class="fas fa-trash-alt delete-btn" @click.stop="removeSequence(index)" title="删除序列"></i>
                </div>
                
                <!-- Keyframe Preview Strip -->
                <div class="keyframe-strip">
                    <div 
                        v-for="(kf, kfIndex) in seq.track" 
                        :key="kfIndex" 
                        class="kf-dot"
                        :style="{ left: (kf.t / seq.duration * 100) + '%' }"
                        :title="`Keyframe at ${kf.t}s`"
                    ></div>
                </div>
            </div>
        </div>

        <div class="add-btn-container">
            <button class="add-seq-btn" @click="addSequence">
                <i class="fas fa-plus"></i> 新建动画序列
            </button>
        </div>
        
        <div class="help-text">
            <p>* 双击名称可重命名</p>
            <p>* 点击列表项切换当前编辑的动画</p>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue';
import { usePlans } from '../../composables/usePlans';

const { tempSequences, currentSequenceIndex, switchSequence, addSequence, removeSequence } = usePlans();

const editingNameIndex = ref(-1);
const nameInput = ref<HTMLInputElement[] | null>(null);

const startRename = (index: number) => {
    editingNameIndex.value = index;
    nextTick(() => {
        if (nameInput.value && nameInput.value[0]) {
            nameInput.value[0].focus();
        }
    });
};

const finishRename = () => {
    editingNameIndex.value = -1;
};
</script>

<style scoped>
.animation-sequences-panel {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    color: #f1f5f9;
}

.panel-header {
    padding: 10px 15px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    font-weight: bold;
    color: #f59e0b; /* PPT style accent */
    background: rgba(0, 0, 0, 0.2);
}

.sequences-list {
    flex: 1;
    overflow-y: auto;
    padding: 10px;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.sequence-item {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    padding: 10px;
    cursor: pointer;
    position: relative;
    transition: all 0.2s;
}

.sequence-item:hover {
    background: rgba(255, 255, 255, 0.1);
}

.sequence-item.active {
    background: rgba(245, 158, 11, 0.15);
    border-color: #f59e0b;
}

.seq-info {
    margin-bottom: 5px;
}

.seq-name {
    font-size: 13px;
    font-weight: bold;
    color: #e2e8f0;
    margin-bottom: 4px;
}

.name-input {
    background: rgba(0,0,0,0.5);
    border: 1px solid #f59e0b;
    color: white;
    padding: 2px 5px;
    width: 100%;
    font-size: 13px;
    border-radius: 3px;
    outline: none;
}

.seq-meta {
    font-size: 11px;
    color: #94a3b8;
}

.seq-actions {
    position: absolute;
    top: 10px;
    right: 10px;
}

.delete-btn {
    color: #ef4444;
    opacity: 0;
    transition: opacity 0.2s;
}

.sequence-item:hover .delete-btn {
    opacity: 1;
}

.keyframe-strip {
    height: 4px;
    background: rgba(0,0,0,0.3);
    border-radius: 2px;
    position: relative;
    margin-top: 5px;
}

.kf-dot {
    position: absolute;
    top: 0;
    width: 4px;
    height: 4px;
    background: #f59e0b;
    border-radius: 50%;
    transform: translateX(-50%);
}

.add-btn-container {
    padding: 10px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.add-seq-btn {
    width: 100%;
    padding: 8px;
    background: rgba(245, 158, 11, 0.2);
    border: 1px solid rgba(245, 158, 11, 0.4);
    color: #f59e0b;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    transition: all 0.2s;
}

.add-seq-btn:hover {
    background: rgba(245, 158, 11, 0.3);
}

.help-text {
    padding: 0 10px 10px;
    font-size: 10px;
    color: #64748b;
}
</style>
