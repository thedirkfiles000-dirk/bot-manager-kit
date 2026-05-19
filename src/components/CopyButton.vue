<template>
  <div>
    <div class="d-flex align-center w-100 copy-row">
      <span class="text-body-2 flex-grow-1">{{ field.label }}</span>
      <span class="text-body-2 text-medium-emphasis mr-3">{{ charCount.toLocaleString() }} chars</span>

      <v-btn
        icon="mdi-eye"
        size="x-small"
        variant="text"
        @click="viewOpen = true"
        title="View content"
        class="mr-1"
      />

      <v-btn
        size="small"
        :color="copied ? 'success' : 'primary'"
        :variant="copied ? 'tonal' : 'outlined'"
        @click="doCopy"
        min-width="72"
      >
        <v-icon :icon="copied ? 'mdi-check' : 'mdi-content-copy'" size="16" class="mr-1" />
        {{ copied ? "Copied" : "Copy" }}
      </v-btn>
    </div>

    <!-- View dialog -->
    <v-dialog v-model="viewOpen" max-width="720" scrollable>
      <v-card>
        <v-card-title class="d-flex align-center">
          {{ field.label }}
          <v-spacer />
          <span class="text-body-2 text-medium-emphasis mr-2">{{ charCount.toLocaleString() }} chars</span>
          <v-btn icon="mdi-close" variant="text" size="small" @click="viewOpen = false" />
        </v-card-title>

        <v-divider />

        <div v-if="isMarkdown" class="d-flex justify-end px-4 pt-2">
          <v-btn-toggle v-model="viewMode" density="compact" variant="outlined" color="primary" mandatory>
            <v-btn value="raw">Raw</v-btn>
            <v-btn value="rendered">Rendered</v-btn>
          </v-btn-toggle>
        </div>

        <v-card-text class="view-content">
          <pre v-if="viewMode === 'raw'" class="text-body-2 font-monospace view-raw"><code>{{ fieldText }}</code></pre>
          <div v-else class="view-rendered" v-html="renderedHtml" />
        </v-card-text>

        <v-divider />

        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" variant="outlined" @click="doCopy(); viewOpen = false">
            <v-icon icon="mdi-content-copy" size="16" class="mr-1" />
            Copy
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import type { ExportField, ExportContext } from "@/types/exportTarget";
import { renderMarkdown } from "@/composables/useMarkdownRenderer";

const props = defineProps<{
  field: ExportField;
  context: ExportContext;
  copied: boolean;
}>();

const emit = defineEmits<{
  copied: [fieldId: string];
}>();

const viewOpen = ref(false);
const viewMode = ref<"raw" | "rendered">("raw");

const fieldText = computed(() => props.field.extract(props.context));
/** Count chars as they'll appear after paste — Windows clipboard normalizes \n → \r\n */
const charCount = computed(() => {
  const text = fieldText.value
  const newlines = (text.match(/\n/g) ?? []).length
  return text.length + newlines
});
const isMarkdown = computed(() => props.context.format === "asMarkdown");
const renderedHtml = computed(() => renderMarkdown(fieldText.value));

async function doCopy() {
  await writeText(fieldText.value);
  emit("copied", props.field.id);
}
</script>

<style scoped>
.copy-row {
  min-height: 40px;
}
.view-content {
  max-height: 60vh;
  overflow-y: auto;
}
.view-raw {
  white-space: pre-wrap;
  word-break: break-word;
}
.view-rendered {
  line-height: 1.6;
}
</style>
