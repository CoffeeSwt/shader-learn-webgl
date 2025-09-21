<template>
  <div size-screen flex-center gap-10>
    <template v-for="route in routesRendered" :key="route.path">
      <div @click="routeTo(route.path)" class="hover-line" text-gray-400 hover:text-gray-600 cursor-pointer font-mono
        text-4xl duration-300>
        {{ route.name }}
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const routesRendered = computed(() => router.getRoutes().filter(route => {
  if (route.path === '/' || route.path === '/home') {
    return false;
  }
  return true;
}));

const routeTo = (path: string) => {
  router.push(path);
}

</script>

<style scoped>
.hover-line {
  position: relative;
  display: inline-block;
}

.hover-line::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: -3px;
  /* 调整线条距离文字的间距 */
  width: 0;
  height: 2px;
  /* 线条的高度 */
  background-color: currentColor;
  /* 使用文字颜色 */
  transition: width 0.3s ease-in-out;
  /* 动画效果 */
}

.hover-line:hover::after {
  width: 100%;
  /* 在 hover 时展开线条 */
}

.hover-line:not(:hover)::after {
  width: 0;
  /* 离开 hover 时收回线条 */
}
</style>
