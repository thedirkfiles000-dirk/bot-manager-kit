<!-- src/components/panels/CharacterAppearancePanel.vue -->
<template>
  <panel-wrapper title="Appearance" subtitle="Physical description and notable features.">

    <!-- Short single-line fields -->
    <v-row density="compact">
      <v-col cols="12" md="6">
        <generic-text-field-panel
          :path="`${props.charPrefix}.appearance.height`"
          title="Height"
          placeholder="e.g., 5'10&quot; or 178 cm"
        />
      </v-col>
      <v-col cols="12" md="6">
        <generic-text-field-panel
          :path="`${props.charPrefix}.appearance.build`"
          title="Build"
          placeholder="e.g., athletic, slender, stocky"
        />
      </v-col>
    </v-row>

    <v-row density="compact" class="mt-0">
      <v-col cols="12" md="6">
        <generic-text-field-panel
          :path="`${props.charPrefix}.appearance.hair`"
          title="Hair"
          placeholder="color, length, style"
        />
      </v-col>
      <v-col cols="12" md="6">
        <generic-text-field-panel
          :path="`${props.charPrefix}.appearance.eyes`"
          title="Eyes"
          placeholder="color, shape"
        />
      </v-col>
    </v-row>

    <v-row class="mt-0">
      <v-col cols="12">
        <generic-text-field-panel
          :path="`${props.charPrefix}.appearance.style`"
          title="Overall Style"
          placeholder="fashion sense, typical clothing, vibe"
        />
      </v-col>
    </v-row>

    <!-- Notable features list -->
    <v-row class="mt-6">
      <v-col cols="12">
        <item-list-panel
          :path="`${props.charPrefix}.appearance.notable_features`"
          title="Notable Features"
          helper-text="Scars, tattoos, distinctive marks, etc."
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
  import GenericTextFieldPanel from "@/components/panels/GenericTextFieldPanel.vue";
  import ItemListPanel from "@/components/panels/ItemListPanel.vue";

  const props = defineProps<{
    charPrefix: string;
  }>();
</script>
