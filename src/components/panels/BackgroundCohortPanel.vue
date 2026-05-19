<!-- src/components/panels/BackgroundCohortPanel.vue -->
<template>
  <panel-wrapper title="Cohort" subtitle="Supporting cast — named NPCs and recurring background figures. Not full characters, just enough for the LLM to recall them consistently." :max-width="1200">

    <v-btn
      color="primary"
      size="small"
      class="mb-4"
      prepend-icon="mdi-plus"
      @click="openEditor(null)"
    >
      Add Cohort Member
    </v-btn>

    <v-row density="comfortable">
      <v-col
        v-for="(entry, index) in localCohorts"
        :key="entry._key"
        cols="12"
        md="6"
        xl="4"
      >
        <v-card class="h-100 pa-4" variant="outlined" hover @click="openEditor(index)">
          <v-card-title class="d-flex align-center justify-start">
            <span class="text-h6 text-truncate pr-2">{{ entry.name || "Unnamed" }}</span>
          </v-card-title>
          <v-card-subtitle v-if="entry.role" class="pt-2">{{ entry.role }}</v-card-subtitle>
          <v-card-text class="pt-2 text-body-2">
            <div v-if="entry.signature" class="font-italic mb-1 text-medium-emphasis">{{ entry.signature }}</div>
            <div>{{ entry.notes || "No notes" }}</div>
          </v-card-text>
          <v-card-actions class="pt-4 justify-end">
            <v-btn icon="mdi-delete" size="x-small" color="error" variant="plain" @click.stop="removeEntry(index)" />
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <div v-if="localCohorts.length === 0" class="text-center text-medium-emphasis py-12">
      No cohort members defined yet.
    </div>

    <v-dialog v-model="editorDialog" max-width="600">
      <v-card>
        <v-card-title>{{ editingIndex === null ? "Add" : "Edit" }} Cohort Member</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="editingEntry.name"
            label="Name"
            variant="outlined"
            density="compact"
            class="mb-4"
          />
          <v-text-field
            v-model="editingEntry.role"
            label="Role (optional)"
            variant="outlined"
            density="compact"
            class="mb-4"
          />
          <v-text-field
            v-model="editingEntry.signature"
            label="Signature Trait (optional)"
            variant="outlined"
            density="compact"
            class="mb-4"
            hint="One memorable physical or behavioral detail"
            persistent-hint
          />
          <v-textarea
            v-model="editingEntry.notes"
            label="Notes"
            variant="outlined"
            density="compact"
            auto-grow
            rows="4"
            class="mb-4"
          />
          <item-list-combo
            v-model="surfacingRulesModel"
            label="Surfacing Rules"
            helper-text="Conditional guidance for when this cohort member should appear or be referenced. Use If/When phrasing (e.g. &quot;When Emily is sad, Linda comes over&quot;)."
            :show-add-button="true"
            :prevent-duplicates="true"
            :show-clear-button="true"
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
import { computed, ref, watch } from "vue";
import { useVariantAnyField } from "@/composables/useVariantAnyField.ts";
import { fieldPath } from "@/types/fieldPath";
import type { CohortEntry } from "@/types/botSchema";
import ItemListCombo from "@/components/ItemListCombo.vue";

interface CohortRow extends CohortEntry {
  _key: string;
}

const cohorts = useVariantAnyField<CohortEntry[]>(
  fieldPath("background.cohorts"),
  [],
);

const localCohorts = ref<CohortRow[]>([]);

watch(
  cohorts,
  (newVal) => {
    localCohorts.value = (newVal || []).map((row, i) => ({
      ...row,
      _key: `cohort-${i}-${Date.now()}`,
    }));
  },
  { immediate: true },
);

const editorDialog = ref(false);
const editingIndex = ref<number | null>(null);
const editingEntry = ref<CohortEntry>({ name: "", notes: "", surfacing_rules: [] });

const surfacingRulesModel = computed<string[]>({
  get: () => editingEntry.value.surfacing_rules ?? [],
  set: (v) => { editingEntry.value.surfacing_rules = v; },
});

function openEditor(index: number | null) {
  editingIndex.value = index;
  if (index === null) {
    editingEntry.value = { name: "", notes: "", surfacing_rules: [] };
  } else {
    const cloned = JSON.parse(JSON.stringify(localCohorts.value[index])) as CohortEntry;
    if (!cloned.surfacing_rules) cloned.surfacing_rules = [];
    editingEntry.value = cloned;
  }
  editorDialog.value = true;
}

function closeEditor() {
  editorDialog.value = false;
  editingEntry.value = { name: "", notes: "", surfacing_rules: [] };
  editingIndex.value = null;
}

function saveEditor() {
  const { _key: _k, ...clean } = editingEntry.value as CohortRow;
  if (editingIndex.value === null) {
    localCohorts.value.push({ ...clean, _key: Date.now().toString() });
  } else {
    localCohorts.value[editingIndex.value] = { ...clean, _key: localCohorts.value[editingIndex.value]._key };
  }
  cohorts.value = localCohorts.value.map(({ _key: _k, ...rest }) => rest);
  closeEditor();
}

function removeEntry(index: number) {
  localCohorts.value.splice(index, 1);
  cohorts.value = localCohorts.value.map(({ _key: _k, ...rest }) => rest);
}
</script>
