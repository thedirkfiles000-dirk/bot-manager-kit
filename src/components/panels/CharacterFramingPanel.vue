<!-- src/components/panels/CharacterFramingPanel.vue -->
<template>
  <panel-wrapper title="Character RP Rules" subtitle="Character-specific persistent roleplay rules that supplement the global RP Rules.">

    <v-row>
      <v-col cols="12">
        <item-list-panel
            :path="`${props.charPrefix}.character_rp_rules`"
            title="RP Rules"
            helper-text="Persistent rules specific to this character, such as perspective limits or behavioral constraints."
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
