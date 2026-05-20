<template>
  <v-container fluid class="pa-4" style="max-width: 1100px">
    <!-- Header -->
    <v-row align="center" class="mb-4" no-gutters>
      <v-col cols="12" md="auto">
        <div class="d-flex align-center ga-3">
          <v-btn
            variant="text"
            size="small"
            prepend-icon="mdi-arrow-left"
            @click="goBackToLibrary"
          >
            Library
          </v-btn>
          <span class="text-h6">
            Copy Station — {{ bot?.name || "Untitled Bot" }}
          </span>
        </div>
      </v-col>
    </v-row>

    <div v-if="loading" class="d-flex justify-center my-8">
      <v-progress-circular indeterminate />
    </div>

    <div v-else-if="!bot" class="text-center my-8">
      <v-icon size="80" color="error">mdi-alert-circle-outline</v-icon>
      <p class="text-h5 mt-4">Bot not found.</p>
    </div>

    <template v-else>
      <p class="text-body-2 text-medium-emphasis mb-4">
        Each card below corresponds to one of the four chat-bot output buckets
        the kit assumes. Fields are assigned to a bucket via the schema's
        <code>x-export-target</code> annotation. Toggle individual fields off
        to mask them; the markdown updates live.
      </p>

      <v-card
        v-for="card in station.targets"
        :key="card.target"
        variant="outlined"
        class="mb-4"
      >
        <v-card-title class="d-flex align-center pb-1">
          <span>{{ card.target }}</span>
          <v-chip
            v-if="!card.hasFields.value"
            size="x-small"
            variant="tonal"
            color="grey"
            class="ml-3"
          >
            no fields tagged
          </v-chip>
          <v-spacer />
          <v-btn
            v-if="card.hasFields.value"
            size="small"
            variant="tonal"
            color="primary"
            prepend-icon="mdi-content-copy"
            :disabled="card.markdown.value.length === 0"
            @click="copyOutput(card.target, card.markdown.value)"
          >
            {{ copiedTarget === card.target ? "Copied!" : "Copy" }}
          </v-btn>
        </v-card-title>

        <v-card-text v-if="card.hasFields.value">
          <!-- Field mask toggles -->
          <div class="d-flex flex-wrap ga-2 mb-3">
            <v-chip
              v-for="meta in metaForTarget(card.target)"
              :key="meta.name"
              size="small"
              variant="tonal"
              :color="card.maskedFields.value.has(meta.name) ? 'grey' : 'primary'"
              :prepend-icon="
                card.maskedFields.value.has(meta.name)
                  ? 'mdi-eye-off-outline'
                  : 'mdi-eye-outline'
              "
              @click="card.toggleMask(meta.name)"
            >
              {{ meta.label }}
            </v-chip>
            <v-btn
              v-if="card.maskedFields.value.size > 0"
              size="x-small"
              variant="text"
              color="error"
              @click="card.resetMask()"
            >
              Reset
            </v-btn>
          </div>

          <!-- Markdown preview -->
          <v-textarea
            :model-value="card.markdown.value"
            variant="outlined"
            density="compact"
            rows="6"
            auto-grow
            hide-details
            readonly
            class="markdown-preview"
          />
        </v-card-text>

        <v-card-text v-else class="text-caption text-medium-emphasis">
          No schema fields are tagged with
          <code>x-export-target: "{{ card.target }}"</code>. Add the
          annotation to a field in
          <code>BotSchemas/{{ schemaName }}/schema.json</code> to populate
          this card.
        </v-card-text>
      </v-card>
    </template>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useBotStore } from "@/stores/botStore";
import { useCopyStation, metaFor } from "@/composables/useCopyStation";
import type { OutputTarget } from "@/utils/exportMarkdown";

const route = useRoute();
const router = useRouter();
const botStore = useBotStore();
const loading = ref(true);
const copiedTarget = ref<OutputTarget | null>(null);

const schemaName = computed(() => route.params.schemaName as string);
const bot = computed(() => botStore.currentBot);

const station = useCopyStation();

onMounted(async () => {
  const botId = route.params.botId as string;
  if (botId) {
    await botStore.loadFromDisk(botId);
  }
  loading.value = false;
});

function metaForTarget(target: OutputTarget) {
  return metaFor(target);
}

function goBackToLibrary() {
  router.push({ name: "schema-home", params: { schemaName: schemaName.value } });
}

async function copyOutput(target: OutputTarget, text: string) {
  try {
    await navigator.clipboard.writeText(text);
    copiedTarget.value = target;
    setTimeout(() => {
      if (copiedTarget.value === target) copiedTarget.value = null;
    }, 1500);
  } catch (e) {
    console.error("Clipboard write failed:", e);
  }
}
</script>

<style scoped>
.markdown-preview :deep(textarea) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, monospace;
  font-size: 0.875rem;
  line-height: 1.45;
}
</style>
