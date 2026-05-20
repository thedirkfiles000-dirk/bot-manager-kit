import { defineStore } from "pinia";
import { computed, ref, watch } from "vue";
import { join } from "@tauri-apps/api/path";
import {
  mkdir,
  readDir,
  readFile,
  readTextFile,
  remove,
  writeFile,
  writeTextFile,
} from "@tauri-apps/plugin-fs";
import { formatAjvErrors } from "@/utils/botValidator.ts";
import { useActiveSchemaStore } from "@/stores/activeSchemaStore.ts";
import { botsDirFor } from "@/utils/schemaLoader.ts";
import type { StarterBot } from "@/types/botSchema.ts";
import { stripEmpties } from "@/types/typeSupport.ts";
import { createDefaultBot } from "@/utils/defaultBotGenerator.ts";
import { useNotify } from "@/composables/useNotify.ts";
import { getMime } from "@/composables/useImageUtils.ts";

const blobUrls = ref<Set<string>>(new Set());

export const useBotStore = defineStore("bot", () => {
  const notify = useNotify();
  const activeSchemaStore = useActiveSchemaStore();
  const currentBot = ref<StarterBot | null>(null);
  const isDirty = ref(false);
  const editGeneration = ref(0);
  const loading = ref(false);

  // Centralized image URLs for the current bot (filename → data URL)
  const imageUrls = ref<Record<string, string>>({});

  function cleanupBlobUrls() {
    blobUrls.value.forEach((url) => URL.revokeObjectURL(url));
    blobUrls.value.clear();
    imageUrls.value = {};
  }

  /** Throws if no schema is active. Path operations are meaningless without one. */
  function requireActiveSchema(): string {
    const name = activeSchemaStore.active?.name;
    if (!name) {
      throw new Error("No schema is active — cannot operate on bots.");
    }
    return name;
  }

  async function imagesDirForBot(botId: string): Promise<string> {
    const botsDir = await botsDirFor(requireActiveSchema());
    return join(botsDir, botId, "images");
  }

  async function syncImagesFromDisk() {
    if (!currentBot.value) return;
    const imagesDir = await imagesDirForBot(currentBot.value.id);

    let changed = false;

    try {
      await mkdir(imagesDir, { recursive: true });

      const entries = await readDir(imagesDir);
      const diskFiles = entries
        .filter((e) => e.name)
        .map((e) => e.name!)
        .filter((name) => {
          const ext = name.toLowerCase().split(".").pop();
          return ["png", "jpg", "jpeg", "gif", "webp", "svg", "avif"].includes(
            ext ?? "",
          );
        });

      const declared = new Set(currentBot.value.images ?? []);

      const toRemove = [...declared].filter((f) => !diskFiles.includes(f));
      if (toRemove.length > 0) {
        currentBot.value.images =
          currentBot.value.images?.filter((f) => !toRemove.includes(f)) ?? [];
        if (toRemove.includes(currentBot.value.profileImage ?? "")) {
          currentBot.value.profileImage = undefined;
        }
        changed = true;
      }

      const toAdd = diskFiles.filter((f) => !declared.has(f));
      if (toAdd.length > 0) {
        if (!currentBot.value.images) currentBot.value.images = [];
        currentBot.value.images.push(...toAdd);
        changed = true;
      }

      await loadImages();

      if (changed) {
        setDirty();
        notify.success(
          `Images synced: ${toAdd.length} added, ${toRemove.length} removed`,
        );
      } else {
        notify.info("Images already in sync");
      }
    } catch (e) {
      console.error("Failed to sync images:", e);
      notify.error("Failed to sync images – check console");
    }
  }

  const sortedImages = computed(() => {
    if (!currentBot.value) return [];
    const list = currentBot.value.images ?? [];
    const profile = currentBot.value.profileImage;
    if (profile && list.includes(profile)) {
      return [profile, ...list.filter((i) => i !== profile)];
    }
    return list;
  });

  async function loadImages() {
    if (!currentBot.value) {
      cleanupBlobUrls();
      return;
    }

    cleanupBlobUrls();

    const imagesDir = await imagesDirForBot(currentBot.value.id);
    const declared = currentBot.value.images ?? [];

    for (const filename of declared) {
      const path = await join(imagesDir, filename);
      try {
        const bytes = await readFile(path);
        const mime = getMime(filename);
        const blob = new Blob([bytes], { type: mime });
        const url = URL.createObjectURL(blob);
        imageUrls.value[filename] = url;
        blobUrls.value.add(url);
      } catch (e) {
        console.warn(`Failed to load image ${filename}:`, e);
        currentBot.value.images = declared.filter((f) => f !== filename);
        if (currentBot.value.profileImage === filename) {
          currentBot.value.profileImage = undefined;
        }
        setDirty();
      }
    }
  }

  async function addImage(file: File) {
    if (!currentBot.value) return;
    const imagesDir = await imagesDirForBot(currentBot.value.id);
    await mkdir(imagesDir, { recursive: true });

    let name = file.name;
    const existing = new Set(currentBot.value.images ?? []);
    let counter = 1;
    const base = name.replace(/\.[^.]+$/, "");
    const ext = name.split(".").pop() ?? "";
    while (existing.has(name)) {
      name = `${base} (${counter}).${ext}`;
      counter++;
    }

    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    await writeFile(await join(imagesDir, name), bytes);

    if (!currentBot.value.images) currentBot.value.images = [];
    currentBot.value.images.push(name);

    const url = URL.createObjectURL(file);
    imageUrls.value[name] = url;
    blobUrls.value.add(url);

    setDirty();
  }

  async function removeImage(filename: string) {
    if (!currentBot.value) return;
    const imagesDir = await imagesDirForBot(currentBot.value.id);
    const path = await join(imagesDir, filename);

    try {
      await remove(path);
    } catch (e) {
      console.warn(`Failed to delete image file ${filename}:`, e);
    }

    currentBot.value.images =
      currentBot.value.images?.filter((f) => f !== filename) ?? [];
    if (currentBot.value.profileImage === filename) {
      currentBot.value.profileImage = undefined;
    }

    const url = imageUrls.value[filename];
    if (url) {
      URL.revokeObjectURL(url);
      blobUrls.value.delete(url);
      delete imageUrls.value[filename];
    }

    setDirty();
  }

  function setProfileImage(filename: string | undefined) {
    if (!currentBot.value) return;
    currentBot.value.profileImage = filename;
    setDirty();
  }

  async function loadFromDisk(botId: string) {
    loading.value = true;
    cleanupBlobUrls();
    try {
      const botsDir = await botsDirFor(requireActiveSchema());
      const botFolder = await join(botsDir, botId);
      const path = await join(botFolder, "bot.json");

      const content = await readTextFile(path);
      let parsed = JSON.parse(content);

      // UI-only field that may have been stamped by HomeView previously.
      delete parsed._valid;

      currentBot.value = parsed;

      const { valid, errors } = activeSchemaStore.validateBot(currentBot.value);
      if (!valid) {
        throw new Error(
          "Invalid bot file: " + formatAjvErrors(errors).join("; "),
        );
      }

      if (!currentBot.value!.images) {
        currentBot.value!.images = [];
      }

      await loadImages();

      isDirty.value = false;
    } catch (e: any) {
      console.error("Failed to load bot:", e);

      if (e.message?.includes("Invalid bot file")) {
        notify.error(`Failed to load bot – invalid file:\n${e.message}`);
      } else {
        notify.error(`Failed to load bot: ${e.message || "Unknown error"}`);
      }

      currentBot.value = null;
    }
    loading.value = false;
  }

  function clear() {
    cleanupBlobUrls();
    currentBot.value = null;
    isDirty.value = false;
  }

  async function save() {
    if (!currentBot.value) return;

    try {
      loading.value = true;

      const { valid, errors } = activeSchemaStore.validateBot(currentBot.value);
      if (!valid) {
        const errorMsg =
          "Cannot save bot – validation failed:\n" +
          formatAjvErrors(errors).join("\n");
        notify.error(errorMsg);
        return;
      }

      const botsDir = await botsDirFor(requireActiveSchema());
      const botFolder = await join(botsDir, currentBot.value.id);
      await mkdir(botFolder, { recursive: true });

      const updatedBot = {
        ...currentBot.value,
        lastModified: new Date().toISOString(),
      };

      const lean = stripEmpties(updatedBot) as Record<string, any>;
      // Ensure system-required fields survive stripEmpties even when empty.
      lean.id = updatedBot.id;
      lean.name = updatedBot.name;
      lean.lastModified = updatedBot.lastModified;

      const path = await join(botFolder, "bot.json");
      await writeTextFile(path, JSON.stringify(lean, null, 2));

      currentBot.value = updatedBot;
      isDirty.value = false;

      notify.success("Bot saved successfully");
    } catch (e) {
      console.error("Save failed:", e);
      notify.error("Failed to save bot – check console for details");
    } finally {
      loading.value = false;
    }
  }

  async function createNew() {
    try {
      currentBot.value = createDefaultBot();
      currentBot.value.images = [];

      const botsDir = await botsDirFor(requireActiveSchema());
      const botFolder = await join(botsDir, currentBot.value.id);
      const imagesDir = await join(botFolder, "images");
      await mkdir(imagesDir, { recursive: true });

      await save();

      notify.success(`New bot "${currentBot.value.name}" created`);
    } catch (e) {
      console.error("Failed to create new bot:", e);
      notify.error("Failed to create new bot – please try again.");
      currentBot.value = null;
    }
  }

  function setDirty() {
    isDirty.value = true;
    editGeneration.value++;
  }

  watch(
    currentBot,
    async (newBot) => {
      if (newBot) await loadImages();
      else cleanupBlobUrls();
    },
    { deep: false },
  );

  return {
    currentBot,
    isDirty,
    editGeneration,
    loading,
    imageUrls,
    sortedImages,
    loadImages,
    addImage,
    removeImage,
    setProfileImage,
    loadFromDisk,
    save,
    createNew,
    setDirty,
    clear,
    syncImagesFromDisk,
    cleanupBlobUrls,
  };
});
