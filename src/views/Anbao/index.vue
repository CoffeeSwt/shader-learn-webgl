<template>
    <div class="anbao-container">
        <!-- 3D Background -->
        <div ref="canvasContainer" id="canvas-container"></div>

        <!-- Applied Plan Indicator -->
        <div v-if="appliedPlanId" id="applied-plan-badge" class="applied-plan-indicator" style="display: flex;">
            <i class="fas fa-check-circle"></i>
            <span id="applied-plan-name">当前方案: {{ plans[appliedPlanId]?.name }}</span>
            <i class="fas fa-times-circle" style="margin-left:10px; font-size:16px;" title="取消应用"
                @click="cancelAppliedPlan"></i>
        </div>

        <!-- UI Overlay -->
        <div id="ui-layer" :class="{ 'pointer-events-none': currentMode === 'roam' || currentMode === 'edit' }">
            <!-- Editor UI -->
            <div v-show="currentMode === 'edit'" id="editor-ui" style="display: flex;">
                <div class="editor-toolbar">
                    <div
                        style="font-weight:bold; color:var(--accent); margin-right:10px; display:flex; align-items:center;">
                        方案编辑器</div>
                    <button class="editor-btn" @click="addCameraKeyframe"><i class="fas fa-camera"></i> 记录镜头</button>
                    <button class="editor-btn" @click="addObjectToTimeline('camera')"><i class="fas fa-video"></i>
                        加监控</button>
                    <button class="editor-btn" @click="addObjectToTimeline('guard')"><i class="fas fa-user-shield"></i>
                        加保安</button>
                    <button class="editor-btn" @click="addObjectToTimeline('barrier')"><i class="fas fa-bars"></i>
                        加围栏</button>
                    <div style="width:1px; background:#555; margin:0 5px;"></div>
                    <button class="editor-btn" @click="savePlan"><i class="fas fa-save"></i> 保存方案</button>
                    <button class="editor-btn danger" @click="exitEditor"><i class="fas fa-times"></i> 退出编辑</button>
                    <div style="font-size:10px; color:#aaa; margin-left:10px; display:flex; align-items:center;">
                        <i class="fas fa-mouse" style="margin-right:5px;"></i> 左键旋转 | 右键平移
                    </div>
                </div>

                <!-- New Track Editor -->
                <div class="track-editor">
                    <div class="track-controls">
                        <button class="editor-btn" @click="togglePlayEditor">
                            <i :class="isEditorPlaying ? 'fas fa-pause' : 'fas fa-play'" id="play-icon"></i>
                            <span id="play-text">{{ isEditorPlaying ? '暂停' : '播放预览' }}</span>
                        </button>
                        <button class="editor-btn" @click="stopEditor"><i class="fas fa-stop"></i> 停止</button>
                        <div class="time-display" id="time-display">{{ formattedEditorTime }}</div>

                        <div style="flex:1;"></div>

                        <!-- Duration Control -->
                        <div
                            style="display:flex; align-items:center; gap:5px; margin-right:15px; font-size:12px; color:#888;">
                            <span>总时长(s):</span>
                            <input type="number" v-model.number="currentPlanDuration" min="5" max="120"
                                style="width:50px; background:rgba(0,0,0,0.3); border:1px solid #555; color:white; padding:2px 5px; border-radius:4px;"
                                @change="updateDuration">
                        </div>
                    </div>
                    <div class="tracks-container">
                        <div class="track-headers" id="track-headers">
                            <div class="track-header" style="height:20px;"></div> <!-- Ruler spacer -->
                            <div class="track-header">镜头轨道</div>
                            <!-- Dynamic Object Headers -->
                            <div v-for="(item, idx) in tempPlanData" :key="idx" class="track-header"
                                :style="{ color: selectedObjectIndex === idx ? 'var(--primary)' : '' }"
                                @click="selectObject(idx)">
                                {{ item.label }}
                            </div>
                        </div>
                        <div class="timeline-area" id="timeline-area" @mousedown="startScrub">
                            <div class="timeline-ruler" id="timeline-ruler">
                                <!-- Ruler Marks -->
                                <div v-for="i in Math.floor(currentPlanDuration / 5) + 1" :key="i" class="ruler-mark"
                                    :style="{ left: ((i - 1) * 5 / currentPlanDuration * 100) + '%' }">
                                    {{ (i - 1) * 5 }}s
                                </div>
                            </div>
                            <div id="track-lanes">
                                <div class="track-lane" id="camera-lane">
                                    <div v-for="(key, idx) in tempCameraTrack" :key="idx" class="keyframe camera-key"
                                        :style="{ left: (key.t / currentPlanDuration * 100) + '%' }"
                                        :title="`Camera: ${key.t}s`" @click.stop="jumpToCameraKeyframe(key)"
                                        @mousedown.stop="startDragCameraKeyframe($event, idx)"
                                        @contextmenu.prevent="deleteCameraKeyframe(idx)"></div>
                                </div>
                                <!-- Dynamic Object Lanes -->
                                <div v-for="(item, idx) in tempPlanData" :key="idx" class="track-lane"
                                    :style="{ background: selectedObjectIndex === idx ? 'rgba(59, 130, 246, 0.1)' : '' }">
                                    <div class="keyframe"
                                        :style="{ left: ((item.time || 0) / currentPlanDuration * 100) + '%' }"
                                        :title="`${item.label} appear @ ${item.time}s`"
                                        @mousedown.stop="startDragKeyframe($event, idx)"></div>
                                </div>
                            </div>
                            <div class="playhead" id="playhead"
                                :style="{ left: (currentEditorTime / currentPlanDuration * 100) + '%' }">
                                <div class="playhead-handle"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Object Transform Controls -->
                <div v-show="selectedObjectIndex !== -1" id="transform-controls" class="transform-controls"
                    style="display: flex;">
                    <div class="panel-header">
                        <span><i class="fas fa-arrows-alt"></i> 调整位置</span>
                        <i class="fas fa-times" style="cursor:pointer;" @click="deselectObject"></i>
                    </div>
                    <div class="control-row">
                        <label>X</label> <input type="number" v-model.number="selectedObjectPos.x" step="1"
                            @change="updateObjectPos">
                    </div>
                    <div class="control-row">
                        <label>Y</label> <input type="number" v-model.number="selectedObjectPos.y" step="1"
                            @change="updateObjectPos">
                    </div>
                    <div class="control-row">
                        <label>Z</label> <input type="number" v-model.number="selectedObjectPos.z" step="1"
                            @change="updateObjectPos">
                    </div>
                    <div class="control-row" style="margin-top:5px; border-top:1px solid #333; padding-top:5px;">
                        <label style="width:auto;">标签:</label>
                        <input type="text" v-model="selectedObjectLabel" style="width:100px;"
                            @change="updateObjectLabel">
                    </div>
                    <p style="font-size:10px; color:#888; margin-top:5px;">* 也可以在场景中直接拖拽</p>
                </div>
            </div>

            <!-- Reset Button -->
            <div v-show="showResetBtn" id="reset-btn" class="reset-btn" style="display: block;" @click="resetView">
                <i class="fas fa-undo"></i> 重置视角
            </div>

            <div class="header pointer-events-auto">
                <div class="logo"><i class="fas fa-shield-alt"></i> 智慧安保指挥平台</div>
                <div class="clock" id="clock">{{ currentTime }}</div>
            </div>

            <div v-show="currentMode === 'dashboard'" class="dashboard-grid">
                <!-- Top Left: Traffic -->
                <div class="panel p-top-left pointer-events-auto" id="panel-traffic">
                    <div class="panel-header">
                        <span><i class="fas fa-chart-area"></i> 人流密度监控</span>
                        <span style="font-size:10px; color:var(--accent)">高密度预警</span>
                    </div>
                    <div ref="chartTraffic" id="chart-traffic" class="chart-box"></div>
                </div>

                <!-- Bottom Left: Video -->
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

                <!-- Center: Spacer -->
                <div class="p-center"></div>

                <!-- Top Right: Info -->
                <div class="panel p-top-right pointer-events-auto" id="panel-info">
                    <div class="panel-header">
                        <span><i class="fas fa-info-circle"></i> 场馆/标签信息</span>
                    </div>
                    <div class="info-text" id="info-content" v-html="infoContent"></div>
                </div>

                <!-- Bottom Right: Plans -->
                <div class="panel p-bottom-right pointer-events-auto" id="panel-plans">
                    <div class="panel-header">
                        <span><i class="fas fa-clipboard-list"></i> 安保方案管理</span>
                        <i class="fas fa-plus-circle" style="cursor:pointer; color:var(--primary)" title="新建方案"
                            @click="createPlan"></i>
                    </div>
                    <div class="plan-list" id="plan-list-container">
                        <div v-for="(plan, id) in plans" :key="id" class="plan-item">
                            <span :style="{ color: appliedPlanId === id ? 'var(--primary)' : '' }">
                                {{ plan.name }} <small style="color:#666; font-size:10px;">({{ plan.duration || 30
                                    }}s)</small> {{ appliedPlanId === id ? '(当前)' : '' }}
                            </span>
                            <div class="plan-actions">
                                <i class="fas fa-edit" title="编辑" @click="editPlan(id as string)"></i>
                                <i :class="['fas', appliedPlanId === id ? 'fa-ban' : 'fa-check-circle']"
                                    :title="appliedPlanId === id ? '取消应用' : '应用方案'"
                                    :style="{ color: appliedPlanId === id ? 'var(--danger)' : '' }"
                                    @click="appliedPlanId === id ? cancelAppliedPlan() : applyPlan(id as string)"></i>
                                <i class="fas fa-play" title="演示" @click="playDemo(id as string)"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Center Controls Container -->
            <div v-show="currentMode !== 'edit'" class="center-controls-container" id="center-controls">
                <!-- Layer Control -->
                <div class="layer-control">
                    <div :class="['layer-item', { active: layers.base }]" @click="toggleLayer('base')"><i
                            class="fas fa-map"></i> 基础底图</div>
                    <div :class="['layer-item', { active: layers.location }]" @click="toggleLayer('location')"><i
                            class="fas fa-map-marker-alt"></i> 地点标签</div>
                    <div :class="['layer-item', { active: layers.plan }]" @click="toggleLayer('plan')"><i
                            class="fas fa-shield-alt"></i> 安保方案</div>
                </div>

                <!-- Rotation Control -->
                <div v-show="currentMode === 'dashboard'" class="rotate-control" id="rotate-ui">
                    <label><input type="checkbox" v-model="autoRotate" @change="toggleAutoRotate"> 自动巡航</label>
                    <span style="border-left:1px solid #555; height:15px; margin:0 5px;"></span>
                    <i class="fas fa-tachometer-alt"></i>
                    <input type="range" min="1" max="10" v-model.number="rotateSpeed" @input="setRotateSpeed">
                </div>

                <!-- Mode Switcher -->
                <div class="mode-switcher">
                    <button class="mode-btn" @click="setMode('dashboard')">指挥看板</button>
                    <button class="mode-btn" @click="setMode('roam')">自由漫游</button>
                </div>
            </div>
        </div>

        <!-- Play Control Overlay (For Demo) -->
        <div v-show="isAnimating" id="play-control-overlay" style="display: flex;">
            <div class="play-ctrl-btn" @click="toggleDemoPause" title="暂停/继续">
                <i :class="isDemoPaused ? 'fas fa-play' : 'fas fa-pause'" id="demo-pause-icon"></i>
            </div>
            <div class="play-ctrl-btn danger" @click="stopDemo" title="停止演示">
                <i class="fas fa-stop"></i>
            </div>
            <div style="color:white; font-size:12px; display:flex; align-items:center; margin-left:10px;">
                <span id="demo-time">{{ formatTime(demoElapsedTime) }}</span> / <span id="demo-total">{{
                    formatTime(demoDuration) }}</span>
            </div>
        </div>

        <!-- HTML Labels Container -->
        <div ref="labelsContainer" id="labels-container"></div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, reactive, computed, nextTick } from 'vue';
import * as THREE from 'three';

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

// --- State ---
const canvasContainer = ref<HTMLDivElement | null>(null);
const labelsContainer = ref<HTMLDivElement | null>(null);
const chartTraffic = ref<HTMLDivElement | null>(null);

const currentTime = ref('12:00:00');
const currentMode = ref('dashboard');
const showResetBtn = ref(false);
const autoRotate = ref(true);
const rotateSpeed = ref(2);
const isAnimating = ref(false);
const isDemoPaused = ref(false);
const demoElapsedTime = ref(0);
const demoDuration = ref(30);

const appliedPlanId = ref<string | null>(null);
const editingPlanId = ref<string | null>(null);
const plans = reactive<any>({
    'plan1': {
        name: "常规安保方案 A",
        duration: 16,
        cameraTrack: [
            { t: 0, pos: { x: 120, y: 120, z: 120 }, target: { x: 0, y: 0, z: 0 } },
            { t: 3, pos: { x: 40, y: 20, z: 40 }, target: { x: 30, y: 2, z: 30 } },
            { t: 5, pos: { x: 20, y: 15, z: 40 }, target: { x: 30, y: 2, z: 30 } },
            { t: 7, pos: { x: 0, y: 5, z: 0 }, target: { x: -20, y: 2, z: -20 } },
            { t: 9, pos: { x: -15, y: 2, z: -10 }, target: { x: -20, y: 4, z: -20 } },
            { t: 11, pos: { x: 15, y: 8, z: 50 }, target: { x: 0, y: 1, z: 40 } },
            { t: 16, pos: { x: 0, y: 150, z: 100 }, target: { x: 0, y: 0, z: 0 } }
        ],
        items: [
            { type: 'camera', pos: { x: 30, y: 2, z: 30 }, label: "入口监控1", desc: "覆盖主入口区域", time: 3.5 },
            { type: 'guard', pos: { x: -20, y: 2, z: -20 }, label: "安保岗A", desc: "车辆引导", time: 7.5 },
            { type: 'barrier', pos: { x: 0, y: 1, z: 40 }, label: "限流围栏", desc: "防止人流", time: 11.5 }
        ]
    },
    'plan2': {
        name: "VIP特勤方案 B",
        duration: 13,
        cameraTrack: [
            { t: 0, pos: { x: -80, y: 30, z: 0 }, target: { x: 0, y: 10, z: 0 } },
            { t: 2.5, pos: { x: 40, y: 5, z: 0 }, target: { x: 50, y: 2, z: 0 } },
            { t: 4.5, pos: { x: 45, y: 8, z: 15 }, target: { x: 50, y: 2, z: 0 } },
            { t: 6, pos: { x: 30, y: 6, z: 15 }, target: { x: 40, y: 2, z: 0 } },
            { t: 9, pos: { x: 30, y: 6, z: -15 }, target: { x: 40, y: 2, z: 0 } },
            { t: 13, pos: { x: 45, y: 100, z: 0 }, target: { x: 45, y: 0, z: 0 } }
        ],
        items: [
            { type: 'camera', pos: { x: 50, y: 2, z: 0 }, label: "VIP通道监控", desc: "高精度全景", time: 2.5 },
            { type: 'guard', pos: { x: 40, y: 2, z: 0 }, label: "特勤小组", desc: "3人小组", time: 6.5 }
        ]
    }
});

const tempPlanData = reactive<any[]>([]);
const tempCameraTrack = reactive<any[]>([]);
const currentPlanDuration = ref(30);
const currentEditorTime = ref(0);
const isEditorPlaying = ref(false);
const selectedObjectIndex = ref(-1);
const selectedObjectPos = reactive({ x: 0, y: 0, z: 0 });
const selectedObjectLabel = ref('');

const layers = reactive({
    base: true,
    location: true,
    plan: true
});

const infoContent = ref(`
  <p><strong>当前场馆：</strong> 奥体中心主体育场</p>
  <p><strong>活动名称：</strong> 年度全明星演唱会</p>
  <p><strong>预计人数：</strong> 45,000 人</p>
  <hr style="border:0; border-top:1px dashed #333; margin:10px 0;">
  <p style="font-size:11px; color:#888;">
      请点击场景中的标签查看详细信息。
  </p>
`);

// --- Three.js Variables ---
let scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer, controls: any;
let objects: THREE.Mesh[] = [];
let labels: any[] = [];
let dragPlane: THREE.Mesh;
let cameraHelpersGroup: THREE.Group;
let raycaster: THREE.Raycaster;
let animationId: number;
let lastFrameTime = 0;
let editorStartTime = 0;

// --- SimpleOrbitControls Class ---
class SimpleOrbitControls {
    camera: THREE.Camera;
    domElement: HTMLElement;
    target: THREE.Vector3;
    isDragging: boolean;
    state: string;
    prevPos: { x: number, y: number };
    radius: number;
    theta: number;
    phi: number;
    enabled: boolean;
    autoRotate: boolean;
    rotateSpeed: number;
    panSpeed: number;

    constructor(camera: THREE.Camera, domElement: HTMLElement) {
        this.camera = camera;
        this.domElement = domElement;
        this.target = new THREE.Vector3(0, 0, 0);
        this.isDragging = false;
        this.state = 'NONE';
        this.prevPos = { x: 0, y: 0 };
        this.radius = 150;
        this.theta = Math.PI / 4;
        this.phi = Math.PI / 3;
        this.enabled = true;
        this.autoRotate = true;
        this.rotateSpeed = 0.002;
        this.panSpeed = 1.0;

        domElement.addEventListener('mousedown', e => this.onDown(e));
        window.addEventListener('mousemove', e => this.onMove(e));
        window.addEventListener('mouseup', () => {
            this.isDragging = false;
            this.state = 'NONE';
        });
        domElement.addEventListener('wheel', e => this.onWheel(e));
        domElement.addEventListener('contextmenu', e => e.preventDefault());
    }
    onDown(e: MouseEvent) {
        if (!this.enabled) return;
        // Check if target is domElement or label
        if (e.target !== this.domElement && !(e.target as HTMLElement).classList.contains('label-marker')) return;

        this.isDragging = true;
        this.prevPos = { x: e.clientX, y: e.clientY };

        if (e.button === 0) { // Left Click
            this.state = 'ROTATE';
        } else if (e.button === 2) { // Right Click
            this.state = 'PAN';
        }
    }
    onMove(e: MouseEvent) {
        if (!this.isDragging || !this.enabled) return;
        const dx = e.clientX - this.prevPos.x;
        const dy = e.clientY - this.prevPos.y;

        if (this.state === 'ROTATE') {
            this.theta -= dx * 0.005;
            this.phi -= dy * 0.005;
            this.phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.1, this.phi));
        } else if (this.state === 'PAN') {
            this.pan(-dx, dy);
        }

        this.update();
        this.prevPos = { x: e.clientX, y: e.clientY };
    }
    pan(deltaX: number, deltaY: number) {
        const offset = new THREE.Vector3().copy(this.camera.position).sub(this.target);
        const targetDistance = offset.length();
        const factor = 2 * targetDistance * Math.tan(((this.camera as THREE.PerspectiveCamera).fov / 2) * Math.PI / 180) / this.domElement.clientHeight;

        const vX = new THREE.Vector3();
        const vY = new THREE.Vector3();

        vX.setFromMatrixColumn(this.camera.matrix, 0); // Right
        vY.setFromMatrixColumn(this.camera.matrix, 1); // Up

        vX.multiplyScalar(deltaX * factor);
        vY.multiplyScalar(deltaY * factor);

        this.target.add(vX);
        this.target.add(vY);
    }
    onWheel(e: WheelEvent) {
        if (!this.enabled) return;
        this.radius += e.deltaY * 0.1;
        this.radius = Math.max(1, Math.min(500, this.radius));
        this.update();
    }
    update() {
        this.camera.position.x = this.target.x + this.radius * Math.sin(this.phi) * Math.sin(this.theta);
        this.camera.position.y = this.target.y + this.radius * Math.cos(this.phi);
        this.camera.position.z = this.target.z + this.radius * Math.sin(this.phi) * Math.cos(this.theta);
        this.camera.lookAt(this.target);
    }
}

// --- Lifecycle ---
onMounted(async () => {
    // Load styles
    loadStyle("https://cdn.bootcdn.net/ajax/libs/font-awesome/6.4.0/css/all.min.css");

    // Load scripts
    try {
        await loadScript("https://cdn.bootcdn.net/ajax/libs/echarts/5.4.3/echarts.min.js");
        await loadScript("https://cdn.staticfile.org/tween.js/18.6.4/tween.umd.js");

        init3D();
        initCharts();
        updateClock();
        loadLocationLabels();

        // Start loop
        animate();
    } catch (e) {
        console.error("Failed to load dependencies", e);
    }
});

onUnmounted(() => {
    cancelAnimationFrame(animationId);
    if (renderer) {
        renderer.dispose();
        renderer.domElement.remove();
    }
    window.removeEventListener('resize', onWindowResize);
    window.removeEventListener('mousemove', onGlobalMouseMove);
    window.removeEventListener('mouseup', onGlobalMouseUp);
});

// --- Methods ---
const init3D = () => {
    const container = canvasContainer.value!;
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0f172a, 0.002);

    camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 1, 1000);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    controls = new SimpleOrbitControls(camera, renderer.domElement);
    controls.update();

    // Lighting
    const amb = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(amb);
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(50, 100, 50);
    scene.add(dir);

    loadBaseScene();

    cameraHelpersGroup = new THREE.Group();
    scene.add(cameraHelpersGroup);

    dragPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(500, 500),
        new THREE.MeshBasicMaterial({ visible: false })
    );
    dragPlane.rotation.x = -Math.PI / 2;
    scene.add(dragPlane);

    renderer.domElement.addEventListener('click', onSceneClick);
    setupDragControls();

    window.addEventListener('resize', onWindowResize);
};

const loadBaseScene = () => {
    const grid = new THREE.GridHelper(200, 50, 0x3b82f6, 0x1e293b);
    scene.add(grid);

    const plane = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshPhongMaterial({ color: 0x0f172a, side: THREE.DoubleSide }));
    plane.rotation.x = -Math.PI / 2;
    scene.add(plane);

    const stadium = new THREE.Mesh(
        new THREE.TorusGeometry(50, 15, 16, 100),
        new THREE.MeshPhongMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.6, wireframe: true })
    );
    stadium.rotation.x = Math.PI / 2;
    stadium.position.y = 8;
    scene.add(stadium);
};

const loadLocationLabels = () => {
    const locations = [
        { pos: { x: 40, y: 5, z: 0 }, title: "主入口", desc: "场馆主要观众入口，设有8个检票闸机。" },
        { pos: { x: -40, y: 5, z: 0 }, title: "VIP通道", desc: "贵宾及演职人员专用通道。" },
        { pos: { x: 0, y: 15, z: 0 }, title: "中央舞台", desc: "演出核心区域，需重点防范抛物。" }
    ];
    locations.forEach(loc => {
        createLabel(loc.pos, loc.title, loc.desc, 'location');
    });
};

const createLabel = (pos: any, title: string, desc: string, type: string) => {
    const div = document.createElement('div');
    div.className = `label-marker ${type === 'plan' ? 'plan-label' : ''}`;
    div.innerHTML = `
        <i class="fas ${type === 'plan' ? 'fa-shield-alt' : 'fa-map-marker-alt'}"></i> ${title}
        <div class="detail">${desc}</div>
    `;

    div.onclick = (e) => {
        e.stopPropagation();
        document.querySelectorAll('.label-marker').forEach(el => el.classList.remove('expanded'));
        div.classList.add('expanded');

        focusCamera(pos);
        showResetBtn.value = true;

        infoContent.value = `
            <h3 style="color:${type === 'plan' ? 'var(--accent)' : 'var(--primary)'}">${title}</h3>
            <p style="margin-top:10px; font-size:13px; color:#ddd;">${desc}</p>
            <p style="margin-top:5px; font-size:12px; color:#888;">坐标: [${pos.x}, ${pos.y}, ${pos.z}]</p>
        `;
    };

    labelsContainer.value?.appendChild(div);

    labels.push({
        element: div,
        position: new THREE.Vector3(pos.x, pos.y, pos.z),
        type: type
    });
};

const updateLabels = () => {
    labels.forEach(label => {
        if (label.type === 'location' && !layers.location) {
            label.element.style.display = 'none';
            return;
        }
        if (label.type === 'plan' && !layers.plan) {
            label.element.style.display = 'none';
            return;
        }

        const vector = label.position.clone();
        vector.project(camera);

        const x = (vector.x * .5 + .5) * renderer.domElement.clientWidth;
        const y = (-(vector.y * .5) + .5) * renderer.domElement.clientHeight;

        if (vector.z > 1) {
            label.element.style.display = 'none';
        } else {
            label.element.style.display = 'block';
            label.element.style.left = x + 'px';
            label.element.style.top = y + 'px';
        }
    });
};

const animate = () => {
    animationId = requestAnimationFrame(animate);
    // @ts-ignore
    if (window.TWEEN) window.TWEEN.update();

    if (currentMode.value === 'dashboard' && !controls.isDragging && !isAnimating.value && controls.autoRotate) {
        controls.theta += controls.rotateSpeed;
        controls.update();
    }

    updateLabels();
    renderer.render(scene, camera);
};

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

const updateClock = () => {
    currentTime.value = new Date().toLocaleTimeString();
    setTimeout(updateClock, 1000);
};

// --- Logic for Plans ---
const clearPlanObjects = () => {
    for (let i = objects.length - 1; i >= 0; i--) {
        scene.remove(objects[i]);
    }
    objects = [];

    labels = labels.filter(l => {
        if (l.type === 'plan') {
            l.element.remove();
            return false;
        }
        return true;
    });
};

const addMesh = (pos: any, type: string) => {
    let geo, color;
    if (type === 'camera') { geo = new THREE.BoxGeometry(2, 2, 2); color = 0x3b82f6; }
    else if (type === 'guard') { geo = new THREE.CylinderGeometry(1, 1, 4); color = 0x10b981; }
    else { geo = new THREE.BoxGeometry(4, 2, 1); color = 0xf59e0b; }

    const mesh = new THREE.Mesh(geo, new THREE.MeshPhongMaterial({ color: color }));
    mesh.position.set(pos.x, pos.y, pos.z);
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
};

const applyPlan = (planId: string) => {
    clearPlanObjects();
    appliedPlanId.value = planId;
    const items = plans[planId].items;

    items.forEach((item: any) => {
        addMesh(item.pos, item.type);
        createLabel({ x: item.pos.x, y: item.pos.y + 5, z: item.pos.z }, item.label, item.desc, 'plan');
    });

    alert("方案 [" + plans[planId].name + "] 已加载！");
};

const cancelAppliedPlan = () => {
    if (!appliedPlanId.value) return;
    clearPlanObjects();
    appliedPlanId.value = null;
    alert("已取消方案应用，恢复默认场景。");
};

const createPlan = () => {
    const id = 'plan_' + Date.now();
    plans[id] = { name: "新建安保方案", items: [], cameraTrack: [], duration: 30 };
    editPlan(id);
};

const editPlan = (planId: string) => {
    const plan = plans[planId];
    if (!plan) return;

    editingPlanId.value = planId;

    tempPlanData.splice(0, tempPlanData.length, ...JSON.parse(JSON.stringify(plan.items || [])));
    tempCameraTrack.splice(0, tempCameraTrack.length, ...JSON.parse(JSON.stringify(plan.cameraTrack || [])));

    currentPlanDuration.value = plan.duration || 30;
    setMode('edit');
    currentEditorTime.value = 0;
    isEditorPlaying.value = false;
    selectedObjectIndex.value = -1;

    refreshEditorScene();

    if (tempCameraTrack.length > 0) {
        const firstKey = tempCameraTrack[0];
        controls.camera.position.copy(firstKey.pos);
        controls.target.copy(firstKey.target);
        controls.update();
    }

    alert("进入编辑模式: " + plans[planId].name);
};

const savePlan = () => {
    if (!editingPlanId.value || !plans[editingPlanId.value]) {
        alert("错误：无法找到当前编辑的方案ID！");
        return;
    }

    plans[editingPlanId.value].items = JSON.parse(JSON.stringify(tempPlanData));
    plans[editingPlanId.value].cameraTrack = JSON.parse(JSON.stringify(tempCameraTrack));
    plans[editingPlanId.value].duration = currentPlanDuration.value;

    const savedPlan = plans[editingPlanId.value];
    if (savedPlan.cameraTrack.length === 0) {
        alert("警告：当前方案没有记录任何镜头关键帧！\n播放时镜头将不会移动。");
    }

    alert(`方案 [${savedPlan.name}] 保存成功！\n时长: ${savedPlan.duration}s\n安保点位: ${savedPlan.items.length}\n镜头关键帧: ${savedPlan.cameraTrack.length}`);

    setMode('dashboard');
};

const exitEditor = () => {
    if (confirm("确定退出编辑吗？未保存的更改将丢失。")) {
        setMode('dashboard');
        clearPlanObjects();
        editingPlanId.value = null;
    }
};

const refreshEditorScene = () => {
    clearPlanObjects();
    tempPlanData.forEach((item, idx) => {
        const mesh = addMesh(item.pos, item.type);
        mesh.userData = { isPlanObject: true, index: idx };
        createLabel({ x: item.pos.x, y: item.pos.y + 5, z: item.pos.z }, item.label, item.desc, 'plan');
    });
    updateSceneAtTime(currentEditorTime.value);
    if (selectedObjectIndex.value !== -1) selectObject(selectedObjectIndex.value);
};

// --- Timeline & Editor Logic ---
const formattedEditorTime = computed(() => {
    const t = currentEditorTime.value;
    const s = Math.floor(t);
    const ms = Math.floor((t - s) * 10);
    return `00:${s.toString().padStart(2, '0')}.${ms}`;
});

const updateDuration = () => {
    if (currentPlanDuration.value < 5) currentPlanDuration.value = 5;
};

const addCameraKeyframe = () => {
    const t = currentEditorTime.value;
    const existing = tempCameraTrack.find(k => Math.abs(k.t - t) < 0.1);

    const currentPos = { x: camera.position.x, y: camera.position.y, z: camera.position.z };
    const currentTarget = { x: controls.target.x, y: controls.target.y, z: controls.target.z };

    if (existing) {
        existing.pos = currentPos;
        existing.target = currentTarget;
    } else {
        tempCameraTrack.push({
            t: t,
            pos: currentPos,
            target: currentTarget
        });
        tempCameraTrack.sort((a, b) => a.t - b.t);
    }
    updateCameraPathVisuals();
};

const addObjectToTimeline = (type: string) => {
    const pos = {
        x: Math.round(controls.target.x + (Math.random() * 10 - 5)),
        y: 2,
        z: Math.round(controls.target.z + (Math.random() * 10 - 5))
    };

    const label = type === 'camera' ? '新监控' : (type === 'guard' ? '新安保' : '新围栏');

    const newItem = {
        type: type,
        pos: pos,
        label: label,
        desc: "请配置详细信息",
        time: Math.floor(currentEditorTime.value)
    };

    const index = tempPlanData.push(newItem) - 1;

    refreshEditorScene();
    selectObject(index);
};

const jumpToTime = (t: number) => {
    currentEditorTime.value = Math.max(0, Math.min(t, currentPlanDuration.value));
    updateSceneAtTime(currentEditorTime.value);
};

const startScrub = (e: MouseEvent) => {
    if (isEditorPlaying.value) return;
    const updateScrub = (evt: MouseEvent) => {
        const rect = document.getElementById('timeline-area')!.getBoundingClientRect();
        let x = evt.clientX - rect.left;
        x = Math.max(0, Math.min(x, rect.width));
        const t = (x / rect.width) * currentPlanDuration.value;
        jumpToTime(t);
    };
    updateScrub(e);

    const onMove = (evt: MouseEvent) => updateScrub(evt);
    const onUp = () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
};

const startDragKeyframe = (e: MouseEvent, itemIndex: number) => {
    const onMove = (evt: MouseEvent) => {
        const rect = document.getElementById('timeline-area')!.getBoundingClientRect();
        let x = evt.clientX - rect.left;
        x = Math.max(0, Math.min(x, rect.width));
        const t = (x / rect.width) * currentPlanDuration.value;

        tempPlanData[itemIndex].time = Math.round(t * 10) / 10;
        updateSceneAtTime(currentEditorTime.value);
    };
    const onUp = () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
};

const startDragCameraKeyframe = (e: MouseEvent, keyIndex: number) => {
    const onMove = (evt: MouseEvent) => {
        const rect = document.getElementById('timeline-area')!.getBoundingClientRect();
        let x = evt.clientX - rect.left;
        x = Math.max(0, Math.min(x, rect.width));
        const t = (x / rect.width) * currentPlanDuration.value;

        tempCameraTrack[keyIndex].t = Math.round(t * 10) / 10;
        tempCameraTrack.sort((a, b) => a.t - b.t);
        updateSceneAtTime(currentEditorTime.value);
    };
    const onUp = () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
};

const togglePlayEditor = () => {
    if (isEditorPlaying.value) {
        stopEditor();
    } else {
        isEditorPlaying.value = true;
        editorStartTime = Date.now() - currentEditorTime.value * 1000;
        requestAnimationFrame(editorLoop);
    }
};

const stopEditor = () => {
    isEditorPlaying.value = false;
};

const editorLoop = () => {
    if (!isEditorPlaying.value) return;

    const now = Date.now();
    let t = (now - editorStartTime) / 1000;

    if (t > currentPlanDuration.value) {
        t = currentPlanDuration.value;
        stopEditor();
    }

    jumpToTime(t);
    requestAnimationFrame(editorLoop);
};

const getCameraStateAtTime = (t: number) => {
    if (tempCameraTrack.length === 0) return null;

    let prev = tempCameraTrack[0];
    let next = tempCameraTrack[tempCameraTrack.length - 1];

    for (let i = 0; i < tempCameraTrack.length - 1; i++) {
        if (t >= tempCameraTrack[i].t && t < tempCameraTrack[i + 1].t) {
            prev = tempCameraTrack[i];
            next = tempCameraTrack[i + 1];
            break;
        }
    }

    const result = { pos: new THREE.Vector3(), target: new THREE.Vector3() };

    if (t >= next.t) {
        result.pos.copy(next.pos);
        result.target.copy(next.target);
    } else if (t <= prev.t) {
        result.pos.copy(prev.pos);
        result.target.copy(prev.target);
    } else {
        const duration = next.t - prev.t;
        const alpha = (t - prev.t) / duration;

        const ease = (k: number) => k < .5 ? 4 * k * k * k : (k - 1) * (2 * k - 2) * (2 * k - 2) + 1;
        const k = ease(alpha);

        result.pos.x = prev.pos.x + (next.pos.x - prev.pos.x) * k;
        result.pos.y = prev.pos.y + (next.pos.y - prev.pos.y) * k;
        result.pos.z = prev.pos.z + (next.pos.z - prev.pos.z) * k;

        result.target.x = prev.target.x + (next.target.x - prev.target.x) * k;
        result.target.y = prev.target.y + (next.target.y - prev.target.y) * k;
        result.target.z = prev.target.z + (next.target.z - prev.target.z) * k;
    }
    return result;
};

const updateCameraPathVisuals = () => {
    if (!cameraHelpersGroup) return;
    while (cameraHelpersGroup.children.length > 0) {
        cameraHelpersGroup.remove(cameraHelpersGroup.children[0]);
    }

    if (currentMode.value !== 'edit' || tempCameraTrack.length === 0) return;

    tempCameraTrack.forEach((kf, i) => {
        const geometry = new THREE.ConeGeometry(2, 5, 4);
        geometry.rotateX(Math.PI / 2);
        const material = new THREE.MeshBasicMaterial({ color: 0x3b82f6, wireframe: true, transparent: true, opacity: 0.5 });
        const mesh = new THREE.Mesh(geometry, material);

        mesh.position.set(kf.pos.x, kf.pos.y, kf.pos.z);
        mesh.lookAt(kf.target.x, kf.target.y, kf.target.z);

        const sprite = makeTextSprite((i + 1).toString());
        sprite.position.set(0, 3, 0);
        mesh.add(sprite);

        cameraHelpersGroup.add(mesh);
    });

    if (tempCameraTrack.length > 1) {
        const points = [];
        const steps = 100;
        for (let i = 0; i <= steps; i++) {
            const t = (i / steps) * currentPlanDuration.value;
            const state = getCameraStateAtTime(t);
            if (state) points.push(state.pos);
        }
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ color: 0xffff00 });
        const line = new THREE.Line(geometry, material);
        cameraHelpersGroup.add(line);
    }
};

const makeTextSprite = (message: string) => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    context.font = "Bold 40px Arial";
    context.fillStyle = "rgba(255,255,255,1)";
    context.fillText(message, 0, 40);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(5, 2.5, 1);
    return sprite;
};

const updateSceneAtTime = (t: number) => {
    const state = getCameraStateAtTime(t);
    if (state) {
        controls.camera.position.copy(state.pos);
        controls.target.copy(state.target);
        controls.camera.lookAt(controls.target);
    }

    tempPlanData.forEach((item, idx) => {
        const mesh = objects.find(o => o.userData.index === idx);
        if (mesh) {
            const visible = t >= (item.time || 0);

            if (currentMode.value === 'edit') {
                mesh.visible = true;
                if (visible) {
                    // @ts-ignore
                    mesh.material.opacity = 1;
                    // @ts-ignore
                    mesh.material.transparent = false;
                } else {
                    // @ts-ignore
                    mesh.material.opacity = 0.3;
                    // @ts-ignore
                    mesh.material.transparent = true;
                }
            } else {
                mesh.visible = visible;
                // @ts-ignore
                mesh.material.opacity = 1;
                // @ts-ignore
                mesh.material.transparent = false;
            }

            const label = labels.find(l =>
                Math.abs(l.position.x - item.pos.x) < 0.1 &&
                Math.abs(l.position.z - item.pos.z) < 0.1
            );
            if (label) {
                label.element.style.display = visible ? 'block' : 'none';
                if (currentMode.value === 'edit' && selectedObjectIndex.value === idx) {
                    label.element.style.display = 'block';
                    label.element.style.opacity = visible ? '1' : '0.5';
                }
            }
        }
    });
};

const selectObject = (index: number) => {
    selectedObjectIndex.value = index;
    const item = tempPlanData[index];

    objects.forEach(obj => {
        if (obj.userData.index === index) {
            // @ts-ignore
            obj.material.emissive.setHex(0x555555);
        } else {
            // @ts-ignore
            if (obj.material.emissive) obj.material.emissive.setHex(0x000000);
        }
    });

    selectedObjectPos.x = item.pos.x;
    selectedObjectPos.y = item.pos.y;
    selectedObjectPos.z = item.pos.z;
    selectedObjectLabel.value = item.label;
};

const deselectObject = () => {
    selectedObjectIndex.value = -1;
    objects.forEach(obj => {
        // @ts-ignore
        if (obj.material.emissive) obj.material.emissive.setHex(0x000000);
    });
};

const updateObjectPos = () => {
    if (selectedObjectIndex.value === -1) return;

    const x = selectedObjectPos.x;
    const y = selectedObjectPos.y;
    const z = selectedObjectPos.z;

    const item = tempPlanData[selectedObjectIndex.value];
    item.pos = { x, y, z };

    const mesh = objects.find(o => o.userData.index === selectedObjectIndex.value);
    if (mesh) mesh.position.set(x, y, z);

    refreshEditorScene();
    selectObject(selectedObjectIndex.value);
};

const updateObjectLabel = () => {
    if (selectedObjectIndex.value === -1) return;
    tempPlanData[selectedObjectIndex.value].label = selectedObjectLabel.value;
    refreshEditorScene();
    selectObject(selectedObjectIndex.value);
};

const onSceneClick = (event: MouseEvent) => {
    if (currentMode.value !== 'edit') return;

    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
    mouse.y = - (event.clientY / renderer.domElement.clientHeight) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(objects);

    if (intersects.length > 0) {
        const object = intersects[0].object;
        if (object.userData && object.userData.isPlanObject) {
            selectObject(object.userData.index);
            event.stopPropagation();
        }
    }
};

const setupDragControls = () => {
    let isDraggingObj = false;
    let dragObject: THREE.Object3D | null = null;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    renderer.domElement.addEventListener('mousedown', (e) => {
        if (currentMode.value !== 'edit') return;

        mouse.x = (e.clientX / renderer.domElement.clientWidth) * 2 - 1;
        mouse.y = - (e.clientY / renderer.domElement.clientHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(objects);

        if (intersects.length > 0 && intersects[0].object.userData.isPlanObject) {
            isDraggingObj = true;
            dragObject = intersects[0].object;
            controls.enabled = false;
            selectObject(dragObject.userData.index);
        }
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDraggingObj || !dragObject) return;

        mouse.x = (e.clientX / renderer.domElement.clientWidth) * 2 - 1;
        mouse.y = - (e.clientY / renderer.domElement.clientHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(dragPlane);

        if (intersects.length > 0) {
            const point = intersects[0].point;
            dragObject.position.set(Math.round(point.x), dragObject.position.y, Math.round(point.z));

            selectedObjectPos.x = dragObject.position.x;
            selectedObjectPos.z = dragObject.position.z;

            const item = tempPlanData[dragObject.userData.index];
            item.pos.x = dragObject.position.x;
            item.pos.z = dragObject.position.z;
        }
    });

    window.addEventListener('mouseup', () => {
        if (isDraggingObj) {
            isDraggingObj = false;
            dragObject = null;
            controls.enabled = true;
            refreshEditorScene();
            selectObject(selectedObjectIndex.value);
        }
    });
};

const playDemo = (planId: string) => {
    const plan = plans[planId];
    if (!plan) return;

    demoDuration.value = (plan.duration && !isNaN(plan.duration) && plan.duration > 0) ? plan.duration : 30;

    tempPlanData.splice(0, tempPlanData.length, ...JSON.parse(JSON.stringify(plan.items || [])));
    tempCameraTrack.splice(0, tempCameraTrack.length, ...JSON.parse(JSON.stringify(plan.cameraTrack || [])));

    if (tempCameraTrack.length === 0) {
        tempCameraTrack.push({
            t: 0,
            pos: { x: camera.position.x, y: camera.position.y, z: camera.position.z },
            target: { x: controls.target.x, y: controls.target.y, z: controls.target.z }
        });
    }

    clearPlanObjects();
    tempPlanData.forEach((item, idx) => {
        const mesh = addMesh(item.pos, item.type);
        mesh.userData = { isPlanObject: true, index: idx };
        createLabel({ x: item.pos.x, y: item.pos.y + 5, z: item.pos.z }, item.label, item.desc, 'plan');
    });

    isAnimating.value = true;
    setMode('roam');
    showResetBtn.value = false;

    isDemoPaused.value = false;
    demoElapsedTime.value = 0;
    lastFrameTime = Date.now();

    requestAnimationFrame(runDemoFrame);
};

const runDemoFrame = () => {
    if (!isAnimating.value) return;

    const now = Date.now();
    const delta = (now - lastFrameTime) / 1000;
    lastFrameTime = now;

    if (!isDemoPaused.value) {
        demoElapsedTime.value += delta;

        if (demoElapsedTime.value >= demoDuration.value) {
            demoElapsedTime.value = demoDuration.value;
            stopDemo();
            alert("演示结束");
            return;
        }

        updateSceneAtTime(demoElapsedTime.value);
    }

    requestAnimationFrame(runDemoFrame);
};

const toggleDemoPause = () => {
    isDemoPaused.value = !isDemoPaused.value;
    if (!isDemoPaused.value) lastFrameTime = Date.now();
};

const stopDemo = () => {
    isAnimating.value = false;
    setMode('dashboard');

    const expanded = document.querySelector('.label-marker.expanded');
    if (expanded) {
        showResetBtn.value = true;
    }
};

const setMode = (mode: string) => {
    currentMode.value = mode;
    if (cameraHelpersGroup) cameraHelpersGroup.visible = (mode === 'edit');
};

const toggleLayer = (layer: 'base' | 'location' | 'plan') => {
    layers[layer] = !layers[layer];
    if (layer === 'plan') {
        objects.forEach(o => o.visible = layers[layer]);
    }
};

const toggleAutoRotate = () => {
    controls.autoRotate = autoRotate.value;
};

const setRotateSpeed = () => {
    controls.rotateSpeed = rotateSpeed.value * 0.001;
};

const resetView = () => {
    showResetBtn.value = false;
    document.querySelectorAll('.label-marker').forEach(el => el.classList.remove('expanded'));
    infoContent.value = `
        <p><strong>当前场馆：</strong> 奥体中心主体育场</p>
        <p><strong>活动名称：</strong> 年度全明星演唱会</p>
        <p><strong>预计人数：</strong> 45,000 人</p>
        <hr style="border:0; border-top:1px dashed #333; margin:10px 0;">
        <p style="font-size:11px; color:#888;">
            请点击场景中的标签查看详细信息。
        </p>
    `;

    const targetPos = { x: 0, y: 0, z: 0 };
    const duration = 1500;

    const startTarget = { x: controls.target.x, y: controls.target.y, z: controls.target.z };

    // @ts-ignore
    if (window.TWEEN) {
        // @ts-ignore
        new window.TWEEN.Tween(startTarget)
            .to(targetPos, duration)
            // @ts-ignore
            .easing(window.TWEEN.Easing.Quadratic.Out)
            .onUpdate(() => {
                controls.target.set(startTarget.x, startTarget.y, startTarget.z);
            })
            .start();

        // @ts-ignore
        new window.TWEEN.Tween(controls)
            .to({
                radius: 150,
                theta: Math.PI / 4,
                phi: Math.PI / 3
            }, duration)
            // @ts-ignore
            .easing(window.TWEEN.Easing.Quadratic.Out)
            .onUpdate(() => {
                controls.update();
            })
            .onComplete(() => {
                autoRotate.value = true;
                controls.autoRotate = true;
            })
            .start();
    }
};

const focusCamera = (targetPos: any) => {
    controls.autoRotate = false;
    autoRotate.value = false;
    showResetBtn.value = true;

    const startTarget = { x: controls.target.x, y: controls.target.y, z: controls.target.z };

    // @ts-ignore
    if (window.TWEEN) {
        // @ts-ignore
        new window.TWEEN.Tween(startTarget)
            .to({ x: targetPos.x, y: targetPos.y, z: targetPos.z }, 1000)
            // @ts-ignore
            .easing(window.TWEEN.Easing.Quadratic.Out)
            .onUpdate(() => {
                controls.target.set(startTarget.x, startTarget.y, startTarget.z);
            })
            .start();

        // @ts-ignore
        new window.TWEEN.Tween(controls)
            .to({ radius: 40, theta: controls.theta + 0.5 }, 1000)
            // @ts-ignore
            .easing(window.TWEEN.Easing.Quadratic.Out)
            .onUpdate(() => {
                controls.update();
            })
            .start();
    }
};

const formatTime = (t: number) => {
    const s = Math.floor(t);
    const ms = Math.floor((t - s) * 10);
    return s.toString().padStart(2, '0') + ':' + ms + '0';
};

const jumpToCameraKeyframe = (key: any) => {
    jumpToTime(key.t);
    controls.camera.position.set(key.pos.x, key.pos.y, key.pos.z);
    controls.target.set(key.target.x, key.target.y, key.target.z);
    controls.update();
};

const deleteCameraKeyframe = (idx: number) => {
    if (confirm("删除这个镜头关键帧?")) {
        tempCameraTrack.splice(idx, 1);
        updateCameraPathVisuals();
    }
};

const onWindowResize = () => {
    if (canvasContainer.value && renderer && camera) {
        const width = canvasContainer.value.clientWidth;
        const height = canvasContainer.value.clientHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    }
};

const onGlobalMouseMove = (e: MouseEvent) => { }; // Placeholder if needed
const onGlobalMouseUp = () => { }; // Placeholder if needed

</script>

<style scoped>
:root {
    --bg-dark: #0f172a;
    --panel-bg: rgba(15, 23, 42, 0.85);
    --primary: #3b82f6;
    --accent: #f59e0b;
    --danger: #ef4444;
    --text-main: #f1f5f9;
    --border: rgba(59, 130, 246, 0.3);
}

.anbao-container {
    position: relative;
    width: 100%;
    height: 100vh;
    overflow: hidden;
    background: #000;
    color: #f1f5f9;
    font-family: 'Inter', sans-serif;
}

#canvas-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
    background: radial-gradient(circle at center, #1e293b 0%, #000 100%);
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

.pointer-events-auto {
    pointer-events: auto;
}

.header {
    height: 60px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: linear-gradient(180deg, rgba(0, 0, 0, 0.8) 0%, transparent 100%);
    margin: -20px -20px 20px -20px;
    padding: 0 30px;
}

.logo {
    font-size: 24px;
    font-weight: bold;
    color: #3b82f6;
    text-shadow: 0 0 10px #3b82f6;
}

.clock {
    font-family: monospace;
    color: #f59e0b;
    font-size: 16px;
}

.dashboard-grid {
    flex: 1;
    display: grid;
    grid-template-columns: 350px 1fr 350px;
    grid-template-rows: 1fr 1fr;
    gap: 20px;
    height: calc(100% - 60px);
}

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

.p-top-left {
    grid-column: 1;
    grid-row: 1;
}

.p-bottom-left {
    grid-column: 1;
    grid-row: 2;
}

.p-top-right {
    grid-column: 3;
    grid-row: 1;
}

.p-bottom-right {
    grid-column: 3;
    grid-row: 2;
}

.p-center {
    grid-column: 2;
    grid-row: 1 / span 2;
    pointer-events: none;
    position: relative;
}

/* Labels style (global because inserted to body/container dynamically, but here scoped to container) */
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

.center-controls-container {
    position: absolute;
    bottom: 30px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 15px;
    z-index: 15;
    pointer-events: none;
    transition: opacity 0.3s;
}

.center-controls-container>* {
    pointer-events: auto;
}

.layer-control {
    background: rgba(0, 0, 0, 0.6);
    padding: 5px 15px;
    border-radius: 20px;
    border: 1px solid #555;
    display: flex;
    gap: 15px;
}

.layer-item {
    font-size: 12px;
    color: #ccc;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 5px;
}

.layer-item.active {
    color: #3b82f6;
    font-weight: bold;
}

.rotate-control {
    background: rgba(0, 0, 0, 0.6);
    padding: 5px 15px;
    border-radius: 20px;
    border: 1px solid #555;
    display: flex;
    gap: 15px;
    align-items: center;
    font-size: 12px;
    color: #ccc;
}

.rotate-control input[type="range"] {
    width: 100px;
    accent-color: #3b82f6;
}

#play-control-overlay {
    position: absolute;
    bottom: 30px;
    left: 50%;
    transform: translateX(-50%);
    gap: 15px;
    pointer-events: auto;
    z-index: 30;
    background: rgba(0, 0, 0, 0.7);
    padding: 10px 20px;
    border-radius: 30px;
    border: 1px solid #3b82f6;
}

.play-ctrl-btn {
    color: white;
    font-size: 20px;
    cursor: pointer;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    transition: all 0.2s;
}

.play-ctrl-btn:hover {
    background: #3b82f6;
    transform: scale(1.1);
}

.play-ctrl-btn.danger:hover {
    background: #ef4444;
}

.chart-box {
    flex: 1;
    width: 100%;
    min-height: 0;
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

.info-text {
    font-size: 12px;
    line-height: 1.6;
    color: #ccc;
}

.plan-list {
    flex: 1;
    overflow-y: auto;
}

.plan-item {
    padding: 10px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.plan-item:hover {
    background: rgba(255, 255, 255, 0.05);
}

.plan-actions i {
    margin-left: 8px;
    color: #aaa;
    cursor: pointer;
}

.plan-actions i:hover {
    color: #3b82f6;
}

.mode-switcher {
    display: flex;
    gap: 10px;
}

.mode-btn {
    padding: 8px 20px;
    background: rgba(0, 0, 0, 0.6);
    border: 1px solid #3b82f6;
    color: #3b82f6;
    border-radius: 20px;
    cursor: pointer;
    font-size: 14px;
    transition: 0.2s;
}

.mode-btn:hover {
    background: #3b82f6;
    color: white;
}

.reset-btn {
    position: absolute;
    bottom: 180px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(239, 68, 68, 0.8);
    color: white;
    padding: 8px 20px;
    border-radius: 20px;
    cursor: pointer;
    border: 1px solid rgba(255, 255, 255, 0.3);
    pointer-events: auto;
    z-index: 20;
    transition: all 0.3s;
    box-shadow: 0 0 15px rgba(239, 68, 68, 0.5);
}

.reset-btn:hover {
    background: rgba(239, 68, 68, 1);
    transform: translateX(-50%) scale(1.05);
}

.track-editor {
    pointer-events: auto;
    background: rgba(15, 23, 42, 0.85);
    border: 1px solid rgba(59, 130, 246, 0.3);
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 200px;
    margin-top: auto;
    position: relative;
}

.track-controls {
    height: 40px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    padding: 0 15px;
    gap: 15px;
    background: rgba(0, 0, 0, 0.3);
}

.time-display {
    font-family: monospace;
    color: #3b82f6;
    font-size: 14px;
    min-width: 60px;
}

.tracks-container {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    position: relative;
    display: flex;
}

.track-headers {
    width: 120px;
    border-right: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(0, 0, 0, 0.2);
    flex-shrink: 0;
}

.track-header {
    height: 30px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    display: flex;
    align-items: center;
    padding-left: 10px;
    font-size: 11px;
    color: #ccc;
    cursor: pointer;
}

.timeline-area {
    flex: 1;
    position: relative;
    overflow: hidden;
    cursor: crosshair;
}

.timeline-ruler {
    height: 20px;
    background: rgba(255, 255, 255, 0.05);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    position: relative;
}

.ruler-mark {
    position: absolute;
    top: 0;
    bottom: 0;
    border-left: 1px solid rgba(255, 255, 255, 0.2);
    font-size: 9px;
    color: #888;
    padding-left: 2px;
}

.track-lane {
    height: 30px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    position: relative;
}

.keyframe {
    position: absolute;
    top: 5px;
    width: 8px;
    height: 20px;
    background: #f59e0b;
    border-radius: 2px;
    cursor: pointer;
    transform: translateX(-50%);
    z-index: 2;
}

.keyframe:hover {
    background: white;
    z-index: 3;
}

.keyframe.camera-key {
    background: #3b82f6;
    border-radius: 50%;
    width: 12px;
    height: 12px;
    top: 9px;
}

.playhead {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 2px;
    background: #ef4444;
    z-index: 10;
    pointer-events: none;
}

.playhead-handle {
    position: absolute;
    top: 0;
    left: -5px;
    width: 12px;
    height: 12px;
    background: #ef4444;
    transform: rotate(45deg);
}

.applied-plan-indicator {
    position: absolute;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(16, 185, 129, 0.9);
    color: white;
    padding: 8px 20px;
    border-radius: 30px;
    border: 1px solid rgba(255, 255, 255, 0.3);
    align-items: center;
    gap: 10px;
    box-shadow: 0 0 15px rgba(16, 185, 129, 0.4);
    z-index: 25;
    pointer-events: auto;
    font-size: 14px;
}

.applied-plan-indicator i {
    cursor: pointer;
    opacity: 0.8;
}

.applied-plan-indicator i:hover {
    opacity: 1;
    transform: scale(1.1);
}

#editor-ui {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    flex-direction: column;
    justify-content: flex-end;
    padding: 20px;
    padding-bottom: 20px;
    z-index: 20;
}

.editor-toolbar {
    position: absolute;
    top: 70px;
    left: 20px;
    pointer-events: auto;
    background: rgba(15, 23, 42, 0.85);
    border: 1px solid rgba(59, 130, 246, 0.3);
    border-radius: 8px;
    padding: 10px;
    display: flex;
    gap: 10px;
    margin-top: 0;
}

.editor-btn {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: white;
    padding: 5px 15px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
}

.editor-btn:hover {
    background: #3b82f6;
}

.editor-btn.danger {
    border-color: #ef4444;
    color: #ef4444;
}

.editor-btn.danger:hover {
    background: #ef4444;
    color: white;
}

.transform-controls {
    position: absolute;
    bottom: 250px;
    right: 20px;
    background: rgba(15, 23, 42, 0.85);
    border: 1px solid rgba(59, 130, 246, 0.3);
    border-radius: 8px;
    padding: 10px;
    flex-direction: column;
    gap: 5px;
    pointer-events: auto;
    width: 200px;
}

.control-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 12px;
}

.control-row label {
    color: #aaa;
    width: 20px;
}

.control-row input {
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid #555;
    color: white;
    width: 50px;
    padding: 2px 5px;
    border-radius: 4px;
}

@keyframes blink {
    50% {
        opacity: 0;
    }
}
</style>
