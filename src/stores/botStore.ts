import { defineStore } from "pinia";
import { useVariantStore } from "@/stores/variantStore.ts";
import { computed, ref, watch } from "vue";
import { appLocalDataDir, join } from "@tauri-apps/api/path";
import {
  mkdir,
  readDir,
  readFile,
  readTextFile,
  remove,
  writeFile,
  writeTextFile,
} from "@tauri-apps/plugin-fs";
import { formatAjvErrors, validateBotData, classifyBot } from "@/utils/botValidator.ts";
import { useComplianceStore } from "@/stores/complianceStore.ts";
import { CharacterProfile, GrokBotProfile } from "@/types/botSchema.ts";
import { pruneRedundantOverrides } from "@/utils/variantOverrides.ts";
import { stripEmpties } from "@/types/typeSupport.ts";
import { normalizeBot } from "@/utils/migrate.ts";
import {
  createDefaultBot,
  createDefaultCharacter,
} from "@/utils/defaultBotGenerator.ts";
import { useNotify } from "@/composables/useNotify.ts";
import { getMime } from "@/composables/useImageUtils.ts";

const blobUrls = ref<Set<string>>(new Set());

export const useBotStore = defineStore("bot", () => {
  const notify = useNotify();
  const currentBot = ref<GrokBotProfile | null>(null);
  const isDirty = ref(false);
  const editGeneration = ref(0);
  const loading = ref(false);

  // function isImageFilename(name: string): boolean {
  //   return /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(name);
  // }
  //
  // async function migrateStorageIfNeeded() {
  //   // Run only once — check/store a flag in your settings store
  //   // if (await getSetting('storage_migration_v2_done')) return;
  //   // await setSetting('storage_migration_v2_done', true);
  //
  //   const botsDir = await join(await appLocalDataDir(), "Bot Manager", "bots");
  //
  //   if (!(await exists(botsDir))) return;
  //
  //   const entries = await readDir(botsDir); // non-recursive, flat
  //
  //   // Find all root-level .json files (old bot profiles)
  //   const jsonEntries = entries.filter((e) => e.name?.endsWith(".json"));
  //
  //   for (const jsonEntry of jsonEntries) {
  //     const oldJsonFilename = jsonEntry.name!;
  //     if (oldJsonFilename === "bot.json") continue; // unlikely, but skip
  //
  //     const id = oldJsonFilename.replace(".json", ""); // Extract UUID
  //     const oldJsonPath = await join(botsDir, oldJsonFilename);
  //
  //     const botFolder = await join(botsDir, id);
  //     const newJsonPath = await join(botFolder, "bot.json");
  //     const imagesDir = await join(botFolder, "images");
  //
  //     // Skip if already migrated (bot.json exists in folder)
  //     if (await exists(newJsonPath)) {
  //       // Optional: clean up stray old root .json
  //       await remove(oldJsonPath).catch(() => {});
  //       continue;
  //     }
  //
  //     // Ensure bot folder exists (create if bot had no images originally)
  //     if (!(await exists(botFolder))) {
  //       await mkdir(botFolder);
  //     }
  //
  //     // Create images subdir if missing
  //     if (!(await exists(imagesDir))) {
  //       await mkdir(imagesDir);
  //     }
  //
  //     // Move old images (if any) from flat botFolder into images/
  //     // At this point, botFolder may contain old flat images
  //     const folderContents = await readDir(botFolder).catch(() => []); // [] if empty
  //     for (const item of folderContents) {
  //       if (item.name && isImageFilename(item.name)) {
  //         const oldPath = await join(botFolder, item.name);
  //         const newPath = await join(imagesDir, item.name);
  //         await rename(oldPath, newPath).catch(() => {}); // skip conflicts/dups
  //       }
  //     }
  //
  //     // Finally, move the root .json into botFolder as bot.json
  //     await rename(oldJsonPath, newJsonPath);
  //
  //     // Optional: success log or notification per bot
  //   }
  //
  //   // All done — old root .json files are now gone/moved
  // }

  // Centralized image URLs for the current bot (filename → data URL)
  const imageUrls = ref<Record<string, string>>({});

  function cleanupBlobUrls() {
    blobUrls.value.forEach((url) => URL.revokeObjectURL(url));
    blobUrls.value.clear();
    imageUrls.value = {};
  }

  // src/stores/botStore.ts – Add this new function
  async function syncImagesFromDisk() {
    if (!currentBot.value) return;

    const appDir = await appLocalDataDir();
    const botsDir = await join(appDir, "Bot Manager", "bots");
    const botDir = await join(botsDir, currentBot.value.id);
    const imagesDir = await join(botDir, "images");

    let changed = false;

    try {
      // Ensure bot folder and images subdir exist (harmless if already present)
      await mkdir(imagesDir, { recursive: true });

      // Read actual image files on disk from the images/ subdir (non-recursive)
      const entries = await readDir(imagesDir);

      // Since readDir is non-recursive, all entries are leaves.
      // We rely solely on filename extension to identify image files.
      // (No valid way to distinguish files vs dirs without children field here)
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

      // Remove declared files not on disk
      const toRemove = [...declared].filter((f) => !diskFiles.includes(f));
      if (toRemove.length > 0) {
        currentBot.value.images =
          currentBot.value.images?.filter((f) => !toRemove.includes(f)) ?? [];
        if (toRemove.includes(currentBot.value.profileImage ?? "")) {
          currentBot.value.profileImage = undefined;
        }
        changed = true;
      }

      // Add disk files not declared
      const toAdd = diskFiles.filter((f) => !declared.has(f));
      if (toAdd.length > 0) {
        if (!currentBot.value.images) currentBot.value.images = [];
        currentBot.value.images.push(...toAdd);
        changed = true;
      }

      // Fully reload all image URLs (fresh blobs/URLs for any changed/added)
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

  // Computed: Sorted images with profile first
  const sortedImages = computed(() => {
    if (!currentBot.value) return [];
    const list = currentBot.value.images ?? [];
    const profile = currentBot.value.profileImage;
    if (profile && list.includes(profile)) {
      return [profile, ...list.filter((i) => i !== profile)];
    }
    return list;
  });

  // Load all declared images for current bot
  async function loadImages() {
    if (!currentBot.value) {
      cleanupBlobUrls();
      return;
    }

    cleanupBlobUrls(); // Revoke any previous bot's URLs

    const appDir = await appLocalDataDir();
    const botsDir = await join(appDir, "Bot Manager", "bots");
    const botDir = await join(botsDir, currentBot.value.id);
    const imagesDir = await join(botDir, "images");

    const declared = currentBot.value.images ?? [];

    for (const filename of declared) {
      const path = await join(imagesDir, filename);
      try {
        const bytes = await readFile(path);
        const mime = getMime(filename);
        const blob = new Blob([bytes], { type: mime });
        const url = URL.createObjectURL(blob);
        imageUrls.value[filename] = url;
        blobUrls.value.add(url); // Track for later revocation
      } catch (e) {
        console.warn(`Failed to load image ${filename}:`, e);
        // Remove broken/missing entry from the bot's images array
        currentBot.value.images = declared.filter((f) => f !== filename);
        // If it was the profile image, clear that too
        if (currentBot.value.profileImage === filename) {
          currentBot.value.profileImage = undefined;
        }
        setDirty();
      }
    }
  }

  async function addImage(file: File) {
    if (!currentBot.value) return;

    const appDir = await appLocalDataDir();
    const botsDir = await join(appDir, "Bot Manager", "bots");
    const botDir = await join(botsDir, currentBot.value.id);
    const imagesDir = await join(botDir, "images");

    // Ensure bot folder and images subdir exist
    await mkdir(imagesDir, { recursive: true });

    // Unique filename logic (unchanged)
    let name = file.name;
    const existing = new Set(currentBot.value.images ?? []);
    let counter = 1;
    const base = name.replace(/\.[^.]+$/, "");
    const ext = name.split(".").pop() ?? "";
    while (existing.has(name)) {
      name = `${base} (${counter}).${ext}`;
      counter++;
    }

    // Save raw file to images/ subdir
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    await writeFile(await join(imagesDir, name), bytes);

    // Update metadata
    if (!currentBot.value.images) currentBot.value.images = [];
    currentBot.value.images.push(name);

    // Immediate preview: Blob URL directly from File (fastest, no disk read needed)
    const url = URL.createObjectURL(file);
    imageUrls.value[name] = url;
    blobUrls.value.add(url);

    setDirty();
  }

  // Remove image
  async function removeImage(filename: string) {
    if (!currentBot.value) return;

    const appDir = await appLocalDataDir();
    const botsDir = await join(appDir, "Bot Manager", "bots");
    const botDir = await join(botsDir, currentBot.value.id);
    const imagesDir = await join(botDir, "images");
    const path = await join(imagesDir, filename);

    try {
      await remove(path);
    } catch (e) {
      console.warn(`Failed to delete image file ${filename}:`, e);
      // File may already be missing – that's fine, we still clean metadata
    }

    // Clean metadata
    currentBot.value.images =
      currentBot.value.images?.filter((f) => f !== filename) ?? [];
    if (currentBot.value.profileImage === filename) {
      currentBot.value.profileImage = undefined;
    }

    // Revoke blob URL if exists
    const url = imageUrls.value[filename];
    if (url) {
      URL.revokeObjectURL(url);
      blobUrls.value.delete(url);
      delete imageUrls.value[filename];
    }

    setDirty();
  }

  // Set/clear profile image
  function setProfileImage(filename: string | undefined) {
    if (!currentBot.value) return;
    currentBot.value.profileImage = filename;
    setDirty();
  }

  async function loadFromDisk(botId: string) {
    loading.value = true;
    cleanupBlobUrls();
    try {
      const appDir = await appLocalDataDir();
      const botsDir = await join(appDir, "Bot Manager", "bots");
      const botFolder = await join(botsDir, botId);
      const path = await join(botFolder, "bot.json");

      const content = await readTextFile(path);
      let parsed = JSON.parse(content);

      // Only clean on load → legacy data disappears from UI & future saves
      delete parsed._valid;
      if (parsed.background?.characters) {
        parsed.background.characters = parsed.background.characters.map(
          (c: any) => {
            const { usage_hints, ...rest } = c;
            return rest;
          },
        );
      }

      // Migrate legacy shapes (slot-based dialog_examples, numeric
      // progression_phases) before validating against the current schema.
      normalizeBot(parsed as GrokBotProfile);

      currentBot.value = parsed;

      // Reset the active variant if it doesn't exist in the newly loaded bot
      const variantStore = useVariantStore();
      if (
        variantStore.activeVariant !== null &&
        !parsed.variants?.[variantStore.activeVariant]
      ) {
        variantStore.setActiveVariant(null);
      }

      const { valid, errors } = validateBotData(currentBot.value);
      if (!valid) {
        throw new Error(
          "Invalid bot file: " + formatAjvErrors(errors).join("; "),
        );
      }

      // Fix misshapen characters (existing code)
      let fixedCharacters: CharacterProfile[] = [];
      for (const char of currentBot.value?.background?.characters ?? []) {
        // Deep-copy defaults first (as before)
        const base = createDefaultCharacter();

        fixedCharacters.push({
          ...base,
          ...char,
        });
      }
      currentBot.value?.background?.characters?.splice(
        0,
        fixedCharacters.length,
        ...fixedCharacters,
      );

      if (!currentBot.value!.images) {
        currentBot.value!.images = [];
      }

      await loadImages();

      isDirty.value = false;
    } catch (e: any) {
      console.error("Failed to load bot:", e);

      if (e.message?.includes("Invalid bot file")) {
        notify.error(
          `Failed to load bot – invalid file:\n${e.message}`,
        );
      } else {
        notify.error(
          `Failed to load bot: ${e.message || "Unknown error"}`,
        );
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

      // Belt-and-suspenders: run migrations again before save so a v1 bot
      // that somehow slipped through (or a bot mutated by external code)
      // is normalized before the validator sees it.
      normalizeBot(currentBot.value);

      const { valid, errors } = validateBotData(currentBot.value);
      if (!valid) {
        const errorMsg =
          "Cannot save bot – validation failed:\n" +
          formatAjvErrors(errors).join("\n");

        notify.error(errorMsg);
        return;
      }

      const appDir = await appLocalDataDir();
      const botsDir = await join(appDir, "Bot Manager", "bots");
      const botFolder = await join(botsDir, currentBot.value.id);

      // Ensure bot folder exists (harmless if already present)
      await mkdir(botFolder, { recursive: true });

      pruneRedundantOverrides(currentBot.value);

      const updatedBot = {
        ...currentBot.value,
        schema_version: "3",
        lastModified: new Date().toISOString(),
      };

      // Strip empty fields to keep bot.json lean
      const lean = stripEmpties(updatedBot) as Record<string, any>;
      // Ensure mandatory fields survive even if empty
      lean.id = updatedBot.id;
      lean.name = updatedBot.name;
      lean.lastModified = updatedBot.lastModified;
      lean.intro = updatedBot.intro ?? "";
      lean.greeting = updatedBot.greeting ?? "";

      const path = await join(botFolder, "bot.json");
      await writeTextFile(path, JSON.stringify(lean, null, 2));

      // Update the in-memory ref with the new lastModified
      currentBot.value = updatedBot;

      isDirty.value = false;

      // Re-evaluate compliance after save (bot may have moved from v1 → v2)
      const complianceStore = useComplianceStore();
      const compliance = classifyBot(updatedBot);
      complianceStore.set(updatedBot.id, updatedBot.lastModified, compliance);

      notify.success("Bot saved successfully");
    } catch (e) {
      console.error("Save failed:", e);
      notify.error(
        "Failed to save bot – check console for details",
      );
    } finally {
      loading.value = false;
    }
  }

  async function createNew() {
    try {
      currentBot.value = createDefaultBot();
      currentBot.value.images = [];

      const appDir = await appLocalDataDir();
      const botsDir = await join(appDir, "Bot Manager", "bots");
      const botFolder = await join(botsDir, currentBot.value.id);
      const imagesDir = await join(botFolder, "images");

      // Ensure full structure exists (bot folder + images subdir)
      await mkdir(imagesDir, { recursive: true });

      // Save the JSON (updates lastModified, writes to bot.json)
      await save();

      // Optional success feedback
      notify.success(
        `New bot "${currentBot.value.name}" created`,
      );
    } catch (e) {
      console.error("Failed to create new bot:", e);
      notify.error(
        "Failed to create new bot – please try again.",
      );
      currentBot.value = null;
    }
  }

  function setDirty() {
    isDirty.value = true;
    editGeneration.value++;
  }

  // Watch currentBot changes to reload images or clean up blob URLs
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
