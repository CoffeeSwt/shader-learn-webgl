<template>
  <div class="panel camera-feed-panel pointer-events-auto">
    <div class="panel-header">
      <span><i class="fas fa-video"></i> {{ title || '实时监控 (Camera Feed)' }}</span>
    </div>
    <div class="feed-content">
      <div class="placeholder-feed">
        <div class="live-indicator">● LIVE</div>
        <div class="camera-info">
          <span>{{ sourceData?.name || '未连接信号源' }}</span>
          <span v-if="dataSourceId" class="source-id">{{ dataSourceId }}</span>
        </div>
        <div class="stream-content">
           <div class="mock-stream">
             <i class="fas fa-video-slash" v-if="!sourceData"></i>
             <span v-else>{{ sourceData.data?.status === 'live' ? '正在直播' : '录像回放' }}</span>
           </div>
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

.feed-content {
  flex: 1;
  background: #000;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-feed {
  width: 100%;
  height: 100%;
  background: linear-gradient(45deg, #1a1a1a 25%, #2a2a2a 25%, #2a2a2a 50%, #1a1a1a 50%, #1a1a1a 75%, #2a2a2a 75%, #2a2a2a 100%);
  background-size: 20px 20px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.live-indicator {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(220, 38, 38, 0.8);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: bold;
  color: white;
  animation: pulse 2s infinite;
  z-index: 10;
}

.camera-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.6);
  padding: 5px 10px;
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #ccc;
  z-index: 10;
}

.mock-stream {
    color: rgba(255, 255, 255, 0.5);
    font-family: monospace;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

.pointer-events-auto {
  pointer-events: auto;
}
</style>
