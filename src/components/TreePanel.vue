<!-- src/components/TreePanel.vue -->
<template>
  <div class="tree-panel h-100 d-flex flex-column ga-3">
    <!-- Variant control at top -->
    <div class="px-4 pt-3">
      <variant-selector />
    </div>
    <v-treeview
      :items="computedTreeNodes"
      active-strategy="single-independent"
      activatable
      v-model:activated="activated"
      v-model:opened="openNodes"
      class="flex-grow-1 overflow-y-auto px-2"
      density="comfortable"
      item-value="id"
      item-children="children"
      item-title="title"
      :return-object="false"
    >
      <!-- Icon slot -->
      <template #prepend="{ item }">
        <v-icon :color="'primary'">{{ item.icon }}</v-icon>
      </template>

      <!-- Title with override badge -->
      <template #title="{ item }">
        <div
          class="d-flex align-center text-body-2"
          style="white-space: normal; word-break: break-word"
        >
          <span>{{ item.title }}</span>
          <override-badges
            v-if="item.subPaths?.length"
            :path="item.subPaths[0]"
            :extra-paths="item.subPaths.slice(1)"
            class="ml-2"
          />
        </div>
      </template>

      <!-- Append actions -->
      <template #append="{ item }">
        <div class="d-flex align-center ga-1">
          <v-btn
            v-if="item.id === 'characters-root'"
            icon="mdi-plus-circle-outline"
            size="x-small"
            variant="text"
            color="success"
            @click.stop="addCharacter"
            title="Add new character"
          />

          <template v-else-if="item.id.startsWith('char-') && !!item.children">
            <v-btn
              icon="mdi-content-copy"
              size="x-small"
              variant="text"
              color="primary"
              @click.stop="duplicateCharacter(item.id)"
              title="Duplicate"
            />
            <v-btn
              icon="mdi-delete"
              size="x-small"
              variant="text"
              color="error"
              @click.stop="openDeleteDialog(item.id, item.title)"
              title="Delete character"
            />
          </template>
        </div>
      </template>
    </v-treeview>

    <!-- Delete confirmation dialog -->
    <v-dialog v-model="deleteDialog" max-width="460" persistent>
      <v-card>
        <v-card-title class="text-h6">Delete Character</v-card-title>
        <v-card-text class="pt-4">
          Permanently remove
          <strong>{{ charToDelete?.title || "this character" }}</strong
          >?<br />
          <span class="text-caption text-error">This cannot be undone.</span>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">Cancel</v-btn>
          <v-btn color="error" variant="tonal" @click="confirmDelete"
            >Delete</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { useBotStore } from "@/stores/botStore";
import VariantSelector from "@/components/VariantSelector.vue";
import OverrideBadges from "@/components/OverrideBadges.vue";
import { buildFullTree } from "@/utils/treeBuilder";
import { createDefaultCharacter } from "@/utils/defaultBotGenerator";
import type { TreeNode } from "@/types/treeNode";

const botStore = useBotStore();

// Two-way binding from parent (BotTreeLayout.vue)
const openNodes = defineModel<string[]>("openNodes", { required: true });
const activeNodeId = defineModel<string[] | null>("activeNodeId", {
  default: null,
});

// Local state
const deleteDialog = ref(false);
const charToDelete = ref<{ id: string; title: string } | null>(null);

const activated = computed({
  get: () => activeNodeId.value,
  set: (val: string[]) => {
    activeNodeId.value = val;
  },
});

// Log when parent model changes externally (sanity check)
watch(
  activated,
  (newId) => {
    console.log("[TreePanel] parent changed activated →", newId);
  },
  { immediate: true },
);

// // Normalize for single selection
// watch(localActivated, (newVal) => {
//   if (newVal.length > 0) {
//     activeNodeId.value = newVal[0];
//   } else {
//     activeNodeId.value = null;
//   }
// }, { immediate: true });

// ── Computed tree ────────────────────────────────────────────────
const computedTreeNodes = computed<TreeNode[]>(() => {
  const chars = botStore.currentBot?.background?.characters ?? [];
  return buildFullTree(chars.map((c) => ({ id: c.id, name: c.name })));
});

// ── Character actions ────────────────────────────────────────────
function addCharacter() {
  if (!botStore.currentBot) return;

  const newChar = createDefaultCharacter();
  if (!botStore.currentBot.background) botStore.currentBot.background = { characters: [] };
  if (!botStore.currentBot.background.characters) botStore.currentBot.background.characters = [];
  botStore.currentBot.background.characters.push(newChar);
  botStore.setDirty();

  nextTick(() => {
    openNodes.value = [...openNodes.value, `char-${newChar.id}`];
    activeNodeId.value = [`char-${newChar.id}-basic`]; // open first panel
  });
}

function duplicateCharacter(nodeId: string) {
  if (!botStore.currentBot) return;
  const charId = nodeId.replace(/^char-/, "");
  const chars = botStore.currentBot.background?.characters ?? [];
  const index = chars.findIndex((c) => c.id === charId);
  if (index === -1) return;

  const original = chars[index];
  const copy = {
    ...structuredClone(original),
    id: crypto.randomUUID(),
    name: original.name ? `${original.name} (copy)` : "Copy",
  };

  chars.splice(index + 1, 0, copy);
  botStore.setDirty();

  nextTick(() => {
    openNodes.value = [...openNodes.value, `char-${copy.id}`];
  });
}

function openDeleteDialog(nodeId: string, title: string) {
  charToDelete.value = { id: nodeId, title };
  deleteDialog.value = true;
}

function confirmDelete() {
  if (!charToDelete.value || !botStore.currentBot) return;

  const charId = charToDelete.value.id.replace(/^char-/, "");
  const chars = botStore.currentBot.background?.characters ?? [];
  const index = chars.findIndex((c) => c.id === charId);

  if (index !== -1) {
    chars.splice(index, 1);
    botStore.setDirty();

    // Clear selection if it was inside the deleted character
    if (activeNodeId.value?.[0].startsWith(`char-${charId}`)) {
      activeNodeId.value = null;
    }
  }

  deleteDialog.value = false;
  charToDelete.value = null;
}
</script>

<style scoped>
.tree-panel {
  background: var(--v-surface-base);
  border-right: thin solid var(--v-border-color);
}
</style>
