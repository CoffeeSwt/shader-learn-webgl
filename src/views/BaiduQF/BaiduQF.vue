<template>
  <div class="baidu-qf-container" @mousemove="onMouseMove">
    <div class="custom-cursor" :style="{ left: mouseX + 'px', top: mouseY + 'px', opacity: mouseX < 0 ? 0 : 1 }"></div>
    <div ref="canvasContainer" class="canvas-container"></div>
    <div class="ui-overlay">
      <div class="header">
        <h1 class="title">AI 视觉大模型能力演示</h1>
        <div class="subtitle">Baidu AI Vision Capabilities</div>
      </div>
      
      <div class="scenario-list">
        <div
          v-for="(scenario, index) in scenarios"
          :key="index"
          class="scenario-item"
          :class="{ active: currentScenarioIndex === index }"
          @click="switchScenario(index)"
        >
          <div class="scenario-icon"></div>
          <span class="scenario-name">{{ scenario.name }}</span>
        </div>
      </div>

      <div class="current-info" v-if="scenarios[currentScenarioIndex]">
        <h2 class="info-title">{{ scenarios[currentScenarioIndex].name }}</h2>
        <p class="info-desc">{{ scenarios[currentScenarioIndex].description }}</p>
      </div>

      <div class="layout-menu">
        <button :class="{ active: currentLayout === 'sphere' }" @click="switchLayout('sphere')">SPHERE</button>
        <button :class="{ active: currentLayout === 'helix' }" @click="switchLayout('helix')">HELIX</button>
        <button :class="{ active: currentLayout === 'grid' }" @click="switchLayout('grid')">GRID</button>
        <button :class="{ active: currentLayout === 'cylinder' }" @click="switchLayout('cylinder')">CYLINDER</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from 'vue'
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import TWEEN from '@tweenjs/tween.js'

interface Scenario {
  id: string
  name: string
  description: string
  glyph: string
}

const scenarios: Scenario[] = [
  { id: 'dish', name: '菜品识别', description: '智能识别各类菜品，精准计算卡路里与营养成分', glyph: 'DISH' },
  { id: 'industry', name: '智慧工业', description: '工业质检、缺陷检测，助力智能制造升级', glyph: 'IND' },
  { id: 'visual', name: '视觉技术', description: '实时视觉体验，高精度三维重建与渲染', glyph: 'VIS' },
  { id: 'city', name: '智慧城市', description: '城市治理、交通流量监控、安防预警', glyph: 'CITY' },
  { id: 'animal', name: '动物识别', description: '自然生态保护，珍稀动物种类识别与监测', glyph: 'ANI' },
  { id: 'general', name: '高级通用', description: '通用物体检测，适应复杂场景下的多目标识别', glyph: 'GEN' },
  { id: 'plant', name: '植物识别', description: '植物病虫害检测，农作物生长状态监测', glyph: 'PLT' },
  { id: 'fruit', name: '果蔬识别', description: '果蔬分级分选，新鲜度检测与品种识别', glyph: 'FRU' },
  { id: 'currency', name: '货币识别', description: '多国货币快速识别，汇率换算辅助', glyph: 'CUR' },
]

const currentScenarioIndex = ref(0)
const currentLayout = ref('sphere')
const canvasContainer = ref<HTMLDivElement | null>(null)

let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let composer: EffectComposer
let animationId: number

const mouseX = ref(-100)
const mouseY = ref(-100)
const normalizedMouse = new THREE.Vector2(0, 0)
const baseCameraPos = new THREE.Vector3(0, 0, 3000)
const baseCameraTarget = new THREE.Vector3(0, 0, 0)

const TOTAL_PANELS = 125 // 5x5x5 grid
const objects: THREE.Mesh[] = []
const mainPanels: THREE.Mesh[] = new Array(9)
const targets: Record<string, THREE.Object3D[]> = {
  sphere: [],
  helix: [],
  grid: [],
  cylinder: []
}

let cameraPosTween: any = null
let controlsTargetTween: any = null

const scenarioImages: Record<string, HTMLImageElement> = {}

function preloadImages() {
  scenarios.forEach((sc, idx) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    // Load tech/sci-fi/industry related random images from picsum
    img.src = `https://picsum.photos/seed/${sc.id}ai/240/320`
    scenarioImages[sc.id] = img
  })
}

onMounted(() => {
  preloadImages()
  initThree()
  createBackgroundGrids()
  createPanels()
  calculateLayouts()
  switchLayout('sphere', 0) // initial instant layout
  switchLayout('sphere', 2000) // animate into sphere
  
  setTimeout(() => {
    currentScenarioIndex.value = -1
    switchScenario(0)
  }, 2200)

  animate()
  window.addEventListener('resize', onWindowResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onWindowResize)
  cancelAnimationFrame(animationId)
  renderer.dispose()
  scene.clear()
})

function initThree() {
  if (!canvasContainer.value) return
  scene = new THREE.Scene()
  scene.fog = new THREE.FogExp2(0x020814, 0.0008)
  
  camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 10000)
  camera.position.set(0, 0, 3000)

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  canvasContainer.value.appendChild(renderer.domElement)

  const renderScene = new RenderPass(scene, camera)
  const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85)
  bloomPass.threshold = 0.1
  bloomPass.strength = 1.2
  bloomPass.radius = 0.5
  
  composer = new EffectComposer(renderer)
  composer.addPass(renderScene)
  composer.addPass(bloomPass)

  const ambientLight = new THREE.AmbientLight(0xffffff, 1.0)
  scene.add(ambientLight)
}

let bgGroup: THREE.Group

function createBackgroundGrids() {
  bgGroup = new THREE.Group()
  
  for (let i = 0; i < 6; i++) {
    const size = 6000
    const divisions = 30
    const gridHelper = new THREE.GridHelper(size, divisions, 0x00bfff, 0x00bfff)
    gridHelper.position.set(
      (Math.random() - 0.5) * 4000,
      (Math.random() - 0.5) * 4000,
      (Math.random() - 0.5) * 4000 - 1000
    )
    gridHelper.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    )
    ;(gridHelper.material as THREE.Material).transparent = true
    ;(gridHelper.material as THREE.Material).opacity = 0.08
    ;(gridHelper.material as THREE.Material).blending = THREE.AdditiveBlending
    ;(gridHelper.material as THREE.Material).depthWrite = false
    bgGroup.add(gridHelper)
  }
  
  const particleCount = 2500
  const pGeo = new THREE.BufferGeometry()
  const pPos = new Float32Array(particleCount * 3)
  for(let i = 0; i < particleCount; i++) {
    pPos[i*3] = (Math.random() - 0.5) * 8000
    pPos[i*3+1] = (Math.random() - 0.5) * 8000
    pPos[i*3+2] = (Math.random() - 0.5) * 8000
  }
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3))
  const pMat = new THREE.PointsMaterial({
    color: 0x4fd1ff,
    size: 12,
    transparent: true,
    opacity: 0.3,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  })
  const particles = new THREE.Points(pGeo, pMat)
  bgGroup.add(particles)
  
  scene.add(bgGroup)
}

function createPanelTexture(scenario: Scenario, isMain: boolean) {
  const canvas = document.createElement('canvas')
  canvas.width = 240
  canvas.height = 320
  const ctx = canvas.getContext('2d')!
  
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace

  const drawContent = (img?: HTMLImageElement) => {
    if (img && img.complete) {
      ctx.drawImage(img, 0, 0, 240, 320)
      ctx.fillStyle = isMain ? 'rgba(4, 20, 46, 0.4)' : 'rgba(2, 8, 20, 0.7)'
      ctx.fillRect(0, 0, 240, 320)
    } else {
      const bg = ctx.createLinearGradient(0, 0, 0, canvas.height)
      bg.addColorStop(0, isMain ? 'rgba(10, 42, 92, 0.9)' : 'rgba(3, 21, 47, 0.6)')
      bg.addColorStop(1, isMain ? 'rgba(4, 18, 46, 0.9)' : 'rgba(2, 8, 20, 0.6)')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    // Border
    ctx.strokeStyle = isMain ? '#00bfff' : 'rgba(0, 191, 255, 0.3)'
    ctx.lineWidth = isMain ? 6 : 2
    ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8)
    
    // Text
    ctx.fillStyle = isMain ? '#ffffff' : 'rgba(255, 255, 255, 0.6)'
    ctx.font = `bold ${isMain ? 42 : 28}px "Segoe UI", sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(scenario.glyph, canvas.width / 2, canvas.height / 2 - 20)
    
    ctx.font = `${isMain ? 24 : 16}px "Segoe UI", sans-serif`
    ctx.fillText(scenario.name, canvas.width / 2, canvas.height / 2 + 40)

    // Inner decorations
    ctx.strokeStyle = isMain ? 'rgba(120, 220, 255, 0.6)' : 'rgba(120, 220, 255, 0.2)'
    ctx.lineWidth = 1
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40)
    
    texture.needsUpdate = true
  }

  const img = scenarioImages[scenario.id]
  if (img && img.complete) {
    drawContent(img)
  } else if (img) {
    drawContent()
    img.addEventListener('load', () => drawContent(img))
  } else {
    drawContent()
  }

  return texture
}

function createPanels() {
  const mainIndices = [12, 26, 40, 54, 68, 82, 96, 110, 124] // 9 distinct spots

  for (let i = 0; i < TOTAL_PANELS; i++) {
    const isMain = mainIndices.includes(i)
    const scenarioIndex = isMain ? mainIndices.indexOf(i) : i % scenarios.length
    const scenario = scenarios[scenarioIndex]

    const geometry = new THREE.PlaneGeometry(120, 160)
    const material = new THREE.MeshBasicMaterial({
      map: createPanelTexture(scenario, isMain),
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
    })
    
    const mesh = new THREE.Mesh(geometry, material)
    
    // Random initial positions
    mesh.position.x = Math.random() * 4000 - 2000
    mesh.position.y = Math.random() * 4000 - 2000
    mesh.position.z = Math.random() * 4000 - 2000
    
    scene.add(mesh)
    objects.push(mesh)

    if (isMain) {
      mainPanels[scenarioIndex] = mesh
    }
  }
}

function calculateLayouts() {
  const vector = new THREE.Vector3()

  // Sphere
  for (let i = 0; i < TOTAL_PANELS; i++) {
    const phi = Math.acos(-1 + (2 * i) / TOTAL_PANELS)
    const theta = Math.sqrt(TOTAL_PANELS * Math.PI) * phi
    const object = new THREE.Object3D()
    object.position.setFromSphericalCoords(800, phi, theta)
    vector.copy(object.position).multiplyScalar(2)
    object.lookAt(vector)
    targets.sphere.push(object)
  }

  // Helix
  for (let i = 0; i < TOTAL_PANELS; i++) {
    const theta = i * 0.175 + Math.PI
    const y = -(i * 12) + 750
    const object = new THREE.Object3D()
    object.position.setFromCylindricalCoords(900, theta, y)
    vector.x = object.position.x * 2
    vector.y = object.position.y
    vector.z = object.position.z * 2
    object.lookAt(vector)
    targets.helix.push(object)
  }

  // Grid
  for (let i = 0; i < TOTAL_PANELS; i++) {
    const object = new THREE.Object3D()
    object.position.x = ((i % 5) * 350) - 700
    object.position.y = (-(Math.floor(i / 5) % 5) * 350) + 700
    object.position.z = (Math.floor(i / 25)) * 600 - 1200
    targets.grid.push(object)
  }

  // Cylinder
  for (let i = 0; i < TOTAL_PANELS; i++) {
    const theta = (i % 18) * (Math.PI * 2 / 18)
    const y = -(Math.floor(i / 18) * 180) + 540
    const object = new THREE.Object3D()
    object.position.setFromCylindricalCoords(800, theta, y)
    vector.x = object.position.x * 2
    vector.y = object.position.y
    vector.z = object.position.z * 2
    object.lookAt(vector)
    targets.cylinder.push(object)
  }
}

function switchLayout(layoutName: string, duration = 2000) {
  currentLayout.value = layoutName
  const layoutTargets = targets[layoutName]

  // Reset base camera position to overview when layout changes
  if (cameraPosTween) cameraPosTween.stop()
  if (controlsTargetTween) controlsTargetTween.stop()

  new TWEEN.Tween(baseCameraPos)
    .to({ x: 0, y: 0, z: 3000 }, duration)
    .easing(TWEEN.Easing.Cubic.InOut)
    .start()
    
  new TWEEN.Tween(baseCameraTarget)
    .to({ x: 0, y: 0, z: 0 }, duration)
    .easing(TWEEN.Easing.Cubic.InOut)
    .start()

  for (let i = 0; i < objects.length; i++) {
    const object = objects[i] as any
    const target = layoutTargets[i]

    if (object.posTween) object.posTween.stop()
    if (object.rotTween) object.rotTween.stop()

    object.posTween = new TWEEN.Tween(object.position)
      .to({ x: target.position.x, y: target.position.y, z: target.position.z }, Math.random() * duration + duration)
      .easing(TWEEN.Easing.Exponential.InOut)
      .start()

    object.rotTween = new TWEEN.Tween(object.rotation)
      .to({ x: target.rotation.x, y: target.rotation.y, z: target.rotation.z }, Math.random() * duration + duration)
      .easing(TWEEN.Easing.Exponential.InOut)
      .start()
  }

  if (currentScenarioIndex.value >= 0 && duration > 0) {
    const idx = currentScenarioIndex.value
    currentScenarioIndex.value = -1
    switchScenario(idx)
  }
}

function switchScenario(index: number) {
  if (currentScenarioIndex.value === index) return
  currentScenarioIndex.value = index
  const targetPanel = mainPanels[index]
  
  if (!targetPanel) return

  const objIndex = objects.indexOf(targetPanel)
  const layoutTargets = targets[currentLayout.value]
  const targetState = layoutTargets[objIndex]

  // Distance from panel to camera when focused
  const dist = 500
  const panelPos = targetState.position.clone()
  
  // Get the panel's forward direction
  const panelNormal = new THREE.Vector3(0, 0, 1).applyEuler(targetState.rotation).normalize()
  const camTargetPos = panelPos.clone().add(panelNormal.multiplyScalar(dist))

  if (cameraPosTween) cameraPosTween.stop()
  if (controlsTargetTween) controlsTargetTween.stop()

  cameraPosTween = new TWEEN.Tween(baseCameraPos)
    .to({ x: camTargetPos.x, y: camTargetPos.y, z: camTargetPos.z }, 1500)
    .easing(TWEEN.Easing.Cubic.InOut)
    .start()

  controlsTargetTween = new TWEEN.Tween(baseCameraTarget)
    .to({ x: panelPos.x, y: panelPos.y, z: panelPos.z }, 1500)
    .easing(TWEEN.Easing.Cubic.InOut)
    .start()
}

function onMouseMove(event: MouseEvent) {
  mouseX.value = event.clientX
  mouseY.value = event.clientY
  normalizedMouse.x = (event.clientX / window.innerWidth) * 2 - 1
  normalizedMouse.y = -(event.clientY / window.innerHeight) * 2 + 1
}

function onWindowResize() {
  if (!canvasContainer.value) return
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
  composer.setSize(window.innerWidth, window.innerHeight)
}

function animate() {
  animationId = requestAnimationFrame(animate)
  TWEEN.update()
  
  // Update Background Grid rotation
  if (bgGroup) {
    bgGroup.rotation.y += 0.0005
    bgGroup.rotation.x += 0.0002
  }

  // Parallax camera offset
  const parallaxX = normalizedMouse.x * 250
  const parallaxY = normalizedMouse.y * 250
  
  camera.position.x = THREE.MathUtils.lerp(camera.position.x, baseCameraPos.x + parallaxX, 0.08)
  camera.position.y = THREE.MathUtils.lerp(camera.position.y, baseCameraPos.y + parallaxY, 0.08)
  camera.position.z = THREE.MathUtils.lerp(camera.position.z, baseCameraPos.z, 0.08)
  
  const targetX = baseCameraTarget.x + parallaxX * 0.2
  const targetY = baseCameraTarget.y + parallaxY * 0.2
  const targetZ = baseCameraTarget.z
  
  // Smoothly look at target
  const currentLookAt = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion).add(camera.position)
  const desiredLookAt = new THREE.Vector3(targetX, targetY, targetZ)
  currentLookAt.lerp(desiredLookAt, 0.08)
  camera.lookAt(currentLookAt)

  // Object Center Scale Logic
  objects.forEach(obj => {
    const vec = obj.position.clone().project(camera)
    let targetScale = 1.0
    // Check if object is in front of camera
    if (vec.z < 1.0 && vec.z > -1.0) {
      const dist = Math.sqrt(vec.x * vec.x + vec.y * vec.y)
      if (dist < 0.3) {
        targetScale = 1.0 + (0.3 - dist) * 2.8 // max scale ~ 1.84
      }
    }
    obj.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.15)
  })

  composer.render()
}
</script>

<style scoped>
.baidu-qf-container {
  width: 100vw;
  height: 100vh;
  position: relative;
  background-color: #000510;
  overflow: hidden;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  cursor: none; /* Hide default cursor */
}

.custom-cursor {
  position: fixed;
  width: 20px;
  height: 20px;
  border: 2px solid #00bfff;
  border-radius: 50%;
  pointer-events: none;
  transform: translate(-50%, -50%);
  z-index: 9999;
  box-shadow: 0 0 10px rgba(0, 191, 255, 0.8);
  transition: width 0.2s, height 0.2s;
}

.custom-cursor::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 4px;
  height: 4px;
  background: #00bfff;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 0 5px #00bfff;
}

.canvas-container {
  width: 100%;
  height: 100%;
}

.ui-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 40px;
  box-sizing: border-box;
}

.header {
  text-align: left;
  pointer-events: auto;
}

.title {
  color: #00BFFF;
  font-size: 2.5rem;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 4px;
  text-shadow: 0 0 20px rgba(0, 191, 255, 0.5);
}

.subtitle {
  color: #87CEEB;
  font-size: 1.2rem;
  margin-top: 5px;
  letter-spacing: 2px;
  opacity: 0.8;
}

.scenario-list {
  position: absolute;
  right: 40px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 15px;
  pointer-events: auto;
}

.scenario-item {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  cursor: none;
  transition: all 0.3s ease;
  opacity: 0.6;
}

.scenario-item:hover, .scenario-item.active {
  opacity: 1;
  transform: translateX(-10px);
}

.scenario-name {
  color: #fff;
  margin-right: 15px;
  font-size: 1rem;
  letter-spacing: 1px;
  text-shadow: 0 0 5px rgba(255, 255, 255, 0.5);
}

.scenario-icon {
  width: 12px;
  height: 12px;
  background: #00BFFF;
  transform: rotate(45deg);
  box-shadow: 0 0 10px #00BFFF;
}

.current-info {
  position: absolute;
  top: 150px;
  left: 40px;
  max-width: 400px;
  background: rgba(0, 20, 40, 0.6);
  padding: 20px;
  border-left: 4px solid #00BFFF;
  backdrop-filter: blur(5px);
  pointer-events: auto;
}

.info-title {
  color: #00BFFF;
  margin: 0 0 10px 0;
  font-size: 1.8rem;
  letter-spacing: 2px;
}

.info-desc {
  color: #cccccc;
  margin: 0;
  line-height: 1.6;
  font-size: 1rem;
}

.layout-menu {
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 20px;
  pointer-events: auto;
}

.layout-menu button {
  background: rgba(0, 20, 40, 0.6);
  color: rgba(127, 255, 255, 0.75);
  border: 1px solid rgba(127, 255, 255, 0.75);
  padding: 10px 24px;
  cursor: none;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  font-size: 14px;
  letter-spacing: 2px;
  transition: all 0.3s;
  backdrop-filter: blur(5px);
}

.layout-menu button:hover {
  background-color: rgba(0, 255, 255, 0.2);
}

.layout-menu button.active {
  background-color: rgba(0, 255, 255, 0.5);
  color: #fff;
  box-shadow: 0 0 15px rgba(0, 255, 255, 0.5);
}
</style>
