// src/composables/useField.ts
//
// Reactive read/write binding to a path on the current bot. Writes go directly
// to `botStore.currentBot` and mark the store dirty.
//
// Path conventions:
//   "name"                                — top-level field
//   "background.setting.location"          — dotted path into background
//   "character.<charId>.<subPath>"         — resolves to the character matched
//                                            by id in background.characters[]
//
// The character.<id>.<subPath> form is preserved so existing panel code keeps
// working unchanged; without it, panels would each need to look up their
// character by id and bind by index, which is fragile across reorders.

import { computed, type WritableComputedRef } from "vue";
import get from "lodash/get";
import set from "lodash/set";
import { useBotStore } from "@/stores/botStore";
import type { GrokBotProfile } from "@/types/botSchema";
import type { FieldPath } from "@/types/fieldPath";

function readPath(bot: GrokBotProfile, path: string): unknown {
  if (path.startsWith("character.")) {
    const parts = path.split(".");
    const charId = parts[1];
    const subPath = parts.slice(2).join(".");
    const char = (bot.background?.characters ?? []).find((c) => c.id === charId);
    if (!char) return undefined;
    return subPath ? get(char, subPath) : char;
  }
  return get(bot, path);
}

function writePath(bot: GrokBotProfile, path: string, value: unknown): void {
  if (path.startsWith("character.")) {
    const parts = path.split(".");
    const charId = parts[1];
    const subPath = parts.slice(2).join(".");
    const char = (bot.background?.characters ?? []).find((c) => c.id === charId);
    if (!char) return;
    if (subPath) set(char, subPath, value);
    return;
  }
  set(bot, path, value);
}

export function useField<T = string>(
  path: FieldPath,
  fallback: T = "" as unknown as T,
): WritableComputedRef<T> {
  const botStore = useBotStore();
  return computed<T>({
    get() {
      const bot = botStore.currentBot;
      if (!bot) return fallback;
      const value = readPath(bot, path);
      return value === undefined || value === null ? fallback : (value as T);
    },
    set(value: T) {
      const bot = botStore.currentBot;
      if (!bot) return;
      writePath(bot, path, value);
      botStore.setDirty();
    },
  });
}
