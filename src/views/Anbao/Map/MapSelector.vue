<template>
  <div class="map-selector-container">
    <div class="header">
      <div class="title">
        <i class="fas fa-map-marked-alt"></i> 全国安保指挥中心
      </div>
      <div v-if="currentLevel !== 'country'" class="back-btn" @click="backToCountry">
        <i class="fas fa-arrow-left"></i> 返回全国视图
      </div>
    </div>
    
    <div ref="chartContainer" class="chart-container"></div>

    <div v-if="loading" class="loading-overlay">
      <i class="fas fa-spinner fa-spin"></i> 加载地图数据中...
    </div>

    <ToastContainer />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, shallowRef } from 'vue';
import { useRouter } from 'vue-router';
// @ts-ignore
import * as echarts from 'echarts';
import ToastContainer from '../components/common/ToastContainer.vue';
import { useToast } from '../composables/useToast';

const toast = useToast();
const router = useRouter();
const chartContainer = ref<HTMLElement | null>(null);
const chartInstance = shallowRef<any>(null);
const loading = ref(false);

const currentLevel = ref<'country' | 'province'>('country');
const currentAdcode = ref<number>(100000); // 100000 is China

// Mock Venues Data (Lat, Lng)
const venues = [
  { id: 'bj_stadium', name: '北京国家体育场', adcode: 110000, coords: [116.396, 39.993] },
  { id: 'sh_arena', name: '上海梅赛德斯中心', adcode: 310000, coords: [121.490, 31.190] },
  { id: 'gz_gym', name: '广州体育馆', adcode: 440000, coords: [113.280, 23.166] },
  { id: 'sz_center', name: '深圳大运中心', adcode: 440300, coords: [114.215, 22.693] }, // Shenzhen under Guangdong
  { id: 'hz_olympic', name: '杭州奥体中心', adcode: 330000, coords: [120.228, 30.227] },
  { id: 'wh_sports', name: '武汉体育中心', adcode: 420000, coords: [114.167, 30.505] }
];

const loadScript = (src: string) => {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
            resolve(true);
            return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => resolve(true);
        script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
        document.head.appendChild(script);
    });
};

const initChart = async () => {
    if (!chartContainer.value) return;
    
    // Ensure ECharts is loaded (if not imported via npm, check window)
    // Here we assume it's available via import or global if the user project setup allows.
    // The previous file used CDN loading, so we might need to ensure it's loaded here too.
    // However, since we import * as echarts, if it's installed via npm (as seen in todo/terminal), we can use it directly.
    // If it fails, we fall back to window.echarts.
    
    let ec = echarts;
    if (!ec || !ec.init) {
        // @ts-ignore
        ec = window.echarts;
    }

    if (!ec) {
        await loadScript("https://cdn.bootcdn.net/ajax/libs/echarts/5.4.3/echarts.min.js");
        // @ts-ignore
        ec = window.echarts;
    }

    chartInstance.value = ec.init(chartContainer.value);
    
    // Add click event
    chartInstance.value.on('click', (params: any) => {
        handleMapClick(params);
    });

    loadMap(100000, 'china');
    
    window.addEventListener('resize', resizeChart);
};

const resizeChart = () => {
    chartInstance.value?.resize();
};

const loadMap = async (adcode: number, mapName: string) => {
    loading.value = true;
    try {
        const url = `https://geo.datav.aliyun.com/areas_v3/bound/${adcode}_full.json`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Network response was not ok');
        const geoJson = await response.json();

        // @ts-ignore
        const ec = echarts || window.echarts;
        ec.registerMap(mapName, geoJson);
        
        renderMap(mapName, adcode);
    } catch (error) {
        console.error("Failed to load map:", error);
        toast.error("地图数据加载失败，请检查网络连接。");
    } finally {
        loading.value = false;
    }
};

const renderMap = (mapName: string, adcode: number) => {
    const isCountry = adcode === 100000;
    currentLevel.value = isCountry ? 'country' : 'province';
    currentAdcode.value = adcode;

    // Filter venues for this view
    // If country view, show province aggregations or just scatter points?
    // Let's simplify: show all venues as scatter points on top of map.
    
    const scatterData = venues.map(v => ({
        name: v.name,
        value: [...v.coords, v.id], // append id to value for click handler
        itemStyle: { color: '#f59e0b' }
    }));

    const option = {
        backgroundColor: '#0f172a',
        geo: {
            map: mapName,
            roam: true,
            label: {
                show: true,
                color: '#fff',
                fontSize: 10
            },
            itemStyle: {
                areaColor: '#1e293b',
                borderColor: '#3b82f6',
                borderWidth: 1
            },
            emphasis: {
                itemStyle: {
                    areaColor: '#2563eb'
                },
                label: {
                    color: '#fff'
                }
            },
            select: {
                itemStyle: {
                    areaColor: '#2563eb'
                }
            }
        },
        series: [
            {
                name: 'Venues',
                type: 'effectScatter',
                coordinateSystem: 'geo',
                data: scatterData,
                symbolSize: 15,
                showEffectOn: 'render',
                rippleEffect: {
                    brushType: 'stroke'
                },
                label: {
                    show: true,
                    formatter: '{b}',
                    position: 'right',
                    color: '#f59e0b',
                    fontSize: 12,
                    fontWeight: 'bold',
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    padding: [4, 8],
                    borderRadius: 4
                },
                itemStyle: {
                    color: '#f59e0b',
                    shadowBlur: 10,
                    shadowColor: '#333'
                },
                zlevel: 1
            }
        ],
        tooltip: {
            trigger: 'item',
            formatter: (params: any) => {
                if (params.seriesType === 'effectScatter') {
                    return `${params.name}<br/>点击进入场馆`;
                }
                return params.name;
            }
        }
    };

    chartInstance.value.setOption(option, true); // true = not merge, replace
};

const handleMapClick = (params: any) => {
    if (params.seriesType === 'effectScatter') {
        // Clicked on a venue
        const venueId = params.value[2];
        router.push(`/anbao/venue/${venueId}`);
    } else if (params.componentType === 'geo' || params.seriesType === 'map') {
        // Clicked on a region
        if (currentLevel.value === 'country') {
            // Drill down to province
            // Need adcode. ECharts geoJSON usually has adcode in properties.
            // Check params.data or look up via name?
            // Aliyun GeoJSON properties usually have 'adcode'.
            
            // Note: params.region.name gives the name. We might need to map name to adcode if not present.
            // However, registerMap geoJson features usually have properties.adcode.
            // But 'click' event on 'geo' component might not pass full properties directly in all versions.
            
            // Let's try to find adcode from the event.
            // ECharts event params for geo click: name (region name).
            // We need a mapping or check if we can access the adcode directly.
            
            // A robust way for Aliyun maps: The features have adcode.
            // But we can just use a simple mapping or try to read it if exposed.
            
            // For simplicity, let's look up adcode from a known list or try to get it from params.
            // Actually, for this demo, let's assume we can get it or just support a few provinces.
            
            // Better approach: Use the map data we just loaded.
            const geoJson = chartInstance.value.getOption().geo[0].map; 
            // Wait, this just gives name 'china'. We need the actual JSON data.
            // We can cache the JSON data.
            
            // Let's try a direct lookup for common provinces or rely on a helper.
            // Or simpler: Just check if we have venues in that province?
            
            // Let's fetch the province map based on adcode if available in params.
            // Many geoJSONs put adcode in `properties.adcode`.
            // params.event.target might have data.
            
            // HACK: For this demo, let's use a predefined mapping for provinces with venues.
            // Or use a generic city map if adcode is found.
            
            // Let's assume we get adcode from `adcodes` property if available, 
            // but ECharts standard click param is just name.
            
            // Let's try to fetch a province map by name? No, API needs adcode.
            // I'll create a small name-to-adcode map for demo purposes.
            
            const provinceMap: Record<string, number> = {
                '北京市': 110000,
                '上海市': 310000,
                '广东省': 440000,
                '浙江省': 330000,
                '江苏省': 320000,
                '湖北省': 420000
                // Add more if needed
            };
            
            const adcode = provinceMap[params.name];
            if (adcode) {
                loadMap(adcode, params.name);
            } else {
                toast.info(`暂无 ${params.name} 的详细数据`);
            }
        }
    }
};

const backToCountry = () => {
    loadMap(100000, 'china');
};

const loadStyle = (href: string) => {
    if (document.querySelector(`link[href="${href}"]`)) return;
    const link = document.createElement('link');
    link.href = href;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
}

onMounted(() => {
    loadStyle("https://cdn.bootcdn.net/ajax/libs/font-awesome/6.4.0/css/all.min.css");
    initChart();
});

onUnmounted(() => {
    window.removeEventListener('resize', resizeChart);
    chartInstance.value?.dispose();
});
</script>

<style scoped>
.map-selector-container {
  width: 100%;
  height: 100vh;
  background: #0f172a;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.header {
  height: 60px;
  background: rgba(30, 41, 59, 0.8);
  border-bottom: 1px solid rgba(59, 130, 246, 0.3);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 30px;
  color: #f1f5f9;
  z-index: 10;
}

.title {
  font-size: 20px;
  font-weight: bold;
  color: #3b82f6;
  display: flex;
  align-items: center;
  gap: 10px;
}

.back-btn {
  cursor: pointer;
  color: #f59e0b;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 4px;
  transition: all 0.3s;
}

.back-btn:hover {
  background: rgba(245, 158, 11, 0.1);
  transform: translateX(-2px);
}

.chart-container {
  flex: 1;
  width: 100%;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #3b82f6;
  font-size: 18px;
  z-index: 20;
}
</style>
