<!-- src/components/panels/BackgroundSettingPanel.vue -->
<template>
  <panel-wrapper title="Setting" subtitle="Physical and atmospheric world details.">

    <v-row>
      <v-col cols="12" md="6">
        <generic-textarea-panel
          path="background.setting.location"
          title="Location"
          helper-text="The canonical where-and-when anchor — fill this first. Put the full picture here; the fields below are optional refinements. Example: 'Small snowy town in Vermont, present day.'"
          rows="3"
        />
      </v-col>
      <v-col cols="12" md="6">
        <generic-textarea-panel
          path="background.setting.era"
          title="Era"
          helper-text="Optional. Use when the historical period carries significance on its own and isn't already clear from Location."
          rows="3"
        />
      </v-col>
    </v-row>

    <v-row class="mt-2">
      <v-col cols="12" md="6">
        <generic-textarea-panel
          path="background.setting.city"
          title="City / Region"
          helper-text="Optional. A named city, town, or world area when the specific named place matters separately from the broad location."
          rows="3"
        />
      </v-col>
      <v-col cols="12" md="6">
        <generic-textarea-panel
          path="background.setting.specific_location"
          title="Specific Location"
          helper-text="Optional. Scene-level starting place within the city/world, when the opening location matters to establish early."
          rows="3"
        />
      </v-col>
    </v-row>

    <v-row class="mt-4">
      <v-col cols="12">
        <generic-textarea-panel
          path="background.setting.environment_tone"
          title="Environment Tone"
          helper-text="Overall mood/atmosphere."
          rows="4"
        />
      </v-col>
    </v-row>

    <v-row class="mt-4">
      <v-col cols="12" md="6">
        <generic-textarea-panel
          path="background.setting.realism"
          title="Realism"
          helper-text="Level of realism and any custom rules."
          rows="4"
        />
      </v-col>
      <v-col cols="12" md="6">
        <generic-textarea-panel
          path="background.setting.lifestyle"
          title="Lifestyle / Cultural Context"
          helper-text="Socioeconomic context, daily rhythms, or cultural backdrop."
          rows="4"
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
