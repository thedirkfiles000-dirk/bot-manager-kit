<template>
  <div class="d-inline-flex align-center">
    <v-chip
      v-if="overridingCount > 0"
      size="x-small"
      color="primary"
      class="ml-1"
      :title="`Overridden by: ${overridingVariants.join(', ')}`"
    >
      {{ overridingCount }}
    </v-chip>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import { useBotStore } from '@/stores/botStore';
  import { getOverridingVariants } from '@/utils/variantOverrides';

  const props = defineProps<{
    path: string; // Full path, e.g., "greeting" or "character.abc123.name"
    extraPaths?: string[]; // Additional paths to check for overrides
  }>();

  const botStore = useBotStore();

  const overridingVariants = computed<string[]>(() => {
    const bot = botStore.currentBot;
    if (!bot) return [];
    return [...getOverridingVariants(bot, props.path, props.extraPaths ?? [])].sort();
  });

  const overridingCount = computed(() => overridingVariants.value.length);
</script>