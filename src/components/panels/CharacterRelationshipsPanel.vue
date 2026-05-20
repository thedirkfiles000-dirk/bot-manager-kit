<!-- src/components/panels/CharacterRelationshipsPanel.vue -->
<template>
  <panel-wrapper title="Relationships" subtitle="General relationship patterns and specific known relationships." :max-width="1200">

    <!-- Relationship History -->
    <v-row class="mb-6">
      <v-col cols="12">
        <generic-textarea-panel
          :path="`${props.charPrefix}.relationship_history`"
          title="Relationship History"
          helper-text="General past relationship patterns (complements specific relationships)."
          rows="6"
        />
      </v-col>
    </v-row>

    <!-- Relationships Cards Grid -->
    <v-btn
      color="primary"
      size="small"
      class="mb-4"
      prepend-icon="mdi-plus"
      @click="openEditor(null)"
    >
      Add Relationship
    </v-btn>
    <v-row density="compact">
      <v-col
        v-for="(rel, index) in localRelationships"
        :key="rel.id || index"
        cols="12"
        md="6"
        xl="4"
      >
        <v-card
          class="h-100 pa-4"
          variant="outlined"
          hover
          @click="openEditor(index)"
        >
          <v-card-title class="d-flex align-center justify-start">
            <span class="text-h6 text-truncate pr-2">
              {{ rel.name || "Unnamed Relationship" }}
            </span>
          </v-card-title>
          <v-card-subtitle class="pt-2">
            {{ rel.role || "No role specified" }}
          </v-card-subtitle>
          <v-card-text class="pt-2 text-body-2">
            {{ rel.notes || "No notes" }}
          </v-card-text>
          <v-card-actions class="pt-4 justify-end">
            <v-btn
              icon="mdi-delete"
              size="x-small"
              color="error"
              variant="plain"
              @click.stop="removeRelationship(index)"
            />
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <div
      v-if="localRelationships.length === 0"
      class="text-center text-medium-emphasis py-12"
    >
      No relationships defined yet.
    </div>

    <!-- Editor Dialog -->
    <v-dialog v-model="editorDialog" max-width="600">
      <v-card>
        <v-card-title>
          {{ editingIndex === null ? "Add" : "Edit" }} Relationship
        </v-card-title>
        <v-card-text>
          <v-text-field
            v-model="editingRel.name"
            label="Name"
            variant="outlined"
            density="compact"
            class="mb-4"
          />
          <v-text-field
            v-model="editingRel.role"
            label="Role"
            variant="outlined"
            density="compact"
            class="mb-4"
          />
          <v-textarea
            v-model="editingRel.notes"
            label="Notes"
            variant="outlined"
            density="compact"
            auto-grow
            rows="4"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeEditor">Cancel</v-btn>
          <v-btn color="primary" variant="tonal" @click="saveEditor"
            >Save</v-btn
          >
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
import GenericTextareaPanel from "@/components/panels/GenericTextareaPanel.vue";

const props = defineProps<{
  charPrefix: string; // "character.uuid"
}>();

interface RelationshipRow {
  id?: string;
  name: string;
  role: string;
  notes: string;
}

const relationships = useField<RelationshipRow[]>(
  fieldPath(`${props.charPrefix}.relationships`),
  [],
);

const localRelationships = ref<RelationshipRow[]>([]);

// One-way sync: rated → local on load/rating change (no back-sync watch → no recursion)
watch(
  relationships,
  (newVal) => {
    localRelationships.value = (newVal || []).map((row, i) => ({
      ...row,
      id: row.id || `rel-${i}-${Date.now()}`,
    }));
  },
  { immediate: true },
);

// Editor
const editorDialog = ref(false);
const editingIndex = ref<number | null>(null);
const editingRel = ref<RelationshipRow>({ name: "", role: "", notes: "" });

function openEditor(index: number | null) {
  editingIndex.value = index;
  if (index === null) {
    editingRel.value = { name: "", role: "", notes: "" };
  } else {
    editingRel.value = JSON.parse(
      JSON.stringify(localRelationships.value[index]),
    ); // Deep copy
  }
  editorDialog.value = true;
}

function closeEditor() {
  editorDialog.value = false;
  editingRel.value = { name: "", role: "", notes: "" };
  editingIndex.value = null;
}

function saveEditor() {
  const newRow = {
    ...editingRel.value,
    id: editingRel.value.id || Date.now().toString(),
  };

  if (editingIndex.value === null) {
    localRelationships.value.push(newRow);
  } else {
    localRelationships.value[editingIndex.value] = newRow;
  }

  // Manual sync to rated field (triggers override/save, no loop)
  relationships.value = JSON.parse(JSON.stringify(localRelationships.value));

  closeEditor();
}

function removeRelationship(index: number) {
  localRelationships.value.splice(index, 1);
  relationships.value = JSON.parse(JSON.stringify(localRelationships.value)); // Manual sync
}
</script>
