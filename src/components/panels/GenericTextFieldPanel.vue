<!-- src/components/panels/GenericTextFieldPanel.vue -->
<template>
  <div class="field-wrapper">
    <div class="d-flex align-center justify-start">
      <span class="text-subtitle-1">{{ props.title }}</span>
    </div>
    <v-text-field
      v-model="field"
      variant="outlined"
      density="compact"
      hide-details
      :type="inputType"
      :placeholder="placeholder"
      class="mb-4"
    />

    <div
      class="d-flex justify-space-between align-center text-caption text-medium-emphasis ml-3"
    >
      <div v-if="helperText">{{ helperText }}</div>
      <div v-if="props.showCharCount" class="text-no-wrap">
        {{ fieldLength }} / {{ maxLengthHint }} chars
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useField } from "@/composables/useField.ts";
import { fieldPath } from "@/types/fieldPath";

const props = defineProps<{
  path: string;
  title?: string;
  helperText?: string;
  placeholder?: string;
  /** 'text' (default), 'number', 'password', etc. */
  type?: string;
  showCharCount?: boolean;
  maxLength?: number;
}>();

const field = useField<string | number>(
  fieldPath(props.path),
  props.type === "number" ? 0 : "",
);

const inputType = computed(() => props.type || "text");

// Character count logic (consistent with effective value)
const fieldLength = computed(() => {
  const val = field.value;
  if (typeof val === "number") return val.toString().length;
  return (val ?? "").length;
});

const maxLengthHint = computed(() => {
  return props.maxLength ?? "∞";
});
</script>

<style scoped>
.field-wrapper {
  width: 100%;
}
</style>
