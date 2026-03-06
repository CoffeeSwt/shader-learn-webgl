import { ref } from 'vue';

// Global UI state
const currentMode = ref('dashboard');
const showResetBtn = ref(false);
const showDashboardPreview = ref(false);
const currentTime = ref('12:00:00');
const selectedObjectIndex = ref(-1);

// Detail View State
const detailViewObject = ref<any>(null); // PlanItem but circular dep
const showDetailPopup = ref(false);
const detailPopupPosition = ref({ x: 0, y: 0 });

// Shared info content
const infoContent = ref(`
  <p><strong>当前场馆：</strong> 奥体中心主体育场</p>
  <p><strong>活动名称：</strong> 年度全明星演唱会</p>
  <p><strong>预计人数：</strong> 45,000 人</p>
  <hr style="border:0; border-top:1px dashed #333; margin:10px 0;">
  <p style="font-size:11px; color:#888;">
      请点击场景中的标签查看详细信息。
  </p>
`);

const venueMap: Record<string, any> = {
    'bj_stadium': { name: '北京国家体育场', address: '北京市朝阳区国家体育场南路1号', capacity: '91,000' },
    'sh_arena': { name: '上海梅赛德斯中心', address: '上海市浦东新区世博大道1200号', capacity: '18,000' },
    'gz_gym': { name: '广州体育馆', address: '广州市白云区白云大道南783号', capacity: '10,000' },
    'sz_center': { name: '深圳大运中心', address: '深圳市龙岗区龙翔大道', capacity: '60,000' },
    'hz_olympic': { name: '杭州奥体中心', address: '杭州市滨江区飞虹路3号', capacity: '80,000' },
    'wh_sports': { name: '武汉体育中心', address: '武汉市经济技术开发区车城北路58号', capacity: '60,000' }
};

export function useAnbaoState() {
    const updateClock = () => {
        currentTime.value = new Date().toLocaleTimeString();
        setTimeout(updateClock, 1000);
    };

    const loadVenueInfo = (id: string) => {
        const venue = venueMap[id] || { name: '未知场馆', address: '未知', capacity: '-' };
        infoContent.value = `
          <p><strong>当前场馆：</strong> ${venue.name}</p>
          <p><strong>场馆地址：</strong> ${venue.address}</p>
          <p><strong>预计人数：</strong> ${venue.capacity} 人</p>
          <hr style="border:0; border-top:1px dashed #333; margin:10px 0;">
          <p style="font-size:11px; color:#888;">
              请点击场景中的标签查看详细信息。
          </p>
        `;
    };

    const openDetail = (item: any, position: { x: number, y: number } = { x: 0, y: 0 }) => {
        detailViewObject.value = item;
        showDetailPopup.value = true;
        detailPopupPosition.value = position;
    };

    const closeDetail = () => {
        showDetailPopup.value = false;
        detailViewObject.value = null;
    };

    return {
        currentMode,
        showResetBtn,
        showDashboardPreview,
        currentTime,
        selectedObjectIndex,
        infoContent,
        detailViewObject,
        showDetailPopup,
        detailPopupPosition,
        updateClock,
        loadVenueInfo,
        openDetail,
        closeDetail
    };
}
