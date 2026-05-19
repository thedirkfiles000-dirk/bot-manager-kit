<!-- src/components/panels/CharacterViewpointPanel.vue -->
<template>
  <panel-wrapper
    title="Drive & Viewpoint"
    subtitle="The character's core motivation distilled to one sentence, and how they specifically perceive the user."
  >

    <v-row>
      <v-col cols="12">
        <generic-textarea-panel
          :path="`${props.charPrefix}.core_drive`"
          title="Core Drive"
          helper-text="Distilled single-sentence motivation — the engine behind all behavior. Complements personality motivations with maximum compression."
          rows="3"
        />
      </v-col>
    </v-row>

    <v-row class="mt-4">
      <v-col cols="12">
        <generic-textarea-panel
          :path="`${props.charPrefix}.user_viewpoint`"
          title="User Viewpoint"
          helper-text="How this character specifically perceives the user's character — their lens, biases, and unspoken feelings toward the user."
          rows="5"
        />
      </v-col>
    </v-row>

  </panel-wrapper>
</template>

<script setup lang="ts">
import PanelWrapper from "@/components/PanelWrapper.vue";
import GenericTextareaPanel from "@/components/panels/GenericTextareaPanel.vue";

const props = defineProps<{
  charPrefix: string;
}>();
</script>
