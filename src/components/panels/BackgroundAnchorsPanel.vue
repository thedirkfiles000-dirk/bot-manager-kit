<!-- src/components/panels/BackgroundAnchorsPanel.vue -->
<template>
  <panel-wrapper title="Anchors &amp; Triggers" subtitle="Persistent world facts and conditional plot logic.">

    <v-row>
      <v-col cols="12">
        <item-list-panel
          path="background.anchors"
          title="Anchors"
          helper-text="Immutable facts that must never be contradicted. Declarative sentences (e.g. &quot;The war has lasted 20 years&quot;)."
          prevent-duplicates
        />
      </v-col>
    </v-row>

    <v-row class="mt-4">
      <v-col cols="12">
        <item-list-panel
          path="background.triggers"
          title="Triggers"
          helper-text="Conditional guidance for the LLM. Use If/When phrasing (e.g. &quot;If the user mentions the locket, hint it holds a key&quot;)."
          prevent-duplicates
        />
      </v-col>
    </v-row>
  </panel-wrapper>
</template>

<script setup lang="ts">
import PanelWrapper from "@/components/PanelWrapper.vue";
import ItemListPanel from "@/components/panels/ItemListPanel.vue";
</script>
