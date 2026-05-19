<!-- src/components/panels/CharacterBasicPanel.vue -->
<template>
  <panel-wrapper title="Basic Info" subtitle="Core identity and creator notes for this character.">

    <!-- Short single-line fields -->
    <v-row density="compact">
      <v-col cols="12" md="4">
        <generic-text-field-panel
          :path="`${props.charPrefix}.name`"
          title="Name"
          placeholder="Character name"
        />
      </v-col>
      <v-col cols="12" md="4">
        <generic-text-field-panel
          :path="`${props.charPrefix}.full_name`"
          title="Full Name"
          placeholder="Optional full/legal name"
        />
      </v-col>
      <v-col cols="12" md="4">
        <generic-text-field-panel
          :path="`${props.charPrefix}.nickname`"
          title="Nickname"
          placeholder="e.g., Bri, Doc"
        />
      </v-col>
    </v-row>

    <v-row density="compact" class="mt-0">
      <v-col cols="12">
        <generic-text-field-panel
          :path="`${props.charPrefix}.archetype`"
          title="Archetype"
          placeholder="e.g., The Obsessive Protector"
          helper-text="Single-label shorthand giving the LLM an immediate framing anchor."
        />
      </v-col>
    </v-row>

    <v-row density="compact" class="mt-0">
      <v-col cols="12" sm="6" md="4">
        <generic-number-field-panel
          :path="`${props.charPrefix}.age`"
          title="Age"
          placeholder="e.g. 25"
          :default-value="25"
        />
      </v-col>
      <v-col cols="12" sm="6" md="4">
        <generic-text-field-panel
          :path="`${props.charPrefix}.gender`"
          title="Gender"
        />
      </v-col>
    </v-row>

    <v-row density="compact" class="mt-0">
      <v-col cols="12">
        <generic-text-field-panel
          :path="`${props.charPrefix}.orientation`"
          title="Orientation"
        />
      </v-col>
    </v-row>

    <v-row density="compact" class="mt-0">
      <v-col cols="12">
        <generic-text-field-panel
          :path="`${props.charPrefix}.role`"
          title="Role"
          placeholder="e.g., Protagonist, Mentor"
        />
      </v-col>
    </v-row>

    <!-- Longer text areas -->
    <v-row class="mt-4">
      <v-col cols="12">
        <generic-textarea-panel
          :path="`${props.charPrefix}.overview`"
          title="Overview"
          helper-text="One-paragraph summary/vibe."
        />
      </v-col>
    </v-row>

  </panel-wrapper>
</template>

<script setup lang="ts">
import PanelWrapper from "@/components/PanelWrapper.vue";
import GenericTextareaPanel from "@/components/panels/GenericTextareaPanel.vue";
import GenericTextFieldPanel from "@/components/panels/GenericTextFieldPanel.vue";
import GenericNumberFieldPanel from "@/components/panels/GenericNumberFieldPanel.vue";

const props = defineProps<{
  charPrefix: string;
}>();
</script>
