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

// Store all generated butterflies
interface ButterflyData {
    mesh: THREE.Group;
    leftWing: THREE.Mesh;
    rightWing: THREE.Mesh;
    speed: number;
    flapSpeed: number;
    offset: number;
    radius: number;
    yOffset: number;
    wanderX: number;
    wanderZ: number;
}
let butterflies: ButterflyData[] = [];

const onFileChange = (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
        if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
        previewUrl.value = URL.createObjectURL(file);
    }
};

// --- Image Processing: Extract Butterfly from Background ---
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

            // Sample corners to determine background color
            const corners = [
                0, // Top-Left
                (canvas.width - 1) * 4, // Top-Right
                (canvas.height - 1) * canvas.width * 4, // Bottom-Left
                ((canvas.height - 1) * canvas.width + canvas.width - 1) * 4 // Bottom-Right
            ];

            let r = 0, g = 0, b = 0;
            corners.forEach(idx => {
                r += data[idx];
                g += data[idx + 1];
                b += data[idx + 2];
            });
            r /= 4; g /= 4; b /= 4;

            // Tolerance for background removal
            const threshold = 40;

            for (let i = 0; i < data.length; i += 4) {
                const pr = data[i], pg = data[i + 1], pb = data[i + 2];
                const dist = Math.abs(pr - r) + Math.abs(pg - g) + Math.abs(pb - b);

                // If pixel is close to background color, make it transparent
                if (dist < threshold * 3) {
                    data[i + 3] = 0;
                } else {
                    // Slight edge smoothing for semi-transparent pixels could be added here
                }
            }

            ctx.putImageData(imageData, 0, 0);
            const texture = new THREE.CanvasTexture(canvas);
            texture.colorSpace = THREE.SRGBColorSpace;
            // Improve texture filtering for models
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

    // Create materials with slight hue variation for "various butterflies"
    const mat = new THREE.MeshStandardMaterial({
        map: texture,
        side: THREE.DoubleSide,
        transparent: true,
        alphaTest: 0.1, // Key for cutout
        roughness: 0.4,
        metalness: 0.1
    });

    // Optionally tint the material slightly for variety
    if (index > 0) {
        const hsl = { h: 0, s: 0, l: 0 };
        mat.color.getHSL(hsl);
        // Slight random hue shift
        mat.color.setHSL((hsl.h + Math.random() * 0.2) % 1.0, hsl.s, hsl.l + (Math.random() * 0.2 - 0.1));
    }

    // High Precision Model: Bending the wings for realism
    const wingWidth = 2;
    const wingHeight = 3;
    const segments = 16; // Higher segments for smooth bending

    // --- Left Wing ---
    const leftWingGeo = new THREE.PlaneGeometry(wingWidth, wingHeight, segments, segments);
    const lUvs = leftWingGeo.attributes.uv;
    const lPos = leftWingGeo.attributes.position;
    for (let i = 0; i < lUvs.count; i++) {
        const u = lUvs.getX(i);
        lUvs.setX(i, u * 0.5); // Map to left half of image

        // Bend the wing: create a natural camber
        const x = lPos.getX(i);
        // x goes from -wingWidth/2 to wingWidth/2. Center of butterfly is right edge (+wingWidth/2)
        const distFromCenter = Math.abs(x - (wingWidth / 2));
        const z = Math.pow(distFromCenter * 0.5, 2) * -0.3; // Curve upwards
        lPos.setZ(i, z);
    }
    leftWingGeo.computeVertexNormals();
    leftWingGeo.translate(-wingWidth / 2, 0, 0); // Pivot at center

    const leftWing = new THREE.Mesh(leftWingGeo, mat);
    leftWing.castShadow = true;
    leftWing.receiveShadow = true;

    // --- Right Wing ---
    const rightWingGeo = new THREE.PlaneGeometry(wingWidth, wingHeight, segments, segments);
    const rUvs = rightWingGeo.attributes.uv;
    const rPos = rightWingGeo.attributes.position;
    for (let i = 0; i < rUvs.count; i++) {
        const u = rUvs.getX(i);
        rUvs.setX(i, u * 0.5 + 0.5); // Map to right half of image

        // Bend the wing
        const x = rPos.getX(i);
        // Center of butterfly is left edge (-wingWidth/2)
        const distFromCenter = Math.abs(x - (-wingWidth / 2));
        const z = Math.pow(distFromCenter * 0.5, 2) * -0.3;
        rPos.setZ(i, z);
    }
    rightWingGeo.computeVertexNormals();
    rightWingGeo.translate(wingWidth / 2, 0, 0); // Pivot at center

    const rightWing = new THREE.Mesh(rightWingGeo, mat);
    rightWing.castShadow = true;
    rightWing.receiveShadow = true;

    // --- Body ---
    const bodyGeo = new THREE.CapsuleGeometry(0.15, 0.15, 2, 4, 8);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.rotation.x = Math.PI / 2;
    body.position.z = 0.1; // slightly above wings
    body.castShadow = true;

    group.add(leftWing, rightWing, body);

    // We want the butterfly to face "forward" when it flies.
    // By default, the image is drawn on the XY plane (facing +Z). 
    // Top of the image (head) is +Y. Right wing is +X.
    // In Three.js, "forward" (lookAt) points towards -Z.
    // We want the butterfly's head (+Y) to point towards -Z, and its back to face up (+Y).
    // Let's rotate the whole group so the image lies flat on the XZ plane, with the head pointing to -Z.
    
    // Rotate -90 degrees on X axis: 
    // +Y (head) becomes -Z (forward)
    // +Z (front face) becomes +Y (up)
    group.rotation.x = -Math.PI / 2;

    // To allow `lookAt` to work correctly (it aligns the local -Z axis with the target),
    // we need to wrap the rotated butterfly in an outer container group.
    // The outer group handles position and lookAt, while the inner group holds the fixed orientation.
    const container = new THREE.Group();
    container.add(group);
    
    // Random Scale
    const scale = Math.random() * 0.4 + 0.3;
    container.scale.set(scale, scale, scale);

    // Initial position
    const startX = (Math.random() - 0.5) * 60;
    const startZ = (Math.random() - 0.5) * 60;
    const startY = 3 + Math.random() * 10;
    container.position.set(startX, startY, startZ);

    scene.add(container);

    // Store data for animation
    butterflies.push({
        mesh: container, // The container is what we move and lookAt
        leftWing,
        rightWing,
        speed: Math.random() * 0.8 + 0.5,
        flapSpeed: Math.random() * 5 + 15,
        offset: Math.random() * 1000,
        radius: Math.random() * 15 + 5,
        yOffset: startY,
        wanderX: (Math.random() - 0.5) * 2,
        wanderZ: (Math.random() - 0.5) * 2
    });
};

const animate = () => {
    animationId = requestAnimationFrame(animate);

    if (clock && butterflies.length > 0) {
        const time = clock.getElapsedTime();

        butterflies.forEach(b => {
            const t = time * b.speed + b.offset;

            // 1. Flap Wings
          // Use individual offset for flapping to desynchronize them
          // Sine wave goes from -1 to 1.
          // When flat on XZ plane, rotation.y controls the flap up and down.
          // Because of our container rotation, local Y axis of wings is still pointing "forward" relative to the butterfly image, 
          // wait, the wings are rotated around the Y axis of the inner group.
          // Since the inner group is rotated -90 on X, the inner Y axis points towards global -Z.
          // Flapping around Y means the wings swing like doors, which is correct for flapping up/down when lying flat.
          // We want the flap to go mostly "up" (positive Z in local space, which is positive Y in global space).
          // We adjust the sine wave to range mostly on one side.
          
          const flapRaw = Math.sin(t * b.flapSpeed + b.offset * 10);
          // Map -1..1 to roughly 0..1 so wings flap upwards from flat, maybe dipping slightly below
          const flapAngle = (flapRaw * 0.4 + 0.4) * (Math.PI / 2); 
          
          b.leftWing.rotation.y = flapAngle;
          b.rightWing.rotation.y = -flapAngle;

            // 2. Flight Path (Complex organic movement)
          // Base figure-8 pattern, slowed down significantly
          const pathTime = time * 0.2 * b.speed + b.offset; // Scale time down for path
          
          let px = Math.sin(pathTime) * b.radius + Math.cos(pathTime * 0.7) * b.radius * 0.5;
          let pz = Math.cos(pathTime * 0.8) * b.radius + Math.sin(pathTime * 1.3) * b.radius * 0.5;
          
          // Add wandering drift (using a very slow sine wave instead of unbounded linear addition)
          // Unbounded linear addition (time * wanderX) caused the extreme speeds over time!
          b.wanderX = Math.sin(time * 0.1 + b.offset) * 20;
          b.wanderZ = Math.cos(time * 0.15 + b.offset) * 20;

          px += b.wanderX;
          pz += b.wanderZ;

          // Gentle bobbing up and down
          const py = b.yOffset + Math.sin(time * 1.5 + b.offset) * 1.5 + Math.cos(time * 0.5 + b.offset) * 1.0;

          b.mesh.position.set(px, py, pz);

          // 3. Orientation (Look in direction of travel)
          // Calculate future position a fraction of a second ahead
          const dt = 0.1;
          const nextPathTime = (time + dt) * 0.2 * b.speed + b.offset;
          
          let nx = Math.sin(nextPathTime) * b.radius + Math.cos(nextPathTime * 0.7) * b.radius * 0.5;
          let nz = Math.cos(nextPathTime * 0.8) * b.radius + Math.sin(nextPathTime * 1.3) * b.radius * 0.5;
          
          const nextWanderX = Math.sin((time + dt) * 0.1 + b.offset) * 20;
          const nextWanderZ = Math.cos((time + dt) * 0.15 + b.offset) * 20;
          
          nx += nextWanderX;
          nz += nextWanderZ;
          
          let ny = b.yOffset + Math.sin((time + dt) * 1.5 + b.offset) * 1.5 + Math.cos((time + dt) * 0.5 + b.offset) * 1.0;
          
          b.mesh.lookAt(nx, ny, nz);
          
          // Pitch up slightly when flying upwards
          // Smooth the pitch to prevent jitter
          const pitchTarget = (ny - py) * 0.8;
          b.mesh.rotateX(-pitchTarget); 
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