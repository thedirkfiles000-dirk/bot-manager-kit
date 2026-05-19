<!-- src/components/panels/BotBasicPanel.vue -->
<template>
  <panel-wrapper title="Basic Info">

    <v-row>
      <v-col cols="12" md="6">
        <generic-text-field-panel
          path="name"
          title="Bot Display Name"
          placeholder="Enter a memorable name…"
          helper-text="The public name shown in listings and chats"
          :show-char-count="true"
          :max-length="25"
        />
      </v-col>
        <v-col cols="12" md="6">
        <generic-text-field-panel
          path="cid"
          title="Creator / Collection ID (CID)"
          placeholder="optional-creator-tag or collection-123"
          helper-text="Optional grouping or credit identifier (not shown to users)"
        />
      </v-col>
    </v-row>

    <v-row class="mt-4">
      <v-col cols="12">
        <generic-textarea-panel
          path="intro"
          title="Intro / Description"
          helper-text="Long-form internal premise & listing description (not sent to the LLM)"
          :show-char-count="true"
        />
      </v-col>
    </v-row>

    <v-row class="mt-4">
      <v-col cols="12">
        <generic-textarea-panel
          path="greeting"
          title="Greeting (First Message)"
          helper-text="The very first message the bot sends in a new conversation"
          :show-char-count="true"
        />
      </v-col>
    </v-row>

    <v-row class="mt-4">
      <v-col cols="12">
        <generic-textarea-panel
          path="usage_hints"
          title="Usage Hints"
          helper-text="Creator-only notes — how to use/share the bot (excluded from prompt)"
        />
      </v-col>
    </v-row>

    <v-row class="mt-4">
      <v-col cols="12">
        <item-list-panel
          path="rp_rules"
          title="RP Rules"
          helper-text="Core persistent roleplay rules placed early in the prompt for strongest LLM adherence. Use neutral, imperative phrasing."
          prevent-duplicates
        />
      </v-col>
    </v-row>
  </panel-wrapper>
</template>

<script setup lang="ts">
import PanelWrapper from "@/components/PanelWrapper.vue";
import GenericTextFieldPanel from "@/components/panels/GenericTextFieldPanel.vue";
import GenericTextareaPanel from "@/components/panels/GenericTextareaPanel.vue";
import ItemListPanel from "@/components/panels/ItemListPanel.vue";
</script>
