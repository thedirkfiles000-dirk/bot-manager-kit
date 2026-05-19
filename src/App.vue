<template>
  <v-app :theme="settings.theme">
    <v-main scrollable>
      <router-view />
    </v-main>
  </v-app>

  <global-notification />
</template>

<script setup lang="ts">
import { RouterView } from "vue-router";
import GlobalNotification from "@/components/GlobalNotification.vue";
import { useSettingsStore } from "@/stores/settingsStore";

const settings = useSettingsStore();
</script>
