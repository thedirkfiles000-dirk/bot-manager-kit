<!-- src/components/panels/ItemListPanel.vue -->
<template>
  <panel-wrapper :title="title" :max-width="900" bordered>
    <template #actions>
      <override-badges :path="props.path" />
    </template>

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
import { useVariantAnyField } from "@/composables/useVariantAnyField.ts";
import { fieldPath } from "@/types/fieldPath";
import OverrideBadges from "@/components/OverrideBadges.vue";

const props = defineProps<{
  path: string;
  title: string;
  helperText?: string;
  preventDuplicates?: boolean;
  prefillItems?: string[];
  prefillButtonLabel?: string;
}>();

const field = useVariantAnyField<string[]>(fieldPath(props.path), []);
</script>
