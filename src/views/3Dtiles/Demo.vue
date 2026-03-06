<template>
    <div></div>
</template>

<script setup lang="ts">
import { TilesRenderer } from '3d-tiles-renderer';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { onMounted } from 'vue'

onMounted(() => {
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100000);
    camera.position.set(0, 0, 5);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    // 创建OrbitControls实例
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    const box = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    );
    box.position.set(0, 0, -5);
    scene.add(box);

    // 创建TilesRenderer实例，指定tileset.json文件的路径
    const tilesRenderer = new TilesRenderer('/terrab3dms/tileset.json');
    // 设置误差阈值为 0，强制加载最精细的层级（适用于小场景）
    tilesRenderer.errorTarget = 0;
    // 允许加载兄弟节点，确保加载更完整
    tilesRenderer.loadSiblings = true;

    // Setup Draco Loader
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/draco/'); // Use local path

    const loader = new GLTFLoader(tilesRenderer.manager);
    loader.setDRACOLoader(dracoLoader);

    tilesRenderer.manager.addHandler(/\.(gltf|glb)$/g, loader);

    // 设置相机和渲染器
    tilesRenderer.setCamera(camera);
    tilesRenderer.setResolutionFromRenderer(camera, renderer);
    // 将TilesRenderer的group添加到场景中
    scene.add(tilesRenderer.group);

    // 添加光照
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight.position.set(100, 100, 100);
    scene.add(dirLight);

    // 监听 tileset 加载完成事件，调整相机视角
    const onTilesetLoad = () => {
        const sphere = new THREE.Sphere();
        if (tilesRenderer.getBoundingSphere(sphere)) {
            // 计算缩放比例，将模型缩放到半径为 100 的范围内
            // 这样可以避免因模型过大或过小导致的视角控制问题（推不动或穿模）
            const center = sphere.center.clone();
            const radius = sphere.radius;
            const targetRadius = 100.0;
            const scale = targetRadius / radius;

            // 应用缩放和偏移，将模型中心对齐到场景原点 (0,0,0)
            tilesRenderer.group.scale.setScalar(scale);
            tilesRenderer.group.position.copy(center).multiplyScalar(-scale);
            tilesRenderer.group.updateMatrixWorld(true);

            // 重置相机位置
            // 相机距离设置为目标半径的 3 倍，确保能看到全貌
            const distance = targetRadius * 3.0;
            camera.position.set(0, 0, distance);
            camera.lookAt(0, 0, 0);
            
            // 调整相机的近裁剪面和远裁剪面，适应缩放后的场景
            camera.near = 0.1;
            camera.far = distance * 10;
            camera.updateProjectionMatrix();

            // 更新控制器目标点为原点
            controls.target.set(0, 0, 0);
            controls.update();
            
            // 移除监听，防止后续加载子 tileset 时重置视角
            tilesRenderer.removeEventListener('load-tileset', onTilesetLoad);
        }
    };
    tilesRenderer.addEventListener('load-tileset', onTilesetLoad);

    // 监听窗口大小变化
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        tilesRenderer.setResolutionFromRenderer(camera, renderer);
    });

    // 动画循环中更新TilesRenderer
    function animate() {
        requestAnimationFrame(animate);
        // 更新OrbitControls
        controls.update();
        tilesRenderer.update();
        renderer.render(scene, camera);
    }
    animate();
})

</script>
