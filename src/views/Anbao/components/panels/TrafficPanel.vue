<template>
    <div class="panel p-top-left pointer-events-auto" id="panel-traffic">
        <div class="panel-header">
            <span><i class="fas fa-chart-area"></i> 人流密度监控</span>
            <span style="font-size:10px; color:var(--accent)">高密度预警</span>
        </div>
        <div ref="chartTraffic" id="chart-traffic" class="chart-box"></div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const chartTraffic = ref<HTMLDivElement | null>(null);

const initCharts = () => {
    // @ts-ignore
    if (window.echarts && chartTraffic.value) {
        // @ts-ignore
        const chart = window.echarts.init(chartTraffic.value);
        chart.setOption({
            grid: { top: 10, bottom: 20, left: 30, right: 10 },
            xAxis: { type: 'category', data: ['A区', 'B区', 'C区', 'D区'], axisLabel: { color: '#ccc' } },
            yAxis: { type: 'value', axisLabel: { color: '#ccc' }, splitLine: { lineStyle: { color: '#333' } } },
            series: [{
                data: [120, 200, 150, 80],
                type: 'bar',
                itemStyle: { color: '#3b82f6' }
            }]
        });
        window.addEventListener('resize', () => chart.resize());
    }
};

onMounted(() => {
    const checkEcharts = setInterval(() => {
        // @ts-ignore
        if (window.echarts) {
            clearInterval(checkEcharts);
            initCharts();
        }
    }, 100);
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
    transition: opacity 0.3s, transform 0.3s;
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

.chart-box {
    flex: 1;
    width: 100%;
    min-height: 0;
}

.pointer-events-auto {
    pointer-events: auto;
}
</style>
