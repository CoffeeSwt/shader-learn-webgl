<template>
    <div relative size-screen>
        <div absolute top-0 left-0 ref="canvasContainer" size-full></div>
        <div absolute top-10 right-10>
            <div v-for="item in boxAreas" :key="item.name" class="box-area">
                <div @click="changeCameraArea(item)" class="box-header">
                    <span>{{ item.name }}</span>
                </div>
            </div>
        </div>
    </div>
</template>


<script setup lang="ts">
import { onMounted, ref } from 'vue'
import * as THREE from 'three'
import { Tween, Group, Easing } from '@tweenjs/tween.js'

const canvasContainer = ref<HTMLDivElement | null>(null)
let scene = new THREE.Scene()
let camera = new THREE.PerspectiveCamera(75, 16 / 9, 0.1, 1000)
let renderer = new THREE.WebGLRenderer({ antialias: true })
const tweenGroup = new Group()

// View control state
const viewCenter = new THREE.Vector3(0, 0, 1000) // Initial overview position
const mouseOffset = new THREE.Vector3()

// Mouse interaction state
const mousePos = new THREE.Vector2()
const windowHalfX = window.innerWidth / 2
const windowHalfY = window.innerHeight / 2

const onDocumentMouseMove = (event: MouseEvent) => {
    mousePos.x = (event.clientX - windowHalfX)
    mousePos.y = (event.clientY - windowHalfY)
    
    // Map mouse position to world offset
    // Allow moving across the entire 2x2 grid area
    // Grid total width = 2 * AREA_W = 400
    // Grid total height = 2 * AREA_H = 225
    // Range should be roughly half of that to reach edges from center
    const rangeX = 60 
    const rangeY = 35
    
    // Calculate the potential full offset based on mouse position
    const fullOffsetX = (mousePos.x / windowHalfX) * rangeX
    const fullOffsetY = -(mousePos.y / windowHalfY) * rangeY

    // Apply the offset RELATIVE to the current viewCenter
    // If viewCenter is at Top-Left (-OFFSET_X, OFFSET_Y), and mouse is at Top-Left (-windowHalfX, -windowHalfY)
    // We want the camera to look MORE to the Top-Left, but not double count the position.
    // Actually, the user wants "Joystick" behavior around the CURRENT center.
    // So mouse at center screen = 0 offset. Mouse at edge = max offset.
    // This offset should be added to the CURRENT viewCenter.
    
    mouseOffset.x = fullOffsetX
    mouseOffset.y = fullOffsetY
    mouseOffset.z = 0
}

const init = () => {
    scene = new THREE.Scene()
    scene.background = new THREE.Color(0x050510)
    scene.fog = new THREE.FogExp2(0x050510, 0.001)

    camera = new THREE.PerspectiveCamera(75, canvasContainer.value!.offsetWidth / canvasContainer.value!.offsetHeight, 0.1, 2000)
    renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(canvasContainer.value!.offsetWidth, canvasContainer.value!.offsetHeight)
    canvasContainer.value?.appendChild(renderer.domElement)
    
    // Initial camera position based on the first area
    viewCenter.copy(boxAreas[0].cameraPos)
    camera.position.copy(viewCenter)
    // Calculate initial target with mouse offset (which starts at 0,0,0)
    const targetPos = viewCenter.clone().add(mouseOffset)
    camera.position.copy(targetPos)
    
    camera.lookAt(camera.position.x, camera.position.y, 0)
    
    document.addEventListener('mousemove', onDocumentMouseMove)
}

const initSciFiBackground = () => {
    // 1. Particle System with Connections (Data Flow)
    const particleCount = 2000 // Increased count
    const connectionDistance = 150 // Distance to connect
    const particleGeometry = new THREE.BufferGeometry()
    const particlePositions = new Float32Array(particleCount * 3)
    const particleVelocities = []

    for (let i = 0; i < particleCount; i++) {
        // Spread particles in a wider volume
        const x = (Math.random() - 0.5) * 2500
        const y = (Math.random() - 0.5) * 2500
        const z = (Math.random() - 0.5) * 1000 - 500 // Push back a bit
        particlePositions[i * 3] = x
        particlePositions[i * 3 + 1] = y
        particlePositions[i * 3 + 2] = z
        
        particleVelocities.push({
            x: (Math.random() - 0.5) * 0.8,
            y: (Math.random() - 0.5) * 0.8,
            z: (Math.random() - 0.5) * 0.2
        })
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3))
    const particleMaterial = new THREE.PointsMaterial({
        color: 0x00aaff,
        size: 2.5,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    })
    const particleSystem = new THREE.Points(particleGeometry, particleMaterial)
    scene.add(particleSystem)

    // Lines geometry for connections
    const linesGeometry = new THREE.BufferGeometry()
    const linesMaterial = new THREE.LineBasicMaterial({
        color: 0x0088ff,
        transparent: true,
        opacity: 0.15,
        blending: THREE.AdditiveBlending
    })
    const linesMesh = new THREE.LineSegments(linesGeometry, linesMaterial)
    scene.add(linesMesh)

    // Store data for animation
    particleSystem.userData = { 
        velocities: particleVelocities,
        linesMesh: linesMesh,
        connectionDistance: connectionDistance
    }
    
    // 2. Grid Background (Subtler)
    const gridHelper = new THREE.GridHelper(3000, 60, 0x0a1a2a, 0x050a15)
    gridHelper.position.y = -600
    scene.add(gridHelper)
    const gridHelperTop = new THREE.GridHelper(3000, 60, 0x0a1a2a, 0x050a15)
    gridHelperTop.position.y = 600
    scene.add(gridHelperTop)

    // 3. Rotating Rings (Data Circles) - Removed the "X" (Torus with different rotations)
    // Kept simple concentric data rings
    const ringGeometry = new THREE.TorusGeometry(700, 1, 16, 100)
    const ringMaterial = new THREE.MeshBasicMaterial({ color: 0x004488, wireframe: true, transparent: true, opacity: 0.2 })
    const ring1 = new THREE.Mesh(ringGeometry, ringMaterial)
    const ring2 = new THREE.Mesh(ringGeometry, ringMaterial)
    
    // Flat rings on Z plane behind content
    ring1.position.z = -200
    ring2.position.z = -200
    ring2.scale.set(1.2, 1.2, 1) // Outer ring

    scene.add(ring1)
    scene.add(ring2)
    
    return { particleSystem, rings: [ring1, ring2] }
}

let bgObjects: any = null

const animate = () => {
    requestAnimationFrame(animate)
    tweenGroup.update()
    
    const dampingFactor = 0.05
    
    // Calculate final target: View Center (animated by buttons) + Mouse Offset (interactive)
    const targetPos = viewCenter.clone().add(mouseOffset)

    // Smoothly interpolate camera to target
    camera.position.lerp(targetPos, dampingFactor)
    
    // Animate Background
    if (bgObjects) {
        // Rotate rings
        bgObjects.rings.forEach((ring: THREE.Mesh, i: number) => {
            ring.rotation.z += 0.0005 * (i % 2 === 0 ? 1 : -1)
        })
        
        // Move particles and update lines
        const pSystem = bgObjects.particleSystem
        const positions = pSystem.geometry.attributes.position.array
        const velocities = pSystem.userData.velocities
        const count = positions.length / 3
        
        // Update positions
        for(let i = 0; i < count; i++) {
            positions[i*3] += velocities[i].x
            positions[i*3+1] += velocities[i].y
            positions[i*3+2] += velocities[i].z
            
            // Wrap around
            if(Math.abs(positions[i*3]) > 1250) positions[i*3] = -positions[i*3]
            if(Math.abs(positions[i*3+1]) > 1250) positions[i*3+1] = -positions[i*3+1]
            if(Math.abs(positions[i*3+2]) > 800) positions[i*3+2] = -positions[i*3+2]
        }
        pSystem.geometry.attributes.position.needsUpdate = true

        // Update Connections (Dynamic Lines)
        // Optimization: Only check a subset or use spatial partitioning for better perf in production
        // For 2000 particles, O(N^2) is heavy. Let's limit line checks to closest neighbors roughly or just random subset
        // Simple approach: only connect first 200 particles to others to save frames
        
        const linePositions = []
        const connectLimit = 300 // Only check connections for this many particles to maintain 60fps
        const distSq = pSystem.userData.connectionDistance * pSystem.userData.connectionDistance
        
        for (let i = 0; i < connectLimit; i++) {
            for (let j = i + 1; j < count; j++) {
                const dx = positions[i*3] - positions[j*3]
                const dy = positions[i*3+1] - positions[j*3+1]
                const dz = positions[i*3+2] - positions[j*3+2]
                
                const dist = dx*dx + dy*dy + dz*dz
                
                if (dist < distSq) {
                    // Add line
                    linePositions.push(
                        positions[i*3], positions[i*3+1], positions[i*3+2],
                        positions[j*3], positions[j*3+1], positions[j*3+2]
                    )
                }
            }
        }
        
        const linesMesh = pSystem.userData.linesMesh
        linesMesh.geometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3))
    }
    
    renderer.render(scene, camera)
}

//四个点确定一个三维立方体区域
//分别对应，立方体前左上角坐标，前左下角坐标，前右下角坐标，后右上角坐标
//由四个点确定一个立方体区域，表示不同的模块
type AreaPos = [THREE.Vector3, THREE.Vector3, THREE.Vector3, THREE.Vector3]
type BoxArea = {
    //模块名称
    name: string
    //描述模块功能
    description: string
    cameraPos: THREE.Vector3
    cameraLookAt: THREE.Vector3
    areaPos: AreaPos
}
const themeList = [
    {
        name: '菜品识别',
        description: '识别菜品并显示在屏幕上',
    },
    {
        name: '动物识别',
        description: '利用AI技术，实现动物识别',
    },
    {
        name: '人物识别',
        description: '利用AI技术，实现人物识别',
    },
    {
        name: '高级通用',
        description: '利用AI技术，实现高级通用识别',
    }

]
// Standard 16:9 aspect ratio for areas
// Width: 200, Height: 112.5
// Depth: 100
// Distance to fill screen (FOV 75): ~73.3
const CAM_Z_OFFSET = 73.3 + 50 // Distance + half depth (front face is at +50 relative to center)
const AREA_W = 200
const AREA_H = 112.5
const AREA_D = 100

// 2x2 Grid Layout
// Center offsets
// The camera position should be at the CENTER of each quadrant
// Top-Left center: (-AREA_W/2, AREA_H/2)
// Top-Right center: (AREA_W/2, AREA_H/2)
// Bottom-Left center: (-AREA_W/2, -AREA_H/2)
// Bottom-Right center: (AREA_W/2, -AREA_H/2)
const OFFSET_X = AREA_W / 2
const OFFSET_Y = AREA_H / 2

const boxAreas: BoxArea[] = [
    {
        // Top-Left (Quadrant 2)
        name: themeList[0].name,
        description: themeList[0].description,
        cameraPos: new THREE.Vector3(-OFFSET_X, OFFSET_Y, CAM_Z_OFFSET),
        cameraLookAt: new THREE.Vector3(-OFFSET_X, OFFSET_Y, 0),
        areaPos: [
            // Front face corners
            new THREE.Vector3(-AREA_W, AREA_H, AREA_D / 2),   // Top Left
            new THREE.Vector3(-AREA_W, 0, AREA_D / 2),        // Bottom Left
            new THREE.Vector3(0, 0, AREA_D / 2),              // Bottom Right
            new THREE.Vector3(0, AREA_H, AREA_D / 2),         // Top Right
        ]
    },
    {
        // Top-Right (Quadrant 1)
        name: themeList[1].name,
        description: themeList[1].description,
        cameraPos: new THREE.Vector3(OFFSET_X, OFFSET_Y, CAM_Z_OFFSET),
        cameraLookAt: new THREE.Vector3(OFFSET_X, OFFSET_Y, 0),
        areaPos: [
             // Front face corners
            new THREE.Vector3(0, AREA_H, AREA_D / 2),         // Top Left
            new THREE.Vector3(0, 0, AREA_D / 2),              // Bottom Left
            new THREE.Vector3(AREA_W, 0, AREA_D / 2),         // Bottom Right
            new THREE.Vector3(AREA_W, AREA_H, AREA_D / 2),    // Top Right
        ]
    },
    {
        // Bottom-Left (Quadrant 3)
        name: themeList[2].name,
        description: themeList[2].description,
        cameraPos: new THREE.Vector3(-OFFSET_X, -OFFSET_Y, CAM_Z_OFFSET),
        cameraLookAt: new THREE.Vector3(-OFFSET_X, -OFFSET_Y, 0),
        areaPos: [
             // Front face corners
            new THREE.Vector3(-AREA_W, 0, AREA_D / 2),        // Top Left
            new THREE.Vector3(-AREA_W, -AREA_H, AREA_D / 2),  // Bottom Left
            new THREE.Vector3(0, -AREA_H, AREA_D / 2),        // Bottom Right
            new THREE.Vector3(0, 0, AREA_D / 2),              // Top Right
        ]
    },
    {
        // Bottom-Right (Quadrant 4)
        name: themeList[3].name,
        description: themeList[3].description,
        cameraPos: new THREE.Vector3(OFFSET_X, -OFFSET_Y, CAM_Z_OFFSET),
        cameraLookAt: new THREE.Vector3(OFFSET_X, -OFFSET_Y, 0),
        areaPos: [
             // Front face corners
            new THREE.Vector3(0, 0, AREA_D / 2),              // Top Left
            new THREE.Vector3(0, -AREA_H, AREA_D / 2),        // Bottom Left
            new THREE.Vector3(AREA_W, -AREA_H, AREA_D / 2),   // Bottom Right
            new THREE.Vector3(AREA_W, 0, AREA_D / 2),         // Top Right
        ]
    },
]

const initSceneObj = () => {
    //创建一个坐标轴辅助器
    const axesHelper = new THREE.AxesHelper(100)
    scene.add(axesHelper)

    // Helper function to create random positions within an area
    const getRandomPosInArea = (areaPos: AreaPos) => {
        const minX = Math.min(...areaPos.map(v => v.x))
        const maxX = Math.max(...areaPos.map(v => v.x))
        const minY = Math.min(...areaPos.map(v => v.y))
        const maxY = Math.max(...areaPos.map(v => v.y))
        const minZ = Math.min(...areaPos.map(v => v.z))
        const maxZ = Math.max(...areaPos.map(v => v.z))

        return new THREE.Vector3(
            THREE.MathUtils.randFloat(minX, maxX),
            THREE.MathUtils.randFloat(minY, maxY),
            THREE.MathUtils.randFloat(minZ, maxZ)
        )
    }

    // Populate areas with different geometries
    boxAreas.forEach((area, index) => {
        const group = new THREE.Group()
        const count = 200 // Number of objects per area

        for (let i = 0; i < count; i++) {
            let geometry, material
            const color = Math.random() * 0xffffff

            switch (index) {
                case 0: // Box for Area 1
                    geometry = new THREE.BoxGeometry(2, 2, 2)
                    material = new THREE.MeshBasicMaterial({ color: color, wireframe: false })
                    break
                case 1: // Cylinder for Area 2
                    geometry = new THREE.CylinderGeometry(1, 1, 3, 32)
                    material = new THREE.MeshBasicMaterial({ color: color, wireframe: false })
                    break
                case 2: // Sphere for Area 3
                    geometry = new THREE.SphereGeometry(1.5, 32, 32)
                    material = new THREE.MeshBasicMaterial({ color: color, wireframe: false })
                    break
                case 3: // Cone for Area 4
                    geometry = new THREE.ConeGeometry(1.5, 3, 32)
                    material = new THREE.MeshBasicMaterial({ color: color, wireframe: false })
                    break
                default:
                    geometry = new THREE.BoxGeometry(1, 1, 1)
                    material = new THREE.MeshBasicMaterial({ color: color })
            }

            if (geometry && material) {
                const mesh = new THREE.Mesh(geometry, material)
                // Use a dedicated helper that respects the new quadrant-based bounds
                // The original getRandomPosInArea was using the bounding box of the points, 
                // which is correct if the points define the box volume.
                // Our points define the Front Face. We need to extend this to volume.
                // Z range is [AREA_D/2, -AREA_D/2] (Front to Back)
                
                // Get bounds from the areaPos (Front Face)
                const minX = Math.min(...area.areaPos.map(v => v.x))
                const maxX = Math.max(...area.areaPos.map(v => v.x))
                const minY = Math.min(...area.areaPos.map(v => v.y))
                const maxY = Math.max(...area.areaPos.map(v => v.y))
                
                // Z depth is fixed for all boxes centered at 0
                // Front is at AREA_D/2, Back is at -AREA_D/2
                const minZ = -AREA_D / 2
                const maxZ = AREA_D / 2

                mesh.position.set(
                    THREE.MathUtils.randFloat(minX, maxX),
                    THREE.MathUtils.randFloat(minY, maxY),
                    THREE.MathUtils.randFloat(minZ, maxZ)
                )
                
                mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0)
                group.add(mesh)
            }
        }
        scene.add(group)
    })
}

const changeCameraArea = (area: BoxArea) => {
    // Tween viewCenter to the new area's position
    const start = viewCenter.clone()
    const end = area.cameraPos.clone()
    
    tweenGroup.removeAll()

    const tween = new Tween(viewCenter) // Tween the viewCenter object directly
        .to({ x: end.x, y: end.y, z: end.z }, 2000)
        .easing(Easing.Quadratic.InOut)
        .start()
        
    tweenGroup.add(tween)
}


onMounted(() => {
    init()
    bgObjects = initSciFiBackground()
    animate()
    initSceneObj()
})

</script>