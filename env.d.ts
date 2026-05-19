/// <reference types="vite/client" />

declare module "*.md?raw" {
  const content: string;
  export default content;
}

interface ImportMetaEnv {
  readonly TAURI_ENV_DEBUG?: string;
  readonly TAURI_ENV_PLATFORM?: 'darwin' | 'freebsd' | 'linux' | 'windows';
  // Add more as needed (e.g., from tauri.conf.json)
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}