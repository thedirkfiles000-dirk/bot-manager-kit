<!-- src/components/panels/CharacterStoryHooksPanel.vue -->
<template>
  <panel-wrapper title="Story Hooks" subtitle="Current conflicts and long-term goals that drive the character's arc.">

    <!-- Side-by-side textareas (stacks on smaller screens) -->
    <v-row>
      <v-col cols="12" md="6">
        <generic-textarea-panel
          :path="`${props.charPrefix}.story_hooks.current_conflict`"
          title="Current Conflict"
          helper-text="Immediate problems, tensions, or challenges the character faces."
          rows="8"
        />
      </v-col>
      <v-col cols="12" md="6">
        <generic-textarea-panel
          :path="`${props.charPrefix}.story_hooks.goals`"
          title="Goals"
          helper-text="What the character wants to achieve — short-term or lifelong aspirations."
          rows="8"
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
