<template>
  <div class="panel gate-flow-panel pointer-events-auto">
    <div class="panel-header">
      <span><i class="fas fa-chart-bar"></i> {{ title || '门禁流量 (Gate Flow)' }}</span>
    </div>
    <div class="flow-content">
      <div class="chart-container">
        <div v-for="item in displayData" :key="item.label" class="bar-group">
          <div class="label">{{ item.label }}</div>
          <div class="bar-wrapper">
            <div class="bar-bg">
              <div class="bar-fill" :style="{ width: item.percentage + '%' }"></div>
            </div>
          </div>
          <div class="value">{{ item.value }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useDataSource } from '../dashboard/DataSourceRegistry';

const props = defineProps<{
  dataSourceId?: string;
  title?: string;
}>();

const sourceData = useDataSource(props.dataSourceId);

const displayData = computed(() => {
  if (sourceData.value && sourceData.value.data) {
    const d = sourceData.value.data;
    const max = Math.max(d.total, 100); 
    return [
      { label: '总流量', value: d.total, percentage: (d.total / max) * 100 },
      { label: '进入', value: d.in, percentage: (d.in / max) * 100 },
      { label: '离开', value: d.out, percentage: (d.out / max) * 100 },
    ];
  }
  
  return [
    { label: '主入口', value: 1245, percentage: 80 },
    { label: '北门', value: 856, percentage: 55 },
    { label: '东侧门', value: 432, percentage: 30 },
    { label: 'VIP通道', value: 120, percentage: 10 },
  ];
});
</script>

<style scoped>
.panel {
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 8px;
  padding: 15px;
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
  color: #fff;
  height: 100%;
  box-sizing: border-box;
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

.flow-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.chart-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.bar-group {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
}

.label {
  width: 60px;
  text-align: right;
  color: #ccc;
}

.bar-wrapper {
  flex: 1;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

.bar-bg {
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.2);
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #60a5fa);
  border-radius: 4px;
  transition: width 0.5s ease-in-out;
}

.value {
  width: 40px;
  text-align: left;
  font-weight: bold;
  color: #fff;
}

.pointer-events-auto {
  pointer-events: auto;
}
</style>
