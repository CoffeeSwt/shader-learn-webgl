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

            <!-- Detail View Configuration -->
            <div class="section-title">详情视图配置</div>
            <div class="control-row" v-if="!hasDetailView">
                <button class="action-btn" @click="initDetailView">添加可视化组件</button>
            </div>
            <div v-else class="control-group-vertical">
                <div class="control-row">
                    <label>类型:</label>
                    <select v-model="detailViewConfig.type" class="full-width select-input">
                         <option value="bar">柱状图 (Bar)</option>
                         <option value="pie">饼图 (Pie)</option>
                         <option value="video">视频 (Video)</option>
                    </select>
                </div>
                <div class="control-row">
                    <label>标题:</label>
                    <input type="text" v-model="detailViewConfig.title" class="full-width">
                </div>
                <div class="control-row" v-if="detailViewConfig.type === 'video'">
                    <label>URL:</label>
                    <input type="text" v-model="detailViewConfig.url" class="full-width" placeholder="Video URL">
                </div>
                <div class="control-row" v-else>
                     <label>数据 (JSON):</label>
                     <textarea v-model="detailViewDataStr" class="full-width text-area" rows="3" placeholder='{"labels": ["A","B"], "values": [10, 20]}'></textarea>
                </div>
                <div class="control-row">
                    <button class="action-btn danger" @click="removeDetailView" style="border-color: #ef4444; color: #ef4444;">移除组件</button>
                </div>
            </div>

            <!-- Detail View Configuration -->
            <div class="section-title">详情视图配置</div>
            <div class="control-row" v-if="!hasDetailView">
                <button class="action-btn" @click="initDetailView">添加可视化组件</button>
            </div>
            <div v-else class="control-group-vertical">
                <div class="control-row">
                    <label>类型:</label>
                    <select v-model="detailViewConfig.type" class="full-width select-input">
                         <option value="bar">柱状图 (Bar)</option>
                         <option value="pie">饼图 (Pie)</option>
                         <option value="video">视频 (Video)</option>
                    </select>
                </div>
                <div class="control-row">
                    <label>标题:</label>
                    <input type="text" v-model="detailViewConfig.title" class="full-width">
                </div>
                <div class="control-row" v-if="detailViewConfig.type === 'video'">
                    <!-- Removed URL input, mock video doesn't need it -->
                    <div style="font-size:10px; color:#aaa;">(将显示模拟实时画面)</div>
                </div>
                <div class="control-row" v-else>
                     <label>静态数据 (JSON):</label>
                     <textarea v-model="detailViewDataStr" class="full-width text-area" rows="3" placeholder='{"labels": ["A","B"], "values": [10, 20]}'></textarea>
                </div>
                <div class="control-row">
                    <button class="action-btn danger" @click="removeDetailView" style="border-color: #ef4444; color: #ef4444;">移除组件</button>
                </div>
            </div>

            <!-- Dashboard Binding -->
            <div class="section-title">仪表盘配置</div>
            <div class="control-row">
                <div class="control-item" style="justify-content: space-between;">
                    <label>显示组件</label>
                    <input type="checkbox" :checked="isBound" @change="toggleBinding">
                </div>
            </div>
            
            <div v-if="isBound && boundWidget" class="control-group-vertical">
                <div class="control-row">
                    <label>类型:</label>
                    <select v-model="boundWidget.type" class="full-width select-input">
                        <option value="info">信息卡片 (Info)</option>
                        <option value="video">视频监控 (Video)</option>
                        <option value="camera-feed">实时画面 (Camera Feed)</option>
                        <option value="traffic">流量图表 (Traffic)</option>
                        <option value="gate-flow">闸机流量 (Gate Flow)</option>
                        <option value="event-info">事件信息 (Event Info)</option>
                    </select>
                </div>
                
                <div v-if="availableDataSources.length > 0" class="control-row">
                    <label>数据源:</label>
                    <select v-model="boundWidget.dataSourceId" class="full-width select-input">
                        <option :value="undefined">无</option>
                        <option v-for="ds in availableDataSources" :key="ds.id" :value="ds.id">
                            {{ ds.name }}
                        </option>
                    </select>
                </div>

                <div class="control-row">
                    <label>标题:</label>
                    <input type="text" v-model="boundWidget.title" class="full-width">
                </div>
                <div class="control-group">
                    <div class="control-item">
                        <label>Col</label>
                        <input type="number" v-model.number="boundWidget.layout.x" min="1" max="12">
                    </div>
                    <div class="control-item">
                        <label>Row</label>
                        <input type="number" v-model.number="boundWidget.layout.y" min="1" max="12">
                    </div>
                </div>
                <div class="control-group">
                    <div class="control-item">
                        <label>W</label>
                        <input type="number" v-model.number="boundWidget.layout.w" min="1" max="12">
                    </div>
                    <div class="control-item">
                        <label>H</label>
                        <input type="number" v-model.number="boundWidget.layout.h" min="1" max="12">
                    </div>
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
import { computed } from 'vue';
import { useAnbaoState } from '../../composables/useAnbaoState';
import { useInteraction } from '../../composables/useInteraction';
import { usePlans } from '../../composables/usePlans';
import AnimationSequencesPanel from './AnimationSequencesPanel.vue';
import { WidgetConfig } from '../../types/dashboard';
import { getDataSourcesByType, DataSourceType } from '../dashboard/DataSourceRegistry';

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

const { plans, editingPlanId, tempPlanData } = usePlans();

const selectedItem = computed(() => {
    if (selectedObjectIndex.value === -1) return null;
    return tempPlanData[selectedObjectIndex.value];
});

const currentDashboard = computed(() => {
    if (!editingPlanId.value || !plans[editingPlanId.value]) return null;
    // Ensure dashboard exists
    if (!plans[editingPlanId.value].dashboard) {
        plans[editingPlanId.value].dashboard = {
            widgets: [],
            grid: { columns: 3, rows: 2, gap: 20 }
        };
    }
    return plans[editingPlanId.value].dashboard!;
});

const boundWidget = computed(() => {
    if (!selectedItem.value?.id || !currentDashboard.value) return undefined;
    return currentDashboard.value.widgets.find(w => w.binding?.targetId === selectedItem.value!.id);
});

const isBound = computed(() => !!boundWidget.value);

const widgetTypeToDataSourceType: Record<string, DataSourceType> = {
    'video': 'video',
    'camera-feed': 'video',
    'traffic': 'traffic',
    'gate-flow': 'traffic',
    'event-info': 'events'
};

const availableDataSources = computed(() => {
    if (!boundWidget.value) return [];
    const dsType = widgetTypeToDataSourceType[boundWidget.value.type];
    if (!dsType) return [];
    return getDataSourcesByType(dsType).value;
});

const toggleBinding = () => {
    if (!currentDashboard.value || !selectedItem.value?.id) return;
    
    if (isBound.value) {
        // Remove
        const idx = currentDashboard.value.widgets.findIndex(w => w.binding?.targetId === selectedItem.value!.id);
        if (idx > -1) currentDashboard.value.widgets.splice(idx, 1);
    } else {
        // Add
        const newWidget: WidgetConfig = {
            id: 'w_' + Date.now(),
            type: selectedItem.value.type === 'camera' ? 'camera-feed' : (selectedItem.value.type === 'gate' ? 'gate-flow' : 'info'),
            title: selectedItem.value.label,
            layout: { x: 1, y: 1, w: 1, h: 1 },
            binding: {
                targetId: selectedItem.value.id
            }
        };
        currentDashboard.value.widgets.push(newWidget);
    }
};

// --- Detail View Logic ---
const hasDetailView = computed(() => !!selectedItem.value?.detailView);

const detailViewConfig = computed(() => {
    // Return a default object that satisfies DetailViewConfig interface if detailView is missing
    return selectedItem.value?.detailView || { type: 'info', title: '', url: '' };
});

const detailViewDataStr = computed({
    get: () => {
        if (!selectedItem.value?.detailView?.staticData) return '';
        return JSON.stringify(selectedItem.value.detailView.staticData, null, 2);
    },
    set: (val: string) => {
        if (!selectedItem.value || !selectedItem.value.detailView) return;
        try {
            selectedItem.value.detailView.staticData = JSON.parse(val);
        } catch (e) {
            // Ignore parse errors while typing
        }
    }
});

const initDetailView = () => {
    if (!selectedItem.value) return;
    selectedItem.value.detailView = {
        type: 'bar',
        title: selectedItem.value.label + ' Detail',
        staticData: { labels: ['A', 'B', 'C'], values: [10, 20, 15] }
    };
};

const removeDetailView = () => {
    if (!selectedItem.value) return;
    delete selectedItem.value.detailView;
};
</script>

<style scoped>
.text-area {
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: white;
    padding: 5px;
    border-radius: 4px;
    outline: none;
    font-family: monospace;
    font-size: 11px;
    resize: vertical;
}
.select-input {
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: white;
    padding: 5px;
    border-radius: 4px;
    outline: none;
}
.select-input option {
    background: #0f172a;
}
.control-group-vertical {
    display: flex;
    flex-direction: column;
    gap: 10px;
    background: rgba(255, 255, 255, 0.05);
    padding: 10px;
    border-radius: 4px;
    margin-bottom: 10px;
}

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
