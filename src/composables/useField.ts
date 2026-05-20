// src/composables/useField.ts
//
// Reactive read/write binding to a dotted path on the current bot. Writes go
// directly to `botStore.currentBot` and mark the store dirty.

import { computed, type WritableComputedRef } from "vue";
import get from "lodash/get";
import set from "lodash/set";
import { useBotStore } from "@/stores/botStore";
import type { FieldPath } from "@/types/fieldPath";

export function useField<T = string>(
  path: FieldPath,
  fallback: T = "" as unknown as T,
): WritableComputedRef<T> {
  const botStore = useBotStore();
  return computed<T>({
    get() {
      const bot = botStore.currentBot;
      if (!bot) return fallback;
      const value = get(bot, path);
      return value === undefined || value === null ? fallback : (value as T);
    },
    set(value: T) {
      const bot = botStore.currentBot;
      if (!bot) return;
      set(bot, path, value);
      botStore.setDirty();
    },
  });
}
