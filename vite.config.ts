// vite.config.ts
import { fileURLToPath, URL } from "node:url";
import { readFileSync } from "node:fs";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vuetify from "vite-plugin-vuetify";

const tauriConf = JSON.parse(readFileSync("./src-tauri/tauri.conf.json", "utf-8"));

export default defineConfig((_env) => {
  return {
    plugins: [
      vue(),
      vuetify({
        autoImport: true,
      }),
    ],

    define: {
      __APP_VERSION__: JSON.stringify(tauriConf.version),
      "process.env": {},
    },

    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },

    clearScreen: false,

    server: {
      port: 3000,
      strictPort: true,
      open: true,
      host: process.env.TAURI_DEV_HOST || false,
      hmr: process.env.TAURI_DEV_HOST
        ? {
            protocol: "ws",
            host: process.env.TAURI_DEV_HOST,
            port: 1421,
          }
        : undefined,
      watch: {
        ignored: ["**/src-tauri/**"],
      },
      fs: {
        allow: [".", "E:/.pnpm"],
      },
    },

    envPrefix: ["VITE_", "TAURI_ENV_*"],

    build: {
      target:
        process.env.TAURI_ENV_PLATFORM === "windows"
          ? "chrome105"
          : "esnext",
      minify: !process.env.TAURI_ENV_DEBUG ? "oxc" : false,
      sourcemap: !!process.env.TAURI_ENV_DEBUG,
    },
  };
});
