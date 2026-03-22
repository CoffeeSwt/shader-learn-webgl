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

const generateButterfly = async () => {
    if (!previewUrl.value) return;

    isProcessing.value = true;
    try {
        // Extract texture with background removed
        const texture = await extractButterflyTexture(previewUrl.value);

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
    scene.background = new THREE.Color(0xa0d8ef); // Bright sky
    scene.fog = new THREE.FogExp2(0xa0d8ef, 0.015);

    // Setup Camera
    camera = new THREE.PerspectiveCamera(60, canvasTarget.value.offsetWidth / canvasTarget.value.offsetHeight, 0.1, 1000);
    camera.position.set(0, 15, 30);

    // Setup Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(canvasTarget.value.offsetWidth, canvasTarget.value.offsetHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    canvasTarget.value.appendChild(renderer.domElement);

    // Setup Controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.maxPolarAngle = Math.PI / 2 - 0.1; // Prevent going below ground
    controls.target.set(0, 5, 0);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight.position.set(50, 80, 30);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 10;
    dirLight.shadow.camera.far = 200;
    const d = 50;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.bias = -0.0005;
    scene.add(dirLight);

    // Garden Ground
    const groundGeo = new THREE.PlaneGeometry(200, 200, 32, 32);
    // Add some displacement to ground for a natural look
    const pos = groundGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        pos.setZ(i, Math.sin(x * 0.1) * Math.cos(y * 0.1) * 2);
    }
    groundGeo.computeVertexNormals();

    const groundMat = new THREE.MeshStandardMaterial({
        color: 0x4CAF50,
        roughness: 0.8,
        metalness: 0.2
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Build Garden Environment
    createGarden();

    // Create a flock of Butterflies from the extracted texture
    butterflies = [];
    const numButterflies = 25; // 各种各样的蝴蝶
    for (let i = 0; i < numButterflies; i++) {
        createButterflyInstance(butterflyTexture, i);
    }

    clock = new THREE.Clock();
    animate();

    window.addEventListener('resize', onWindowResize);
};

const createGarden = () => {
    if (!scene) return;

    // Create Trees
    const treeGeo = new THREE.ConeGeometry(1.5, 6, 7);
    const treeMat = new THREE.MeshStandardMaterial({ color: 0x2E8B57, roughness: 0.9 });
    const trunkGeo = new THREE.CylinderGeometry(0.3, 0.4, 1.5);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5C4033, roughness: 1.0 });

    // Create Flowers
    const flowerGeo = new THREE.SphereGeometry(0.4, 8, 8);
    const stemGeo = new THREE.CylinderGeometry(0.05, 0.05, 1);
    const stemMat = new THREE.MeshStandardMaterial({ color: 0x32CD32 });

    const flowerColors = [0xFF69B4, 0xFFD700, 0xFF4500, 0x9370DB, 0x00BFFF];

    for (let i = 0; i < 150; i++) {
        const x = (Math.random() - 0.5) * 120;
        const z = (Math.random() - 0.5) * 120;

        // Keep center somewhat clear
        if (Math.abs(x) < 8 && Math.abs(z) < 8) continue;

        const isTree = Math.random() > 0.7;

        const group = new THREE.Group();

        if (isTree) {
            const trunk = new THREE.Mesh(trunkGeo, trunkMat);
            trunk.position.y = 0.75;
            trunk.castShadow = true;
            trunk.receiveShadow = true;

            const leaves = new THREE.Mesh(treeGeo, treeMat);
            leaves.position.y = 3.5;
            leaves.castShadow = true;
            leaves.receiveShadow = true;

            group.add(trunk, leaves);
            const scale = Math.random() * 1.5 + 0.8;
            group.scale.set(scale, scale, scale);
        } else {
            // Flower
            const stem = new THREE.Mesh(stemGeo, stemMat);
            stem.position.y = 0.5;

            const flowerMat = new THREE.MeshStandardMaterial({
                color: flowerColors[Math.floor(Math.random() * flowerColors.length)],
                roughness: 0.4
            });
            const bloom = new THREE.Mesh(flowerGeo, flowerMat);
            bloom.position.y = 1.0;
            bloom.castShadow = true;

            group.add(stem, bloom);
            const scale = Math.random() * 0.5 + 0.5;
            group.scale.set(scale, scale, scale);
        }

        // Adjust Y based on ground displacement
        const y = Math.sin(x * 0.1) * Math.cos(z * 0.1) * 2;
        group.position.set(x, y, z);

        scene.add(group);
    }
}

const createButterflyInstance = (texture: THREE.Texture, index: number) => {
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

    // 随机色相偏移，让同一个图片生成色彩斑斓的各种蝴蝶
    if (index > 0) {
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
    
    // 随机缩放蝴蝶大小
    const scale = Math.random() * 0.4 + 0.3;
    group.scale.set(scale, scale, scale);

    // 随机初始位置
    const startX = (Math.random() - 0.5) * 60;
    const startZ = (Math.random() - 0.5) * 60;
    const startY = 3 + Math.random() * 10;
    group.position.set(startX, startY, startZ);

    scene.add(group);

    // 保存动画需要的数据
    butterflies.push({
        mesh: group,
        leftWing,
        rightWing,
        speed: Math.random() * 0.8 + 0.5, // 飞行速度差异
        flapSpeed: Math.random() * 5 + 15, // 拍翅频率差异
        offset: Math.random() * 1000,      // 动作时间偏移，防止齐刷刷拍翅膀
        radius: Math.random() * 15 + 5,    // 环绕飞行的圈圈半径
        yOffset: startY,                   // 基础飞行高度
        wanderX: (Math.random() - 0.5) * 2, // 随机游荡偏移量
        wanderZ: (Math.random() - 0.5) * 2
    });
};

const animate = () => {
  animationId = requestAnimationFrame(animate);

  if (clock && butterflies.length > 0) {
      const time = clock.getElapsedTime();
      
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