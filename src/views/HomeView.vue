<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { appLocalDataDir, join } from "@tauri-apps/api/path";
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
import { GrokBotProfile } from "@/types/botSchema.ts";
import { createDefaultBot } from "@/utils/defaultBotGenerator.ts";
import { formatAjvErrors, validateBotData, classifyBot, type BotCompliance } from "@/utils/botValidator.ts";
import botSchema from "@/assets/grokbot.schema.json";
import { useComplianceStore } from "@/stores/complianceStore.ts";
import { getMime } from "@/composables/useImageUtils.ts";
import { useNotify } from "@/composables/useNotify.ts";
import { botManagerVersion } from "@/main";
import AppManual from "@/components/AppManual.vue";
import { useSettingsStore } from "@/stores/settingsStore";

const botStore = useBotStore();
const settingsStore = useSettingsStore();
const complianceStore = useComplianceStore();
const router = useRouter();
const notify = useNotify();
const loading = ref(true);

const generateUUID = () => crypto.randomUUID();

const deleteDialog = ref(false);
const botToDelete = ref<GrokBotProfile | null>(null);

interface BotCard extends GrokBotProfile {
  _valid: boolean;
  _compliance?: BotCompliance;
  profileUrl?: string;
  imagesCount?: number;
}

const bots = ref<BotCard[]>([]);

const filterText = ref("");

const complianceFilter = ref<string | null>(null);
const complianceEvaluated = ref(false);
const evaluating = ref(false);

const COMPLIANCE_FILTER_OPTIONS = [
  { value: 'v2',     label: 'Schema v2',          color: 'success' },
  { value: 'v1',     label: 'Schema v1',          color: 'blue'    },
  { value: 'broken', label: 'Other / Broken',     color: 'error'   },
] as const;

const filteredBots = computed(() => {
  let list = sortedBots.value;

  if (filterText.value.trim()) {
    const query = filterText.value.trim().toLowerCase();
    list = list.filter((bot) => {
      const nameMatch = (bot.name || "").toLowerCase().includes(query);
      const cidMatch = (bot.cid || "").toLowerCase().includes(query);
      return nameMatch || cidMatch;
    });
  }

  if (complianceEvaluated.value && complianceFilter.value) {
    list = list.filter((bot) => bot._compliance === complianceFilter.value);
  }

  return list;
});

async function duplicateBot(original: GrokBotProfile) {
  try {
    // Deep clone the saved bot — strip _valid (BotCard-only UI field) before persisting
    const rawClone = JSON.parse(JSON.stringify(original));
    delete rawClone._valid;
    const newBot: BotCard = rawClone;

    // Generate new ID
    newBot.id = generateUUID();

    // Smart duplicate name to avoid immediate conflicts in the list
    let baseName = original.name.trim() || "Unnamed Bot";
    let newName = `${baseName} (Copy)`;
    let counter = 1;

    // Check current in-memory list for naming conflicts
    while (bots.value.some((b) => b.name === newName)) {
      counter++;
      newName = `${baseName} (Copy ${counter})`;
    }
    newBot.name = newName;

    // Update timestamp
    newBot.lastModified = new Date().toISOString();

    // Write new file (folder structure: {id}/bot.json)
    const appDir = await appLocalDataDir();
    const botsDir = await join(appDir, "Bot Manager", "bots");
    const newDir = await join(botsDir, newBot.id);
    const imagesDir = await join(newDir, "images");
    await mkdir(imagesDir, { recursive: true });
    const jsonPath = await join(newDir, "bot.json");
    await writeTextFile(jsonPath, JSON.stringify(newBot, null, 2));

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

    // Build BotCard for the home grid
    const card: BotCard = {
      ...newBot,
      _valid: true,
      imagesCount: newBot.images?.length ?? 0,
      profileUrl: undefined,
    };

    // Update in-memory list immediately (newest on top)
    bots.value.unshift(card);
    bots.value.sort((a, b) =>
      (b.lastModified || "").localeCompare(a.lastModified || ""),
    );

    // Feedback
    snackbarText.value = `Duplicated "${original.name}" as "${newBot.name}"`;
    showSnackbar.value = true;
  } catch (e) {
    console.error("Failed to duplicate bot:", e);
    snackbarText.value = "Failed to duplicate bot";
    showSnackbar.value = true;
  }
}

function openDeleteDialog(bot: GrokBotProfile) {
  botToDelete.value = bot;
  deleteDialog.value = true;
}

async function confirmDelete() {
  if (!botToDelete.value) return;

  const bot = botToDelete.value;

  try {
    const appDir = await appLocalDataDir();
    const botsDir = await join(appDir, "Bot Manager", "bots");
    const botFolder = await join(botsDir, bot.id);

    // Recursively delete the entire bot folder (bot.json + images/ + everything)
    await remove(botFolder, { recursive: true });

    // If this bot was currently open in the editor, clear it
    if (botStore.currentBot?.id === bot.id) {
      botStore.clear();
    }

    // Reload the list
    await loadBots();

    // Success feedback
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
  const appDir = await appLocalDataDir();
  const botsDir = await join(appDir, "Bot Manager", "bots");
  await mkdir(botsDir, { recursive: true });

  const entries = await readDir(botsDir);
  const loaded: BotCard[] = [];

  for (const entry of entries) {
    // Skip obvious files (e.g., any stray .json that shouldn't be there post-migration)
    if (!entry.name || entry.name.endsWith(".json")) continue;

    // Potential bot folder — check for bot.json inside
    const botFolder = await join(botsDir, entry.name);
    const jsonPath = await join(botFolder, "bot.json");

    if (!(await exists(jsonPath))) continue; // Not a valid bot folder

    let rawBot: any;

    try {
      const content = await readTextFile(jsonPath);

      let parsed = JSON.parse(content);

      // Only clean on load → legacy data disappears from UI & future saves
      delete parsed._valid;
      if (parsed.background?.characters) {
        parsed.background.characters = parsed.background.characters.map(
          (c: any) => {
            const { usage_hints, ...rest } = c;
            return rest;
          },
        );
      }

      rawBot = parsed;
    } catch (e) {
      console.error(
        `Failed to read or parse bot.json in folder ${entry.name}:`,
        e,
      );
      continue;
    }

    // Optional sanity check: folder name should match bot.id
    if (rawBot.id !== entry.name) {
      console.warn(
        `Bot folder name "${entry.name}" does not match bot.id "${rawBot.id}". Using bot.id for consistency.`,
      );
      // You could optionally rename the folder here to rawBot.id, but it's risky — better manual fix
    }

    const botCard = rawBot as BotCard;
    const cached = complianceStore.get(rawBot.id, rawBot.lastModified ?? '');
    botCard._compliance = cached ?? classifyBot(rawBot);
    if (!cached) complianceStore.set(rawBot.id, rawBot.lastModified ?? '', botCard._compliance);
    botCard._valid = botCard._compliance !== 'broken';

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

  // Optional: sort loaded bots (e.g., by name or lastModified)
  loaded.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

  bots.value = loaded;
  complianceEvaluated.value = true;
  complianceFilter.value = null;

  loading.value = false;
}

// async function loadBots() {
//   loading.value = true;
//   const appDir = await appLocalDataDir();
//   const botsDir = await join(appDir, "Bot Manager", "bots");
//   await mkdir(botsDir, { recursive: true });
//
//   const files = await readDir(botsDir);
//   const loaded: BotCard[] = [];
//   let invalidCount = 0;
//
//   for (const file of files) {
//     if (!file.name?.endsWith(".json")) continue;
//
//     const path = await join(botsDir, file.name);
//     let rawBot: any;
//
//     try {
//       const content = await readTextFile(path);
//       rawBot = JSON.parse(content);
//     } catch (e) {
//       console.error(`Failed to read or parse bot file ${file.name}:`, e);
//       continue; // Skip completely unreadable/corrupted files
//     }
//
//     const { valid, errors } = validateBotData(rawBot);
//
//     const botCard = rawBot as BotCard;
//     botCard._valid = valid;
//
//     botCard.imagesCount = botCard.images?.length ?? 0;
//     botCard.profileUrl = undefined;
//
//     if (botCard.profileImage) {
//       try {
//         const botDir = await join(botsDir, botCard.id);
//         const imgPath = await join(botDir, botCard.profileImage);
//         const bytes = await readFile(imgPath);
//         const mime = getMime(botCard.profileImage); // keep your existing getMime helper
//         const blob = new Blob([bytes], { type: mime });
//         botCard.profileUrl = URL.createObjectURL(blob);
//       } catch (e) {
//         console.warn(`Failed to load profile image for bot ${botCard.id}:`, e);
//         botCard.profileUrl = undefined;
//       }
//     }
//
//     loaded.push(botCard);
//
//     if (!valid) {
//       invalidCount++;
//       console.warn(
//         `Bot "${rawBot.name || "Unnamed"}" (${rawBot.id || file.name}) failed schema validation:`,
//         formatAjvErrors(errors),
//       );
//     }
//   }
//
//   // Ensure every loaded bot has its individual directory
//   // (creates missing ones on startup – prevents "no such directory" when opening folder)
//   await Promise.all(
//     loaded.map(async (bot) => {
//       const botDir = await join(botsDir, bot.id);
//       await mkdir(botDir, { recursive: true });
//     }),
//   );
//
//   bots.value = loaded.sort((a, b) =>
//     (b.lastModified || "").localeCompare(a.lastModified || ""),
//   );
//
//   if (invalidCount > 0) {
//     snackbarText.value = `${invalidCount} bot(s) failed schema validation and cannot be edited.`;
//     showSnackbar.value = true;
//   }
//
//   loading.value = false;
// }

function evaluateCompliance() {
  evaluating.value = true;
  complianceStore.clear();
  for (const bot of bots.value) {
    bot._compliance = classifyBot(bot);
    bot._valid = bot._compliance !== 'broken';
    complianceStore.set(bot.id, bot.lastModified ?? '', bot._compliance);
  }
  complianceEvaluated.value = true;
  evaluating.value = false;
}

onMounted(async () => {
  await loadBots();
});


/* ==================== IMPORT BOT FEATURE ==================== */
const importJsonDialog = ref(false);
const importJsonText = ref("");
const jsonError = ref<string | null>(null);
const importedParsed = ref<GrokBotProfile | null>(null);
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

/** Replace entire textarea content on paste (import expects a complete JSON blob). */
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

  // Resolve $ref
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
      // Drop keys not in schema (additionalProperties: false)
    }
    // Also handle additionalProperties that allow arbitrary keys (e.g., variants)
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

// Main watcher for live validation/preview
watch(
  importJsonText,
  async (newVal) => {
    jsonError.value = null;
    importedParsed.value = null;
    importValidationErrors.value = [];
    if (!newVal?.trim()) return;

    try {
      let raw: any = JSON.parse(newVal.trim());

      // Support array with one bot
      if (Array.isArray(raw)) {
        if (raw.length !== 1)
          throw new Error("Array must contain exactly one bot");
        raw = raw[0];
      }

      if (typeof raw !== "object" || raw === null)
        throw new Error("Not a valid bot object");

      const newId = generateUUID();
      const now = new Date().toISOString();

      // Start with full defaults
      const merged: GrokBotProfile = JSON.parse(
        JSON.stringify(createDefaultBot()),
      );

      // Recursively override with imported values (discards extras)
      applyOverrides(merged, raw);

      // FORCE fresh metadata (always overrides import)
      merged.id = newId;
      merged.lastModified = now;

      // Always strip images on JSON-only import
      merged.images = [];
      delete merged.profileImage;

      // Fallback name only if missing/empty
      if (!merged.name?.trim()) {
        merged.name = "Imported Bot";
      }

      // Regenerate all character IDs (fresh for import)
      (merged.background?.characters ?? []).forEach((char: any) => {
        char.id = generateUUID();
        char.lastModified = now;
      });

      // Strip any fields not in the schema (applyOverrides copies arrays wholesale)
      const cleaned = stripUnknownFields(merged, botSchema) as GrokBotProfile;

      // Final validation
      const { valid, errors } = validateBotData(cleaned);
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
    const appDir = await appLocalDataDir();
    const botsDir = await join(appDir, "Bot Manager", "bots");
    await mkdir(botsDir, { recursive: true });

    const botDir = await join(botsDir, newBot.id);

    // Check for existing bot with same ID (prevent silent overwrite)
    const existingJsonPath = await join(botDir, "bot.json");
    if (await exists(existingJsonPath)) {
      notify.error(
        `A bot with ID "${newBot.id}" already exists. Import canceled.`,
      );
      return;
    }

    // Create bot folder and images subdir
    await mkdir(botDir, { recursive: true });
    const imagesDir = await join(botDir, "images");
    await mkdir(imagesDir, { recursive: true });

    // Update lastModified for proper sorting
    newBot.lastModified = new Date().toISOString();

    // Persist to disk (new structure)
    const jsonPath = await join(botDir, "bot.json");
    await writeTextFile(jsonPath, JSON.stringify(newBot, null, 2));

    // Add to home grid — sortedBots computed handles ordering
    const card: BotCard = {
      ...newBot,
      _valid: true,
      imagesCount: newBot.images?.length ?? 0,
      profileUrl: undefined,
    };
    bots.value.push(card);

    // Load into store
    botStore.currentBot = newBot;
    botStore.isDirty = false;

    // Show navigation options instead of auto-navigating
    importedBotId.value = newBot.id;

    notify.success(`Imported bot "${newBot.name}"`);
  } catch (e: any) {
    console.error("Import failed:", e);
    notify.error("Failed to import bot");
  }
}

function importNavigate(destination: 'editor' | 'copy-station') {
  const botId = importedBotId.value;
  if (!botId) return;
  closeImportJson();
  if (destination === 'editor') {
    router.push({ name: "bot-tree", params: { botId } });
  } else {
    router.push({ name: "copy-station", params: { botId } });
  }
}

function toggleSort() {
  sortMode.value = sortMode.value === "modified" ? "name" : "modified";
}

const sortedBots = computed(() => {
  const list = [...bots.value];

  if (sortMode.value === "modified") {
    // Newest first (descending by lastModified)
    return list.sort((a, b) =>
      (b.lastModified || "").localeCompare(a.lastModified || ""),
    );
  } else {
    // Alphabetical A-Z by name (case-sensitive; adjust if you want case-insensitive)
    return list.sort((a, b) =>
      (a.name || "Unnamed Bot").localeCompare(b.name || "Unnamed Bot"),
    );
  }
});

function openBot(botId: string) {
  router.push({ name: "bot-tree", params: { botId } });
}

/* ========================================================== */

async function createAndOpenNewBot() {
  await botStore.createNew();
  router.push({
    name: "bot-tree",
    params: { botId: botStore.currentBot!.id },
  });
}

const sortIcon = computed(() => {
  return sortMode.value === "modified"
    ? "mdi-sort-clock-descending-outline" // Newest first (clock descending)
    : "mdi-sort-alphabetical-ascending";
});
</script>

<template>
  <v-container fluid class="pa-4">
    <!-- Header row: Flexible layout – filter grows, buttons shrink-to-fit on right -->
    <v-row align="center" class="mb-6" no-gutters v-if="!loading">
      <v-col cols="12" md="7" lg="6">
        <v-text-field
          v-model="filterText"
          label="Filter by name or CID"
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
        <div class="d-flex ga-1 mt-2 flex-wrap align-center">
          <v-btn
            size="x-small"
            variant="tonal"
            :color="complianceEvaluated ? 'success' : 'primary'"
            :prepend-icon="complianceEvaluated ? 'mdi-check-circle' : 'mdi-shield-search'"
            :loading="evaluating"
            @click="evaluateCompliance"
          >{{ complianceEvaluated ? 'Re-evaluate' : 'Evaluate' }}</v-btn>
          <template v-if="complianceEvaluated">
            <v-chip
              v-for="opt in COMPLIANCE_FILTER_OPTIONS"
              :key="opt.value"
              size="x-small"
              :color="complianceFilter === opt.value ? opt.color : undefined"
              :variant="complianceFilter === opt.value ? 'elevated' : 'tonal'"
              label
              @click="complianceFilter = complianceFilter === opt.value ? null : opt.value"
            >{{ opt.label }} ({{ bots.filter(b => b._compliance === opt.value).length }})</v-chip>
          </template>
        </div>
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

            <!-- Subtitle / info area -->
            <v-card-subtitle class="text-caption text-medium-emphasis pb-2">
              <div class="d-flex align-center gap-1 mb-1">
                <v-chip
                  v-if="bot._compliance === 'broken'"
                  size="x-small"
                  color="error"
                  variant="tonal"
                  label
                >Broken</v-chip>
                <v-chip
                  v-else
                  size="x-small"
                  :color="bot._compliance === 'v2' ? 'success' : 'blue'"
                  variant="tonal"
                  label
                >Schema v{{ bot._compliance === 'v2' ? '2' : '1' }}</v-chip>
              </div>
              <div>CID: {{ bot.cid ?? "--" }}</div>
              <div>
                {{ (bot.background?.characters ?? []).length }} character{{ (bot.background?.characters ?? []).length === 1 ? "" : "s" }}
                &middot;
                {{ Object.keys(bot.variants ?? {}).length === 0 ? "no variants" : Object.keys(bot.variants ?? {}).length === 1 ? "1 variant" : `${Object.keys(bot.variants ?? {}).length} variants` }}
              </div>
              <div>Modified: {{ new Date(bot.lastModified || "").toLocaleDateString() }}</div>
            </v-card-subtitle>

            <v-card-actions class="mt-auto mb-2 px-4">
              <div class="d-flex flex-column align-start">
                <div class="d-flex ga-2 flex-wrap">
                    <!-- Export / Copy Station -->
                    <router-link
                      :to="{ name: 'copy-station', params: { botId: bot.id } }"
                      @click.stop
                    >
                      <v-btn
                        icon="mdi-export-variant"
                        size="small"
                        variant="tonal"
                        color="success"
                        title="Export (Copy Station)"
                        :disabled="!bot._valid"
                      />
                    </router-link>
                    <!-- Raw JSON view button ��� always enabled, even for invalid bots (helps debugging) -->
                    <router-link
                      :to="{ name: 'raw-bot', params: { botId: bot.id } }"
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

      <!-- Empty state when no bots match filter -->
      <div
        v-if="!filteredBots.length"
        class="text-center text-grey-darken-2 w-100 mt-16"
      >
        <v-icon size="120">mdi-magnify</v-icon>
        <p class="text-h5 mt-4">No bots found</p>
        <p>Try adjusting your search or create a new bot.</p>
      </div>
    </div>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="500px" persistent>
      <v-card>
        <v-card-title class="text-h6 text-error">
          <v-icon icon="mdi-alert" class="mr-2" />
          Confirm Delete
        </v-card-title>
        <v-card-text class="text-body-1">
          Are you sure you want to <strong>permanently delete</strong> the bot
          "<strong>{{ botToDelete?.name || "Unnamed" }}</strong
          >"?<br /><br />
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

    <!-- Import JSON Dialog -->
    <v-dialog v-model="importJsonDialog" max-width="800px" persistent>
      <v-card>
        <v-card-title class="text-h6"> Import Bot from JSON </v-card-title>
        <v-card-text>
          <v-alert type="info" prominent class="mb-4">
            <p>This will create and save a new bot from the pasted JSON.</p>
            <v-list density="compact" class="pa-0 bg-transparent">
              <v-list-item>
                A new UUID, character IDs, and timestamp will be generated.
              </v-list-item>
              <v-list-item> Unknown/extra fields discarded. </v-list-item>
              <v-list-item>Missing fields use app defaults. </v-list-item>
              <v-list-item> Images not supported (JSON only). </v-list-item>
            </v-list>
            <p>
              The bot will appear in your library. You can then open it in the
              editor or go straight to the Copy Station.
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
              @click="importNavigate('editor')"
            >
              Open in Editor
            </v-btn>
            <v-btn
              color="success"
              variant="tonal"
              prepend-icon="mdi-export-variant"
              @click="importNavigate('copy-station')"
            >
              Open in Copy Station
            </v-btn>
          </template>
        </v-card-actions>
      </v-card>
    </v-dialog>


    <!-- Snackbar -->
    <v-snackbar
      v-model="showSnackbar"
      :text="snackbarText"
      color="info"
      timeout="5000"
    />
    <div class="text-caption text-medium-emphasis text-center mt-8 pb-2">
      Bot Manager v{{ botManagerVersion() }}
    </div>  </v-container>
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
  line-height: 1.15; /* Tighten wrapped lines — adjust 1.1–1.25 to taste */
  word-break: break-word; /* Safe break for long words */
  overflow-wrap: anywhere; /* Modern fallback */
  margin: 0; /* Remove any default margin */
  padding: 0; /* Ensure no extra padding */
}

.bot-card:hover {
  transform: translateY(-4px);
}

.gap-6 > * {
  /* Custom gap utility (Vuetify doesn't have ga-6 by default) */
  margin: 12px; /* Adjust as needed; or use ma-4 on cards instead */
}

</style>
