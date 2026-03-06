<template>
  <div class="panel event-info-panel pointer-events-auto">
    <div class="panel-header">
      <span><i class="fas fa-info-circle"></i> {{ title || '事件信息 (Event Info)' }}</span>
    </div>
    <div class="info-content">
      <div class="info-item">
        <div class="label">事件类型:</div>
        <div class="value">{{ event.type }}</div>
      </div>
      <div class="info-item">
        <div class="label">发生地点:</div>
        <div class="value">{{ event.location }}</div>
      </div>
      <div class="info-item">
        <div class="label">时间:</div>
        <div class="value">{{ event.time }}</div>
      </div>
      <div class="info-item">
        <div class="label">状态:</div>
        <div class="value status-alert">{{ event.status }}</div>
      </div>
      <div class="info-description">
        <div class="label">描述:</div>
        <div class="desc-text">{{ event.description }}</div>
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

const event = computed(() => {
  if (sourceData.value && sourceData.value.data && sourceData.value.data.latest) {
    const latest = sourceData.value.data.latest;
    return {
      type: latest.type || 'Unknown',
      location: latest.location || 'System',
      time: latest.time || new Date().toISOString(),
      status: latest.level === 'high' ? '紧急处理中' : '监控中',
      description: `监测到${latest.type}，位于${latest.location}。`
    };
  }
  // Default mock
  return {
    type: '待机中',
    location: '--',
    time: '--:--:--',
    status: '正常',
    description: '暂无异常事件报告。'
  };
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

.info-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 13px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  border-bottom: 1px dashed rgba(255, 255, 255, 0.1);
  padding-bottom: 4px;
}

.label {
  color: #94a3b8;
  font-weight: 500;
}

.value {
  color: #f1f5f9;
  text-align: right;
}

.status-alert {
  color: #ef4444;
  font-weight: bold;
}

.info-description {
  margin-top: 8px;
  background: rgba(0, 0, 0, 0.2);
  padding: 8px;
  border-radius: 4px;
}

.desc-text {
  color: #cbd5e1;
  margin-top: 4px;
  line-height: 1.4;
  font-size: 12px;
}

.pointer-events-auto {
  pointer-events: auto;
}
</style>
