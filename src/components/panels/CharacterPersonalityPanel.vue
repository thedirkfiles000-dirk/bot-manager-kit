<!-- src/components/panels/CharacterPersonalityPanel.vue -->
<template>
  <panel-wrapper title="Personality" subtitle="Core traits, drives, and values.">

    <!-- Traits list -->
    <v-row>
      <v-col cols="12">
        <item-list-panel
          :path="`${props.charPrefix}.personality.traits`"
          title="Traits"
          helper-text="Neutral core traits — the LLM infers positive/negative contextually for nuance."
          prevent-duplicates
          :show-add-button="true"
          :show-clear-button="true"
        />
      </v-col>
    </v-row>

    <!-- Motivations -->
    <v-row class="mt-6">
      <v-col cols="12">
        <generic-textarea-panel
          :path="`${props.charPrefix}.personality.motivations`"
          title="Motivations"
          helper-text="What drives this character? Goals, desires, ambitions."
          rows="6"
        />
      </v-col>
    </v-row>

    <!-- Fears -->
    <v-row class="mt-4">
      <v-col cols="12">
        <generic-textarea-panel
          :path="`${props.charPrefix}.personality.fears`"
          title="Fears"
          helper-text="Deep fears, insecurities, or phobias."
          rows="6"
        />
      </v-col>
    </v-row>

    <!-- Values -->
    <v-row class="mt-4">
      <v-col cols="12">
        <generic-textarea-panel
          :path="`${props.charPrefix}.personality.values`"
          title="Values"
          helper-text="Core beliefs, morals, or principles."
          rows="6"
        />
      </v-col>
    </v-row>
  </panel-wrapper>
</template>

<script setup lang="ts">
import PanelWrapper from "@/components/PanelWrapper.vue";
  import GenericTextareaPanel from "@/components/panels/GenericTextareaPanel.vue";
  import ItemListPanel from "@/components/panels/ItemListPanel.vue";

  const props = defineProps<{
    charPrefix: string;
  }>();
</script>
