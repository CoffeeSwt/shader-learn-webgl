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

const init = () => {
    scene = new THREE.Scene()
    camera = new THREE.PerspectiveCamera(75, canvasContainer.value!.offsetWidth / canvasContainer.value!.offsetHeight, 0.1, 1000)
    renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(canvasContainer.value!.offsetWidth, canvasContainer.value!.offsetHeight)
    canvasContainer.value?.appendChild(renderer.domElement)
    camera.position.z = 1000
    camera.lookAt(0, 0, 0)
}
const animate = () => {
    requestAnimationFrame(animate)
    tweenGroup.update()
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
const OFFSET_X = AREA_W / 2
const OFFSET_Y = AREA_H / 2

const boxAreas: BoxArea[] = [
    {
        // Top-Left
        name: themeList[0].name,
        description: themeList[0].description,
        cameraPos: new THREE.Vector3(-OFFSET_X, OFFSET_Y, CAM_Z_OFFSET),
        cameraLookAt: new THREE.Vector3(-OFFSET_X, OFFSET_Y, 0),
        areaPos: [
            new THREE.Vector3(-AREA_W, AREA_H, AREA_D / 2),
            new THREE.Vector3(-AREA_W, 0, AREA_D / 2),
            new THREE.Vector3(0, 0, AREA_D / 2),
            new THREE.Vector3(0, AREA_H, -AREA_D / 2),
        ]
    },
    {
        // Top-Right
        name: themeList[1].name,
        description: themeList[1].description,
        cameraPos: new THREE.Vector3(OFFSET_X, OFFSET_Y, CAM_Z_OFFSET),
        cameraLookAt: new THREE.Vector3(OFFSET_X, OFFSET_Y, 0),
        areaPos: [
            new THREE.Vector3(0, AREA_H, AREA_D / 2),
            new THREE.Vector3(0, 0, AREA_D / 2),
            new THREE.Vector3(AREA_W, 0, AREA_D / 2),
            new THREE.Vector3(AREA_W, AREA_H, -AREA_D / 2),
        ]
    },
    {
        // Bottom-Left
        name: themeList[2].name,
        description: themeList[2].description,
        cameraPos: new THREE.Vector3(-OFFSET_X, -OFFSET_Y, CAM_Z_OFFSET),
        cameraLookAt: new THREE.Vector3(-OFFSET_X, -OFFSET_Y, 0),
        areaPos: [
            new THREE.Vector3(-AREA_W, 0, AREA_D / 2),
            new THREE.Vector3(-AREA_W, -AREA_H, AREA_D / 2),
            new THREE.Vector3(0, -AREA_H, AREA_D / 2),
            new THREE.Vector3(0, 0, -AREA_D / 2),
        ]
    },
    {
        // Bottom-Right
        name: themeList[3].name,
        description: themeList[3].description,
        cameraPos: new THREE.Vector3(OFFSET_X, -OFFSET_Y, CAM_Z_OFFSET),
        cameraLookAt: new THREE.Vector3(OFFSET_X, -OFFSET_Y, 0),
        areaPos: [
            new THREE.Vector3(0, 0, AREA_D / 2),
            new THREE.Vector3(0, -AREA_H, AREA_D / 2),
            new THREE.Vector3(AREA_W, -AREA_H, AREA_D / 2),
            new THREE.Vector3(AREA_W, 0, -AREA_D / 2),
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
                mesh.position.copy(getRandomPosInArea(area.areaPos))
                mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0)
                group.add(mesh)
            }
        }
        scene.add(group)
    })
}

const changeCameraArea = (area: BoxArea) => {
    // Current camera state
    const startPos = camera.position.clone()
    const startLookAt = new THREE.Vector3()
    camera.getWorldDirection(startLookAt)
    startLookAt.add(startPos) // Get current lookAt target

    // Target camera state
    const endPos = area.cameraPos.clone()
    const endLookAt = area.cameraLookAt.clone()

    // Tween animation
    const duration = 2000 // ms
    const t = { t: 0 }
    
    tweenGroup.removeAll()

    const tween = new Tween(t)
        .to({ t: 1 }, duration)
        .easing(Easing.Quadratic.InOut)
        .onUpdate(() => {
            // Linear interpolation for Position
            const pos = new THREE.Vector3().lerpVectors(startPos, endPos, t.t)

            camera.position.copy(pos)

            // Linear interpolation for LookAt
            const currentLookAt = new THREE.Vector3().lerpVectors(startLookAt, endLookAt, t.t)
            camera.lookAt(currentLookAt)
        })
        .start()
    tweenGroup.add(tween)
}


onMounted(() => {
    init()
    animate()
    initSceneObj()
})

</script>