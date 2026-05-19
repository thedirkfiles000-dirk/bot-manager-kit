<!-- src/components/panels/CharacterProgressionPanel.vue -->
<template>
  <panel-wrapper
    title="Progression Phases"
    subtitle="Soft behavioral shifts keyed to narrative arc position rather than message counts. The LLM judges position from tone, beats, and conversation density. Use the optional cue to anchor a shift to a specific moment within a phase."
    :max-width="1200"
  >

    <v-btn
      color="primary"
      size="small"
      class="mb-4"
      prepend-icon="mdi-plus"
      @click="openEditor(null)"
    >
      Add Phase
    </v-btn>

    <v-row density="compact">
      <v-col
        v-for="entry in sortedEntries"
        :key="entry._key"
        cols="12"
        md="6"
        xl="4"
      >
        <v-card class="h-100 pa-4" variant="outlined" hover @click="openEditor(entry._originalIndex)">
          <v-card-title class="d-flex align-center pb-1">
            <v-chip size="small" :color="phaseColor(entry.phase)" variant="tonal" class="mr-2">
              {{ entry.phase?.toUpperCase() || "?" }}
            </v-chip>
            <v-chip size="small" :color="categoryColor(entry.category)" variant="tonal">
              {{ entry.category || "Phase" }} Shift
            </v-chip>
          </v-card-title>
          <v-card-text class="pt-2">
            <div v-if="entry.cue" class="font-italic text-medium-emphasis text-body-2 mb-1">
              cue: {{ entry.cue }}
            </div>
            <div class="text-body-2">{{ entry.description || "No description" }}</div>
          </v-card-text>
          <v-card-actions class="justify-end pt-0">
            <v-btn icon="mdi-delete" size="x-small" color="error" variant="plain" @click.stop="removeEntry(entry._originalIndex)" />
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <div v-if="localEntries.length === 0" class="text-center text-medium-emphasis py-12">
      No progression phases defined yet.
    </div>

    <v-dialog v-model="editorDialog" max-width="600">
      <v-card>
        <v-card-title>{{ editingIndex === null ? "Add" : "Edit" }} Phase</v-card-title>
        <v-card-text>
          <v-row density="compact">
            <v-col cols="12" sm="6">
              <v-select
                v-model="editingEntry.phase"
                :items="phaseOptions"
                label="Phase"
                variant="outlined"
                density="compact"
                hint="Where in the narrative arc this shift belongs"
                persistent-hint
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-select
                v-model="editingEntry.category"
                :items="['Phase', 'Narrative', 'Tone']"
                label="Category"
                variant="outlined"
                density="compact"
                hint="How to classify this shift"
                persistent-hint
              />
            </v-col>
          </v-row>
          <v-text-field
            v-model="editingEntry.cue"
            label="Cue (optional)"
            variant="outlined"
            density="compact"
            class="mt-4"
            hint="Natural-language anchor — e.g. 'after the first emotional confession'"
            persistent-hint
            clearable
          />
          <v-textarea
            v-model="editingEntry.description"
            label="Description"
            variant="outlined"
            density="compact"
            auto-grow
            rows="5"
            class="mt-4"
            hint="What changes when this shift lands — tone, behavior, environment, etc."
            persistent-hint
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeEditor">Cancel</v-btn>
          <v-btn color="primary" variant="tonal" @click="saveEditor" :disabled="!editingEntry.description || !editingEntry.phase">Save</v-btn>
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
import type { ProgressionPhase } from "@/types/botSchema";

const props = defineProps<{
  charPrefix: string;
}>();

interface PhaseRow extends ProgressionPhase {
  _key: string;
  _originalIndex: number;
}

const PHASE_ORDER: Record<string, number> = { early: 0, mid: 1, late: 2 };

const phaseOptions = [
  { title: "Early", value: "early" },
  { title: "Mid", value: "mid" },
  { title: "Late", value: "late" },
];

const phases = useVariantAnyField<ProgressionPhase[]>(
  fieldPath(`${props.charPrefix}.progression_phases`),
  [],
);

const localEntries = ref<PhaseRow[]>([]);

watch(
  phases,
  (newVal) => {
    localEntries.value = (newVal || []).map((row, i) => ({
      ...row,
      _key: `phase-${i}-${Date.now()}`,
      _originalIndex: i,
    }));
  },
  { immediate: true },
);

const sortedEntries = computed(() =>
  [...localEntries.value].sort((a, b) => {
    const pa = PHASE_ORDER[a.phase] ?? 99;
    const pb = PHASE_ORDER[b.phase] ?? 99;
    if (pa !== pb) return pa - pb;
    return a._originalIndex - b._originalIndex;
  }),
);

function phaseColor(phase?: string): string {
  if (phase === "early") return "info";
  if (phase === "mid") return "primary";
  if (phase === "late") return "secondary";
  return "default";
}

function categoryColor(category?: string): string {
  if (category === "Narrative") return "secondary";
  if (category === "Tone") return "warning";
  return "primary";
}

const editorDialog = ref(false);
const editingIndex = ref<number | null>(null);
const editingEntry = ref<ProgressionPhase>({ phase: "early", category: "Phase", description: "" });

function openEditor(index: number | null) {
  editingIndex.value = index;
  if (index === null) {
    editingEntry.value = { phase: "early", category: "Phase", description: "" };
  } else {
    editingEntry.value = JSON.parse(JSON.stringify(localEntries.value[index]));
  }
  editorDialog.value = true;
}

function closeEditor() {
  editorDialog.value = false;
  editingEntry.value = { phase: "early", category: "Phase", description: "" };
  editingIndex.value = null;
}

function saveEditor() {
  const { _key: _k, _originalIndex: _oi, ...clean } = editingEntry.value as PhaseRow;
  // Drop empty cue so we don't persist empty strings.
  if (!clean.cue?.trim()) delete clean.cue;
  if (editingIndex.value === null) {
    const newKey = Date.now().toString();
    const newIdx = localEntries.value.length;
    localEntries.value.push({ ...clean, _key: newKey, _originalIndex: newIdx });
  } else {
    const existing = localEntries.value[editingIndex.value];
    localEntries.value[editingIndex.value] = { ...clean, _key: existing._key, _originalIndex: existing._originalIndex };
  }
  phases.value = localEntries.value.map(({ _key: _k, _originalIndex: _oi, ...rest }) => rest);
  closeEditor();
}

function removeEntry(index: number) {
  localEntries.value.splice(index, 1);
  phases.value = localEntries.value.map(({ _key: _k, _originalIndex: _oi, ...rest }) => rest);
}
</script>
