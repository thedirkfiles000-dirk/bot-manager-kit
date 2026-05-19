<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { appLocalDataDir, join } from "@tauri-apps/api/path";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { formatAjvErrors, validateBotData, classifyBot } from "@/utils/botValidator.ts";
import { useNotify } from "@/composables/useNotify.ts";
import { useComplianceStore } from "@/stores/complianceStore.ts";

const route = useRoute();
const router = useRouter();
const notify = useNotify();

const botId = route.params.botId as string;

const jsonText = ref<string>("");
const prettyJson = ref<string>("");
const loading = ref(true);
const error = ref<string>("");
const botName = ref<string>("");
const parseError = ref<string>("");
const validationErrors = ref<string[]>([]);
const isValid = ref<boolean | null>(null);

// Edit/Replacement Dialog
const editDialog = ref(false);
const confirmDialog = ref(false);
const newJsonText = ref<string>("");

// Live validation in the edit dialog
const dialogParseError = ref<string>("");
const dialogValidationErrors = ref<string[]>([]);
const dialogIsValid = ref<boolean | null>(null);

const replaced = ref(false);
const copiedJson = ref(false);

async function loadRawBot() {
  loading.value = true;
  error.value = "";
  parseError.value = "";
  validationErrors.value = [];
  isValid.value = null;

  try {
    const appDir = await appLocalDataDir();
    const botsDir = await join(appDir, "Bot Manager", "bots");
    const botFolder = await join(botsDir, botId);
    const path = await join(botFolder, "bot.json");

    const content = await readTextFile(path);
    jsonText.value = content;

    // Attempt to pretty-print (will fail gracefully if not valid JSON)
    try {
      const parsed = JSON.parse(content);
      prettyJson.value = JSON.stringify(parsed, null, 2);
      botName.value = parsed.name || "Unnamed Bot";

      // Run schema validation
      const { valid, errors } = validateBotData(parsed);
      isValid.value = valid;
      if (!valid) {
        validationErrors.value = formatAjvErrors(errors);
      }
    } catch (e) {
      prettyJson.value = content; // Fallback to raw text if not parseable
      botName.value = "Unknown";
      parseError.value = "Invalid JSON – file could not be parsed.";
    }
  } catch (e: any) {
    console.error("Failed to load raw bot:", e);
    error.value =
      "Failed to load bot file – it may not exist or is inaccessible.";
  }

  loading.value = false;
}

function openEditDialog() {
  // Prefill with pretty JSON if available (nicer for editing), otherwise raw
  newJsonText.value = prettyJson.value || jsonText.value;
  replaced.value = false;
  editDialog.value = true;
  // Trigger initial validation
  validateNewJson();
}

function navigateAfterReplace(destination: 'editor' | 'copy-station') {
  editDialog.value = false;
  if (destination === 'editor') {
    router.push({ name: "bot-tree", params: { botId } });
  } else {
    router.push({ name: "copy-station", params: { botId } });
  }
}

/** Replace entire textarea content on paste (user is pasting a complete replacement). */
function onReplacePaste(e: ClipboardEvent) {
  const text = e.clipboardData?.getData("text/plain");
  if (text != null) {
    e.preventDefault();
    newJsonText.value = text;
  }
}

function validateNewJson() {
  dialogParseError.value = "";
  dialogValidationErrors.value = [];
  dialogIsValid.value = null;

  if (!newJsonText.value.trim()) {
    return;
  }

  try {
    const parsed = JSON.parse(newJsonText.value);
    const { valid, errors } = validateBotData(parsed);
    dialogIsValid.value = valid;
    if (!valid) {
      dialogValidationErrors.value = formatAjvErrors(errors);
    }
  } catch (e: any) {
    dialogParseError.value = "Invalid JSON – cannot parse.";
  }
}

watch(newJsonText, validateNewJson);

async function performReplacement() {
  try {
    const appDir = await appLocalDataDir();
    const botsDir = await join(appDir, "Bot Manager", "bots");
    const botFolder = await join(botsDir, botId);
    const path = await join(botFolder, "bot.json");
    const bakPath = await join(botFolder, "bot.json.bak");

    // Create backup of original file contents
    await writeTextFile(bakPath, jsonText.value);

    // Preserve the original bot id and cid, stamp a fresh timestamp
    const original = JSON.parse(jsonText.value);
    const parsed = JSON.parse(newJsonText.value);
    parsed.id = botId;
    if (original.cid) parsed.cid = original.cid;
    parsed.lastModified = new Date().toISOString();
    const finalJson = JSON.stringify(parsed, null, 2);

    // Update compliance cache for this bot
    const complianceStore = useComplianceStore();
    const compliance = classifyBot(parsed);
    complianceStore.set(botId, parsed.lastModified, compliance);

    await writeTextFile(path, finalJson);

    // Reload the view to reflect changes
    await loadRawBot();

    confirmDialog.value = false;
    replaced.value = true;

    notify.success("Bot JSON replaced. Backup saved as bot.json.bak.");
  } catch (e: any) {
    console.error("Replacement failed:", e);
    notify.error("Failed to save replacement – check console for details.");
  }
}

async function copyToClipboard() {
  try {
    await navigator.clipboard.writeText(prettyJson.value);
    copiedJson.value = true;
    setTimeout(() => { copiedJson.value = false; }, 1800);
  } catch (e) {
    notify.error("Failed to copy to clipboard.");
  }
}

onMounted(loadRawBot);
</script>

<template>
  <v-container fluid class="pa-6 d-flex flex-column" style="height: 100%">
    <v-row align="center" class="mb-4 flex-shrink-0">
      <v-col>
        <h1 class="text-h4">Raw JSON – {{ botName }} ({{ botId }})</h1>
      </v-col>
      <v-col cols="auto">
        <v-btn
          color="primary"
          prepend-icon="mdi-arrow-left"
          @click="router.push({ name: 'home' })"
        >
          Back to Home
        </v-btn>
      </v-col>
    </v-row>

    <v-progress-linear v-if="loading" indeterminate class="mb-4 flex-shrink-0" />

    <div v-else-if="error" class="flex-shrink-0 text-error text-h6">
      <v-icon icon="mdi-alert-circle" class="mr-2" />
      {{ error }}
    </div>

    <div v-else class="d-flex flex-column flex-grow-1" style="min-height: 0">
      <!-- Validation / Parse Feedback -->
      <div v-if="parseError" class="mb-4 flex-shrink-0">
        <v-alert type="error" prominent>
          <v-icon icon="mdi-code-json" class="mr-2" />
          {{ parseError }}
        </v-alert>
      </div>

      <div v-else-if="isValid === false" class="mb-4 flex-shrink-0">
        <v-alert type="warning" prominent title="Schema Validation Failed">
          The bot JSON is parseable but does not conform to the current schema.
          This may happen after schema updates. Below are the specific issues:
          <ul class="mt-3">
            <li v-for="err in validationErrors" :key="err">{{ err }}</li>
          </ul>
        </v-alert>
      </div>

      <div v-else-if="isValid === true" class="mb-4 flex-shrink-0">
        <v-alert type="success" title="Valid Bot JSON">
          This file fully conforms to the current schema.
        </v-alert>
      </div>

      <v-card variant="outlined" class="mb-4 flex-grow-1" style="min-height: 0; overflow: hidden">
        <v-card-text class="pa-0" style="height: 100%; overflow: hidden">
          <pre
            class="pa-4 text-body-1"
            style="
              height: 100%;
              width: 100%;
              box-sizing: border-box;
              white-space: pre-wrap;
              overflow: auto;
              text-align: left;
            "
            >{{ prettyJson }}</pre
          >
        </v-card-text>
      </v-card>

      <div class="d-flex gap-4 flex-shrink-0 pb-2">
        <v-btn
          color="success"
          :prepend-icon="copiedJson ? 'mdi-check' : 'mdi-content-copy'"
          @click="copyToClipboard"
        >
          Copy to Clipboard
        </v-btn>

        <v-btn
          color="warning"
          prepend-icon="mdi-pencil"
          @click="openEditDialog"
        >
          Replace Raw JSON
        </v-btn>
      </div>
    </div>

    <!-- Edit / Replace Dialog -->
    <v-dialog v-model="editDialog" max-width="900px" persistent>
      <v-card style="height: 85vh; overflow: hidden; display: flex; flex-direction: column;">
        <v-card-title class="text-h6 text-error flex-shrink-0">
          <v-icon icon="mdi-alert" class="mr-2" />
          Replace Raw JSON (High Risk)
        </v-card-title>

        <v-card-text style="flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; gap: 12px; overflow: hidden;">
          <v-alert type="warning" density="compact" class="flex-shrink-0">
            <strong>Completely overwrites</strong> the bot's JSON file.
            Backup saved as <code>bot.json.bak</code>. Unsaved editor changes will be lost on next load.
          </v-alert>

          <textarea
            v-model="newJsonText"
            class="json-editor"
            placeholder="Edit / Paste New JSON"
            autofocus
            spellcheck="false"
            @paste="onReplacePaste"
          />

          <!-- Live validation feedback -->
          <div class="flex-shrink-0">
            <v-alert v-if="dialogParseError" type="error" density="compact">
              {{ dialogParseError }}
            </v-alert>

            <v-alert
              v-else-if="dialogIsValid === false"
              type="warning"
              density="compact"
              title="Schema Validation Failed"
            >
              <ul class="mt-1">
                <li v-for="err in dialogValidationErrors" :key="err">{{ err }}</li>
              </ul>
            </v-alert>

            <v-alert v-else-if="dialogIsValid === true" type="success" density="compact">
              Valid JSON and fully schema-compliant.
            </v-alert>

            <div v-else class="text-medium-emphasis text-body-2">
              Paste or edit JSON above to see live validation.
            </div>
          </div>
        </v-card-text>

        <v-card-actions class="flex-shrink-0">
          <v-spacer />
          <template v-if="!replaced">
            <v-btn variant="text" @click="editDialog = false"> Cancel </v-btn>
            <v-btn color="error" variant="elevated" @click="confirmDialog = true">
              Save Replacement
            </v-btn>
          </template>
          <template v-else>
            <v-btn variant="text" @click="editDialog = false"> Close </v-btn>
            <v-btn
              color="primary"
              variant="tonal"
              prepend-icon="mdi-pencil"
              @click="navigateAfterReplace('editor')"
            >
              Open in Editor
            </v-btn>
            <v-btn
              color="success"
              variant="tonal"
              prepend-icon="mdi-export-variant"
              @click="navigateAfterReplace('copy-station')"
            >
              Open in Copy Station
            </v-btn>
          </template>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Final Confirmation Dialog -->
    <v-dialog v-model="confirmDialog" max-width="500px" persistent>
      <v-card>
        <v-card-title class="text-h6 text-error">
          <v-icon icon="mdi-alert-octagon" class="mr-2" />
          Final Confirmation
        </v-card-title>
        <v-card-text class="text-body-1">
          Are you <strong>absolutely sure</strong> you want to replace the bot
          JSON?<br /><br />
          This cannot be undone from the app (though a <code>.bak</code> backup
          will be created).
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="confirmDialog = false"> Cancel </v-btn>
          <v-btn color="error" variant="elevated" @click="performReplacement">
            Yes, Replace It
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>

</template>

<style scoped>
pre {
  font-family: "Roboto Mono", monospace;
  background: rgb(var(--v-theme-surface-variant));
  color: rgb(var(--v-theme-on-surface-variant));
  border-radius: 4px;
}

.d-flex.gap-4 {
  gap: 16px;
}

.json-editor {
  /* card=85vh, minus title+actions+alerts+padding+gaps ≈ 260px */
  height: calc(85vh - 260px);
  min-height: 150px;
  width: 100%;
  resize: none;
  overflow-y: auto;
  background: transparent;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 4px;
  color: rgb(var(--v-theme-on-surface));
  font-family: "Roboto Mono", monospace;
  font-size: 0.8125rem;
  line-height: 1.5;
  padding: 12px;
  outline: none;
  box-sizing: border-box;
}

.json-editor:focus {
  border-color: rgb(var(--v-theme-primary));
  border-width: 2px;
  padding: 11px;
}
</style>
