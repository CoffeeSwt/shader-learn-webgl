<template>
    <div size-screen>
        <div w-200 h-100 ref="canvasTarget"></div>
    </div>

</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { BasicEngine } from "@/ts/BasicEngine"
import { BasicObjGenerator } from '@/ts/BasicObjGenerator';
import { Color, Vector3 } from 'three';

const canvasTarget = ref<HTMLDivElement | null>(null);
const engine = new BasicEngine()

const main = () => {
    engine.init(canvasTarget.value!)
    engine.animate()

    engine.addObj(BasicObjGenerator.createBasicBox(new Vector3(2, 2, 2),
        new Color(0, 0.6, 0),
        new Vector3(0, 0, 0)
    ))

}

onMounted(() => {
    main();
});

onUnmounted(() => {
    engine.dispose();
});


</script>

<style scoped></style>