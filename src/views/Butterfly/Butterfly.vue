<template>
    <div relative size-screen bg-gray-50 overflow-hidden>
        <!-- Step 1: Upload Page -->
        <div v-if="step === 1" absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-blue-50
            to-green-50>
            <div bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center max-w-lg w-full transform
                transition-all>
                <h1 text-3xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-500
                    to-green-500>
                    神奇涂鸦花园
                </h1>
                <p text-gray-500 mb-8 text-center leading-relaxed>
                    请上传一张填好色的蝴蝶画纸照片，系统将自动提取你的涂鸦，让它们在3D花园中翩翩起舞！
                </p>

                <!-- Upload Area -->
                <label
                    class="w-72 h-72 border-4 border-dashed border-blue-300 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50 hover:border-blue-500 transition-all relative overflow-hidden group">
                    <input type="file" accept="image/*" @change="onFileChange" class="hidden" />
                    <div v-if="!previewUrl" flex flex-col items-center text-blue-400 group-hover:text-blue-600
                        transition-colors>
                        <div text-6xl mb-4>+</div>
                        <div font-bold text-lg>点击上传图片</div>
                        <div text-sm mt-2 text-gray-400 font-normal>支持黑底或白底照片</div>
                    </div>
                    <img v-else :src="previewUrl" class="w-full h-full object-contain absolute inset-0 bg-gray-900" />
                </label>

                <button v-if="previewUrl" @click="generateButterfly"
                    class="mt-8 w-full py-4 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 flex justify-center items-center"
                    :disabled="isProcessing">
                    <span v-if="isProcessing" class="animate-spin mr-2">⏳</span>
                    {{ isProcessing ? '正在提取涂鸦...' : '召唤蝴蝶群' }}
                </button>
            </div>
        </div>

        <!-- Step 2: 3D Garden -->
        <div v-show="step === 2" ref="canvasTarget" size-full></div>
        <button v-if="step === 2" @click="goBack" absolute top-6 left-6 px-6 py-3 class="bg-white/80" backdrop-blur
            text-gray-800 rounded-full shadow-lg hover:bg-white transition-colors font-bold z-10 flex items-center
            gap-2>
            <span>←</span> 返回重新上传
        </button>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import * as THREE from 'three';
// @ts-ignore
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const step = ref(1);
const isProcessing = ref(false);
const previewUrl = ref<string | null>(null);
const canvasTarget = ref<HTMLDivElement | null>(null);

// Three.js variables
let scene: THREE.Scene | null = null;
let camera: THREE.PerspectiveCamera | null = null;
let renderer: THREE.WebGLRenderer | null = null;
let controls: OrbitControls | null = null;
let clock: THREE.Clock | null = null;
let animationId: number | null = null;

// 视频播放与卷轴动画相关变量
let videoElement: HTMLVideoElement | null = null;
let videoTexture: THREE.VideoTexture | null = null;
let videoMesh: THREE.Group | null = null; // 包含视频和画轴
let isVideoPlaying = false;
let scrollProgress = 0; // 卷轴展开进度 0-1
let scrollState = 'hidden'; // 'opening', 'playing', 'closing', 'hidden'

// 场景丰富元素：萤火虫与云朵
let fireflies: THREE.Points | null = null;
let clouds: THREE.Group[] = [];
let fireflyCount = 200;

// 存储所有生成的蝴蝶数据
interface ButterflyData {
    mesh: THREE.Group;       // 蝴蝶的3D组（包含左右翅膀和身体）
    leftWing: THREE.Mesh;    // 左翅膀网格
    rightWing: THREE.Mesh;   // 右翅膀网格
    speed: number;           // 整体飞行速度倍率
    flapSpeed: number;       // 翅膀扇动频率
    offset: number;          // 动画时间偏移量（确保每只蝴蝶动作不同步）
    radius: number;          // 飞行轨迹的半径大小
    yOffset: number;         // 基础飞行高度
    wanderX: number;         // X轴的随机游荡偏移
    wanderZ: number;         // Z轴的随机游荡偏移
}
let butterflies: ButterflyData[] = [];

const onFileChange = (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
        if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
        previewUrl.value = URL.createObjectURL(file);
    }
};

// --- 图像处理：从白色/黑色背景中提取蝴蝶涂鸦 ---
const extractButterflyTexture = async (url: string): Promise<THREE.Texture> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d')!;
            ctx.drawImage(img, 0, 0);
            
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            // 采样四个角的颜色，计算出背景的平均色值（假设四个角都是背景色）
            const corners = [
                0, // 左上角
                (canvas.width - 1) * 4, // 右上角
                (canvas.height - 1) * canvas.width * 4, // 左下角
                ((canvas.height - 1) * canvas.width + canvas.width - 1) * 4 // 右下角
            ];
            
            let r = 0, g = 0, b = 0;
            corners.forEach(idx => {
                r += data[idx];
                g += data[idx+1];
                b += data[idx+2];
            });
            r /= 4; g /= 4; b /= 4;

            // 背景容差值，用于判断像素是否接近背景色
            const threshold = 40; 

            for (let i = 0; i < data.length; i += 4) {
                const pr = data[i], pg = data[i+1], pb = data[i+2];
                // 计算当前像素与背景色的色差距离
                const dist = Math.abs(pr - r) + Math.abs(pg - g) + Math.abs(pb - b);
                
                // 如果色差小于阈值，认为是背景，将透明度(Alpha)设为0
                if (dist < threshold * 3) {
                    data[i+3] = 0; 
                }
            }

            ctx.putImageData(imageData, 0, 0);
            const texture = new THREE.CanvasTexture(canvas);
            texture.colorSpace = THREE.SRGBColorSpace;
            // 优化纹理过滤，防止3D模型上的图片出现锯齿
            texture.minFilter = THREE.LinearMipmapLinearFilter;
            texture.magFilter = THREE.LinearFilter;
            
            resolve(texture);
        };
        img.src = url;
    });
};

// --- 核心流程控制 ---
const generateButterfly = async () => {
    if (!previewUrl.value) return;
    
    isProcessing.value = true;
    try {
        // 1. 提取去背纹理
        const texture = await extractButterflyTexture(previewUrl.value);
        
        // 2. 切换到3D场景
        step.value = 2;
        setTimeout(() => {
            init3D(texture);
        }, 100);
    } catch (err) {
        console.error("Error processing image:", err);
        alert("图片处理失败，请重试！");
    } finally {
        isProcessing.value = false;
    }
};

const goBack = () => {
    step.value = 1;
    if (animationId !== null) cancelAnimationFrame(animationId);
    butterflies = [];
    if (videoElement) {
        videoElement.pause();
        videoElement.src = '';
        videoElement = null;
    }
    isVideoPlaying = false;
    
    if (renderer) {
        renderer.dispose();
        if (canvasTarget.value) {
            canvasTarget.value.innerHTML = '';
        }
    }
}

const init3D = (butterflyTexture: THREE.Texture) => {
  if (!canvasTarget.value) return;

  if (renderer) {
      renderer.dispose();
      canvasTarget.value.innerHTML = '';
  }

  // Setup Scene
  scene = new THREE.Scene();
  // 温暖、可爱的天空蓝
  scene.background = new THREE.Color(0x87CEFA); 
  // 增加雾效，让远处有一种梦幻的晨雾感
  scene.fog = new THREE.FogExp2(0x87CEFA, 0.008);

  // Setup Camera
  camera = new THREE.PerspectiveCamera(60, canvasTarget.value.offsetWidth / canvasTarget.value.offsetHeight, 0.1, 1000);
  // 初始相机位置，正对中心，距离稍微拉远以便看到整个画卷展开
  camera.position.set(0, 15, 40);

  // Setup Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(canvasTarget.value.offsetWidth, canvasTarget.value.offsetHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap; // 柔和阴影
  // 色调映射，让颜色更饱满温暖
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  canvasTarget.value.appendChild(renderer.domElement);

  // Setup Controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.maxPolarAngle = Math.PI / 2 - 0.05; // Prevent going below ground
  controls.target.set(0, 10, 0);

  // Lights - 温暖的童话光照
  // 全局环境光，带一点暖黄色
  const ambientLight = new THREE.AmbientLight(0xfff4e5, 0.7);
  scene.add(ambientLight);
  
  // 主光源：模拟早晨/傍晚的阳光
  const dirLight = new THREE.DirectionalLight(0xffdfb0, 1.5);
  dirLight.position.set(50, 80, 30);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  dirLight.shadow.camera.near = 10;
  dirLight.shadow.camera.far = 200;
  const d = 60;
  dirLight.shadow.camera.left = -d;
  dirLight.shadow.camera.right = d;
  dirLight.shadow.camera.top = d;
  dirLight.shadow.camera.bottom = -d;
  dirLight.shadow.bias = -0.0005;
  scene.add(dirLight);

  // 添加一个背光/补光，让阴影部分不那么死黑，增加梦幻感
  const backLight = new THREE.DirectionalLight(0xcceeff, 0.5);
  backLight.position.set(-50, 30, -30);
  scene.add(backLight);

  // 添加一个温暖的中心点光源，让草地和周围有温馨的氛围
  const centerLight = new THREE.PointLight(0xffa500, 1.2, 80);
  centerLight.position.set(0, 5, 0);
  scene.add(centerLight);

  // Garden Ground - 柔软的草地
  const groundGeo = new THREE.PlaneGeometry(300, 300, 64, 64);
  const pos = groundGeo.attributes.position;
  // 生成柔和的丘陵起伏
  for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      // 复合正弦波制造自然起伏
      const z = Math.sin(x * 0.05) * Math.cos(y * 0.05) * 3 + Math.sin(x * 0.02) * 2;
      pos.setZ(i, z);
  }
  groundGeo.computeVertexNormals();

  const groundMat = new THREE.MeshStandardMaterial({ 
      color: 0x7CBA3D, // 鲜亮温暖的草绿色
      roughness: 1.0,
      metalness: 0.0,
      flatShading: true // Low-poly 风格，小朋友会觉得很可爱
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Build Garden Environment
  createGarden();

  // --- 萤火虫粒子系统 ---
  // 生成萤火虫圆形发光贴图，消除默认的方形粒子
  const createGlowTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d')!;
      const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      gradient.addColorStop(0.2, 'rgba(255, 240, 200, 1)');
      gradient.addColorStop(0.5, 'rgba(255, 220, 150, 0.3)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 64, 64);
      return new THREE.CanvasTexture(canvas);
  };

  const fireflyGeo = new THREE.BufferGeometry();
  const fireflyPos = new Float32Array(fireflyCount * 3);
  const fireflyPhases = new Float32Array(fireflyCount); // 用于闪烁和浮动动画
  for(let i = 0; i < fireflyCount; i++) {
      fireflyPos[i*3] = (Math.random() - 0.5) * 120; // x
      fireflyPos[i*3+1] = Math.random() * 10 + 1;    // y 高度
      fireflyPos[i*3+2] = (Math.random() - 0.5) * 120; // z
      fireflyPhases[i] = Math.random() * Math.PI * 2;
  }
  fireflyGeo.setAttribute('position', new THREE.BufferAttribute(fireflyPos, 3));
  fireflyGeo.setAttribute('aPhase', new THREE.BufferAttribute(fireflyPhases, 1));
  const fireflyMat = new THREE.PointsMaterial({
      color: 0xffffff, // 发光颜色已在贴图中定义
      size: 1.5, // 稍微放大以展现柔和的发光边缘
      map: createGlowTexture(),
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending, // 叠加发光效果
      depthWrite: false
  });
  fireflies = new THREE.Points(fireflyGeo, fireflyMat);
  scene.add(fireflies);

  // 开始视频魔法流程
  clock = new THREE.Clock();
  butterflies = [];
  
  playMagicVideo(butterflyTexture);

  animate();

  window.addEventListener('resize', onWindowResize);
};

// --- 视频播放与特效流程 ---
const playMagicVideo = (butterflyTexture: THREE.Texture) => {
    if (!scene) return;

    // 创建隐藏的 video 标签
    videoElement = document.createElement('video');
    videoElement.src = '/fly4.mp4'; 
    videoElement.crossOrigin = 'anonymous';
    videoElement.loop = false; 
    videoElement.muted = true; 
    videoElement.playsInline = true;
    
    videoTexture = new THREE.VideoTexture(videoElement);
    videoTexture.colorSpace = THREE.SRGBColorSpace;
    videoTexture.minFilter = THREE.LinearFilter;
    videoTexture.magFilter = THREE.LinearFilter;
    videoTexture.format = THREE.RGBAFormat;

    // 创建画卷组
    videoMesh = new THREE.Group();
    videoMesh.position.set(0, 12, 0); // 放置在视野中心偏上
    scene.add(videoMesh);

    // 1:1 视频屏幕
    const videoSize = 12; // 屏幕宽高 12x12
    const videoGeo = new THREE.PlaneGeometry(videoSize, videoSize);
    const videoMat = new THREE.MeshBasicMaterial({ 
        map: videoTexture, 
        side: THREE.DoubleSide,
        transparent: true,
        // 初始时高度为0，实现展开效果
    });
    const videoScreen = new THREE.Mesh(videoGeo, videoMat);
    videoScreen.name = 'videoScreen';
    videoMesh.add(videoScreen);

    // 画轴（上下两根）
    const scrollGeo = new THREE.CylinderGeometry(0.3, 0.3, videoSize + 1, 16);
    const scrollMat = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.7, metalness: 0.1 }); // 木质
    
    const topScroll = new THREE.Mesh(scrollGeo, scrollMat);
    topScroll.rotation.z = Math.PI / 2;
    topScroll.name = 'topScroll';
    videoMesh.add(topScroll);

    const bottomScroll = new THREE.Mesh(scrollGeo, scrollMat);
    bottomScroll.rotation.z = Math.PI / 2;
    bottomScroll.name = 'bottomScroll';
    videoMesh.add(bottomScroll);

    // 初始状态
    videoScreen.scale.y = 0.001;
    topScroll.position.y = 0;
    bottomScroll.position.y = 0;

    // 开始展开动画
    scrollState = 'opening';
    scrollProgress = 0;

    // 监听视频播放结束事件
    videoElement.addEventListener('ended', () => {
        isVideoPlaying = false;
        
        // 视频播放完毕，画轴合上
        scrollState = 'closing';
        
        // --- 核心序列逻辑 ---
        
        // 1. 生成主角蝴蝶
        // 在画轴开始收起的同时，生成主角蝴蝶。
        // 计算视频屏幕在世界坐标系中的右边缘位置
        // 视频屏幕中心在 (0, 12, 0)，宽度为12，所以右边缘X是 6
        // 我们需要它完全贴合视频的表面，所以Z和屏幕一样，都在0
        const mainButterflyPos = new THREE.Vector3(6, 12, 0);
        createButterflyInstance(butterflyTexture, 0, mainButterflyPos, true); // true 表示是主角蝴蝶

        // 2. 启动生成群蝶的序列任务
        // 其他小蝴蝶也从视频消失的位置（屏幕右侧）一只只飞出来
        const numButterflies = 24; 
        let currentButterflyCount = 1; // 已经有了1只主角
        
        const spawnNextButterfly = () => {
            if (currentButterflyCount > numButterflies || !scene) return;
            
            // 所有蝴蝶都从同一个“魔法出口”（视频右侧）生成
            // 为了避免完全重叠，可以在这个点附近做一个极小的随机抖动
            const startX = 6 + (Math.random() - 0.5) * 1.0;
            const startY = 12 + (Math.random() - 0.5) * 1.0;
            const startZ = 0; // 紧贴着原本屏幕所在的平面
            
            const startPos = new THREE.Vector3(startX, startY, startZ);
            createButterflyInstance(butterflyTexture, currentButterflyCount, startPos, false);
            
            currentButterflyCount++;
            
            // 随机间隔 100ms - 500ms 生成下一只
            const nextDelay = 100 + Math.random() * 400;
            setTimeout(spawnNextButterfly, nextDelay);
        };

        // 在主角飞出后，等待画轴完全消失（约800ms）后，开始源源不断地飞入群蝶
        setTimeout(spawnNextButterfly, 800);
    });
};

const createGarden = () => {
    if (!scene) return;
    
    // --- 树木生成 (Low-poly 卡通风格) ---
    // 树冠：圆润的球体组合，更可爱
    const treeMat = new THREE.MeshStandardMaterial({ 
        color: 0x88D42E, // 嫩绿
        roughness: 0.9,
        flatShading: true
    });
    const trunkGeo = new THREE.CylinderGeometry(0.4, 0.6, 2, 5); // 稍微粗短一点的树干
    const trunkMat = new THREE.MeshStandardMaterial({ 
        color: 0x8B5A2B, 
        roughness: 1.0,
        flatShading: true
    });

    // --- 花朵生成 ---
    const flowerColors = [0xFF69B4, 0xFFB6C1, 0xFFD700, 0xFFA500, 0x87CEFA, 0xdda0dd];
    const stemGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.5, 5);
    const stemMat = new THREE.MeshStandardMaterial({ color: 0x32CD32, flatShading: true });
    
    // --- 栅栏生成 (增加庄园感) ---
    const fenceGeo = new THREE.BoxGeometry(0.2, 1.5, 3);
    const fenceMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 }); // 白栅栏

    // --- 草丛生成 ---
    const grassGeo = new THREE.ConeGeometry(0.15, 1.0, 3); // 尖尖的三角形小草
    const grassMat = new THREE.MeshStandardMaterial({ color: 0x558b2f, flatShading: true });

    // --- 建造童话小屋 ---
    const createHouse = () => {
        const group = new THREE.Group();
        // 房子主体
        const bodyGeo = new THREE.BoxGeometry(4, 3, 4);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0xfff8dc, roughness: 0.9 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 1.5;
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);

        // 房顶 (四棱锥)
        const roofGeo = new THREE.ConeGeometry(3.5, 2.5, 4);
        const roofMat = new THREE.MeshStandardMaterial({ color: 0xff6347, roughness: 0.7, flatShading: true });
        const roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.y = 4.25;
        roof.rotation.y = Math.PI / 4;
        roof.castShadow = true;
        group.add(roof);

        // 门
        const doorGeo = new THREE.BoxGeometry(1.0, 1.5, 0.1);
        const doorMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
        const door = new THREE.Mesh(doorGeo, doorMat);
        door.position.set(0, 0.75, 2.05);
        group.add(door);

        // 窗户
        const winGeo = new THREE.BoxGeometry(1.0, 1.0, 0.1);
        const winMat = new THREE.MeshStandardMaterial({ color: 0x87ceeb });
        const windowMesh = new THREE.Mesh(winGeo, winMat);
        windowMesh.position.set(2.05, 1.5, 0);
        windowMesh.rotation.y = Math.PI / 2;
        group.add(windowMesh);

        // 烟囱
        const chimneyGeo = new THREE.BoxGeometry(0.8, 2.0, 0.8);
        const chimneyMat = new THREE.MeshStandardMaterial({ color: 0xb22222 });
        const chimney = new THREE.Mesh(chimneyGeo, chimneyMat);
        chimney.position.set(-1, 4.5, -1);
        chimney.castShadow = true;
        group.add(chimney);

        return group;
    };

    // 随机散落3-4个童话小屋在四周
    for(let i=0; i<4; i++) {
        const house = createHouse();
        const angle = (i / 4) * Math.PI * 2 + (Math.random() - 0.5);
        const radius = 25 + Math.random() * 15; // 距离中心稍微远一点
        const hx = Math.cos(angle) * radius;
        const hz = Math.sin(angle) * radius;
        const hy = Math.sin(hx * 0.05) * Math.cos(hz * 0.05) * 3 + Math.sin(hx * 0.02) * 2;
        house.position.set(hx, hy, hz);
        // 让房子朝向大概中心位置，增加聚落感
        house.lookAt(0, hy, 0);
        scene.add(house);
    }

    // --- 生成天上的软萌云朵 ---
    clouds = [];
    const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1.0, flatShading: true });
    for(let i=0; i<12; i++) {
        const cloud = new THREE.Group();
        const numPuffs = 3 + Math.floor(Math.random() * 4);
        for(let j=0; j<numPuffs; j++) {
            const puffGeo = new THREE.SphereGeometry(3 + Math.random() * 3, 7, 7);
            const puff = new THREE.Mesh(puffGeo, cloudMat);
            puff.position.set((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 6);
            puff.castShadow = true;
            cloud.add(puff);
        }
        cloud.scale.y = 0.6; // 压扁成云朵形状
        cloud.position.set((Math.random() - 0.5) * 160, 35 + Math.random() * 15, (Math.random() - 0.5) * 160);
        scene.add(cloud);
        clouds.push(cloud);
    }

    // 生成森林、花海和草地 (增加数量到400，让场景更充实)
    for(let i=0; i<400; i++) {
        // 扩大生成范围
        const x = (Math.random() - 0.5) * 160;
        const z = (Math.random() - 0.5) * 160;
        
        // 空出中间作为舞台，不要遮挡画卷
        if (Math.abs(x) < 15 && Math.abs(z) < 15) continue;

        // 根据地面的起伏计算高度
        const y = Math.sin(x * 0.05) * Math.cos(z * 0.05) * 3 + Math.sin(x * 0.02) * 2;
        
        const rand = Math.random();
        const group = new THREE.Group();

        if (rand > 0.85) {
            // 生成可爱的树 (15%)
            const trunk = new THREE.Mesh(trunkGeo, trunkMat);
            trunk.position.y = 1;
            trunk.castShadow = true;
            trunk.receiveShadow = true;
            group.add(trunk);
            
            // 用2-3个球体组合成卡通树冠
            const numLeaves = 2 + Math.floor(Math.random() * 2);
            for(let j=0; j<numLeaves; j++) {
                const leafSize = 1.5 + Math.random() * 1.5;
                const leafGeo = new THREE.DodecahedronGeometry(leafSize, 1); // 类似球体的多面体
                const leaf = new THREE.Mesh(leafGeo, treeMat);
                leaf.position.set(
                    (Math.random() - 0.5) * 1.5,
                    2.5 + Math.random() * 1.5,
                    (Math.random() - 0.5) * 1.5
                );
                leaf.castShadow = true;
                leaf.receiveShadow = true;
                group.add(leaf);
            }
            const scale = Math.random() * 1.5 + 1.0;
            group.scale.set(scale, scale, scale);
            
        } else if (rand > 0.45) {
            // 生成花朵 (40%)
            const stem = new THREE.Mesh(stemGeo, stemMat);
            stem.position.y = 0.75;
            
            // 花瓣：用多个小球拼接
            const flowerColor = flowerColors[Math.floor(Math.random() * flowerColors.length)];
            const flowerMat = new THREE.MeshStandardMaterial({ 
                color: flowerColor,
                roughness: 0.3,
                flatShading: true
            });
            
            const centerGeo = new THREE.SphereGeometry(0.2, 8, 8);
            const centerMat = new THREE.MeshStandardMaterial({ color: 0xFFD700 }); // 黄色花蕊
            const center = new THREE.Mesh(centerGeo, centerMat);
            center.position.y = 1.5;
            group.add(center);

            // 5个花瓣
            const petalGeo = new THREE.SphereGeometry(0.3, 8, 8);
            for(let p=0; p<5; p++) {
                const angle = (p / 5) * Math.PI * 2;
                const petal = new THREE.Mesh(petalGeo, flowerMat);
                petal.position.set(
                    Math.cos(angle) * 0.3,
                    1.5,
                    Math.sin(angle) * 0.3
                );
                // 花瓣微微向外翻
                petal.lookAt(0, 2.5, 0);
                petal.scale.z = 0.5; // 压扁一点
                petal.castShadow = true;
                group.add(petal);
            }
            
            group.add(stem);
            
            // 随机倾斜一点，更自然
            group.rotation.x = (Math.random() - 0.5) * 0.3;
            group.rotation.z = (Math.random() - 0.5) * 0.3;
            
            const scale = Math.random() * 0.5 + 0.6;
            group.scale.set(scale, scale, scale);
        } else if (rand > 0.35) {
            // 随机散落的小蘑菇或石头 (10%)
            const capGeo = new THREE.ConeGeometry(0.6, 0.5, 5);
            const capMat = new THREE.MeshStandardMaterial({ color: 0xFF6347, flatShading: true }); // 番茄红
            const cap = new THREE.Mesh(capGeo, capMat);
            cap.position.y = 0.6;
            cap.castShadow = true;
            
            const stemG = new THREE.CylinderGeometry(0.2, 0.3, 0.6, 5);
            const stemM = new THREE.MeshStandardMaterial({ color: 0xffffff });
            const stem = new THREE.Mesh(stemG, stemM);
            stem.position.y = 0.3;
            stem.castShadow = true;
            
            group.add(cap, stem);
            const scale = Math.random() * 0.5 + 0.5;
            group.scale.set(scale, scale, scale);
        } else {
            // 生成草丛 tufts (35%)，增加地面的细节和毛茸茸的感觉
            for(let g=0; g<3; g++) {
                const blade = new THREE.Mesh(grassGeo, grassMat);
                blade.position.set(
                    (Math.random() - 0.5) * 0.4,
                    0.5,
                    (Math.random() - 0.5) * 0.4
                );
                // 小草向外稍微倾斜
                blade.rotation.x = (Math.random() - 0.5) * 0.5;
                blade.rotation.z = (Math.random() - 0.5) * 0.5;
                blade.rotation.y = Math.random() * Math.PI;
                blade.castShadow = true;
                group.add(blade);
            }
        }
        
        group.position.set(x, y, z);
        scene.add(group);
    }
}

const createButterflyInstance = (texture: THREE.Texture, index: number, startPos?: THREE.Vector3, isMain: boolean = false) => {
    if (!scene) return;

    const group = new THREE.Group();

    // 提取纹理，去背景处理
    const mat = new THREE.MeshStandardMaterial({ 
        map: texture, 
        side: THREE.DoubleSide,
        transparent: true,
        alphaTest: 0.1, // 透明度测试，剔除透明度小于0.1的像素，实现抠图效果
        roughness: 0.4,
        metalness: 0.1
    });

    // 随机色相偏移，让同一个图片生成色彩斑斓的各种蝴蝶 (主角不偏移颜色)
    if (!isMain && index > 0) {
        const hsl = { h: 0, s: 0, l: 0 };
        mat.color.getHSL(hsl);
        // 色相偏移 + 亮度轻微波动
        mat.color.setHSL((hsl.h + Math.random() * 0.2) % 1.0, hsl.s, hsl.l + (Math.random() * 0.2 - 0.1));
    }

    // 高精度蝴蝶模型：通过曲面弯曲让翅膀更真实
    const wingWidth = 2;
    const wingHeight = 3;
    const segments = 16; // 细分数越高，翅膀弯曲越平滑

    // --- 左翅膀 ---
    const leftWingGeo = new THREE.PlaneGeometry(wingWidth, wingHeight, segments, segments);
    const lUvs = leftWingGeo.attributes.uv;
    const lPos = leftWingGeo.attributes.position;
    for (let i = 0; i < lUvs.count; i++) {
        const u = lUvs.getX(i);
        lUvs.setX(i, u * 0.5); // UV映射到图片的左半部分
        
        // 模拟自然翅膀的弧度（Camber）
        const x = lPos.getX(i);
        // x 的范围是 [-wingWidth/2, wingWidth/2]。蝴蝶中心轴在右边缘 (+wingWidth/2)
        const distFromCenter = Math.abs(x - (wingWidth / 2));
        // 使用二次函数实现向下弯曲的弧度
        const z = Math.pow(distFromCenter * 0.5, 2) * 0.3; 
        lPos.setZ(i, z);
    }
    leftWingGeo.computeVertexNormals();
    leftWingGeo.translate(-wingWidth / 2, 0, 0); // 将旋转轴心移动到翅膀根部（中心）
    
    // 旋转翅膀：将平面的正上方（图片头部）指向 Three.js 中的正前方（Z轴负方向）
    // 旋转后，蝴蝶平躺在地面，头部朝前，彩色背部朝上
    leftWingGeo.rotateX(Math.PI / 2);

    const leftWing = new THREE.Mesh(leftWingGeo, mat);
    leftWing.castShadow = true;
    leftWing.receiveShadow = true;

    // --- 右翅膀 ---
    const rightWingGeo = new THREE.PlaneGeometry(wingWidth, wingHeight, segments, segments);
    const rUvs = rightWingGeo.attributes.uv;
    const rPos = rightWingGeo.attributes.position;
    for (let i = 0; i < rUvs.count; i++) {
        const u = rUvs.getX(i);
        rUvs.setX(i, u * 0.5 + 0.5); // UV映射到图片的右半部分

        // 模拟自然翅膀的弧度
        const x = rPos.getX(i);
        // 右翅膀的中心轴在左边缘 (-wingWidth/2)
        const distFromCenter = Math.abs(x - (-wingWidth / 2));
        const z = Math.pow(distFromCenter * 0.5, 2) * 0.3; 
        rPos.setZ(i, z);
    }
    rightWingGeo.computeVertexNormals();
    rightWingGeo.translate(wingWidth / 2, 0, 0); // 将旋转轴心移动到翅膀根部（中心）
    
    // 与左翅膀相同的旋转校正
    rightWingGeo.rotateX(Math.PI / 2);

    const rightWing = new THREE.Mesh(rightWingGeo, mat);
    rightWing.castShadow = true;
    rightWing.receiveShadow = true;

    // --- 身体 ---
    const bodyGeo = new THREE.CapsuleGeometry(0.15, 0.15, 2, 4, 8);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 });
    
    // 胶囊体默认是沿着Y轴站立的。我们旋转+90度，让其沿着Z轴趴下，与翅膀方向一致
    bodyGeo.rotateX(Math.PI / 2);
    
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    // 将身体稍微往下移一点，使其悬挂在翅膀中间，而不是凸出在背上
    body.position.y = -0.1; 
    body.castShadow = true;

    group.add(leftWing, rightWing, body);
    
    // 随机缩放蝴蝶大小 (主角稍微大一点)
    const scale = isMain ? 0.6 : Math.random() * 0.4 + 0.3;
    group.scale.set(scale, scale, scale);

    // 初始位置设定
    const sx = startPos ? startPos.x : (Math.random() - 0.5) * 60;
    const sz = startPos ? startPos.z : (Math.random() - 0.5) * 60;
    const sy = startPos ? startPos.y : 3 + Math.random() * 10;
    group.position.set(sx, sy, sz);

    scene.add(group);

    // 如果是主角蝴蝶，给它一个向外飞出的初始漂移方向
    // 如果是群蝶，给它们一个向着场景中心（-Z方向）和四处散开飞行的初始偏移
    const initWanderX = isMain ? 1.5 : (Math.random() - 0.5) * 5;
    const initWanderZ = isMain ? -1.0 : (Math.random() - 0.5) * 5; // 移除之前强行从屏幕外飞入的 -10.0 偏移

    // 保存动画需要的数据
    butterflies.push({
        mesh: group,
        leftWing,
        rightWing,
        speed: Math.random() * 0.8 + 0.5, // 飞行速度差异
        flapSpeed: Math.random() * 5 + 15, // 拍翅频率差异
        offset: Math.random() * 1000,      // 动作时间偏移，防止齐刷刷拍翅膀
        radius: Math.random() * 15 + 5,    // 环绕飞行的圈圈半径
        yOffset: sy,                       // 基础飞行高度 (使用传入的高度)
        wanderX: initWanderX,              // 随机游荡偏移量
        wanderZ: initWanderZ
    });
};

const animate = () => {
  animationId = requestAnimationFrame(animate);
  const delta = clock ? clock.getDelta() : 0.016;

  // 画卷展开与收起动画
  if (videoMesh && scene) {
      const videoScreen = videoMesh.children.find(c => c.name === 'videoScreen');
      const topScroll = videoMesh.children.find(c => c.name === 'topScroll');
      const bottomScroll = videoMesh.children.find(c => c.name === 'bottomScroll');
      
      const videoSize = 12;

      if (scrollState === 'opening') {
          scrollProgress += delta * 0.8; // 约1.2秒展开
          if (scrollProgress >= 1) {
              scrollProgress = 1;
              scrollState = 'playing';
              if (videoElement && !isVideoPlaying) {
                  videoElement.play();
                  isVideoPlaying = true;
              }
          }
      } else if (scrollState === 'closing') {
          scrollProgress -= delta * 1.5; // 约0.6秒收起，比较快
          if (scrollProgress <= 0) {
              scrollProgress = 0;
              scrollState = 'hidden';
              // 动画结束后移除画卷
              scene.remove(videoMesh);
              videoMesh = null;
          }
      }

      if (videoScreen && topScroll && bottomScroll && scrollState !== 'hidden') {
          // 缩放屏幕高度
          videoScreen.scale.y = Math.max(0.001, scrollProgress);
          // 移动上下画轴
          const halfHeight = (videoSize * scrollProgress) / 2;
          topScroll.position.y = halfHeight;
          bottomScroll.position.y = -halfHeight;
      }
  }

  if (clock && butterflies.length > 0) {
      const time = clock.getElapsedTime();
      
      // 动画天上的云朵
      if (clouds && clouds.length > 0) {
          clouds.forEach(c => {
              c.position.x += delta * 2; // 云朵缓缓向右飘
              if (c.position.x > 150) {
                  c.position.x = -150; // 飘出边界后从另一边重新出现
              }
          });
      }

      // 动画萤火虫
      if (fireflies) {
          const positions = fireflies.geometry.attributes.position.array as Float32Array;
          const phases = fireflies.geometry.attributes.aPhase.array as Float32Array;
          for(let i = 0; i < fireflyCount; i++) {
              const phase = phases[i];
              // 萤火虫在Y轴上下轻微浮动，X和Z轴缓缓漂移
              positions[i*3+1] += Math.sin(time * 2.0 + phase) * 0.015;
              positions[i*3] += Math.cos(time * 1.0 + phase) * 0.01;
              positions[i*3+2] += Math.sin(time * 1.0 + phase) * 0.01;
          }
          fireflies.geometry.attributes.position.needsUpdate = true;
      }

      butterflies.forEach(b => {
          const t = time * b.speed + b.offset;
          
          // 1. 煽动翅膀动画
          // 引入 b.offset 让每只蝴蝶的拍打动作不同步
          // 因为之前翅膀绕X轴旋转了90度平躺，所以现在拍打翅膀是绕Z轴旋转
          // 为了让翅膀在身体上方拍打，我们需要调整旋转的角度方向
          // 使用正弦波计算角度，但要确保角度使得翅膀向上翻（背部靠近）
          // 由于左翅膀的轴心在右边缘，绕Z轴正向旋转会往下翻，负向旋转会往上翻
          // 右翅膀的轴心在左边缘，绕Z轴负向旋转会往下翻，正向旋转会往上翻
          const flapAngle = Math.sin(t * b.flapSpeed + b.offset * 10) * Math.PI / 3;
          // 取绝对值后，限制在上方拍打
          // 让翅膀最低点稍微低于水平面（比如 -0.1），最高点高高扬起
          const upFlap = Math.abs(flapAngle) - 0.2; 
          b.leftWing.rotation.z = -upFlap; // 负值让左翅膀向上翻
          b.rightWing.rotation.z = upFlap; // 正值让右翅膀向上翻

          // 2. 飞行轨迹（复杂有机运动算法）
          // 基础的“8”字形(Lissajous曲线)飞行轨迹，放慢速度使其看起来更优雅
          const pathTime = time * 0.2 * b.speed + b.offset; 
          
          let px = Math.sin(pathTime) * b.radius + Math.cos(pathTime * 0.7) * b.radius * 0.5;
          let pz = Math.cos(pathTime * 0.8) * b.radius + Math.sin(pathTime * 1.3) * b.radius * 0.5;
          
          // 添加随机的游荡偏移（使用缓慢的Sin/Cos波形，防止蝴蝶飞出边界）
          b.wanderX = Math.sin(time * 0.1 + b.offset) * 20;
          b.wanderZ = Math.cos(time * 0.15 + b.offset) * 20;

          px += b.wanderX;
          pz += b.wanderZ;

          // 飞行时在Y轴上轻微的上下浮动
          const py = b.yOffset + Math.sin(time * 1.5 + b.offset) * 1.5 + Math.cos(time * 0.5 + b.offset) * 1.0;

          b.mesh.position.set(px, py, pz);

          // 3. 姿态朝向（让蝴蝶头部始终看向飞行的前方）
          // 计算下一个瞬间(dt)的位置，作为注视(lookAt)的目标点
          const dt = 0.1;
          const nextPathTime = (time + dt) * 0.2 * b.speed + b.offset;
          
          let nx = Math.sin(nextPathTime) * b.radius + Math.cos(nextPathTime * 0.7) * b.radius * 0.5;
          let nz = Math.cos(nextPathTime * 0.8) * b.radius + Math.sin(nextPathTime * 1.3) * b.radius * 0.5;
          
          const nextWanderX = Math.sin((time + dt) * 0.1 + b.offset) * 20;
          const nextWanderZ = Math.cos((time + dt) * 0.15 + b.offset) * 20;
          
          nx += nextWanderX;
          nz += nextWanderZ;
          
          let ny = b.yOffset + Math.sin((time + dt) * 1.5 + b.offset) * 1.5 + Math.cos((time + dt) * 0.5 + b.offset) * 1.0;
          
          // 让蝴蝶看向预测的下一个点
          b.mesh.lookAt(nx, ny, nz);
          
          // 4. 飞行俯仰角动态调整
          // 当蝴蝶向上飞时，头部微微抬起；向下飞时，头部微微按下
          // 因为之前模型翻转过，所以这里旋转值为正数代表抬头
          const pitchTarget = (ny - py) * 0.8;
          b.mesh.rotateX(pitchTarget); 
      });
  }

  if (controls) controls.update();
  if (renderer && scene && camera) renderer.render(scene, camera);
};

const onWindowResize = () => {
    if (!camera || !renderer || !canvasTarget.value) return;
    camera.aspect = canvasTarget.value.offsetWidth / canvasTarget.value.offsetHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(canvasTarget.value.offsetWidth, canvasTarget.value.offsetHeight);
}

onUnmounted(() => {
    if (animationId !== null) cancelAnimationFrame(animationId);
    window.removeEventListener('resize', onWindowResize);
    if (renderer) renderer.dispose();
    if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
});
</script>

<style scoped></style>