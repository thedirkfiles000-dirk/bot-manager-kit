<!-- src/views/SchemaPickerView.vue -->
<template>
  <v-container class="py-8" style="max-width: 1100px">
    <div class="d-flex align-center mb-6 ga-3">
      <h1 class="text-h4 flex-grow-1">Bot Manager Kit</h1>
      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        @click="openCreateDialog"
      >
        New Schema
      </v-btn>
      <v-btn
        :icon="settingsStore.theme === 'dark' ? 'mdi-weather-sunny' : 'mdi-weather-night'"
        variant="text"
        @click="settingsStore.toggleTheme()"
        :title="settingsStore.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
      />
    </div>

    <p class="text-body-1 text-medium-emphasis mb-6">
      Pick a schema to work with. Each schema defines the bot structure, the
      editor panels, and the Copy Station outputs for its session. Schemas
      live at <code>BotSchemas/&lt;name&gt;/</code> in your app data folder.
    </p>

    <div v-if="loading" class="d-flex justify-center my-8">
      <v-progress-circular indeterminate />
    </div>

    <div v-else-if="schemas.length === 0" class="text-center my-12">
      <v-icon size="80" color="warning">mdi-folder-alert-outline</v-icon>
      <p class="text-h6 mt-4">No schemas yet.</p>
      <v-btn
        class="mt-4"
        color="primary"
        prepend-icon="mdi-plus"
        @click="openCreateDialog"
      >
        Create one
      </v-btn>
    </div>

    <v-row v-else>
      <v-col
        v-for="meta in schemas"
        :key="meta.name"
        cols="12"
        sm="6"
        md="4"
      >
        <v-card class="h-100 d-flex flex-column" variant="outlined">
          <v-card-title class="pb-1 d-flex align-center">
            <span class="text-truncate flex-grow-1">{{ meta.title }}</span>
            <v-menu>
              <template #activator="{ props }">
                <v-btn
                  icon="mdi-dots-vertical"
                  size="small"
                  variant="text"
                  v-bind="props"
                  @click.stop
                />
              </template>
              <v-list density="compact">
                <v-list-item @click="openDuplicateDialog(meta)">
                  <template #prepend>
                    <v-icon>mdi-content-copy</v-icon>
                  </template>
                  <v-list-item-title>Duplicate</v-list-item-title>
                </v-list-item>
                <v-list-item @click="openRenameDialog(meta)">
                  <template #prepend>
                    <v-icon>mdi-rename-box</v-icon>
                  </template>
                  <v-list-item-title>Rename</v-list-item-title>
                </v-list-item>
                <v-list-item @click="revealInFileManager(meta)">
                  <template #prepend>
                    <v-icon>mdi-folder-open-outline</v-icon>
                  </template>
                  <v-list-item-title>Reveal in file manager</v-list-item-title>
                </v-list-item>
                <v-divider />
                <v-list-item
                  base-color="error"
                  @click="openDeleteDialog(meta)"
                >
                  <template #prepend>
                    <v-icon>mdi-delete</v-icon>
                  </template>
                  <v-list-item-title>Delete</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </v-card-title>

          <v-card-subtitle class="text-caption">
            {{ meta.name }}
            <span v-if="botCounts[meta.name] != null">
              &middot; {{ botCounts[meta.name] }} bot{{ botCounts[meta.name] === 1 ? "" : "s" }}
            </span>
          </v-card-subtitle>

          <v-card-text class="flex-grow-1 text-body-2">
            {{ meta.description || "No description." }}
          </v-card-text>

          <v-card-actions>
            <v-spacer />
            <v-btn
              color="primary"
              variant="tonal"
              append-icon="mdi-arrow-right"
              @click="pick(meta)"
            >
              Open
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <div class="text-caption text-medium-emphasis mt-8">
      Schemas root: <code>{{ schemasRootDisplay }}</code>
    </div>

    <!-- Create / Duplicate / Rename dialog (shared shell) -->
    <v-dialog v-model="nameDialog.open" max-width="500" persistent>
      <v-card>
        <v-card-title>{{ nameDialog.title }}</v-card-title>
        <v-card-text>
          <p v-if="nameDialog.hint" class="text-body-2 text-medium-emphasis mb-3">
            {{ nameDialog.hint }}
          </p>
          <v-text-field
            v-model="nameDialog.value"
            :label="nameDialog.label"
            :error-messages="nameDialog.error ? [nameDialog.error] : []"
            variant="outlined"
            density="compact"
            autofocus
            @keydown.enter="confirmNameDialog"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="nameDialog.open = false">Cancel</v-btn>
          <v-btn
            color="primary"
            variant="tonal"
            :disabled="!nameDialog.value.trim() || !!nameDialog.error"
            :loading="nameDialog.busy"
            @click="confirmNameDialog"
          >
            {{ nameDialog.confirmLabel }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete confirmation -->
    <v-dialog v-model="deleteDialog.open" max-width="500" persistent>
      <v-card>
        <v-card-title class="text-error">
          <v-icon icon="mdi-alert" class="mr-2" />
          Delete schema?
        </v-card-title>
        <v-card-text>
          This will permanently delete the schema
          <strong>"{{ deleteDialog.meta?.title }}"</strong>
          <span v-if="deleteDialog.botCount > 0">
            and its <strong>{{ deleteDialog.botCount }}</strong>
            {{ deleteDialog.botCount === 1 ? "bot" : "bots" }}
          </span>
          from disk. This cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog.open = false">
            Cancel
          </v-btn>
          <v-btn
            color="error"
            variant="elevated"
            :loading="deleteDialog.busy"
            @click="confirmDelete"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useActiveSchemaStore, type SchemaMetadata } from "@/stores/activeSchemaStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useNotify } from "@/composables/useNotify";
import {
  countBotsFor,
  createSchema,
  deleteSchema,
  discoverSchemas,
  duplicateSchema,
  getSchemasRoot,
  renameSchema,
  revealSchemaInFileManager,
  schemaExists,
  validateSchemaName,
} from "@/utils/schemaLoader";

const router = useRouter();
const activeSchemaStore = useActiveSchemaStore();
const settingsStore = useSettingsStore();
const notify = useNotify();

const schemas = ref<SchemaMetadata[]>([]);
const botCounts = ref<Record<string, number>>({});
const schemasRootDisplay = ref<string>("");
const loading = ref(true);

type DialogMode = "create" | "duplicate" | "rename";
const nameDialog = reactive({
  open: false,
  mode: "create" as DialogMode,
  title: "",
  hint: "",
  label: "",
  confirmLabel: "Create",
  value: "",
  error: "" as string,
  busy: false,
  srcMeta: null as SchemaMetadata | null,
});

const deleteDialog = reactive({
  open: false,
  meta: null as SchemaMetadata | null,
  botCount: 0,
  busy: false,
});

async function loadSchemas() {
  loading.value = true;
  try {
    schemasRootDisplay.value = await getSchemasRoot();
    const list = await discoverSchemas();
    schemas.value = list;
    activeSchemaStore.setAvailable(list);

    const counts: Record<string, number> = {};
    await Promise.all(
      list.map(async (m) => {
        try {
          counts[m.name] = await countBotsFor(m.name);
        } catch {
          counts[m.name] = 0;
        }
      }),
    );
    botCounts.value = counts;
  } catch (e) {
    console.error("Failed to discover schemas:", e);
    notify.error("Failed to load schemas — check console.");
  } finally {
    loading.value = false;
  }
}

function pick(meta: SchemaMetadata) {
  activeSchemaStore.setActive(meta);
  router.push({ name: "schema-home", params: { schemaName: meta.name } });
}

// ── Name dialog (shared between create/duplicate/rename) ─────────────────

function resetNameDialog(mode: DialogMode) {
  nameDialog.mode = mode;
  nameDialog.value = "";
  nameDialog.error = "";
  nameDialog.busy = false;
  nameDialog.srcMeta = null;
}

function openCreateDialog() {
  resetNameDialog("create");
  nameDialog.title = "New Schema";
  nameDialog.hint =
    "Pick a short name for the schema's folder (letters, digits, spaces, dashes). You can change the displayed title later by editing schema.json.";
  nameDialog.label = "Schema name";
  nameDialog.confirmLabel = "Create";
  nameDialog.open = true;
}

function openDuplicateDialog(meta: SchemaMetadata) {
  resetNameDialog("duplicate");
  nameDialog.srcMeta = meta;
  nameDialog.title = `Duplicate "${meta.title}"`;
  nameDialog.hint = "The new schema starts as a copy of the source schema.json. Bots are not copied.";
  nameDialog.label = "New schema name";
  nameDialog.confirmLabel = "Duplicate";
  nameDialog.value = `${meta.name} (copy)`;
  nameDialog.open = true;
}

function openRenameDialog(meta: SchemaMetadata) {
  resetNameDialog("rename");
  nameDialog.srcMeta = meta;
  nameDialog.title = `Rename "${meta.name}"`;
  nameDialog.hint =
    "This renames the folder. Bots inside travel with it. The schema's displayed title (from schema.json) is left unchanged.";
  nameDialog.label = "New name";
  nameDialog.confirmLabel = "Rename";
  nameDialog.value = meta.name;
  nameDialog.open = true;
}

// Validate live as the user types.
watch(
  () => nameDialog.value,
  async (v) => {
    if (!nameDialog.open) return;
    const trimmed = v.trim();
    if (!trimmed) {
      nameDialog.error = "";
      return;
    }
    const validation = validateSchemaName(trimmed);
    if (validation) {
      nameDialog.error = validation;
      return;
    }
    // Collision check (skip when renaming to the same name).
    const collidesAllowed =
      nameDialog.mode === "rename" &&
      nameDialog.srcMeta?.name === trimmed;
    if (!collidesAllowed && (await schemaExists(trimmed))) {
      nameDialog.error = `A schema named "${trimmed}" already exists.`;
      return;
    }
    nameDialog.error = "";
  },
);

async function confirmNameDialog() {
  if (!nameDialog.value.trim() || nameDialog.error) return;
  nameDialog.busy = true;
  try {
    const target = nameDialog.value.trim();
    if (nameDialog.mode === "create") {
      await createSchema(target);
      notify.success(`Schema "${target}" created.`);
    } else if (nameDialog.mode === "duplicate" && nameDialog.srcMeta) {
      await duplicateSchema(nameDialog.srcMeta.name, target);
      notify.success(`Schema duplicated as "${target}".`);
    } else if (nameDialog.mode === "rename" && nameDialog.srcMeta) {
      await renameSchema(nameDialog.srcMeta.name, target);
      notify.success(`Schema renamed to "${target}".`);
    }
    nameDialog.open = false;
    await loadSchemas();
  } catch (e: any) {
    console.error("Schema operation failed:", e);
    nameDialog.error = e?.message || "Operation failed.";
  } finally {
    nameDialog.busy = false;
  }
}

// ── Delete ───────────────────────────────────────────────────────────────

async function openDeleteDialog(meta: SchemaMetadata) {
  deleteDialog.meta = meta;
  deleteDialog.botCount = 0;
  deleteDialog.busy = false;
  deleteDialog.open = true;
  try {
    deleteDialog.botCount = await countBotsFor(meta.name);
  } catch {
    // Leave count at 0 on error — confirmation still shows the schema name.
  }
}

async function confirmDelete() {
  if (!deleteDialog.meta) return;
  deleteDialog.busy = true;
  try {
    const name = deleteDialog.meta.name;
    await deleteSchema(name);
    deleteDialog.open = false;
    notify.success(`Schema "${name}" deleted.`);
    await loadSchemas();
  } catch (e: any) {
    console.error("Delete failed:", e);
    notify.error(e?.message || "Delete failed — check console.");
  } finally {
    deleteDialog.busy = false;
  }
}

// ── Reveal in file manager ───────────────────────────────────────────────

async function revealInFileManager(meta: SchemaMetadata) {
  try {
    await revealSchemaInFileManager(meta.name);
  } catch (e: any) {
    console.error("Reveal failed:", e);
    notify.error(e?.message || "Could not open the schema folder.");
  }
}

onMounted(loadSchemas);
</script>
