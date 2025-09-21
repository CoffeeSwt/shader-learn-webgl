<template>
    <div size-screen>
        <div size-full ref="canvasTarget"></div>
    </div>

</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { BasicEngine } from "@/ts/BasicEngine"
import { BasicObjGenerator } from '@/ts/BasicObjGenerator';
import { MaterialGenerator } from '@/ts/MaterialGenerator';
import { Color, Vector3 } from 'three';
import fragmentShader from '@/views/HelloShader/fragmentShader.glsl?raw'
import vertexShader from '@/views/HelloShader/vertexShader.glsl?raw'

const canvasTarget = ref<HTMLDivElement | null>(null);
const engine = new BasicEngine()

engine.animate()

const plane = BasicObjGenerator.createScreenShaderPlane(
    vertexShader, fragmentShader, engine.getUniforms()
)
engine.addObj(plane)

const main = () => {
    engine.init(canvasTarget.value!)

}

onMounted(() => {
    main();
});

onUnmounted(() => {
    engine.dispose();
});


</script>

<style scoped></style>