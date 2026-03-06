<template>
    <div class="anbao-container">
        <!-- 3D Scene -->
        <AnbaoScene />

        <!-- UI Components -->
        <AppliedPlanBadge />

        <div id="ui-layer" :class="{ 'pointer-events-none': currentMode === 'roam' || currentMode === 'edit' }">
            <AnbaoEditor />
            <ResetViewButton />
            <AnbaoHeader />
            <AnbaoDashboard v-show="currentMode === 'dashboard'" />
            <AnbaoControls />
        </div>

        <PlayControlOverlay />
    </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRoute } from 'vue-router';
import AnbaoScene from './components/AnbaoScene.vue';
import AnbaoHeader from './components/AnbaoHeader.vue';
import AnbaoDashboard from './components/AnbaoDashboard.vue';
import AnbaoEditor from './components/AnbaoEditor.vue';
import AnbaoControls from './components/AnbaoControls.vue';
import AppliedPlanBadge from './components/AppliedPlanBadge.vue';
import ResetViewButton from './components/ResetViewButton.vue';
import PlayControlOverlay from './components/PlayControlOverlay.vue';
import { useAnbaoState } from './composables/useAnbaoState';

const { currentMode, loadVenueInfo } = useAnbaoState();
const route = useRoute();

// --- External Script Loading ---
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

const loadStyle = (href: string) => {
    if (document.querySelector(`link[href="${href}"]`)) return;
    const link = document.createElement('link');
    link.href = href;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
}

onMounted(async () => {
    // Load styles
    loadStyle("https://cdn.bootcdn.net/ajax/libs/font-awesome/6.4.0/css/all.min.css");

    // Load scripts
    try {
        await loadScript("https://cdn.bootcdn.net/ajax/libs/echarts/5.4.3/echarts.min.js");
        await loadScript("https://cdn.staticfile.org/tween.js/18.6.4/tween.umd.js");
        // Dependencies loaded, child components will initialize themselves via onMounted checks or retry logic
        
        if (route.params.id) {
            loadVenueInfo(route.params.id as string);
        }
    } catch (e) {
        console.error("Failed to load dependencies", e);
    }
});
</script>

<style scoped>
.anbao-container {
    --bg-dark: #0f172a;
    --panel-bg: rgba(15, 23, 42, 0.85);
    --primary: #3b82f6;
    --accent: #f59e0b;
    --danger: #ef4444;
    --text-main: #f1f5f9;
    --border: rgba(59, 130, 246, 0.3);

    position: relative;
    width: 100%;
    height: 100vh;
    overflow: hidden;
    background: #000;
    color: #f1f5f9;
    font-family: 'Inter', sans-serif;
}

.anbao-container * {
    box-sizing: border-box;
}

#ui-layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 10;
    pointer-events: none;
    display: flex;
    flex-direction: column;
    padding: 20px;
}

.pointer-events-none {
    pointer-events: none;
}

/* Global styles for labels injected by JS */
:deep(.label-marker) {
    position: absolute;
    background: rgba(0, 0, 0, 0.7);
    border: 1px solid #3b82f6;
    color: white;
    padding: 5px 10px;
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
    pointer-events: auto;
    transform: translate(-50%, -100%);
    white-space: nowrap;
    z-index: 5;
    transition: all 0.3s;
}

:deep(.label-marker:hover) {
    background: #3b82f6;
    box-shadow: 0 0 10px #3b82f6;
}

:deep(.label-marker .detail) {
    display: none;
    margin-top: 5px;
    font-size: 10px;
    color: #ddd;
    border-top: 1px solid rgba(255, 255, 255, 0.3);
    padding-top: 5px;
}

:deep(.label-marker.expanded) {
    z-index: 10;
    background: rgba(0, 0, 0, 0.9);
    border-color: #f59e0b;
}

:deep(.label-marker.expanded .detail) {
    display: block;
}

:deep(.plan-label) {
    border-color: #f59e0b;
    color: #f59e0b;
    background: rgba(20, 10, 0, 0.8);
}

:deep(.plan-label:hover) {
    background: #f59e0b;
    color: black;
}
</style>
