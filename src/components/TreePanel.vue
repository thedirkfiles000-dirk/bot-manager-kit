<!-- src/components/TreePanel.vue -->
<template>
  <div class="tree-panel h-100 d-flex flex-column ga-3">
    <v-treeview
      :items="computedTreeNodes"
      active-strategy="single-independent"
      activatable
      v-model:activated="activated"
      v-model:opened="openNodes"
      class="flex-grow-1 overflow-y-auto px-2"
      density="comfortable"
      item-value="id"
      item-children="children"
      item-title="title"
      :return-object="false"
    >
      <template #prepend="{ item }">
        <v-icon :color="'primary'">{{ item.icon }}</v-icon>
      </template>

      <template #title="{ item }">
        <div
          class="d-flex align-center text-body-2"
          style="white-space: normal; word-break: break-word"
        >
          <span>{{ item.title }}</span>
        </div>
      </template>
    </v-treeview>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { buildFullTree } from "@/utils/treeBuilder";
import type { TreeNode } from "@/types/treeNode";

const openNodes = defineModel<string[]>("openNodes", { required: true });
const activeNodeId = defineModel<string[] | null>("activeNodeId", {
  default: null,
});

const activated = computed({
  get: () => activeNodeId.value,
  set: (val: string[]) => {
    activeNodeId.value = val;
  },
});

const computedTreeNodes = computed<TreeNode[]>(() => buildFullTree());
</script>

<style scoped>
.tree-panel {
  background: var(--v-surface-base);
  border-right: thin solid var(--v-border-color);
}
</style>
