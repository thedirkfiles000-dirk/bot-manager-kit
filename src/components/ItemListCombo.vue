<template>
  <v-card class="pa-2 w-100" variant="flat" rounded="sm">
    <div class="d-flex align-center justify-space-between mb-3 px-2">
      <slot name="actions">
        <div class="d-flex ga-2">
          <v-btn
            v-if="
              props.prefillItems &&
              props.prefillItems.length > 0 &&
              !props.readonly
            "
            size="small"
            color="primary"
            variant="tonal"
            @click="applyPrefill"
          >
            {{ props.prefillButtonLabel }}
          </v-btn>

          <v-btn
            v-if="props.showAddButton && !props.readonly"
            size="small"
            color="primary"
            variant="tonal"
            @click="addNewItem"
          >
            Add Item
          </v-btn>

          <v-btn
            v-if="
              props.showClearButton &&
              !props.readonly &&
              internalItems.length > 0
            "
            size="small"
            color="error"
            variant="tonal"
            @click="showClearDialog = true"
          >
            Clear All
          </v-btn>
        </div>
      </slot>
    </div>

    <div
      v-show="internalItems.length > 0"
      ref="listEl"
      class="item-list"
      :style="{ maxHeight: props.listMaxHeight, overflowY: 'auto' }"
    >
      <div
        v-for="item in internalItems"
        :key="item.id"
        :data-id="item.id"
        class="item-row d-flex align-center"
      >
        <v-icon
          v-if="!props.readonly && editingId === null"
          class="drag-handle mr-2"
          style="cursor: grab"
        >
          mdi-drag-vertical
        </v-icon>

        <div class="item-row__content flex-grow-1">
          <div
            v-if="editingId !== item.id"
            class="item-text text-body-2 text-medium-emphasis"
          >
            {{ item.text || "(empty)" }}
          </div>

          <v-textarea
            v-else
            v-model="editedValue"
            :ref="
              (el) => {
                if (el) editingTextarea = el;
              }
            "
            auto-grow
            rows="2"
            density="compact"
            variant="outlined"
            hide-details
            :error-messages="errorMessage ? [errorMessage] : []"
            @keydown.esc="cancel"
          />
        </div>

        <div
          class="d-flex ga-1 ml-2"
          :class="{ 'item-actions': editingId !== item.id }"
        >
          <template v-if="editingId === item.id">
            <v-btn
              icon="mdi-check"
              size="x-small"
              color="success"
              @click="save"
            />
            <v-btn icon="mdi-close" size="x-small" @click="cancel" />
          </template>

          <template v-else>
            <v-btn
              v-if="!props.readonly"
              icon="mdi-pencil"
              size="x-small"
              @click="startEdit(item.id)"
            />
            <v-btn
              v-if="!props.readonly && !props.preventDuplicates"
              icon="mdi-content-copy"
              size="x-small"
              @click="duplicateItem(item.id)"
            />
            <slot name="item-append" :item="item.text">
              <v-btn
                v-if="!props.readonly"
                icon="mdi-delete"
                size="x-small"
                color="error"
                @click="removeItem(item.id)"
              />
            </slot>
          </template>
        </div>
      </div>
    </div>

    <div
      v-if="internalItems.length === 0 && props.showEmptyState"
      class="text-center pa-8 text-caption text-medium-emphasis"
    >
      <slot name="empty-state">No items yet. Add one above!</slot>
    </div>

    <v-card-text v-if="props.helperText" class="pt-1 pb-0 text-caption">
      {{ props.helperText }}
    </v-card-text>

    <v-dialog v-model="showClearDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h6">Clear All Items?</v-card-title>
        <v-card-text>
          This will permanently remove all items from the list. This action
          cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showClearDialog = false">Cancel</v-btn>
          <v-btn color="error" variant="tonal" @click="confirmClear"
            >Clear All</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import Sortable from "sortablejs";

const props = withDefaults(
  defineProps<{
    label?: string;
    listMaxHeight?: string | number;
    helperText?: string;
    showEmptyState?: boolean;
    showAddButton?: boolean;
    readonly?: boolean;
    preventDuplicates?: boolean;
    prefillItems?: string[];
    prefillButtonLabel?: string;
    showClearButton?: boolean;
  }>(),
  {
    label: "Items",
    listMaxHeight: "300px",
    showEmptyState: true,
    showAddButton: true,
    readonly: false,
    preventDuplicates: true,
    prefillButtonLabel: "Prefill Defaults",
    showClearButton: false,
  },
);

const model = defineModel<string[]>({ required: true });

interface InternalItem {
  text: string;
  id: number;
}

const internalItems = ref<InternalItem[]>([]);
let nextId = 0;
let syncing = false;
let sortableInstance: Sortable | null = null;

const syncFromModel = () => {
  const values: string[] = Array.isArray(model.value)
    ? model.value.map((item) => String(item ?? "").trim())
    : [];

  internalItems.value = values.map((text) => ({
    text,
    id: nextId++,
  }));
};

const syncToModel = () => {
  syncing = true;
  model.value = internalItems.value.map((item) => item.text.trim());
  nextTick(() => (syncing = false));
};

watch(
  model,
  () => {
    if (!syncing) syncFromModel();
  },
  { deep: true, immediate: true },
);

const listEl = ref<HTMLElement | null>(null);
const editingId = ref<number | null>(null);
const editedValue = ref<string>("");
const originalValue = ref<string>("");
const errorMessage = ref<string>("");
const showClearDialog = ref(false);
const editingTextarea = ref<any>(null);

const canDrag = computed(() => !props.readonly && editingId.value === null);

// Initialize sortable once the component is mounted (listEl is always in DOM via v-show)
onMounted(() => {
  if (!listEl.value) return;

  sortableInstance = Sortable.create(listEl.value, {
    handle: ".drag-handle",
    animation: 150,
    forceFallback: true,
    fallbackClass: "item-fallback",
    ghostClass: "item-ghost",
    disabled: !canDrag.value,
    onEnd(event) {
      const { oldIndex, newIndex } = event;
      if (oldIndex == null || newIndex == null || oldIndex === newIndex)
        return;

      // Revert DOM change — let Vue re-render from data
      const { from, item } = event;
      from.removeChild(item);
      if (oldIndex < from.children.length) {
        from.insertBefore(item, from.children[oldIndex]);
      } else {
        from.appendChild(item);
      }

      // Now update data
      const [moved] = internalItems.value.splice(oldIndex, 1);
      if (moved) internalItems.value.splice(newIndex, 0, moved);
      syncToModel();
    },
  });

});

onBeforeUnmount(() => {
  sortableInstance?.destroy();
  sortableInstance = null;
});

// Toggle sortable disabled state reactively
watch(canDrag, (enabled) => {
  sortableInstance?.option("disabled", !enabled);
});

const scrollToBottom = () => {
  nextTick(() => {
    if (listEl.value) listEl.value.scrollTop = listEl.value.scrollHeight;
  });
};

const addNewItem = () => {
  const newId = nextId++;
  internalItems.value.push({ text: "", id: newId });
  syncToModel();
  nextTick(() => {
    scrollToBottom();
    nextTick(() => startEdit(newId));
  });
};

const startEdit = (id: number) => {
  const item = internalItems.value.find((i) => i.id === id);
  if (!item) return;

  editingId.value = id;
  originalValue.value = item.text;
  editedValue.value = item.text;
  errorMessage.value = "";

  nextTick(() => editingTextarea.value?.focus?.());
};

const duplicateItem = (id: number) => {
  const item = internalItems.value.find((i) => i.id === id);
  if (item) {
    internalItems.value.push({ text: item.text, id: nextId++ });
    syncToModel();
    nextTick(scrollToBottom);
  }
};

const save = () => {
  if (editingId.value === null) return;

  const item = internalItems.value.find((i) => i.id === editingId.value);
  if (!item) return;

  const trimmed = editedValue.value.trim();
  errorMessage.value = "";

  if (trimmed === "") {
    internalItems.value = internalItems.value.filter(
      (i) => i.id !== editingId.value,
    );
    editingId.value = null;
    syncToModel();
    return;
  }

  const isDuplicate =
    props.preventDuplicates &&
    internalItems.value.some(
      (it) => it.id !== editingId.value && it.text.trim() === trimmed,
    );

  if (isDuplicate) {
    errorMessage.value = "This item already exists.";
  } else {
    item.text = trimmed;
    editingId.value = null;
    syncToModel();
  }
};

const cancel = () => {
  if (editingId.value === null) return;

  const item = internalItems.value.find((i) => i.id === editingId.value);
  if (item) {
    item.text = originalValue.value;

    if (originalValue.value === "") {
      internalItems.value = internalItems.value.filter(
        (i) => i.id !== editingId.value,
      );
    }
  }

  editingId.value = null;
  errorMessage.value = "";
  syncToModel();
};

const removeItem = (id: number) => {
  internalItems.value = internalItems.value.filter((i) => i.id !== id);
  syncToModel();
};

const applyPrefill = () => {
  if (!props.prefillItems || props.readonly) return;

  const existingTrimmed = new Set(
    internalItems.value.map((i) => i.text.trim()),
  );
  let added = false;

  for (const newItem of props.prefillItems) {
    const trimmed = newItem.trim();
    if (trimmed && !existingTrimmed.has(trimmed)) {
      internalItems.value.push({ text: newItem, id: nextId++ });
      existingTrimmed.add(trimmed);
      added = true;
    }
  }

  if (added) {
    syncToModel();
    nextTick(scrollToBottom);
  }
};

const confirmClear = () => {
  internalItems.value = [];
  showClearDialog.value = false;
  syncToModel();
};
</script>

<style scoped>
.item-list {
  border-radius: 4px;
}

.item-row {
  padding: 0.375rem 0.5rem;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.item-row:last-child {
  border-bottom: none;
}

.item-row__content {
  min-width: 0;
}

.item-text {
  white-space: pre-wrap;
  line-height: 1.4;
  word-break: break-word;
}

.drag-handle:hover {
  opacity: 0.8;
}

.item-actions {
  opacity: 0;
  transition: opacity 0.15s;
}

.item-row:hover .item-actions {
  opacity: 1;
}

.item-ghost {
  opacity: 0.3;
  background: rgba(var(--v-theme-primary), 0.1);
}

.item-fallback {
  opacity: 0.85;
  background: rgb(var(--v-theme-surface));
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}
</style>
