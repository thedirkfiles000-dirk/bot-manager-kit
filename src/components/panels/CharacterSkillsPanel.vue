<!-- src/components/panels/CharacterSkillsPanel.vue -->
<template>
  <panel-wrapper title="Skills" subtitle="Expertise, hobbies, strengths, and limitations.">

    <!-- 2x2 grid of lists -->
    <v-row density="compact">
      <v-col cols="12" md="6">
        <item-list-panel
          :path="`${props.charPrefix}.skills.expertise`"
          title="Expertise"
          helper-text="Professional or specialized skills"
          prevent-duplicates
          :show-add-button="true"
          :show-clear-button="true"
        />
      </v-col>
      <v-col cols="12" md="6">
        <item-list-panel
          :path="`${props.charPrefix}.skills.hobbies`"
          title="Hobbies"
          helper-text="Personal interests and pastimes"
          prevent-duplicates
          :show-add-button="true"
          :show-clear-button="true"
        />
      </v-col>
    </v-row>

    <v-row density="compact" class="mt-4">
      <v-col cols="12" md="6">
        <item-list-panel
          :path="`${props.charPrefix}.skills.strengths`"
          title="Strengths"
          helper-text="Natural talents or strong abilities"
          prevent-duplicates
          :show-add-button="true"
          :show-clear-button="true"
        />
      </v-col>
      <v-col cols="12" md="6">
        <item-list-panel
          :path="`${props.charPrefix}.skills.limitations`"
          title="Limitations"
          helper-text="Weaknesses, inexperience, or constraints"
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
  import ItemListPanel from "@/components/panels/ItemListPanel.vue";

  const props = defineProps<{
    charPrefix: string;
  }>();
</script>
