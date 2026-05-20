<!-- src/components/panels/ItemListPanel.vue -->
<template>
  <panel-wrapper :title="title" :max-width="900" bordered>
    <item-list-combo
      v-model="field"
      :label="title"
      :helper-text="helperText"
      list-max-height="60vh"
      :show-add-button="true"
      :prevent-duplicates="preventDuplicates"
      :prefill-items="prefillItems"
      :prefill-button-label="prefillButtonLabel"
      :show-clear-button="true"
    >
      <template v-if="$slots['empty-state']" #empty-state>
        <slot name="empty-state" />
      </template>
    </item-list-combo>
  </panel-wrapper>
</template>

<script setup lang="ts">
import PanelWrapper from "@/components/PanelWrapper.vue";
import ItemListCombo from "@/components/ItemListCombo.vue";
import { useField } from "@/composables/useField.ts";
import { fieldPath } from "@/types/fieldPath";

const props = defineProps<{
  path: string;
  title: string;
  helperText?: string;
  preventDuplicates?: boolean;
  prefillItems?: string[];
  prefillButtonLabel?: string;
}>();

const field = useField<string[]>(fieldPath(props.path), []);
</script>
