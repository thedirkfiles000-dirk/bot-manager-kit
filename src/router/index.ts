import type { RouteLocationNormalized, RouteRecordRaw } from "vue-router";
import { createRouter, createWebHistory } from "vue-router";
import { useActiveSchemaStore } from "@/stores/activeSchemaStore";
import { discoverSchemas } from "@/utils/schemaLoader";

/**
 * Ensure activeSchemaStore.active matches the :schemaName route param.
 * Called by every schema-scoped route's beforeEnter guard. If the URL names
 * a schema that wasn't yet loaded (deep-link, refresh), we rediscover and
 * activate it on the fly.
 */
async function ensureSchemaActive(to: RouteLocationNormalized) {
  const schemaName = to.params.schemaName as string | undefined;
  if (!schemaName) return { name: "picker" };

  const store = useActiveSchemaStore();
  if (store.active?.name === schemaName) return true;

  // Rebuild the available list if empty (e.g. deep-link refresh) so we can
  // find the schema the URL is pointing at.
  if (store.available.length === 0) {
    store.setAvailable(await discoverSchemas());
  }

  const meta = store.available.find((m) => m.name === schemaName);
  if (!meta) return { name: "picker" };

  store.setActive(meta);
  return true;
}

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "picker",
    component: () => import("@/views/SchemaPickerView.vue"),
  },
  {
    path: "/s/:schemaName",
    name: "schema-home",
    component: () => import("@/views/HomeView.vue"),
    beforeEnter: ensureSchemaActive,
  },
  {
    path: "/s/:schemaName/b/:botId/edit",
    name: "bot-tree",
    component: () => import("@/views/BotTreeLayout.vue"),
    beforeEnter: ensureSchemaActive,
  },
  {
    path: "/s/:schemaName/b/:botId/raw",
    name: "raw-bot",
    component: () => import("@/views/RawBotView.vue"),
    beforeEnter: ensureSchemaActive,
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
