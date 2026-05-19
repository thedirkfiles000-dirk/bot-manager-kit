<script setup lang="ts">
import { TreeNode } from "@/types/treeNode.ts";

const props = defineProps<{
  activeNode: TreeNode | null;
}>();

</script>

<template>
  <div class="pa-8 overflow-y-auto flex-grow-1 d-flex flex-column">
    <div
      v-if="!activeNode || !activeNode.component"
      class="d-flex flex-column align-center justify-center flex-grow-1 text-center"
    >
      <v-icon size="80" color="grey lighten-1" class="mb-6"
        >mdi-arrow-left-bold-box</v-icon
      >
      <p class="text-h5 text-medium-emphasis">Select a section to edit</p>
      <p class="text-body-2 text-medium-emphasis mt-4">
        Use the tree on the left to navigate and edit bot sections.
      </p>
    </div>

    <component
      v-else
      :is="activeNode.component"
      v-bind="activeNode.props || {}"
      :key="activeNode.id"
    />
  </div>
</template>
