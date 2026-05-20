<!-- src/components/panels/CharacterDialogExamplesPanel.vue -->
<template>
  <panel-wrapper title="Dialog Examples" subtitle="Few-shot examples of voice/style/tone. Add as many or as few as you need; 2–4 are usually enough, but more is fine. Empty examples are skipped on export." :max-width="1200">

    <div class="d-flex justify-end mb-3">
      <v-btn
        color="primary"
        size="small"
        prepend-icon="mdi-plus"
        @click="addExample"
      >
        Add Example
      </v-btn>
    </div>

    <v-row v-if="examples.length" density="compact">
      <v-col v-for="(ex, idx) in examples" :key="idx" cols="12" md="6" lg="4">
        <v-card
          variant="outlined"
          :color="ex.length > 0 ? 'primary' : 'grey-darken-3'"
          class="mb-4 h-100 d-flex flex-column"
        >
          <v-card-title class="text-subtitle-1 d-flex align-center">
            Example {{ idx + 1 }}
            <v-spacer />
            <v-btn
              icon="mdi-delete"
              size="small"
              variant="text"
              color="error"
              :title="`Remove Example ${idx + 1}`"
              @click="removeExample(idx)"
            />
          </v-card-title>

          <v-card-text class="flex-grow-1">
            <div
              v-if="ex.length === 0"
              class="text-caption text-medium-emphasis text-center py-6"
            >
              Empty — click Edit to add lines
            </div>

            <div v-else class="example-preview">
              <div
                v-for="(line, i) in ex"
                :key="`${idx}-${i}`"
                class="mb-2"
              >
                <strong>{{ line.speaker || "??" }}:</strong>
                {{ line.line }}
              </div>
            </div>

            <div class="text-center mt-4">
              <v-btn
                color="primary"
                variant="tonal"
                @click="startEditing(idx)"
              >
                Edit Example
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <div v-else class="text-center text-medium-emphasis py-12">
      No dialog examples yet. Click <strong>Add Example</strong> above to create one.
    </div>

    <!-- ── Line Editor Dialog ─────────────────────────────────────── -->
    <v-dialog v-model="editorDialog" max-width="900" persistent scrollable>
      <v-card>
        <v-card-title class="d-flex align-center">
          <span>Editing Example {{ editingIdx !== null ? editingIdx + 1 : "?" }}</span>
        </v-card-title>

        <v-card-text>
          <table class="line-editor-table">
            <thead>
              <tr>
                <th class="line-editor-table__col--speaker">Speaker</th>
                <th class="line-editor-table__col--line">Line</th>
                <th class="line-editor-table__col--actions"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in editingLines" :key="index">
                <td>
                  <v-text-field
                    v-model="item.speaker"
                    variant="outlined"
                    density="compact"
                    hide-details
                    placeholder="Character / User"
                  />
                </td>
                <td>
                  <v-textarea
                    v-model="item.line"
                    variant="outlined"
                    density="compact"
                    auto-grow
                    rows="2"
                    hide-details
                    placeholder="Dialogue line..."
                  />
                </td>
                <td class="text-end">
                  <v-btn
                    icon="mdi-delete"
                    size="small"
                    variant="text"
                    color="error"
                    @click="removeLine(index)"
                  />
                </td>
              </tr>
              <tr v-if="editingLines.length === 0">
                <td colspan="3" class="text-center text-medium-emphasis pa-4">
                  No lines yet — click Add Line below
                </td>
              </tr>
            </tbody>
          </table>

          <v-btn
            color="primary"
            variant="outlined"
            prepend-icon="mdi-plus"
            class="mt-4"
            @click="addLine"
          >
            Add Line
          </v-btn>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeEditor">Cancel</v-btn>
          <v-btn
            color="primary"
            variant="tonal"
            :disabled="editingLines.length === 0"
            @click="saveAndClose"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </panel-wrapper>
</template>

<script setup lang="ts">
import PanelWrapper from "@/components/PanelWrapper.vue";
import { computed, ref } from "vue";
import { useBotStore } from "@/stores/botStore";
import { fieldPath } from "@/types/fieldPath";
import type { DialogLineBlock } from "@/types/botSchema";
import { useField } from "@/composables/useField.ts";

const props = defineProps<{
  charPrefix: string; // e.g. "character.abc123"
}>();

const botStore = useBotStore();

// Single bound field for the whole array. Editing mutates the array in-place
// then writes the new reference back through useField's setter.
const examplesField = useField<DialogLineBlock[][]>(
  fieldPath(`${props.charPrefix}.dialog_examples`),
  [],
);

const examples = computed(() => examplesField.value ?? []);

const editorDialog = ref(false);
const editingIdx = ref<number | null>(null);
const editingLines = ref<DialogLineBlock[]>([]);

function addExample() {
  examplesField.value = [...examples.value, []];
  botStore.setDirty();
}

function removeExample(idx: number) {
  if (!confirm(`Remove Example ${idx + 1}?`)) return;
  const next = examples.value.slice();
  next.splice(idx, 1);
  examplesField.value = next;
  botStore.setDirty();
}

function startEditing(idx: number) {
  editingIdx.value = idx;
  editingLines.value = JSON.parse(JSON.stringify(examples.value[idx] ?? []));
  editorDialog.value = true;
}

function addLine() {
  editingLines.value.push({ speaker: "", line: "" });
}

function removeLine(index: number) {
  editingLines.value.splice(index, 1);
}

function saveAndClose() {
  if (editingIdx.value === null) return;
  const cleaned = editingLines.value.filter(
    (l) => l.speaker?.trim() || l.line?.trim(),
  );
  const next = examples.value.slice();
  next[editingIdx.value] = cleaned;
  examplesField.value = next;
  botStore.setDirty();
  closeEditor();
}

function closeEditor() {
  editorDialog.value = false;
  editingIdx.value = null;
  editingLines.value = [];
}
</script>

<style scoped>
.example-preview {
  font-size: 0.95rem;
  line-height: 1.45;
}

.line-editor-table {
  width: 100%;
  border-collapse: collapse;
}

.line-editor-table th {
  text-align: left;
  padding: 0.5rem 0.5rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.7;
}

.line-editor-table td {
  padding: 0.25rem 0.5rem;
  vertical-align: top;
}

.line-editor-table__col--speaker { width: 25%; }
.line-editor-table__col--line { width: 65%; }
.line-editor-table__col--actions { width: 10%; }
</style>
