<!-- src/components/panels/GenericTextareaPanel.vue -->
<template>
  <panel-wrapper :title="title || capitalized" :max-width="900" bordered>
    <v-textarea
      v-model="field"
      variant="outlined"
      auto-grow
      rows="6"
      row-height="24"
      hide-details
      class="mb-4"
    />

    <div class="d-flex justify-space-between align-center text-caption text-medium-emphasis">
      <div v-if="helperText">{{ helperText }}</div>
      <div v-if="props.showCharCount" class="text-no-wrap">
        {{ fieldLength }} chars
      </div>
    </div>
  </panel-wrapper>
</template>

<script setup lang="ts">
import PanelWrapper from "@/components/PanelWrapper.vue";
import { computed } from "vue";
import { useField } from "@/composables/useField.ts";
import { fieldPath } from "@/types/fieldPath";

const props = defineProps<{
  path: string; // Required dot-path e.g. "greeting" or "background.meta.continuity_rules"
  title?: string; // Optional override title
  helperText?: string; // Optional helper
  showCharCount?: boolean;
}>();

const field = useField<string>(fieldPath(props.path), "");

// Character count (reflects the effective value after rating overrides)
const fieldLength = computed(() => {
  return (field.value ?? "").length;
});

// Simple capitalize filter (computed for reactivity if needed)
const capitalized = computed(() => {
  if (!props.title && props.path) {
    const parts = props.path.split(".").pop()!.replace(/_/g, " ");
    return parts.charAt(0).toUpperCase() + parts.slice(1);
  }
  return props.title || "";
});
</script>
