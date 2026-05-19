<!-- src/components/panels/BackgroundBoundariesPanel.vue -->
<template>
  <panel-wrapper title="Boundaries" subtitle="Global content restrictions (safety and scope).">

    <v-row density="compact">
      <v-col cols="12" md="6">
        <item-list-panel
            path="background.boundaries.allowed"
            title="Allowed Content"
            helper-text="Topics or elements explicitly permitted (rarely needed)."
            prevent-duplicates
            :show-add-button="true"
            :show-clear-button="true"
        />
      </v-col>
      <v-col cols="12" md="6">
        <item-list-panel
            path="background.boundaries.disallowed"
            title="Disallowed Content"
            helper-text="Topics or elements strictly forbidden."
            prevent-duplicates
            :show-add-button="true"
            :show-clear-button="true"
        />
      </v-col>
    </v-row>
  </panel-wrapper>
</template>

<script setup lang="ts">
import PanelWrapper from "@/components/PanelWrapper.vue";
  import ItemListPanel from "@/components/panels/ItemListPanel.vue";
  // No props needed — paths fixed at bot level
</script>
