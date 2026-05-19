<template>
  <div class="d-flex align-center">
    <v-select
      v-model="activeVariant"
      :items="variantItems"
      item-title="title"
      item-value="value"
      label="Active Variant"
      variant="outlined"
      density="compact"
      style="width: 200px"
    >
      <template #prepend>
        <v-btn icon="mdi-plus" @click="showAddDialog = true" size="x-small" class="mr-1" />
        <v-btn
          icon="mdi-content-copy"
          @click="openCopyDialog"
          :disabled="activeVariant === null"
          size="x-small"
          class="mr-4"
        />
        <v-btn
          icon="mdi-delete"
          @click="confirmDelete"
          :disabled="activeVariant === null"
          size="x-small"
        />
      </template>
    </v-select>
  </div>

  <v-dialog v-model="showAddDialog" max-width="400">
    <v-card>
      <v-card-title>Add New Variant</v-card-title>
      <v-card-text>
        <v-text-field
          v-model="newName"
          label="Variant Name"
          :rules="nameRules"
          maxlength="32"
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn @click="showAddDialog = false">Cancel</v-btn>
        <v-btn color="primary" @click="addVariant" :disabled="!!nameError"
          >Add</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="showCopyDialog" max-width="400">
    <v-card>
      <v-card-title>Copy Variant</v-card-title>
      <v-card-text>
        <div class="text-caption text-medium-emphasis mb-4">
          Source: <strong>{{ activeVariant }}</strong>
        </div>
        <v-text-field
          v-model="copyName"
          label="New Variant Name"
          :rules="nameRules"
          maxlength="32"
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn @click="showCopyDialog = false">Cancel</v-btn>
        <v-btn color="primary" @click="copyVariant" :disabled="!!copyNameError">Copy</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="showDeleteDialog" max-width="400">
    <v-card>
      <v-card-title>Delete Variant</v-card-title>
      <v-card-text
        >Delete "{{ activeVariant }}"? This cannot be undone.</v-card-text
      >
      <v-card-actions>
        <v-spacer />
        <v-btn @click="showDeleteDialog = false">Cancel</v-btn>
        <v-btn color="error" @click="deleteVariant">Delete</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useBotStore } from "@/stores/botStore";
import { useVariantStore } from "@/stores/variantStore";

const botStore = useBotStore();
const variantStore = useVariantStore();

const activeVariant = computed({
  get: () => variantStore.activeVariant,
  set: (v: string | null) => variantStore.setActiveVariant(v),
});

const variantNames = computed(() =>
  Object.keys(botStore.currentBot?.variants || {}),
);

const variantItems = computed(() => [
  { value: null, title: "Base" },
  ...variantNames.value.map((n) => ({ value: n, title: n })),
]);

const showAddDialog = ref(false);
const newName = ref("");
const nameRules = [
  (v: string) => !!v || "Name required",
  (v: string) =>
    /^[a-zA-Z0-9_-]+$/.test(v) || "Alphanumeric, underscores, or hyphens only",
  (v: string) => v.length <= 32 || "Max 32 characters",
  (v: string) => !variantNames.value.includes(v) || "Name must be unique",
];
const nameError = computed(() =>
  nameRules.some((rule) => typeof rule(newName.value) === "string"),
);

const addVariant = () => {
  if (!botStore.currentBot || nameError.value) return;
  if (!botStore.currentBot.variants) botStore.currentBot.variants = {};
  botStore.currentBot.variants[newName.value] = {
    bot_overrides: [],
    character_overrides: [],
  };
  activeVariant.value = newName.value;
  botStore.setDirty();
  showAddDialog.value = false;
  newName.value = "";
};

const showCopyDialog = ref(false);
const copyName = ref("");
const copyNameError = computed(() =>
  nameRules.some((rule) => typeof rule(copyName.value) === "string"),
);

const openCopyDialog = () => {
  copyName.value = activeVariant.value ? `Copy of ${activeVariant.value}` : "";
  showCopyDialog.value = true;
};

const copyVariant = () => {
  if (!botStore.currentBot || !activeVariant.value || copyNameError.value) return;
  if (!botStore.currentBot.variants) botStore.currentBot.variants = {};
  const source = botStore.currentBot.variants[activeVariant.value];
  botStore.currentBot.variants[copyName.value] = JSON.parse(JSON.stringify(source));
  variantStore.setActiveVariant(copyName.value);
  botStore.setDirty();
  showCopyDialog.value = false;
  copyName.value = "";
};

const showDeleteDialog = ref(false);
const confirmDelete = () => (showDeleteDialog.value = true);

const deleteVariant = () => {
  if (!botStore.currentBot || !activeVariant.value) return;
  delete botStore.currentBot.variants?.[activeVariant.value];
  if (Object.keys(botStore.currentBot.variants || {}).length === 0)
    delete botStore.currentBot.variants;
  activeVariant.value = null;
  botStore.setDirty();
  showDeleteDialog.value = false;
};
</script>

<style scoped>
/* Style as needed */
</style>
