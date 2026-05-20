<!-- src/components/panels/GenericNumberFieldPanel.vue -->
<template>
  <div class="field-wrapper">
    <div class="d-flex align-center justify-start">
      <span class="text-subtitle-1">{{ props.title }}</span>
    </div>
    <v-text-field
      v-model="fieldValue"
      variant="outlined"
      density="compact"
      hide-details
      type="number"
      :placeholder="placeholder"
      class="mb-4"
    />

    <div v-if="helperText" class="text-caption text-medium-emphasis ml-3">
      {{ helperText }}
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
  /** Default fallback if unset (defaults to 25 for age, but overridable) */
  defaultValue?: number;
}>();

const rawField = useField<number>(fieldPath(props.path), props.defaultValue ?? 25);

const fieldValue = computed({
  get(): string {
    const val = rawField.value;
    // Display as string for v-text-field (type=number accepts string)
    return val === undefined || val === null || val === 0 ? "" : String(val);
  },
  set(newVal: string) {
    if (newVal === "" || newVal === null) {
      rawField.value = props.defaultValue ?? 25;
      return;
    }
    const num = Number(newVal);
    rawField.value = isNaN(num) ? (props.defaultValue ?? 25) : num;
  },
});
</script>

<style scoped>
.field-wrapper {
  width: 100%;
}
</style>
