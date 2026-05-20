<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { join } from "@tauri-apps/api/path";
import {
  exists,
  mkdir,
  readDir,
  readFile,
  readTextFile,
  remove,
  writeFile,
  writeTextFile,
} from "@tauri-apps/plugin-fs";
import { useBotStore } from "@/stores/botStore.ts";
import { useActiveSchemaStore } from "@/stores/activeSchemaStore.ts";
import { botsDirFor } from "@/utils/schemaLoader.ts";
import { StarterBot } from "@/types/botSchema.ts";
import { createDefaultBot } from "@/utils/defaultBotGenerator.ts";
import { formatAjvErrors } from "@/utils/botValidator.ts";
import { getMime } from "@/composables/useImageUtils.ts";
import { useNotify } from "@/composables/useNotify.ts";
import { botManagerVersion } from "@/main";
import AppManual from "@/components/AppManual.vue";
import { useSettingsStore } from "@/stores/settingsStore";

const botStore = useBotStore();
const settingsStore = useSettingsStore();
const activeSchemaStore = useActiveSchemaStore();
const router = useRouter();
const route = useRoute();
const notify = useNotify();
const loading = ref(true);

const schemaName = computed(() => route.params.schemaName as string);

const generateUUID = () => crypto.randomUUID();

const deleteDialog = ref(false);
const botToDelete = ref<StarterBot | null>(null);

interface BotCard extends StarterBot {
  _valid: boolean;
  profileUrl?: string;
  imagesCount?: number;
}

const bots = ref<BotCard[]>([]);

const filterText = ref("");

const filteredBots = computed(() => {
  let list = sortedBots.value;

  if (filterText.value.trim()) {
    const query = filterText.value.trim().toLowerCase();
    list = list.filter((bot) =>
      (bot.name || "").toLowerCase().includes(query),
    );
  }

  return list;
});

async function duplicateBot(original: StarterBot) {
  try {
    const rawClone = JSON.parse(JSON.stringify(original));
    delete rawClone._valid;
    const newBot: BotCard = rawClone;

    newBot.id = generateUUID();

    let baseName = original.name.trim() || "Unnamed Bot";
    let newName = `${baseName} (Copy)`;
    let counter = 1;
    while (bots.value.some((b) => b.name === newName)) {
      counter++;
      newName = `${baseName} (Copy ${counter})`;
    }
    newBot.name = newName;
    newBot.lastModified = new Date().toISOString();

    const botsDir = await botsDirFor(schemaName.value);
    const newDir = await join(botsDir, newBot.id);
    const imagesDir = await join(newDir, "images");
    await mkdir(imagesDir, { recursive: true });
    await writeTextFile(await join(newDir, "bot.json"), JSON.stringify(newBot, null, 2));

    // Copy images from old bot's images/ subdir
    const oldImagesDir = await join(botsDir, original.id, "images");
    try {
      const entries = await readDir(oldImagesDir);
      for (const entry of entries) {
        if (!entry.isDirectory) {
          const oldPath = await join(oldImagesDir, entry.name!);
          const newPath = await join(imagesDir, entry.name!);
          const bytes = await readFile(oldPath);
          await writeFile(newPath, bytes);
        }
      }
    } catch (e) {
      console.error("Failed to copy images:", e);
    }
    newBot.profileImage = original.profileImage;

    const card: BotCard = {
      ...newBot,
      _valid: true,
      imagesCount: newBot.images?.length ?? 0,
      profileUrl: undefined,
    };

    bots.value.unshift(card);
    bots.value.sort((a, b) =>
      (b.lastModified || "").localeCompare(a.lastModified || ""),
    );

    snackbarText.value = `Duplicated "${original.name}" as "${newBot.name}"`;
    showSnackbar.value = true;
  } catch (e) {
    console.error("Failed to duplicate bot:", e);
    snackbarText.value = "Failed to duplicate bot";
    showSnackbar.value = true;
  }
}

function openDeleteDialog(bot: StarterBot) {
  botToDelete.value = bot;
  deleteDialog.value = true;
}

async function confirmDelete() {
  if (!botToDelete.value) return;
  const bot = botToDelete.value;

  try {
    const botsDir = await botsDirFor(schemaName.value);
    const botFolder = await join(botsDir, bot.id);
    await remove(botFolder, { recursive: true });

    if (botStore.currentBot?.id === bot.id) {
      botStore.clear();
    }

    await loadBots();

    snackbarText.value = `Deleted bot "${bot.name}"`;
    showSnackbar.value = true;
  } catch (e) {
    console.error("Failed to delete bot:", e);
    snackbarText.value = `Failed to delete "${bot.name}"`;
    showSnackbar.value = true;
  }

  deleteDialog.value = false;
  botToDelete.value = null;
}

function closeDeleteDialog() {
  deleteDialog.value = false;
  botToDelete.value = null;
}

async function loadBots() {
  loading.value = true;
  const botsDir = await botsDirFor(schemaName.value);

  const entries = await readDir(botsDir);
  const loaded: BotCard[] = [];

  for (const entry of entries) {
    if (!entry.name || entry.name.endsWith(".json")) continue;

    const botFolder = await join(botsDir, entry.name);
    const jsonPath = await join(botFolder, "bot.json");
    if (!(await exists(jsonPath))) continue;

    let rawBot: any;

    try {
      const content = await readTextFile(jsonPath);
      let parsed = JSON.parse(content);

      delete parsed._valid;
      rawBot = parsed;
    } catch (e) {
      console.error(
        `Failed to read or parse bot.json in folder ${entry.name}:`,
        e,
      );
      continue;
    }

    if (rawBot.id !== entry.name) {
      console.warn(
        `Bot folder name "${entry.name}" does not match bot.id "${rawBot.id}". Using bot.id for consistency.`,
      );
    }

    const botCard = rawBot as BotCard;
    const { valid } = activeSchemaStore.validateBot(rawBot);
    botCard._valid = valid;

    botCard.imagesCount = botCard.images?.length ?? 0;
    botCard.profileUrl = undefined;

    if (botCard.profileImage) {
      try {
        const imgPath = await join(botFolder, "images", botCard.profileImage);
        const bytes = await readFile(imgPath);
        const mime = getMime(botCard.profileImage);
        const blob = new Blob([bytes], { type: mime });
        botCard.profileUrl = URL.createObjectURL(blob);
      } catch (e) {
        console.warn(`Failed to load profile image for bot ${botCard.id}:`, e);
        botCard.profileUrl = undefined;
      }
    }

    loaded.push(botCard);
  }

  loaded.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

  bots.value = loaded;
  loading.value = false;
}

onMounted(async () => {
  await loadBots();
});

/* ==================== IMPORT BOT FEATURE ==================== */
const importJsonDialog = ref(false);
const importJsonText = ref("");
const jsonError = ref<string | null>(null);
const importedParsed = ref<StarterBot | null>(null);
const importValidationErrors = ref<string[]>([]);
const importedBotId = ref<string | null>(null);

const showSnackbar = ref(false);
const snackbarText = ref("");

const sortMode = computed({
  get: () => settingsStore.homeSortMode,
  set: (v) => { settingsStore.homeSortMode = v; },
});

const importValidationMessage = computed(() => {
  if (importedBotId.value) return "Bot created successfully";
  if (!importJsonText.value.trim()) return "Paste JSON to begin";
  if (jsonError.value) return jsonError.value;
  if (!importedParsed.value) return "Processing...";
  return "Valid bot – ready to import";
});

function openGlobalImportJson() {
  importJsonDialog.value = true;
  importJsonText.value = "";
  jsonError.value = null;
  importedParsed.value = null;
  importValidationErrors.value = [];
  importedBotId.value = null;
}

function onImportPaste(e: ClipboardEvent) {
  const text = e.clipboardData?.getData("text/plain");
  if (text != null) {
    e.preventDefault();
    importJsonText.value = text;
  }
}

function closeImportJson() {
  importJsonDialog.value = false;
}

// Recursive override: only copy fields that exist in target (discards extras)
function applyOverrides(target: any, source: any) {
  if (!source || typeof source !== "object" || Array.isArray(source)) return;

  Object.keys(target).forEach((key) => {
    if (key in source) {
      const sourceVal = source[key];
      const targetVal = target[key];

      if (
        targetVal &&
        typeof targetVal === "object" &&
        !Array.isArray(targetVal) &&
        sourceVal &&
        typeof sourceVal === "object" &&
        !Array.isArray(sourceVal)
      ) {
        applyOverrides(targetVal, sourceVal);
      } else {
        target[key] = sourceVal;
      }
    }
  });
}

/**
 * Recursively strip fields not declared in the JSON schema.
 * Handles $ref resolution for definitions (draft-07 style).
 */
function stripUnknownFields(obj: any, schema: any, root: any = schema): any {
  if (!obj || typeof obj !== "object") return obj;

  if (schema.$ref) {
    const refPath = schema.$ref.replace("#/", "").split("/");
    let resolved = root;
    for (const seg of refPath) resolved = resolved?.[seg];
    if (resolved) return stripUnknownFields(obj, resolved, root);
    return obj;
  }

  if (schema.type === "array" && Array.isArray(obj)) {
    const itemSchema = schema.items;
    if (!itemSchema) return obj;
    return obj.map((item: any) => stripUnknownFields(item, itemSchema, root));
  }

  if (schema.type === "object" && !Array.isArray(obj)) {
    const props = schema.properties;
    if (!props) return obj;
    const cleaned: any = {};
    for (const key of Object.keys(obj)) {
      if (key in props) {
        cleaned[key] = stripUnknownFields(obj[key], props[key], root);
      }
    }
    if (schema.additionalProperties && typeof schema.additionalProperties === "object") {
      for (const key of Object.keys(obj)) {
        if (!(key in (props ?? {}))) {
          cleaned[key] = stripUnknownFields(obj[key], schema.additionalProperties, root);
        }
      }
    }
    return cleaned;
  }

  return obj;
}

watch(
  importJsonText,
  async (newVal) => {
    jsonError.value = null;
    importedParsed.value = null;
    importValidationErrors.value = [];
    if (!newVal?.trim()) return;

    try {
      let raw: any = JSON.parse(newVal.trim());

      if (Array.isArray(raw)) {
        if (raw.length !== 1)
          throw new Error("Array must contain exactly one bot");
        raw = raw[0];
      }

      if (typeof raw !== "object" || raw === null)
        throw new Error("Not a valid bot object");

      const newId = generateUUID();
      const now = new Date().toISOString();

      const merged: StarterBot = JSON.parse(
        JSON.stringify(createDefaultBot()),
      );

      applyOverrides(merged, raw);

      merged.id = newId;
      merged.lastModified = now;
      merged.images = [];
      delete merged.profileImage;

      if (!merged.name?.trim()) {
        merged.name = "Imported Bot";
      }

      const cleaned = stripUnknownFields(merged, activeSchemaStore.active!.raw) as StarterBot;

      const { valid, errors } = activeSchemaStore.validateBot(cleaned);
      if (!valid) {
        jsonError.value = "Schema validation failed";
        importValidationErrors.value = formatAjvErrors(errors);
        return;
      }

      importedParsed.value = cleaned;
    } catch (e: any) {
      jsonError.value = e.message || "Invalid JSON";
    }
  },
  { immediate: false },
);

async function applyImportedJson() {
  if (!importedParsed.value) return;

  const newBot = importedParsed.value;

  try {
    const botsDir = await botsDirFor(schemaName.value);
    const botDir = await join(botsDir, newBot.id);

    const existingJsonPath = await join(botDir, "bot.json");
    if (await exists(existingJsonPath)) {
      notify.error(
        `A bot with ID "${newBot.id}" already exists. Import canceled.`,
      );
      return;
    }

    await mkdir(botDir, { recursive: true });
    const imagesDir = await join(botDir, "images");
    await mkdir(imagesDir, { recursive: true });

    newBot.lastModified = new Date().toISOString();

    const jsonPath = await join(botDir, "bot.json");
    await writeTextFile(jsonPath, JSON.stringify(newBot, null, 2));

    const card: BotCard = {
      ...newBot,
      _valid: true,
      imagesCount: newBot.images?.length ?? 0,
      profileUrl: undefined,
    };
    bots.value.push(card);

    botStore.currentBot = newBot;
    botStore.isDirty = false;

    importedBotId.value = newBot.id;

    notify.success(`Imported bot "${newBot.name}"`);
  } catch (e: any) {
    console.error("Import failed:", e);
    notify.error("Failed to import bot");
  }
}

function importNavigate() {
  const botId = importedBotId.value;
  if (!botId) return;
  closeImportJson();
  router.push({ name: "bot-tree", params: { schemaName: schemaName.value, botId } });
}

function toggleSort() {
  sortMode.value = sortMode.value === "modified" ? "name" : "modified";
}

const sortedBots = computed(() => {
  const list = [...bots.value];

  if (sortMode.value === "modified") {
    return list.sort((a, b) =>
      (b.lastModified || "").localeCompare(a.lastModified || ""),
    );
  } else {
    return list.sort((a, b) =>
      (a.name || "Unnamed Bot").localeCompare(b.name || "Unnamed Bot"),
    );
  }
});

function openBot(botId: string) {
  router.push({ name: "bot-tree", params: { schemaName: schemaName.value, botId } });
}

async function createAndOpenNewBot() {
  await botStore.createNew();
  router.push({
    name: "bot-tree",
    params: { schemaName: schemaName.value, botId: botStore.currentBot!.id },
  });
}

function switchSchema() {
  router.push({ name: "picker" });
}

const sortIcon = computed(() => {
  return sortMode.value === "modified"
    ? "mdi-sort-clock-descending-outline"
    : "mdi-sort-alphabetical-ascending";
});
</script>

<template>
  <v-container fluid class="pa-4">
    <!-- Active schema header -->
    <v-row align="center" class="mb-4" no-gutters>
      <v-col cols="12" md="auto">
        <div class="d-flex align-center ga-3">
          <v-btn
            variant="text"
            size="small"
            prepend-icon="mdi-arrow-left"
            @click="switchSchema"
          >
            Switch Schema
          </v-btn>
          <span class="text-h6">{{ activeSchemaStore.active?.title || schemaName }}</span>
        </div>
      </v-col>
    </v-row>

    <!-- Header row: filter on left, buttons on right -->
    <v-row align="center" class="mb-6" no-gutters v-if="!loading">
      <v-col cols="12" md="7" lg="6">
        <v-text-field
          v-model="filterText"
          label="Filter by name"
          prepend-inner-icon="mdi-magnify"
          :append-inner-icon="sortIcon"
          variant="outlined"
          density="compact"
          clearable
          hide-details
          single-line
          @click:clear="filterText = ''"
          @click:append-inner="toggleSort"
          style="max-width: 600px"
        />
      </v-col>

      <v-col
        cols="12"
        md="5"
        lg="6"
        class="d-flex justify-start justify-md-end flex-wrap ga-3 mt-4 mt-md-0"
      >
        <app-manual />
        <v-btn
          :icon="settingsStore.theme === 'dark' ? 'mdi-weather-sunny' : 'mdi-weather-night'"
          variant="tonal"
          @click="settingsStore.toggleTheme()"
          :title="settingsStore.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
        />
        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          @click="createAndOpenNewBot"
        >
          New Bot
        </v-btn>
        <v-btn
          color="primary"
          prepend-icon="mdi-code-json"
          @click="openGlobalImportJson"
        >
          Import Bot JSON
        </v-btn>
      </v-col>
    </v-row>

    <div v-if="loading" class="d-flex justify-center my-8">
      <v-progress-circular indeterminate />
    </div>

    <div v-if="!loading" class="w-100">
      <div class="d-flex flex-wrap justify-center gap-6">
        <v-card
          v-for="bot in filteredBots"
          :key="bot.id"
          class="bot-card d-flex flex-row elevation-8 rounded-xl"
          :hover="bot._valid"
          @click="bot._valid ? openBot(bot.id) : undefined"
          :style="{ cursor: bot._valid ? 'pointer' : 'not-allowed' }"
        >
          <v-responsive
            aspect-ratio="1"
            min-width="100px"
            class="bg-grey-lighten-3 flex-shrink-0"
          >
            <v-img
              v-if="bot.profileUrl"
              :src="bot.profileUrl"
              cover
              height="100%"
            />
            <div v-else class="fill-height d-flex align-center justify-center">
              <v-icon size="60" color="grey">mdi-image-off</v-icon>
            </div>
          </v-responsive>

          <div class="flex-grow-1 d-flex flex-column overflow-hidden">
            <v-card-title class="pt-4 pb-1 d-flex align-center gap-2 text-wrap">
              <div
                class="card-title flex-grow-1"
                :class="bot._valid ? 'text-success' : 'text-error'"
              >
                {{ bot.name || "Unnamed Bot" }}{{ bot._valid ? '' : ' (invalid)' }}
              </div>
            </v-card-title>

            <v-card-subtitle class="text-caption text-medium-emphasis pb-2">
              <div v-if="(bot as any).tagline" class="font-italic mb-1">
                {{ (bot as any).tagline }}
              </div>
              <div>Modified: {{ new Date(bot.lastModified || "").toLocaleDateString() }}</div>
            </v-card-subtitle>

            <v-card-actions class="mt-auto mb-2 px-4">
              <div class="d-flex flex-column align-start">
                <div class="d-flex ga-2 flex-wrap">
                    <router-link
                      :to="{ name: 'raw-bot', params: { schemaName, botId: bot.id } }"
                      @click.stop
                    >
                      <v-btn
                        icon="mdi-file-code-outline"
                        size="small"
                        variant="tonal"
                        color="info"
                        title="View raw JSON"
                      />
                    </router-link>
                    <v-btn
                      icon="mdi-content-copy"
                      size="small"
                      variant="tonal"
                      color="primary"
                      title="Duplicate bot"
                      @click.stop="duplicateBot(bot)"
                    />
                    <v-btn
                      icon="mdi-delete"
                      size="small"
                      variant="tonal"
                      color="error"
                      title="Delete"
                      @click.stop="openDeleteDialog(bot)"
                    />
                </div>
              </div>
            </v-card-actions>
          </div>
        </v-card>
      </div>

      <div
        v-if="!filteredBots.length"
        class="text-center text-grey-darken-2 w-100 mt-16"
      >
        <v-icon size="120">mdi-magnify</v-icon>
        <p class="text-h5 mt-4">No bots found</p>
        <p>Try adjusting your search or create a new bot.</p>
      </div>
    </div>

    <v-dialog v-model="deleteDialog" max-width="500px" persistent>
      <v-card>
        <v-card-title class="text-h6 text-error">
          <v-icon icon="mdi-alert" class="mr-2" />
          Confirm Delete
        </v-card-title>
        <v-card-text class="text-body-1">
          Are you sure you want to <strong>permanently delete</strong> the bot
          "<strong>{{ botToDelete?.name || "Unnamed" }}</strong>"?<br /><br />
          This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeDeleteDialog"> Cancel </v-btn>
          <v-btn color="error" variant="elevated" @click="confirmDelete">
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="importJsonDialog" max-width="800px" persistent>
      <v-card>
        <v-card-title class="text-h6"> Import Bot from JSON </v-card-title>
        <v-card-text>
          <v-alert type="info" prominent class="mb-4">
            <p>This will create and save a new bot from the pasted JSON.</p>
            <v-list density="compact" class="pa-0 bg-transparent">
              <v-list-item>
                A new UUID and timestamp will be generated.
              </v-list-item>
              <v-list-item> Fields not in the active schema are discarded. </v-list-item>
              <v-list-item> Missing fields use schema defaults. </v-list-item>
              <v-list-item> Images not supported (JSON only). </v-list-item>
            </v-list>
            <p>
              The bot will appear in your library. You can then open it in the editor.
            </p>
          </v-alert>
          <v-textarea
            v-model="importJsonText"
            label="Paste JSON here"
            rows="15"
            variant="outlined"
            monospace
            :error-messages="jsonError ? [jsonError] : []"
            :readonly="!!importedBotId"
            clearable
            @paste="onImportPaste"
          />

          <v-alert
            v-if="importValidationErrors.length"
            type="warning"
            density="compact"
            title="Schema Validation Failed"
            class="mt-3"
          >
            <ul class="mt-1">
              <li v-for="err in importValidationErrors" :key="err">{{ err }}</li>
            </ul>
          </v-alert>

          <div class="mt-2 text-right">
            <strong :class="importedParsed || importedBotId ? 'text-success' : 'text-error'">
              {{ importValidationMessage }}
            </strong>
          </div>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <template v-if="!importedBotId">
            <v-btn @click="closeImportJson">Cancel</v-btn>
            <v-btn
              color="success"
              variant="tonal"
              :disabled="!importedParsed"
              @click="applyImportedJson"
            >
              Create Bot
            </v-btn>
          </template>
          <template v-else>
            <v-btn @click="closeImportJson">Close</v-btn>
            <v-btn
              color="primary"
              variant="tonal"
              prepend-icon="mdi-pencil"
              @click="importNavigate()"
            >
              Open in Editor
            </v-btn>
          </template>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar
      v-model="showSnackbar"
      :text="snackbarText"
      color="info"
      timeout="5000"
    />
    <div class="text-caption text-medium-emphasis text-center mt-8 pb-2">
      Bot Manager Kit v{{ botManagerVersion() }}
    </div>
  </v-container>
</template>

<style scoped>
.bot-card {
  width: 320px;
  max-width: 100%;
  transition: transform 0.2s ease;
  display: flex;
  flex-direction: row;
}

.card-title {
  font-size: medium;
  line-height: 1.15;
  word-break: break-word;
  overflow-wrap: anywhere;
  margin: 0;
  padding: 0;
}

.bot-card:hover {
  transform: translateY(-4px);
}

.gap-6 > * {
  margin: 12px;
}
</style>
