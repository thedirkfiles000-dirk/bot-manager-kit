<!-- src/components/AppManual.vue -->
<template>
  <v-dialog v-model="open" max-width="860" scrollable>
    <template #activator="{ props }">
      <v-btn v-bind="props" prepend-icon="mdi-book-open-variant" variant="tonal">
        Manual
      </v-btn>
    </template>

    <v-card>
      <v-toolbar color="primary" density="compact">
        <v-toolbar-title>
          <v-icon class="mr-2">mdi-book-open-variant</v-icon>
          Bot Manager — User Manual
        </v-toolbar-title>
        <v-spacer />
        <v-btn icon="mdi-close" @click="open = false" />
      </v-toolbar>

      <v-card-text class="manual-body pa-6">
        <div v-html="renderedManual" />
      </v-card-text>

      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn color="primary" variant="tonal" @click="open = false">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref } from "vue";
import manualSource from "@/data/manual.md?raw";
import { useMarkdownRenderer } from "@/composables/useMarkdownRenderer";

const open = ref(false);
const renderedManual = useMarkdownRenderer(manualSource);
</script>

<style scoped>
.manual-body {
  line-height: 1.75;
  max-height: 78vh;
}

.manual-body :deep(ul),
.manual-body :deep(ol) {
  line-height: 1.85;
  padding-left: 1.5em;
}

.manual-body :deep(h1) {
  font-size: 1.25rem;
  font-weight: 700;
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
}

.manual-body :deep(h1:first-child) {
  margin-top: 0;
}

.manual-body :deep(hr) {
  margin: 1.5rem 0;
  border: none;
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.manual-body :deep(blockquote) {
  border-left: 4px solid rgb(var(--v-theme-warning));
  padding: 0.5rem 1rem;
  margin: 1rem 0;
  background: rgba(var(--v-theme-warning), 0.08);
  border-radius: 4px;
}

.manual-body :deep(blockquote p) {
  margin: 0.25rem 0;
}

.manual-body :deep(code) {
  background: rgba(128, 128, 128, 0.15);
  padding: 1px 5px;
  border-radius: 3px;
  font-size: 0.875em;
}

.manual-body :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 1rem 0;
}

.manual-body :deep(th),
.manual-body :deep(td) {
  padding: 0.5rem 0.75rem;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  text-align: left;
}

.manual-body :deep(th) {
  font-weight: 600;
  background: rgba(var(--v-theme-surface-variant), 0.5);
}

.manual-body :deep(p) {
  margin-bottom: 0.75rem;
}

.manual-body :deep(li) {
  margin-bottom: 0.5rem;
}
</style>
