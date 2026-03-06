<template>
    <div v-if="showDetailPopup && detailViewObject" class="detail-popup" :style="popupStyle">
        <div class="popup-header">
            <span><i class="fas fa-info-circle"></i> {{ detailViewObject.detailView?.title || detailViewObject.label }}</span>
            <i class="fas fa-times close-btn" @click="closeDetail"></i>
        </div>
        <div class="popup-content">
            <!-- Video Type -->
            <div v-if="detailViewObject.detailView?.type === 'video'" class="video-container">
                 <div class="video-wrapper">
                    <div class="live-badge">● LIVE</div>
                    <div class="camera-overlay">
                        <span>{{ detailViewObject.label }}</span>
                        <span>{{ new Date().toLocaleTimeString() }}</span>
                    </div>
                    <!-- Mock Video Placeholder -->
                    <div class="mock-video-feed">
                        <i class="fas fa-video"></i>
                        <span>Signal Connected</span>
                    </div>
                 </div>
            </div>

            <!-- Chart Type -->
            <div v-else-if="detailViewObject.detailView?.type && ['bar', 'pie'].includes(detailViewObject.detailView.type)" class="chart-wrapper">
                <div ref="chartRef" class="chart-container"></div>
            </div>

            <!-- Default Info Type -->
            <div v-else class="info-content">
                <div class="info-row">
                    <span class="label">设备ID:</span>
                    <span class="value">{{ detailViewObject.id || '-' }}</span>
                </div>
                <div class="info-row">
                    <span class="label">类型:</span>
                    <span class="value">{{ detailViewObject.type }}</span>
                </div>
                <div class="info-row">
                    <span class="label">名称:</span>
                    <span class="value">{{ detailViewObject.label }}</span>
                </div>
                <div class="info-row">
                    <span class="label">位置:</span>
                    <span class="value">X:{{ detailViewObject.pos.x }} Y:{{ detailViewObject.pos.y }} Z:{{ detailViewObject.pos.z }}</span>
                </div>
                <div class="info-row">
                    <span class="label">状态:</span>
                    <span class="value status-ok">运行正常</span>
                </div>
                 <div class="info-description">
                    <span class="label">描述:</span>
                    <p>{{ detailViewObject.desc || '暂无描述信息' }}</p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useAnbaoState } from '../composables/useAnbaoState';
import { computed, ref, watch, nextTick, onUnmounted } from 'vue';

const { showDetailPopup, detailViewObject, closeDetail } = useAnbaoState();
const chartRef = ref<HTMLElement | null>(null);
let chartInstance: any = null;

const popupStyle = computed(() => {
    return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
    };
});

const renderChart = () => {
    if (!chartRef.value || !detailViewObject.value?.detailView?.staticData) return;
    
    // @ts-ignore
    if (!window.echarts) return;

    if (chartInstance) {
        chartInstance.dispose();
    }

    // @ts-ignore
    chartInstance = window.echarts.init(chartRef.value);
    
    const type = detailViewObject.value.detailView.type;
    const data = detailViewObject.value.detailView.staticData; // Expecting { labels: [], values: [] }
    
    const option = {
        backgroundColor: 'transparent',
        tooltip: { trigger: 'item' },
        grid: { top: 30, bottom: 30, left: 40, right: 20 },
        xAxis: type === 'bar' ? { 
            type: 'category', 
            data: data.labels || [],
            axisLabel: { color: '#ccc' },
            axisLine: { lineStyle: { color: '#475569' } }
        } : undefined,
        yAxis: type === 'bar' ? { 
            type: 'value',
            axisLabel: { color: '#ccc' },
            splitLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }
        } : undefined,
        series: [
            {
                type: type,
                radius: type === 'pie' ? ['40%', '70%'] : undefined,
                data: type === 'pie' ? 
                    (data.labels || []).map((l: string, i: number) => ({ name: l, value: data.values[i] })) : 
                    (data.values || []),
                itemStyle: {
                    color: (params: any) => {
                         const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
                         return colors[params.dataIndex % colors.length];
                    },
                    borderRadius: 4
                },
                label: { color: '#fff' }
            }
        ]
    };
    
    chartInstance.setOption(option);
};

watch(() => showDetailPopup.value, (val) => {
    if (val) {
        nextTick(() => {
            renderChart();
        });
    } else {
        if (chartInstance) {
            chartInstance.dispose();
            chartInstance = null;
        }
    }
});

// Re-render if object changes while open
watch(() => detailViewObject.value, () => {
    if (showDetailPopup.value) {
        nextTick(() => {
            renderChart();
        });
    }
});

onUnmounted(() => {
    if (chartInstance) {
        chartInstance.dispose();
    }
});
</script>

<style scoped>
.detail-popup {
    position: absolute;
    width: 450px;
    height: 320px;
    background: rgba(15, 23, 42, 0.95);
    border: 1px solid #3b82f6;
    border-radius: 8px;
    box-shadow: 0 0 30px rgba(0, 0, 0, 0.8);
    z-index: 1000; /* Ensure on top of everything */
    display: flex;
    flex-direction: column;
    pointer-events: auto;
    animation: zoomIn 0.2s ease-out;
    backdrop-filter: blur(10px);
}

@keyframes zoomIn {
    from { opacity: 0; transform: translate(-50%, -45%) scale(0.9); }
    to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
}

.popup-header {
    padding: 12px 16px;
    background: linear-gradient(to right, rgba(59, 130, 246, 0.2), transparent);
    border-bottom: 1px solid rgba(59, 130, 246, 0.3);
    color: #fff;
    font-weight: bold;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
    font-size: 14px;
}

.close-btn {
    cursor: pointer;
    color: #94a3b8;
    transition: all 0.2s;
    font-size: 16px;
}

.close-btn:hover {
    color: #fff;
    transform: rotate(90deg);
}

.popup-content {
    flex: 1;
    padding: 0;
    overflow: hidden;
    position: relative;
    display: flex;
    flex-direction: column;
}

.chart-wrapper {
    width: 100%;
    height: 100%;
    padding: 10px;
}

.chart-container {
    width: 100%;
    height: 100%;
}

.video-container {
    width: 100%;
    height: 100%;
    background: #000;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
}

.video-wrapper {
    width: 100%;
    height: 100%;
    position: relative;
    background: radial-gradient(circle, #1e293b 0%, #000 100%);
    display: flex;
    align-items: center;
    justify-content: center;
}

.live-badge {
    position: absolute;
    top: 10px;
    right: 10px;
    background: #ef4444;
    color: white;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: bold;
    animation: pulse 2s infinite;
}

.camera-overlay {
    position: absolute;
    bottom: 10px;
    left: 10px;
    color: white;
    font-family: monospace;
    font-size: 12px;
    background: rgba(0,0,0,0.5);
    padding: 4px;
    display: flex;
    gap: 10px;
}

.mock-video-feed {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    color: #475569;
}

.mock-video-feed i {
    font-size: 48px;
}

.info-content {
    padding: 20px;
    color: #cbd5e1;
    font-size: 13px;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.info-row {
    display: flex;
    justify-content: space-between;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    padding-bottom: 8px;
}

.info-row .label {
    color: #94a3b8;
    font-weight: 500;
}

.info-row .value {
    color: #f1f5f9;
    font-family: monospace;
}

.info-description {
    display: flex;
    flex-direction: column;
    gap: 5px;
    margin-top: 5px;
}

.info-description p {
    background: rgba(0,0,0,0.2);
    padding: 8px;
    border-radius: 4px;
    margin: 0;
    line-height: 1.4;
    color: #94a3b8;
}

.status-ok {
    color: #10b981;
    font-weight: bold;
}

@keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
}
</style>
