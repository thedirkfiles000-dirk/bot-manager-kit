<template>
  <v-card variant="outlined" class="mb-6">
    <v-card-title class="d-flex align-center ga-2 pb-2">
      <v-icon v-if="state.target.icon" :icon="state.target.icon" size="20" />
      {{ state.target.name }}
    </v-card-title>

    <v-card-text>
      <!-- Mask toggle row -->
      <div class="d-flex align-center flex-wrap ga-3 mb-4">
        <v-btn
          variant="outlined"
          color="secondary"
          size="small"
          @click="maskExpanded = !maskExpanded"
        >
          Mask Sections
          <v-badge
            v-if="state.masking.maskedCount.value > 0"
            :content="state.masking.maskedCount.value"
            color="error"
            inline
          />
          <v-icon :icon="maskExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down'" end />
        </v-btn>
      </div>

      <!-- Inline masking treeview (collapsible) -->
      <v-expand-transition>
        <div v-show="maskExpanded" class="mb-4">
          <v-card variant="tonal" class="pa-2">
            <div style="max-height: 300px; overflow-y: auto">
              <v-treeview
                :items="state.masking.treeItems.value"
                v-model:selected="maskSelected"
                v-model:opened="state.masking.opened.value"
                selectable
                select-strategy="independent"
                item-title="name"
                item-value="id"
                item-children="children"
                density="compact"
              >
                <template #title="{ item }">
                  <span :class="{ 'text-disabled font-italic': state.masking.isExcluded(item.id) }">
                    {{ item.name }}
                  </span>
                </template>
              </v-treeview>
            </div>
            <div class="d-flex justify-end mt-2">
              <v-btn size="small" color="error" variant="text" @click="state.masking.resetMask()">
                Reset All
              </v-btn>
            </div>
          </v-card>
        </div>
      </v-expand-transition>

      <!-- Copy field list -->
      <v-divider class="mb-3" />
      <copy-button
        v-for="field in visibleFields"
        :key="field.id"
        :field="field"
        :context="state.context.value"
        :copied="state.copiedFields.value.has(field.id)"
        @copied="onFieldCopied"
        class="mb-1"
      />
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { TargetState } from "@/composables/useCopyStation";

import CopyButton from "@/components/CopyButton.vue";

const props = defineProps<{
  state: TargetState;
}>();

const maskExpanded = ref(false);

/** IDs of fields that should be hidden when their extract yields nothing useful. */
const HIDEABLE_FIELDS = new Set(['polybuzz-background', 'polybuzz-dialog', 'hotchatbots-background']);

function isEmptyExtract(text: string): boolean {
  const trimmed = text.trim();
  return !trimmed || trimmed === '{}' || trimmed === '[]' || trimmed === 'undefined' || trimmed === 'null';
}

const visibleFields = computed(() =>
  props.state.target.fields.filter((field) => {
    if (!HIDEABLE_FIELDS.has(field.id)) return true;
    return !isEmptyExtract(field.extract(props.state.context.value));
  }),
);

// Bridge maskedIds between masking composable and v-treeview v-model
const maskSelected = computed({
  get: () => props.state.masking.maskedIds.value,
  set: (val: string[]) => {
    props.state.masking.maskedIds.value = val;
  },
});

function onFieldCopied(fieldId: string) {
  props.state.copiedFields.value = new Set([...props.state.copiedFields.value, fieldId]);
}

// Reset checkmarks if format/capsKeys change (context changes)
watch(
  () => [props.state.context.value.format, props.state.context.value.capsKeys],
  () => {
    props.state.copiedFields.value = new Set();
  },
);
</script>
