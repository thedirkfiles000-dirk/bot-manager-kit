<!-- src/components/panels/BackgroundLorbookPanel.vue -->
<template>
  <panel-wrapper title="Lorebook" subtitle="Keyword-keyed world facts. When a keyword surfaces in conversation, the associated content gives the LLM grounding. Keep this small — it's a prompt inclusion, not a database." :max-width="1200">

    <v-btn
      color="primary"
      size="small"
      class="mb-4"
      prepend-icon="mdi-plus"
      @click="openEditor(null)"
    >
      Add Entry
    </v-btn>

    <v-row density="compact">
      <v-col
        v-for="(entry, index) in localEntries"
        :key="entry._key"
        cols="12"
        md="6"
        xl="4"
      >
        <v-card class="h-100 pa-4" variant="outlined" hover @click="openEditor(index)">
          <v-card-title class="d-flex align-center">
            <v-icon size="small" class="mr-2" color="secondary">mdi-book-open-variant</v-icon>
            <span class="text-h6 text-truncate">{{ entry.keyword || "No keyword" }}</span>
          </v-card-title>
          <v-card-text class="pt-2 text-body-2">{{ entry.content || "No content" }}</v-card-text>
          <v-card-actions class="pt-4 justify-end">
            <v-btn icon="mdi-delete" size="x-small" color="error" variant="plain" @click.stop="removeEntry(index)" />
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <div v-if="localEntries.length === 0" class="text-center text-medium-emphasis py-12">
      No lorebook entries yet.
    </div>

    <v-dialog v-model="editorDialog" max-width="600">
      <v-card>
        <v-card-title>{{ editingIndex === null ? "Add" : "Edit" }} Lorebook Entry</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="editingEntry.keyword"
            label="Keyword / Topic"
            variant="outlined"
            density="compact"
            class="mb-4"
            hint="The noun or phrase the LLM should recall context for"
            persistent-hint
          />
          <v-textarea
            v-model="editingEntry.content"
            label="Content"
            variant="outlined"
            density="compact"
            auto-grow
            rows="5"
            hint="What the LLM should know when this keyword comes up"
            persistent-hint
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeEditor">Cancel</v-btn>
          <v-btn color="primary" variant="tonal" @click="saveEditor">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </panel-wrapper>
</template>

<script setup lang="ts">
import PanelWrapper from "@/components/PanelWrapper.vue";
import { ref, watch } from "vue";
import { useVariantAnyField } from "@/composables/useVariantAnyField.ts";
import { fieldPath } from "@/types/fieldPath";
import type { LorbookEntry } from "@/types/botSchema";

interface LorbookRow extends LorbookEntry {
  _key: string;
}

const entries = useVariantAnyField<LorbookEntry[]>(
  fieldPath("background.lorebook"),
  [],
);

const localEntries = ref<LorbookRow[]>([]);

watch(
  entries,
  (newVal) => {
    localEntries.value = (newVal || []).map((row, i) => ({
      ...row,
      _key: `lore-${i}-${Date.now()}`,
    }));
  },
  { immediate: true },
);

const editorDialog = ref(false);
const editingIndex = ref<number | null>(null);
const editingEntry = ref<LorbookEntry>({ keyword: "", content: "" });

function openEditor(index: number | null) {
  editingIndex.value = index;
  if (index === null) {
    editingEntry.value = { keyword: "", content: "" };
  } else {
    editingEntry.value = JSON.parse(JSON.stringify(localEntries.value[index]));
  }
  editorDialog.value = true;
}

function closeEditor() {
  editorDialog.value = false;
  editingEntry.value = { keyword: "", content: "" };
  editingIndex.value = null;
}

function saveEditor() {
  const { _key: _k, ...clean } = editingEntry.value as LorbookRow;
  if (editingIndex.value === null) {
    localEntries.value.push({ ...clean, _key: Date.now().toString() });
  } else {
    localEntries.value[editingIndex.value] = { ...clean, _key: localEntries.value[editingIndex.value]._key };
  }
  entries.value = localEntries.value.map(({ _key: _k, ...rest }) => rest);
  closeEditor();
}

function removeEntry(index: number) {
  localEntries.value.splice(index, 1);
  entries.value = localEntries.value.map(({ _key: _k, ...rest }) => rest);
}
</script>
