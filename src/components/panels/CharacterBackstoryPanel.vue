<!-- src/components/panels/CharacterBackstoryPanel.vue -->
<template>
  <panel-wrapper title="Backstory" subtitle="Detailed history (foundation for motivations/behavior).">

    <v-row>
      <v-col cols="12">
        <generic-textarea-panel
            :path="`${props.charPrefix}.backstory`"
            title="Backstory"
            helper-text="Detailed history that informs the character's motivations, fears, values, and behavior."
            rows="12"
            auto-grow
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
