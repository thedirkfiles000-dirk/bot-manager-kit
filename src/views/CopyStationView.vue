<template>
  <v-app>
    <v-app-bar elevation="0" border="b" class="px-2">
      <v-btn icon @click="goHome" class="ml-2">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
      <v-app-bar-title v-if="bot">
        Copy Station: {{ bot.name || "Unnamed Bot" }}
      </v-app-bar-title>
      <v-btn
        v-if="bot"
        icon="mdi-pencil"
        variant="text"
        @click="goToEditor"
        title="Edit this bot"
      />
      <v-spacer />
      <v-btn
        :icon="settingsStore.theme === 'dark' ? 'mdi-weather-sunny' : 'mdi-weather-night'"
        variant="text"
        @click="settingsStore.toggleTheme()"
        :title="settingsStore.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
      />
    </v-app-bar>

    <v-main>
      <v-container v-if="loading" class="d-flex justify-center my-8">
        <v-progress-circular indeterminate />
      </v-container>

      <v-container v-else-if="!bot" class="text-center my-8">
        <v-icon size="80" color="error">mdi-alert-circle-outline</v-icon>
        <p class="text-h5 mt-4">Bot not found</p>
        <v-btn color="primary" class="mt-4" @click="goHome">Back to Home</v-btn>
      </v-container>

      <v-container v-else fluid class="pa-4" style="max-width: 960px">
        <!-- Shared Settings -->
        <v-card variant="outlined" class="mb-6">
          <v-card-title class="pb-1">Shared Settings</v-card-title>
          <v-card-text>
            <div class="d-flex align-center flex-wrap ga-4">
              <v-btn-toggle
                v-model="station.format.value"
                density="compact"
                variant="outlined"
                color="primary"
                mandatory
              >
                <v-btn value="asMarkdown">Markdown</v-btn>
                <v-btn value="asYAML">YAML</v-btn>
                <v-btn value="asJSON">JSON</v-btn>
              </v-btn-toggle>

              <v-checkbox
                v-if="station.format.value === 'asMarkdown'"
                v-model="station.capsKeys.value"
                label="CAPS_KEYS"
                density="compact"
                hide-details
                class="flex-grow-0"
              >
                <v-tooltip activator="parent" location="top">
                  Renders field labels as UPPER_SNAKE_CASE in markdown output
                </v-tooltip>
              </v-checkbox>
            </div>
          </v-card-text>
        </v-card>

        <!-- Target Sections -->
        <copy-target-section
          v-for="ts in station.targetStates"
          :key="ts.target.id"
          :state="ts"
        />
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useBotStore } from "@/stores/botStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { exportTargets } from "@/config/targets";
import { useCopyStation } from "@/composables/useCopyStation";
import CopyTargetSection from "@/components/CopyTargetSection.vue";

const route = useRoute();
const router = useRouter();
const botStore = useBotStore();
const settingsStore = useSettingsStore();
const loading = ref(true);

const bot = computed(() => botStore.currentBot);
const station = useCopyStation(bot, exportTargets);

onMounted(async () => {
  const botId = route.params.botId as string;
  if (botId) {
    await botStore.loadFromDisk(botId);
  }
  loading.value = false;
});

function goHome() {
  router.push("/");
}

function goToEditor() {
  if (!bot.value) return;
  router.push({ name: "bot-tree", params: { botId: bot.value.id } });
}
</script>
