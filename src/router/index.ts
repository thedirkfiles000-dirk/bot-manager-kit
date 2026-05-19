import type { RouteRecordRaw } from "vue-router";
import { createRouter, createWebHistory } from "vue-router";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "home",
    component: () => import("@/views/HomeView.vue"),
  },
  {
    path: "/bot-tree/:botId",
    name: "bot-tree",
    component: () => import("@/views/BotTreeLayout.vue"),
  },
  {
    path: "/raw-bot/:botId",
    name: "raw-bot",
    component: () => import("@/views/RawBotView.vue"),
  },
  {
    path: "/export/:botId",
    name: "copy-station",
    component: () => import("@/views/CopyStationView.vue"),
  },
  {
    path: "/:pathMatch(.*)*",
    name: "not-found",
    component: () => import("@/views/NotFound.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});


export default router;
