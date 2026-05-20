<!-- src/components/PanelWrapper.vue -->
<template>
  <div class="panel-container" :style="{ maxWidth: `${maxWidth}px` }">
    <div
      class="panel-header"
      :class="bordered ? ['d-flex', 'align-center', 'justify-start', 'mb-4', 'panel-header--bordered'] : 'mb-6'"
    >
      <div>
        <h2 v-if="!bordered" class="text-h5">{{ title }}</h2>
        <span v-else>{{ title }}</span>
        <div v-if="subtitle && !bordered" class="text-caption text-medium-emphasis mt-1">
          {{ subtitle }}
        </div>
      </div>
      <div v-if="$slots.actions" class="ml-auto actions">
        <slot name="actions" />
      </div>
    </div>
    <slot />
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  title: string;
  subtitle?: string;
  maxWidth?: number;
  bordered?: boolean;
}>(), {
  maxWidth: 1000,
  bordered: false,
});
</script>

<style scoped>
.panel-container {
  /*
   * width: 100% combined with max-width fills the available editor area
   * up to maxWidth, then centers via auto margins. Without width: 100%,
   * the auto margins in a flex-column parent collapse to content width.
   */
  width: 100%;
  margin: 0 auto;
}
.panel-header--bordered {
  border-bottom: 1px solid rgba(var(--v-border-color), 0.12);
  padding-bottom: 8px;
}
</style>
