<!-- src/components/panels/BotResponsePriorityPanel.vue -->
<template>
  <panel-wrapper title="Response Priority" subtitle="Ordered tie-breaker for conflicting instructions. Earlier entries take precedence. Exported above Global Roleplay Rules so the LLM sees the conflict-resolution framework first.">

    <v-row>
      <v-col cols="12">
        <item-list-panel
          path="response_priority"
          title="Response Priority"
          helper-text="Drag to reorder — order is the meaning. Defaults are appropriate for most bots; override only when the bot has unusual mechanics."
          prevent-duplicates
          :prefill-items="defaultResponsePriority"
          prefill-button-label="Prefill Defaults"
        />
      </v-col>
    </v-row>
  </panel-wrapper>
</template>

<script setup lang="ts">
import PanelWrapper from "@/components/PanelWrapper.vue";
import ItemListPanel from "@/components/panels/ItemListPanel.vue";
import { defaultResponsePriority } from "@/utils/defaultBotGenerator";
</script>
