<!-- src/views/SchemaPickerView.vue -->
<template>
  <v-container class="py-8" style="max-width: 1100px">
    <div class="d-flex align-center mb-6">
      <h1 class="text-h4 flex-grow-1">Bot Manager Kit</h1>
      <v-btn
        :icon="settingsStore.theme === 'dark' ? 'mdi-weather-sunny' : 'mdi-weather-night'"
        variant="text"
        @click="settingsStore.toggleTheme()"
        :title="settingsStore.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
      />
    </div>

      <p class="text-body-1 text-medium-emphasis mb-6">
        Pick a schema to work with. Each schema defines the bot structure, the
        editor panels, and the export targets for its session. Schemas live at
        <code>BotSchemas/&lt;name&gt;/</code> in your app data folder, alongside
        the bots that conform to them.
      </p>

      <div v-if="loading" class="d-flex justify-center my-8">
        <v-progress-circular indeterminate />
      </div>

      <div v-else-if="schemas.length === 0" class="text-center my-12">
        <v-icon size="80" color="warning">mdi-folder-alert-outline</v-icon>
        <p class="text-h6 mt-4">No schemas found.</p>
        <p class="text-body-2 text-medium-emphasis">
          Add a schema folder under {{ schemasRootDisplay }} and reload.
        </p>
        <v-btn class="mt-4" prepend-icon="mdi-refresh" @click="loadSchemas">
          Reload
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
          <v-card
            class="h-100 d-flex flex-column"
            variant="outlined"
            hover
            @click="pick(meta)"
          >
            <v-card-title class="pb-1">{{ meta.title }}</v-card-title>
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
              <v-btn color="primary" variant="tonal" append-icon="mdi-arrow-right">
                Open
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>

    <div class="text-caption text-medium-emphasis mt-8">
      Schemas root: <code>{{ schemasRootDisplay }}</code>
    </div>
  </v-container>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useActiveSchemaStore, type SchemaMetadata } from "@/stores/activeSchemaStore";
import { useSettingsStore } from "@/stores/settingsStore";
import {
  countBotsFor,
  discoverSchemas,
  getSchemasRoot,
} from "@/utils/schemaLoader";

const router = useRouter();
const activeSchemaStore = useActiveSchemaStore();
const settingsStore = useSettingsStore();

const schemas = ref<SchemaMetadata[]>([]);
const botCounts = ref<Record<string, number>>({});
const schemasRootDisplay = ref<string>("");
const loading = ref(true);

async function loadSchemas() {
  loading.value = true;
  try {
    schemasRootDisplay.value = await getSchemasRoot();
    const list = await discoverSchemas();
    schemas.value = list;
    activeSchemaStore.setAvailable(list);

    // Fire-and-forget bot counts (per-schema dir listings shouldn't block UI).
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
  } finally {
    loading.value = false;
  }
}

function pick(meta: SchemaMetadata) {
  activeSchemaStore.setActive(meta);
  router.push({ name: "schema-home", params: { schemaName: meta.name } });
}

onMounted(loadSchemas);
</script>
