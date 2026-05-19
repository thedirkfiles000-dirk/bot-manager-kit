<!-- src/components/ExportMasker.vue -->
<template>
  <!-- Activator slot: parent places the button wherever needed -->
  <slot
    name="activator"
    :open="openDialog"
    :masked-count="maskedCount"
    :reset="resetMask"
  />

  <!-- Masking Dialog -->
  <v-dialog v-model="openMaskDialog" max-width="900px" persistent>
    <v-card>
      <v-card-title class="text-h6">
        Mask Sections for Export
        <v-chip v-if="maskedCount > 0" class="ml-3" color="error" size="small">
          {{ maskedCount }}
        </v-chip>
      </v-card-title>
      <v-card-text>
        <p class="mb-4">
          Check nodes to exclude them <strong>and all sub-nodes</strong> from
          the exported content. This only affects the copy/export — the original
          bot data is unchanged.
        </p>

        <div style="max-height: 60vh; overflow-y: auto">
          <v-treeview
            :items="treeItems"
            v-model:selected="maskedIds"
            v-model:opened="opened"
            selectable
            select-strategy="independent"
            item-title="name"
            item-value="id"
            item-children="children"
            density="compact"
          >
            <template #title="{ item }">
              <span
                :class="{ 'text-disabled font-italic': isExcluded(item.id) }"
              >
                {{ item.name }}
              </span>
            </template>
          </v-treeview>
        </div>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn color="error" variant="text" @click="resetMask">
          Reset All
        </v-btn>
        <v-btn color="primary" @click="closeDialog"> Close </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useJsonMasking } from "@/composables/useJsonMasking";

const props = defineProps<{
  /** The pre-mask export-ready JSON object (must contain a stable `id` string for persistence) */
  baseObject: Record<string, any> | undefined;
  /** Unique identifier for this exporter type (e.g., "polybuzz", "hotchat", "sillytavern") */
  suffix: string;
  /** Optional display name for the root node in the tree */
  rootName?: string;
}>();

// Internal dialog state
const openMaskDialog = ref(false);
const openDialog = () => (openMaskDialog.value = true);
const closeDialog = () => (openMaskDialog.value = false);

// Use the composable (now simplified – it receives the bound/local ref directly)
const {
  treeItems,
  isExcluded,
  maskedObject,
  resetMask,
  opened,
  maskedCount,
  maskedIds
} = useJsonMasking({
  baseObject: computed(() => props.baseObject),
  suffix: props.suffix,
  rootName: props.rootName ?? "Export Root",
});

// Expose key items for parent ref access
defineExpose({
  maskedObject,
  resetMask,
  maskedCount,
  openDialog,
  closeDialog,
});
</script>

<style scoped>
/* Optional styling tweaks if needed */
</style>
