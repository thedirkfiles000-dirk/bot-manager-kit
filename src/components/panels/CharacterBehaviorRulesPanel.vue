<!-- src/components/panels/CharacterBehaviorRulesPanel.vue -->
<template>
  <panel-wrapper title="Behavior Rules" subtitle="Scoped guidelines for how this character behaves, speaks, and interacts.">

    <!-- Boundaries -->
    <v-row>
      <v-col cols="12">
        <generic-textarea-panel
          :path="`${props.charPrefix}.behavior_rules.boundaries`"
          title="Boundaries"
          helper-text="Prose hard limits or restrictions on what the character will/will not do."
          rows="6"
        />
      </v-col>
    </v-row>

    <!-- Preferred / Disallowed scene types side-by-side -->
    <v-row density="compact" class="mt-6">
      <v-col cols="12" md="6">
        <item-list-panel
          :path="`${props.charPrefix}.behavior_rules.preferred_scene_types`"
          title="Preferred Scene Types"
          helper-text="Types of scenes or interactions the character enjoys or excels in."
          prevent-duplicates
          :show-add-button="true"
          :show-clear-button="true"
        />
      </v-col>
      <v-col cols="12" md="6">
        <item-list-panel
          :path="`${props.charPrefix}.behavior_rules.disallowed_scenes`"
          title="Disallowed Scenes"
          helper-text="Scenes or topics the character absolutely avoids or refuses."
          prevent-duplicates
          :show-add-button="true"
          :show-clear-button="true"
        />
      </v-col>
    </v-row>

    <!-- Romantic Availability -->
    <v-row class="mt-6">
      <v-col cols="12">
        <generic-textarea-panel
          :path="`${props.charPrefix}.behavior_rules.romantic_availability`"
          title="Romantic Availability"
          helper-text="How open this character is to romantic or sexual engagement, and any conditions or limits. Leave blank for non-romantic characters."
          rows="5"
        />
      </v-col>
    </v-row>

    <!-- Speech Style + Dialect side-by-side -->
    <v-row density="compact" class="mt-4">
      <v-col cols="12" md="6">
        <generic-textarea-panel
          :path="`${props.charPrefix}.behavior_rules.speech_style`"
          title="Speech Style"
          helper-text="How the character speaks — formality, verbosity, rhythm, vocabulary."
          rows="5"
        />
      </v-col>
      <v-col cols="12" md="6">
        <generic-textarea-panel
          :path="`${props.charPrefix}.behavior_rules.dialect_or_accent`"
          title="Dialect or Accent"
          helper-text="Regional dialect, accent, or language quirks (e.g., 'Scots brogue', 'drops g's when relaxed, crisp when angry')."
          rows="5"
        />
      </v-col>
    </v-row>

    <!-- Pacing Preference -->
    <v-row class="mt-4">
      <v-col cols="12">
        <generic-textarea-panel
          :path="`${props.charPrefix}.behavior_rules.pacing_preference`"
          title="Pacing Preference"
          helper-text="Preferred response pacing (e.g., deliberate, rapid)."
          rows="4"
        />
      </v-col>
    </v-row>

    <!-- Character Specific Themes -->
    <v-row class="mt-4">
      <v-col cols="12">
        <generic-textarea-panel
          :path="`${props.charPrefix}.behavior_rules.character_specific_themes`"
          title="Character Specific Themes"
          helper-text="Personal themes/motifs (e.g., redemption, isolation)."
          rows="5"
        />
      </v-col>
    </v-row>

    <!-- Anchors & Triggers -->
    <v-row density="compact" class="mt-6">
      <v-col cols="12" md="6">
        <item-list-panel
          :path="`${props.charPrefix}.character_anchors`"
          title="Character Anchors"
          helper-text="Persistent facts specific to this character that must never be contradicted."
          prevent-duplicates
        />
      </v-col>
      <v-col cols="12" md="6">
        <item-list-panel
          :path="`${props.charPrefix}.character_triggers`"
          title="Character Triggers"
          helper-text="Conditional behaviors for this character. Use If/When phrasing."
          prevent-duplicates
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
