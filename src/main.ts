// src/main.ts (simplified – just import the ready router)
import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";

import "@mdi/font/css/materialdesignicons.css";
import "vuetify/styles";

import { createVuetify } from "vuetify";
import { aliases, mdi } from "vuetify/iconsets/mdi";
import { createNotificationsPlugin } from "@vuetify/v0";

import { createPinia } from "pinia";
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import router from "@/router";

declare const __APP_VERSION__: string;
export const botManagerVersion = () => __APP_VERSION__;

const vuetify = createVuetify({
  theme: {
    defaultTheme: "light",
  },
  icons: {
    defaultSet: "mdi",
    aliases,
    sets: { mdi },
  },
});

const app = createApp(App);

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate)
app.use(pinia);

app.use(vuetify);
app.use(createNotificationsPlugin({ timeout: 8000 }));
app.use(router);

app.mount("#app");