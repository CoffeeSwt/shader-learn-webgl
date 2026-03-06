import type { RouteRecordRaw } from "vue-router";

export const routes: Array<RouteRecordRaw> = [
  { path: "/", redirect: "/home" },

  { path: "/home", name: "Home", component: () => import("@/views/Home.vue") },
  // { path: "/demo", name: "Demo", component: () => import("@/views/Demo.vue") },
  {
    path: "/hello-shader",
    name: "HelloShader",
    component: () => import("@/views/HelloShader/HelloShader.vue"),
  },
  {
    path: "/lessons/l1",
    name: "L1",
    component: () => import("@/views/Lessons/l1/L1.vue"),
  },
  {
    path: "/lessons/l2",
    name: "L2",
    component: () => import("@/views/Lessons/l2/L2.vue"),
  },
  {
    path: "/lessons/l3",
    name: "L3",
    component: () => import("@/views/Lessons/l3/L3.vue"),
  },
  {
    path: "/lessons/l4",
    name: "BlackHole",
    component: () => import("@/views/Lessons/l4/L4.vue"),
  },
  {
    path: "/lessons/l5",
    name: "Rain",
    component: () => import("@/views/Lessons/l5/L5.vue"),
  },
  {
    path: "/lessons/fbx",
    name: "FBX",
    component: () => import("@/views/Lessons/fbx/FBX.vue"),
  },
  {
    path: "/trae",
    name: "Trae",
    component: () => import("@/views/Trae/Trae.vue"),
  },
  // 分形艺术相关路由
  {
    path: "/fractal-intro",
    name: "FractalIntro",
    component: () => import("@/views/FractalIntro.vue"),
  },
  {
    path: "/fractal-examples",
    name: "FractalExamples",
    component: () => import("@/views/Trae/Trae.vue"),
  },
  {
    path: "/digital-human",
    name: "DigitalHuman",
    component: () => import("@/views/DigtalHuman/DigtalHuman.vue"),
  },
];
