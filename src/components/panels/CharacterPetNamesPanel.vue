<!-- src/components/panels/CharacterPetNamesPanel.vue -->
<template>
  <panel-wrapper
    title="Pet Names"
    subtitle="Terms of address this character uses for the user, with optional conditions for when each applies."
  >

    <v-btn
      color="primary"
      size="small"
      class="mb-4"
      prepend-icon="mdi-plus"
      @click="openEditor(null)"
    >
      Add Pet Name
    </v-btn>

    <v-row density="compact">
      <v-col
        v-for="(entry, index) in localEntries"
        :key="entry._key"
        cols="12"
        sm="6"
        md="4"
      >
        <v-card class="h-100 pa-3" variant="outlined" hover @click="openEditor(index)">
          <v-card-title class="text-h6 pb-1">{{ entry.name || "Unnamed" }}</v-card-title>
          <v-card-text class="text-body-2 text-medium-emphasis pt-0">
            {{ entry.trigger || "Always" }}
          </v-card-text>
          <v-card-actions class="justify-end pt-0">
            <v-btn icon="mdi-delete" size="x-small" color="error" variant="plain" @click.stop="removeEntry(index)" />
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <div v-if="localEntries.length === 0" class="text-center text-medium-emphasis py-12">
      No pet names defined yet.
    </div>

    <v-dialog v-model="editorDialog" max-width="480">
      <v-card>
        <v-card-title>{{ editingIndex === null ? "Add" : "Edit" }} Pet Name</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="editingEntry.name"
            label="Term of Address"
            variant="outlined"
            density="compact"
            class="mb-4"
            placeholder="e.g., little wolf, darling"
          />
          <v-text-field
            v-model="editingEntry.trigger"
            label="When Used (optional)"
            variant="outlined"
            density="compact"
            placeholder="e.g., When alone together, When angry, Always"
            hint="Leave blank if this is the default term"
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
import { useField } from "@/composables/useField.ts";
import { fieldPath } from "@/types/fieldPath";
import type { PetNameEntry } from "@/types/botSchema";

const props = defineProps<{
  charPrefix: string;
}>();

interface PetNameRow extends PetNameEntry {
  _key: string;
}

const entries = useField<PetNameEntry[]>(
  fieldPath(`${props.charPrefix}.pet_names`),
  [],
);

const localEntries = ref<PetNameRow[]>([]);

watch(
  entries,
  (newVal) => {
    localEntries.value = (newVal || []).map((row, i) => ({
      ...row,
      _key: `pet-${i}-${Date.now()}`,
    }));
  },
  { immediate: true },
);

const editorDialog = ref(false);
const editingIndex = ref<number | null>(null);
const editingEntry = ref<PetNameEntry>({ name: "" });

function openEditor(index: number | null) {
  editingIndex.value = index;
  if (index === null) {
    editingEntry.value = { name: "" };
  } else {
    editingEntry.value = JSON.parse(JSON.stringify(localEntries.value[index]));
  }
  editorDialog.value = true;
}

function closeEditor() {
  editorDialog.value = false;
  editingEntry.value = { name: "" };
  editingIndex.value = null;
}

function saveEditor() {
  const { _key: _k, ...clean } = editingEntry.value as PetNameRow;
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
