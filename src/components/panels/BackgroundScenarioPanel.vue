<template>
  <panel-wrapper title="Scenario" subtitle="The core premise, current ongoing events, and how the story begins with the user.">

    <v-row>
      <v-col cols="12">
        <generic-textarea-panel
          path="background.scenario.premise"
          title="Premise"
          helper-text="The foundational setup or core concept of the story/world."
          rows="6"
        />
      </v-col>
    </v-row>

    <v-row class="mt-4">
      <v-col cols="12">
        <generic-textarea-panel
          path="background.scenario.ongoing_dynamic"
          title="Ongoing Dynamic"
          helper-text="Current events, conflicts, or evolving situations in the story."
          rows="6"
        />
      </v-col>
    </v-row>

    <v-row class="mt-4">
      <v-col cols="12">
        <generic-textarea-panel
          path="background.scenario.starting_state_with_user"
          title="Starting State with User"
          helper-text="How the user is positioned at the beginning — role, circumstances, relationship to characters."
          rows="6"
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
