import { ref } from 'vue';

// Global UI state
const currentMode = ref('dashboard');
const showResetBtn = ref(false);
const currentTime = ref('12:00:00');
const selectedObjectIndex = ref(-1);

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

export function useAnbaoState() {
    const updateClock = () => {
        currentTime.value = new Date().toLocaleTimeString();
        setTimeout(updateClock, 1000);
    };

    return {
        currentMode,
        showResetBtn,
        currentTime,
        selectedObjectIndex,
        infoContent,
        updateClock
    };
}
