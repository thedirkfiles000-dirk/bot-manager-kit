<template>
  <v-app>
    <v-app-bar elevation="0" border="b" class="px-2">
      <v-btn icon @click="processHomeClick" class="ml-2">
        <v-icon>mdi-home</v-icon>
      </v-btn>

      <v-app-bar-nav-icon v-if="isMobile" @click.stop="drawer = !drawer" />
      <!-- File Menu -->
      <v-menu location="bottom">
        <template v-slot:activator="{ props }">
          <v-btn v-bind="props" variant="text" class="text-capitalize ml-1">
            File
          </v-btn>
        </template>
        <v-list density="compact">
          <v-list-item @click="handleReload">
            <v-list-item-title>Reload</v-list-item-title>
          </v-list-item>
          <v-list-item @click="botStore.save">
            <v-list-item-title>Save</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>

      <!-- Export (Copy Station) -->
      <v-btn
        icon="mdi-export-variant"
        variant="text"
        @click="goToExport"
        title="Export (Copy Station)"
      />

      <!-- Theme toggle -->
      <v-btn
        :icon="settingsStore.theme === 'dark' ? 'mdi-weather-sunny' : 'mdi-weather-night'"
        variant="text"
        @click="settingsStore.toggleTheme()"
        :title="settingsStore.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
      />

      <!-- Spacer to push mode and ratings right -->
      <v-spacer />
      <v-btn-toggle
        v-model="mode"
        density="compact"
        variant="text"
        color="primary"
        selected-class="bg-primary-lighten-4"
        rounded="lg"
        class="mode-toggle mr-8"
      >
        <v-btn value="tree" icon="mdi-file-tree">
          <v-icon />
          <v-tooltip location="bottom">Profile Tree</v-tooltip>
        </v-btn>
        <v-btn value="images" icon="mdi-image-multiple">
          <v-icon />
          <v-tooltip location="bottom"
            >Images{{
              botStore.currentBot?.images?.length
                ? ` (${botStore.currentBot.images.length})`
                : ""
            }}</v-tooltip
          >
        </v-btn>
      </v-btn-toggle>
    </v-app-bar>

    <v-navigation-drawer
      v-if="mode === 'tree'"
      v-model="drawer"
      width="300"
      :temporary="isMobile"
      :permanent="!isMobile"
    >
      <div class="drawer-shell">
        <tree-panel
          :tree-nodes="treeNodes"
          v-model:active-node-id="activeNodeId"
          v-model:open-nodes="openNodes"
          class="drawer-tree"
        />
        <div v-if="consistencyIssues.length" class="drawer-footer pa-2">
          <consistency-panel :issues="consistencyIssues" />
        </div>
      </div>
    </v-navigation-drawer>

    <v-main>
      <div class="main-shell">
        <div class="editor-panel">
          <tree-editor
            v-if="mode === 'tree'"
            :active-node="activeNode"
          />
          <images-workspace v-else />
        </div>
      </div>

      <v-dialog v-model="deleteImageDialog" max-width="400">
        <v-card>
          <v-card-title class="text-h6">Delete Image?</v-card-title>
          <v-card-text> Permanently delete "{{ imageToDelete }}"? </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn @click="deleteImageDialog = false">Cancel</v-btn>
            <v-btn color="error" @click="confirmDeleteImage">Delete</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-dialog v-model="editDialog" max-width="500px" persistent>
        <v-card>
          <v-card-title class="text-h6"> Edit Bot Info </v-card-title>
          <v-card-text>
            <v-text-field
              v-model="editName"
              label="Bot Name"
              :rules="[(v) => !!v.trim() || 'Bot name is required']"
              autofocus
              class="mb-4"
            />
            <v-text-field
              v-model="editCid"
              label="Collection ID (CID)"
              placeholder="Optional – leave blank for none"
              clearable
            />
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn color="grey" variant="text" @click="editDialog = false">
              Cancel
            </v-btn>
            <v-btn
              color="primary"
              variant="elevated"
              @click="saveEdit"
              :disabled="!editName.trim()"
            >
              Save
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Unsaved changes confirmation dialog for leaving to home -->
      <v-dialog v-model="confirmLeaveDialog" max-width="500" persistent>
        <v-card>
          <v-card-title class="text-h6">Unsaved Changes</v-card-title>
          <v-card-text>
            You have unsaved changes to this bot. Do you want to save them
            before returning to the home page?
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn variant="text" @click="confirmLeaveDialog = false">Cancel</v-btn>
            <v-btn
              color="warning"
              variant="tonal"
              :disabled="botStore.loading"
              @click="discardAndLeave"
            >
              Discard and Leave
            </v-btn>
            <v-btn
              color="primary"
              variant="tonal"
              :loading="botStore.loading"
              @click="saveAndLeave"
            >
              Save and Leave
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Reload confirmation dialog -->
      <v-dialog v-model="confirmReloadDialog" max-width="500" persistent>
        <v-card>
          <v-card-title class="text-h6">Discard Unsaved Changes?</v-card-title>
          <v-card-text>
            This bot has unsaved changes. Reloading will discard them and revert
            to the last saved version from disk.
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn variant="text" @click="confirmReloadDialog = false">Cancel</v-btn>
            <v-btn
              color="warning"
              variant="tonal"
              :loading="isReloading"
              @click="proceedReload"
            >
              Reload Anyway
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Delete Confirmation Dialog (add near bottom of template) -->
      <v-dialog v-model="deleteDialog" max-width="500" persistent>
        <v-card>
          <v-card-title class="text-h6"> Delete Character? </v-card-title>
          <v-card-text>
            Permanently delete "<strong>{{ charToDelete?.title }}</strong
            >"? This cannot be undone.
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn variant="text" @click="deleteDialog = false">Cancel</v-btn>
            <v-btn color="error" variant="tonal" @click="confirmDelete">
              Delete
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { useBotStore } from "@/stores/botStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useRoute, useRouter } from "vue-router";
import { type TreeNode } from "@/types/treeNode";
import { useVariantAnyField } from "@/composables/useVariantAnyField";
import { fieldPath } from "@/types/fieldPath";
import { useDisplay } from "vuetify";
import TreePanel from "@/components/TreePanel.vue";
import TreeEditor from "@/components/TreeEditor.vue";
import ImagesWorkspace from "@/components/ImagesWorkspace.vue";
import ConsistencyPanel from "@/components/panels/ConsistencyPanel.vue";
import { buildFullTree } from "@/utils/treeBuilder.ts";
import { botConsistencyCheck } from "@/utils/botConsistencyCheck";

const { smAndDown: isMobile } = useDisplay();

const drawer = ref(true); // Start open (will be overridden by watch)

// Sync open state with screen size
watch(
  isMobile,
  (mobile) => {
    drawer.value = !mobile; // Open on desktop/tablet+, closed on phone
  },
  { immediate: true },
);

const botStore = useBotStore();
const settingsStore = useSettingsStore();
const router = useRouter();
const route = useRoute();

const variantBotName = useVariantAnyField<string>(fieldPath("name"));
const variantCid = useVariantAnyField<string>(fieldPath("cid"));

const editDialog = ref(false);
const editName = ref("");
const editCid = ref("");

const confirmLeaveDialog = ref(false);
const confirmReloadDialog = ref(false);
const isReloading = ref(false);

const activeNodeId = ref<string[]>([]);
const openNodes = ref<string[]>([]);

const deleteDialog = ref(false);
const charToDelete = ref<{ id: string; title: string } | null>(null);

const treeNodes = computed(() => {
  const rawBot = botStore.currentBot;
  if (!rawBot) return [];
  return buildFullTree(rawBot.background?.characters ?? []);
});

const consistencyIssues = computed(() => {
  void botStore.editGeneration; // re-evaluate on every edit
  return botStore.currentBot ? botConsistencyCheck(botStore.currentBot) : [];
});

const activeNode = computed<TreeNode | null>(() => {
  if (!activeNodeId.value.length) return null;
  return findNodeById(treeNodes.value, activeNodeId.value[0]);
});

// Auto-close on mobile when selecting a node (great UX, prevents obstruction)
watch(activeNode, () => {
  if (isMobile.value) {
    drawer.value = false;
  }
});

// findNodeById: recursive search to get full node object from activated id
function findNodeById(nodes: TreeNode[], targetId: string): TreeNode | null {
  for (const node of nodes) {
    if (node.id === targetId) return node;
    if (node.children) {
      const found = findNodeById(node.children, targetId);
      if (found) return found;
    }
  }
  return null;
}

const mode = ref<"tree" | "images">("tree");
const activeImage = ref<string | null>(null);
const deleteImageDialog = ref(false);
const imageToDelete = ref<string | null>(null);

async function confirmDeleteImage() {
  if (!imageToDelete.value) return;
  await botStore.removeImage(imageToDelete.value);
  deleteImageDialog.value = false;
  imageToDelete.value = null;
}

// Load bot on mount (same as BotLayout)
onMounted(async () => {
  if (route.params.botId) {
    await botStore.loadFromDisk(route.params.botId as string);
    await botStore.loadImages();
  }
});

watch(activeNodeId, (newIds) => {
  if (newIds.length) {
    const node = findNodeById(treeNodes.value, newIds[0]);
    if (node && !node.component) {
      // This is a parent/group node with no editor → clear activation
      // Keeps tree expandable via open-on-click, but editor only shows for leaves
      nextTick(() => {
        activeNodeId.value = [];
      });
    }
    // Optional: auto-open all parents of the selected node
    else if (node) {
      const parents = collectParentIds(treeNodes.value, newIds[0]);
      openNodes.value = [...new Set([...openNodes.value, ...parents])];
    }
  }
});

function collectParentIds(
  nodes: TreeNode[],
  targetId: string,
  parents: string[] = [],
): string[] {
  for (const node of nodes) {
    if (node.id === targetId) return parents;
    if (node.children?.length) {
      const found = collectParentIds(node.children, targetId, [
        ...parents,
        node.id,
      ]);
      if (found.length > parents.length) return found;
    }
  }
  return [];
}

function processHomeClick() {
  if (botStore.isDirty) {
    confirmLeaveDialog.value = true;
  } else {
    router.push("/");
  }
}

function discardAndLeave() {
  botStore.clear();
  confirmLeaveDialog.value = false;
  router.push("/");
}

async function saveAndLeave() {
  await botStore.save();
  if (!botStore.isDirty) {
    confirmLeaveDialog.value = false;
    router.push("/");
  }
}

async function goToExport() {
  if (!botStore.currentBot) return;
  if (botStore.isDirty) {
    await botStore.save();
    if (botStore.isDirty) return; // save failed
  }
  router.push({ name: "copy-station", params: { botId: botStore.currentBot.id } });
}

function handleReload() {
  if (!botStore.isDirty) {
    performReload();
    return;
  }
  confirmReloadDialog.value = true;
}

async function performReload() {
  if (!botStore.currentBot) return;

  isReloading.value = true;
  try {
    await botStore.loadFromDisk(botStore.currentBot!.id);
    await botStore.loadImages();
  } catch (error) {
    console.error("Failed to reload bot:", error);
    alert("Failed to reload the bot from disk. See console for details.");
  } finally {
    isReloading.value = false;
  }
}

function proceedReload() {
  confirmReloadDialog.value = false;
  performReload();
}

// Find character index by node id (char-uuid)
function findCharacterIndexByNodeId(nodeId: string): number {
  if (!botStore.currentBot) return -1;
  const charId = nodeId.replace("char-", "");
  return (botStore.currentBot.background?.characters ?? []).findIndex(
    (c) => c.id === charId,
  );
}

// Confirm delete
function confirmDelete() {
  if (!charToDelete.value || !botStore.currentBot) return;
  const index = findCharacterIndexByNodeId(charToDelete.value.id);
  if (index !== -1) {
    botStore.currentBot.background?.characters?.splice(index, 1);
    botStore.setDirty();
  }
  deleteDialog.value = false;
  charToDelete.value = null;
}

function saveEdit() {
  if (!botStore.currentBot) return;

  const trimmedName = editName.value.trim();
  if (trimmedName === "") {
    // Validation handled by rule + disabled button – this is safety
    return;
  }

  if (trimmedName !== variantBotName.value) {
    variantBotName.value = trimmedName;
  }

  const trimmedCid = editCid.value.trim();
  const newCid = trimmedCid || ""; // Treat empty as "" (will cleanup if redundant with lower)

  if (newCid !== (variantCid.value || "")) {
    variantCid.value = newCid;
  }

  editDialog.value = false;
}

watch(mode, async (newMode) => {
  if (newMode === "images" && botStore.currentBot) {
    await botStore.loadImages();
  }
});

watch([mode, () => botStore.currentBot?.id], () => {
  activeImage.value = null;
});
</script>

<style scoped>
.mode-toggle {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.mode-toggle :deep(.v-btn) {
  /* Equal width buttons */
  flex: 1 1 0;
  min-width: 45px;
  opacity: 0.85;
  transition: all 0.2s ease;
}

.mode-toggle :deep(.v-btn--selected) {
  opacity: 1;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.main-shell {
  height: 100%;
  width: 100%;
  max-width: 100vw;
  overflow: hidden;
  display: flex;
}

.image-panel {
  flex: 1 1 auto;
  min-width: 0; /* CRITICAL */
  overflow: hidden;
}

.drawer-shell {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.drawer-tree {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
}

.drawer-footer {
  flex: 0 0 auto;
  border-top: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.editor-panel {
  flex: 1 1 auto;
  min-width: 0; /* THIS stops the jitter */
  overflow: auto;
}
</style>
