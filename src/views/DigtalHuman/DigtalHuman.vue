<template>
  <div class="digital-human-container" size-screen>
    <div ref="canvasContainer" size-full class="canvas-container"></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { BasicEngine } from "@/ts/BasicEngine.ts";
//@ts-ignore
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import { Group, Box3, Vector3, Mesh, Material, TextureLoader } from "three";

const engine = new BasicEngine()
const canvasContainer = ref<HTMLDivElement | null>(null)

const loadFBXModel = async () => {
  const loader = new FBXLoader();
  const texturesUrl = new URL(
    "../../assets/neurosama-3d-vtuber-v2/textures/",
    import.meta.url
  ).href;
  const modelUrl = new URL(
    "../../assets/neurosama-3d-vtuber-v2/source/neurosama fbx ver.fbx",
    import.meta.url
  ).href;

  // 指定贴图资源路径，便于FBXLoader正确解析外部纹理
  loader.setResourcePath(texturesUrl);

  loader.load(
    modelUrl,
    (object: Group) => {
      object.name = "digitalHuman";
      // 根据模型尺寸进行适当缩放（可视情况调整）
      object.scale.set(0.01, 0.01, 0.01);
      engine.addGeometry(object);

      // 为材质建立纹理映射（根据材质/网格名称的关键词匹配）
      const tl = new TextureLoader(loader.manager);
      const tex = {
        body: new URL("../../assets/neurosama-3d-vtuber-v2/textures/Neurosama_body.png", import.meta.url).href,
        clothes: new URL("../../assets/neurosama-3d-vtuber-v2/textures/clothes_neurosama.png", import.meta.url).href,
        skirt: new URL("../../assets/neurosama-3d-vtuber-v2/textures/neuro_skirt.png", import.meta.url).href,
        shoes: new URL("../../assets/neurosama-3d-vtuber-v2/textures/shoes.png", import.meta.url).href,
        cape: new URL("../../assets/neurosama-3d-vtuber-v2/textures/neurosama_cape.png", import.meta.url).href,
        accessories: new URL("../../assets/neurosama-3d-vtuber-v2/textures/neuro_accesories.png", import.meta.url).href,
        hairMain: new URL("../../assets/neurosama-3d-vtuber-v2/textures/Back_hair_main.png", import.meta.url).href,
        hairSideFront: new URL("../../assets/neurosama-3d-vtuber-v2/textures/side-front_hair_neurosama.png", import.meta.url).href,
        expressions: new URL("../../assets/neurosama-3d-vtuber-v2/textures/neuroexpresions.png", import.meta.url).href,
      };

      const pickTexture = (name: string): string | null => {
        const n = name.toLowerCase();
        if (n.includes("hair")) return tex.hairMain;
        if (n.includes("side") && n.includes("hair")) return tex.hairSideFront;
        if (n.includes("body")) return tex.body;
        if (n.includes("cloth")) return tex.clothes;
        if (n.includes("skirt")) return tex.skirt;
        if (n.includes("shoe")) return tex.shoes;
        if (n.includes("cape")) return tex.cape;
        if (n.includes("accessor")) return tex.accessories;
        if (n.includes("express")) return tex.expressions;
        return null;
      };

      object.traverse((child) => {
        if ((child as Mesh).isMesh) {
          const mesh = child as Mesh;
          const materials: Material[] = Array.isArray(mesh.material)
            ? mesh.material
            : [mesh.material];
          materials.forEach((m) => {
            const name = (m as any).name || mesh.name || "";
            const url = pickTexture(name) || tex.body; // 默认给 body 纹理作为兜底
            if (url) {
              const texture = tl.load(url);
              (m as any).map = texture;
              (m as any).needsUpdate = true;
            }
          });
        }
      });

      // 计算包围盒，便于设置相机与控制器焦点
      const box = new Box3().setFromObject(object);
      const center = new Vector3();
      box.getCenter(center);
      const size = new Vector3();
      box.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z);
      const fitDistance = maxDim * 1.5; // 摄像机距离对象的合适比例

      // 设置控制器焦点为模型中心
      if (engine.controls) {
        engine.controls.target.copy(center);
        engine.controls.update();
      }

      // 调整相机位置以完整看到模型
      const cam = engine.camera as any;
      cam.position.copy(center.clone().add(new Vector3(0, 0, fitDistance)));
      cam.lookAt(center);
    },
    undefined,
    (error:any) => {
      console.error("FBX 模型加载失败:", error);
    }
  );
}

const main = () => {
  engine.init(canvasContainer.value!);
  engine.enableGeometryMode();
  engine.animate();
  loadFBXModel();
}

onMounted(() => {
  main();
});

onUnmounted(() => {
  engine.dispose();
});

</script>
