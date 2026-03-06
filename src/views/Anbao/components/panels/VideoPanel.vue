<template>
    <div class="panel p-bottom-left pointer-events-auto" id="panel-video">
        <div class="panel-header">
            <span><i class="fas fa-video"></i> 实时监控</span>
        </div>
        <div class="video-grid">
            <div class="video-feed"></div>
            <div class="video-feed"></div>
            <div class="video-feed"></div>
            <div class="video-feed"></div>
        </div>
    </div>
</template>

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

.video-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr;
    gap: 5px;
    flex: 1;
}

.video-feed {
    background: #000;
    position: relative;
    border: 1px solid #333;
    overflow: hidden;
}

.video-feed::after {
    content: 'LIVE';
    position: absolute;
    top: 5px;
    right: 5px;
    color: red;
    font-size: 10px;
    animation: blink 1s infinite;
}

@keyframes blink {
    50% {
        opacity: 0;
    }
}

.pointer-events-auto {
    pointer-events: auto;
}
</style>
