import { ref, computed } from 'vue';

export type DataSourceType = 'video' | 'traffic' | 'events';

export interface DataSource {
    id: string;
    type: DataSourceType;
    name: string;
    // Mock data update function
    update?: () => void;
    // Current data state
    data: any;
}

// Mock Data Generators
const generateTrafficData = () => {
    return {
        total: Math.floor(Math.random() * 5000),
        in: Math.floor(Math.random() * 100),
        out: Math.floor(Math.random() * 80),
        gates: [
            { name: '北门', value: Math.floor(Math.random() * 100) },
            { name: '南门', value: Math.floor(Math.random() * 80) },
            { name: '东门', value: Math.floor(Math.random() * 50) }
        ]
    };
};

const generateEventsData = () => {
    const types = ['异常闯入', '人群聚集', '设备离线', '巡逻异常'];
    const locations = ['北区入口', 'VIP通道', '中央舞台', '东侧看台'];
    return {
        latest: {
            type: types[Math.floor(Math.random() * types.length)],
            location: locations[Math.floor(Math.random() * locations.length)],
            time: new Date().toLocaleTimeString(),
            level: Math.random() > 0.7 ? 'high' : 'medium'
        },
        history: []
    };
};

// Registry
const dataSources = ref<DataSource[]>([
    // Video Feeds
    { id: 'cam_01', type: 'video', name: 'CAM-01: 主入口', data: { status: 'live', url: 'mock_stream_1' } },
    { id: 'cam_02', type: 'video', name: 'CAM-02: VIP通道', data: { status: 'live', url: 'mock_stream_2' } },
    { id: 'cam_03', type: 'video', name: 'CAM-03: 中央舞台', data: { status: 'live', url: 'mock_stream_3' } },
    { id: 'cam_04', type: 'video', name: 'CAM-04: 外围周界', data: { status: 'recording', url: 'mock_stream_4' } },
    
    // Traffic Sensors
    { id: 'traffic_main', type: 'traffic', name: '主场馆人流统计', data: generateTrafficData() },
    { id: 'traffic_vip', type: 'traffic', name: 'VIP区流量', data: generateTrafficData() },
    
    // Event Systems
    { id: 'events_global', type: 'events', name: '全局安保告警', data: generateEventsData() }
]);

// Simulation Loop
setInterval(() => {
    dataSources.value.forEach(ds => {
        if (ds.type === 'traffic') {
            ds.data = generateTrafficData();
        } else if (ds.type === 'events' && Math.random() > 0.8) {
            ds.data = generateEventsData();
        }
    });
}, 3000);

export const getDataSourcesByType = (type: DataSourceType) => {
    return computed(() => dataSources.value.filter(ds => ds.type === type));
};

export const getAllDataSources = () => computed(() => dataSources.value);

export function useDataSource(sourceId: string | undefined) {
    return computed(() => {
        if (!sourceId) return null;
        return dataSources.value.find(ds => ds.id === sourceId) || null;
    });
}
