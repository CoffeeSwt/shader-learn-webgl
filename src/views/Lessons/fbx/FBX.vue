<template>
  <div class="fbx-container" size-screen>
    <div ref="canvasContainer" size-full class="canvas-container"></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { BasicEngine } from "@/ts/BasicEngine.ts";
//@ts-ignore
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import { Group, Box3, Vector3, Mesh, DoubleSide, PerspectiveCamera, AxesHelper, GridHelper } from "three";
// @ts-ignore
import COLUMN_FBX_URL from "./251129_COLUMN.fbx?url";

const engine = new BasicEngine();
const canvasContainer = ref<HTMLDivElement | null>(null);

const loadFBXModel = async () => {
  const loader = new FBXLoader();
  // 尝试使用 fetch + parse 的方式捕获解析异常（某些 FBX 导出格式会导致解析时抛错）
  try {
    const res = await fetch(COLUMN_FBX_URL);
    const buffer = await res.arrayBuffer();

    // 首先尝试以二进制解析（大多数 FBX 为二进制）
    let object: Group | null = null;
    try {
      // parse 接受 ArrayBuffer 或 字符串
      // @ts-ignore
      object = loader.parse(buffer, COLUMN_FBX_URL) as Group;
    } catch (errBinary) {
      try {
        // 如果二进制解析失败，尝试把 buffer 解为文本（ASCII FBX）再 parse
        const text = new TextDecoder().decode(buffer);
        // @ts-ignore
        object = loader.parse(text, COLUMN_FBX_URL) as Group;
      } catch (errText) {
        console.error("FBX 解析失败（二进制与 ASCII 均失败）:", errBinary, errText);
        return;
      }
    }

    if (!object) {
      console.error("FBX 解析未返回对象");
      return;
    }

    // 成功解析后与之前相同的处理流程
    object.name = "fbxModel";
    engine.addGeometry(object);
    engine.scene.add(new AxesHelper(2));
    engine.scene.add(new GridHelper(20, 20));

    const box = new Box3();
    const temp = new Box3();
    let hasValid = false;
    object.traverse((child) => {
      if ((child as Mesh).isMesh) {
        const mesh = child as Mesh;
        const geom: any = mesh.geometry;
        if (geom && geom.attributes && geom.attributes.position) {
          if (!geom.boundingBox) geom.computeBoundingBox();
          temp.copy(geom.boundingBox).applyMatrix4(mesh.matrixWorld);
          if (!hasValid) {
            box.copy(temp);
            hasValid = true;
          } else {
            box.union(temp);
          }
        }
      }
    });

    if (!hasValid) {
      const cam = engine.camera as any;
      cam.position.set(0, 0, 5);
      cam.lookAt(0, 0, 0);
      return;
    }

    const size = new Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    const targetSize = 5;
    const scaleFactor = maxDim > 0 ? targetSize / maxDim : 1;
    object.scale.setScalar(scaleFactor);
    object.updateMatrixWorld(true);

    const box2 = new Box3();
    const temp2 = new Box3();
    let hasValid2 = false;
    object.traverse((child) => {
      if ((child as Mesh).isMesh) {
        const mesh = child as Mesh;
        const geom: any = mesh.geometry;
        if (geom && geom.attributes && geom.attributes.position) {
          if (!geom.boundingBox) geom.computeBoundingBox();
          temp2.copy(geom.boundingBox).applyMatrix4(mesh.matrixWorld);
          if (!hasValid2) {
            box2.copy(temp2);
            hasValid2 = true;
          } else {
            box2.union(temp2);
          }
        }
      }
    });

    const center = new Vector3();
    box2.getCenter(center);
    const size2 = new Vector3();
    box2.getSize(size2);
    const maxDim2 = Math.max(size2.x, size2.y, size2.z);
    const fitDistance = Math.max(2, maxDim2) * 1.5;

    if (engine.controls) {
      engine.controls.target.copy(center);
      engine.controls.update();
    }

    const cam = engine.camera as PerspectiveCamera;
    cam.far = Math.max(cam.far, fitDistance * 4);
    cam.updateProjectionMatrix();
    cam.position.copy(center.clone().add(new Vector3(0, 0, fitDistance)));
    cam.lookAt(center);

    object.traverse((child) => {
      if ((child as Mesh).isMesh) {
        const mesh = child as Mesh;
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m: any) => (m.side = DoubleSide));
        } else {
          (mesh.material as any).side = DoubleSide;
        }
      }
    });
  } catch (err) {
    console.error("获取 FBX 资源失败:", err);
  }
};

const main = () => {
  engine.init(canvasContainer.value!);
  engine.enableGeometryMode();
  engine.animate();
  loadFBXModel();
};

onMounted(() => {
  main();
});

onUnmounted(() => {
  engine.dispose();
});
</script>

<style scoped>
.fbx-container {
  position: relative;
}
.canvas-container {
  width: 100%;
  height: 100%;
}
</style>
