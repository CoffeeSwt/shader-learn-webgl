<template>
    <div class="fractal-examples">
        <!-- 顶部导航 -->
        <header class="header">
            <div class="header-content">
                <h1 class="title">分形艺术展示</h1>
                <button class="back-btn" @click="goBack">← 返回介绍</button>
            </div>
        </header>

        <!-- 主要内容区域 -->
        <div class="main-content">
            <!-- 分形渲染区域 -->
            <div class="canvas-container" ref="canvasTarget"></div>

            <!-- 控制面板 -->
            <div class="control-panel" :class="{ 'panel-hidden': !showPanel }">
                <div class="panel-header">
                    <h3>控制面板</h3>
                    <button class="toggle-btn" @click="togglePanel">
                        {{ showPanel ? '隐藏' : '显示' }}
                    </button>
                </div>

                <div class="panel-content" v-show="showPanel">
                    <!-- 分形类型选择 -->
                    <div class="control-group">
                        <label>分形类型</label>
                        <select v-model="currentFractal" @change="changeFractal">
                            <option value="julia">Julia集</option>
                            <option value="mandelbrot">Mandelbrot集</option>
                            <option value="fractalTree">分形树</option>
                            <option value="kochSnowflake">Koch雪花</option>
                        </select>
                    </div>

                    <!-- 迭代次数 -->
                    <div class="control-group">
                        <label>迭代次数: {{ maxIterations }}</label>
                        <input type="range" v-model="maxIterations" min="10" max="2000" step="10"
                            @input="updateIterations" />
                    </div>

                    <!-- 缩放 -->
                    <div class="control-group">
                        <label>缩放: {{ Number(zoom).toFixed(2) }}</label>
                        <input type="range" v-model="zoom" min="0.1" max="50000" step="0.1" @input="updateZoom" />
                    </div>

                    <!-- 颜色方案 -->
                    <div class="control-group">
                        <label>颜色方案</label>
                        <select v-model="colorScheme" @change="updateColorScheme">
                            <option value="0" v-if="currentFractal === 'fractalTree'">自然树色</option>
                            <option value="1" v-if="currentFractal === 'fractalTree'">火焰树</option>
                            <option value="2" v-if="currentFractal === 'fractalTree'">冰霜树</option>
                            <option value="3" v-if="currentFractal === 'fractalTree'">彩虹树</option>
                            <option value="0" v-if="currentFractal !== 'fractalTree'">经典</option>
                            <option value="1" v-if="currentFractal !== 'fractalTree'">火焰</option>
                            <option value="2" v-if="currentFractal !== 'fractalTree'">海洋</option>
                            <option value="3" v-if="currentFractal !== 'fractalTree'">彩虹</option>
                        </select>
                    </div>

                    <!-- 颜色强度 -->
                    <div class="control-group">
                        <label>颜色强度: {{ colorIntensity.toFixed(1) }}</label>
                        <input type="range" v-model="colorIntensity" min="0.1" max="3.0" step="0.1"
                            @input="updateColorIntensity" />
                    </div>

                    <!-- Julia集专用参数 -->
                    <div v-if="currentFractal === 'julia'" class="control-group">
                        <label>Julia参数 C</label>
                        <div class="julia-controls">
                            <div>
                                <label>实部: {{ juliaC.x.toFixed(3) }}</label>
                                <input type="range" v-model="juliaC.x" min="-2" max="2" step="0.001"
                                    @input="updateJuliaC" />
                            </div>
                            <div>
                                <label>虚部: {{ juliaC.y.toFixed(3) }}</label>
                                <input type="range" v-model="juliaC.y" min="-2" max="2" step="0.001"
                                    @input="updateJuliaC" />
                            </div>
                        </div>
                    </div>

                    <!-- 重置按钮 -->
                    <div class="control-group">
                        <button class="reset-btn" @click="resetParameters">重置参数</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- 分形信息面板 -->
        <div class="info-panel">
            <h4>{{ fractalInfo.name }}</h4>
            <p>{{ fractalInfo.description }}</p>
            <div class="controls-hint">
                <p><strong>操作提示：</strong></p>
                <ul>
                    <li>鼠标滚轮：缩放</li>
                    <li>鼠标拖拽：平移视图</li>
                    <li>右侧面板：调节参数</li>
                </ul>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { Vector2 } from 'three';
import { BasicEngine } from "@/ts/BasicEngine"
import { BasicObjGenerator } from '@/ts/BasicObjGenerator';
import { FractalGeometryGenerator, type FractalTreeParams, type KochSnowflakeParams } from '@/ts/FractalGeometryGenerator';
import { type FractalTreeCanvasParams, type KochSnowflakeCanvasParams } from '@/ts/CanvasFractalRenderer';
import type { Group } from 'three';

// 导入shader文件
import mandelbrotShader from './shaders/mandelbrot.glsl?raw'
import juliaShader from './shaders/julia.glsl?raw'
import fractalTreeShader from './shaders/fractalTree.glsl?raw'
import kochSnowflakeShader from './shaders/kochSnowflake.glsl?raw'
import vertexShader from './vertexShader.glsl?raw'

const router = useRouter()
const canvasTarget = ref<HTMLDivElement | null>(null);
const engine = new BasicEngine()

// 控制面板状态
const showPanel = ref(true)

// 分形参数
const currentFractal = ref('julia')
const maxIterations = ref(200)
const zoom = ref(3.5)
const colorScheme = ref(0)
const colorIntensity = ref(1.0)
const juliaC = ref({ x: -0.7, y: 0.27015 })

// 分形信息
const fractalInfos = {
    julia: {
        name: 'Julia集',
        description: '优雅的分形曲线，每个不同的参数c都会创造出独特的图案。与Mandelbrot集密切相关，展现了复数动力学的美妙。'
    },
    mandelbrot: {
        name: 'Mandelbrot集',
        description: '最著名的分形集合，由复数迭代公式 z = z² + c 生成。展现了复数平面上的无穷美景，边界处的细节无限精细。'
    },
    fractalTree: {
        name: '分形树',
        description: '模拟自然生长过程的递归结构，每个分支都会产生更小的分支，展现了自然界中树木生长的分形特性。'
    },
    kochSnowflake: {
        name: 'Koch雪花',
        description: '经典的几何分形，通过在等边三角形的每条边上递归添加更小的三角形构造而成，具有无限的周长但有限的面积。'
    }
}

const fractalInfo = computed(() => fractalInfos[currentFractal.value as keyof typeof fractalInfos])

let currentPlane: any = null
let currentGeometry: Group | null = null

// 颜色方案映射
const getColorSchemeName = (scheme: number): string => {
    const schemes = ['rainbow', 'fire', 'ocean', 'forest']
    return schemes[scheme] || 'rainbow'
}

const shaders = {
    mandelbrot: mandelbrotShader,
    julia: juliaShader,
    fractalTree: fractalTreeShader,
    kochSnowflake: kochSnowflakeShader
}

// 初始化
const init = () => {
    engine.init(canvasTarget.value!)
    changeFractal()
}

// 切换分形类型
const changeFractal = () => {
    // 清除现有对象
    if (currentPlane) {
        engine.removeObj(currentPlane)
        currentPlane = null
    }
    if (currentGeometry) {
        engine.removeGeometry(currentGeometry)
        currentGeometry = null
    }

    // 根据分形类型选择渲染方式
    if (currentFractal.value === 'fractalTree' || currentFractal.value === 'kochSnowflake') {
        // 使用Canvas渲染
        engine.enableCanvasMode()
        createCanvasFractal()
        // 重置参数
        resetParameters()
    } else {
        // 使用着色器渲染
        engine.disableCanvasMode()
        const shader = shaders[currentFractal.value as keyof typeof shaders]
        currentPlane = BasicObjGenerator.createScreenShaderPlane(
            vertexShader,
            shader,
            engine.getUniforms()
        )
        engine.addObj(currentPlane)
        // 重置参数
        if (currentFractal.value === 'mandelbrot') {
            resetParameters({
                zoom: 0.1
            })
        }
    }


}

// 创建Canvas分形
const createCanvasFractal = () => {
    if (currentFractal.value === 'fractalTree') {
        const params: FractalTreeCanvasParams = {
            angle: Math.PI / 6, // 30度转弧度
            branchRatio: 0.7,
            maxDepth: Math.max(1, Math.min(12, Math.floor(maxIterations.value / 50))),
            thickness: 2,
            colorScheme: getColorSchemeName(colorScheme.value),
            colorIntensity: colorIntensity.value
        }
        engine.drawCanvasFractalTree(params)
    } else if (currentFractal.value === 'kochSnowflake') {
        const params: KochSnowflakeCanvasParams = {
            iterations: Math.max(0, Math.min(6, Math.floor(maxIterations.value / 100))),
            size: 200,
            thickness: 2,
            colorScheme: getColorSchemeName(colorScheme.value),
            colorIntensity: colorIntensity.value
        }
        engine.drawCanvasKochSnowflake(params)
    }
}

// 更新Canvas分形
const updateCanvasFractal = () => {
    if (engine.isCanvasMode) {
        createCanvasFractal()
    }
}

// 创建几何体分形
const createGeometryFractal = () => {
    if (currentFractal.value === 'fractalTree') {
        const params: FractalTreeParams = {
            depth: Math.floor(maxIterations.value / 25),
            branchLength: 1.0,
            branchRadius: 0.05,
            branchAngle: 30,
            branchCount: 2,
            colorScheme: colorScheme.value,
            colorIntensity: colorIntensity.value
        }
        currentGeometry = FractalGeometryGenerator.createFractalTree(params)
        engine.addGeometry(currentGeometry)
    } else if (currentFractal.value === 'kochSnowflake') {
        const params: KochSnowflakeParams = {
            iterations: Math.min(Math.floor(maxIterations.value / 50), 6),
            size: 2.0,
            lineWidth: 2,
            colorScheme: colorScheme.value,
            colorIntensity: colorIntensity.value
        }
        currentGeometry = FractalGeometryGenerator.createKochSnowflake(params)
        engine.addGeometry(currentGeometry)
    }
}

// 更新几何体分形
const updateGeometryFractal = () => {
    if (!currentGeometry) return

    if (currentFractal.value === 'fractalTree') {
        const params: FractalTreeParams = {
            depth: Math.floor(maxIterations.value / 25),
            branchLength: 1.0,
            branchRadius: 0.05,
            branchAngle: 30,
            branchCount: 2,
            colorScheme: colorScheme.value,
            colorIntensity: colorIntensity.value
        }
        FractalGeometryGenerator.updateFractalTree(currentGeometry, params)
    } else if (currentFractal.value === 'kochSnowflake') {
        const params: KochSnowflakeParams = {
            iterations: Math.min(Math.floor(maxIterations.value / 50), 6),
            size: 2.0,
            lineWidth: 2,
            colorScheme: colorScheme.value,
            colorIntensity: colorIntensity.value
        }
        FractalGeometryGenerator.updateKochSnowflake(currentGeometry, params)
    }
}

// 更新参数
const updateIterations = () => {
    maxIterations.value = Number(maxIterations.value)
    if (engine.isCanvasMode) {
        updateCanvasFractal()
    } else if (engine.isGeometryMode) {
        updateGeometryFractal()
    } else {
        engine.uniforms.set("u_maxIterations", maxIterations.value)
    }
}

const updateZoom = () => {
    zoom.value = Number(zoom.value)
    engine.uniforms.set("u_zoom", zoom.value)
    // 同步更新BasicEngine中的zoomFactor
    engine.zoomFactor = zoom.value
}

const updateColorScheme = () => {
    colorScheme.value = Number(colorScheme.value)
    if (engine.isCanvasMode) {
        updateCanvasFractal()
    } else if (engine.isGeometryMode) {
        updateGeometryFractal()
    } else {
        engine.uniforms.set("u_colorScheme", colorScheme.value)
    }
}

const updateColorIntensity = () => {
    colorIntensity.value = Number(colorIntensity.value)
    if (engine.isCanvasMode) {
        updateCanvasFractal()
    } else if (engine.isGeometryMode) {
        updateGeometryFractal()
    } else {
        engine.uniforms.set("u_colorIntensity", colorIntensity.value)
    }
}

const updateJuliaC = () => {
    juliaC.value.x = Number(juliaC.value.x)
    juliaC.value.y = Number(juliaC.value.y)
    engine.uniforms.set("u_juliaC", new Vector2(juliaC.value.x, juliaC.value.y))
}

// 重置参数
const resetParameters = (params?: any) => {
    maxIterations.value = params?.maxIterations || 200
    zoom.value = params?.zoom || 3.5
    colorScheme.value = params?.colorScheme || 0
    colorIntensity.value = params?.colorIntensity || 1.0
    juliaC.value = params?.juliaC || { x: -0.7, y: 0.27015 }

    // 更新引擎参数
    engine.uniforms.set("u_maxIterations", maxIterations.value)
    engine.uniforms.set("u_zoom", zoom.value)
    engine.uniforms.set("u_colorScheme", colorScheme.value)
    engine.uniforms.set("u_colorIntensity", colorIntensity.value)
    engine.uniforms.set("u_juliaC", new Vector2(-0.7, 0.27015))
    engine.zoomFactor = 3.5
    engine.resetCenter()

    // 如果是Canvas模式，重置Canvas渲染器并重新渲染
    if (engine.isCanvasMode) {
        engine.resetCanvasView()
        updateCanvasFractal()
    }
}

// 切换面板显示
const togglePanel = () => {
    showPanel.value = !showPanel.value
}

// 返回介绍页面
const goBack = () => {
    router.push('/fractal-intro')
}

// 启动动画
engine.animate()

onMounted(() => {
    init()
});

onUnmounted(() => {
    // 清理几何体
    if (currentGeometry) {
        engine.removeGeometry(currentGeometry)
        currentGeometry = null
    }
    engine.dispose();
});
</script>

<style scoped>
.fractal-examples {
    height: 100vh;
    background: #0a0a0a;
    color: white;
    overflow: hidden;
    position: relative;
}

.header {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    z-index: 100;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 2rem;
}

.title {
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0;
    background: linear-gradient(45deg, #e94560, #f39c12);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.back-btn {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.back-btn:hover {
    background: rgba(255, 255, 255, 0.2);
}

.main-content {
    display: flex;
    height: 100vh;
    padding-top: 80px;
}

.canvas-container {
    flex: 1;
    position: relative;
}

.control-panel {
    width: 320px;
    background: rgba(0, 0, 0, 0.9);
    backdrop-filter: blur(10px);
    border-left: 1px solid rgba(255, 255, 255, 0.1);
    padding: 1rem;
    overflow-y: auto;
    transition: transform 0.3s ease;
}

.panel-hidden {
    transform: translateX(100%);
}

.panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.panel-header h3 {
    margin: 0;
    color: #f39c12;
}

.toggle-btn {
    background: #e94560;
    border: none;
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.9rem;
}

.control-group {
    margin-bottom: 1.5rem;
}

.control-group label {
    display: block;
    margin-bottom: 0.5rem;
    color: #b8c6db;
    font-weight: 500;
}

.control-group select,
.control-group input[type="range"] {
    width: 100%;
    padding: 0.5rem;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 6px;
    color: white;
}

.control-group select {
    cursor: pointer;
    background: rgba(30, 30, 30, 0.9);
    color: #ffffff;
}

.control-group select option {
    background: rgba(30, 30, 30, 0.95);
    color: #ffffff;
    padding: 0.5rem;
}

.control-group select:focus {
    outline: none;
    border-color: #e94560;
    box-shadow: 0 0 0 2px rgba(233, 69, 96, 0.2);
}

.control-group input[type="range"] {
    padding: 0;
    height: 6px;
    background: rgba(255, 255, 255, 0.1);
    outline: none;
    cursor: pointer;
}

.control-group input[type="range"]::-webkit-slider-thumb {
    appearance: none;
    width: 18px;
    height: 18px;
    background: #e94560;
    border-radius: 50%;
    cursor: pointer;
}

.julia-controls>div {
    margin-bottom: 1rem;
}

.reset-btn {
    width: 100%;
    background: linear-gradient(45deg, #e94560, #f39c12);
    border: none;
    color: white;
    padding: 0.8rem;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    transition: transform 0.2s ease;
}

.reset-btn:hover {
    transform: translateY(-2px);
}

.info-panel {
    position: absolute;
    bottom: 20px;
    left: 20px;
    max-width: 400px;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(10px);
    padding: 1.5rem;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    z-index: 50;
}

.info-panel h4 {
    margin: 0 0 0.5rem 0;
    color: #3498db;
    font-size: 1.2rem;
}

.info-panel p {
    margin: 0 0 1rem 0;
    line-height: 1.6;
    color: #b8c6db;
}

.controls-hint p {
    margin-bottom: 0.5rem;
    color: #f39c12;
    font-weight: 600;
}

.controls-hint ul {
    margin: 0;
    padding-left: 1.2rem;
    color: #b8c6db;
}

.controls-hint li {
    margin-bottom: 0.3rem;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .main-content {
        flex-direction: column;
    }

    .control-panel {
        width: 100%;
        height: 50vh;
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        border-left: none;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        transform: translateY(calc(100% - 60px));
    }

    .panel-hidden {
        transform: translateY(calc(100% - 60px));
    }

    .control-panel:not(.panel-hidden) {
        transform: translateY(0);
    }

    .info-panel {
        position: relative;
        bottom: auto;
        left: auto;
        max-width: none;
        margin: 1rem;
    }

    .canvas-container {
        height: 50vh;
    }
}
</style>