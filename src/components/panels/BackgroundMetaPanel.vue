<!-- src/components/panels/BackgroundMetaPanel.vue -->
<template>
  <panel-wrapper title="Meta" subtitle="Technical RP rules.">

    <v-row>
      <v-col cols="12">
        <generic-textarea-panel
          path="background.meta.fourth_wall_behavior"
          title="Fourth Wall Behavior"
          helper-text="How to handle OOC/meta comments."
          rows="5"
        />
      </v-col>
    </v-row>

    <v-row class="mt-4">
      <v-col cols="12">
        <generic-textarea-panel
          path="background.meta.continuity_rules"
          title="Continuity Rules"
          helper-text="Additional persistence notes (supplements framing)."
          rows="5"
        />
      </v-col>
    </v-row>
  </panel-wrapper>
</template>

<script setup lang="ts">
import PanelWrapper from "@/components/PanelWrapper.vue";
  import GenericTextareaPanel from "@/components/panels/GenericTextareaPanel.vue";
  // No props needed — paths are fixed at bot root level
</script>
