// src/composables/useVariantField.ts
import { computed, type WritableComputedRef } from "vue";
import { useBotStore } from "@/stores/botStore";
import { useVariantStore } from "@/stores/variantStore.ts";
import { getEffectiveValue, setVariantValue } from "@/utils/variantOverrides.ts";
import type { FieldPath } from "@/types/fieldPath";

export function useVariantField<T = string>(
  path: FieldPath,
  fallback: T = "" as unknown as T,
): WritableComputedRef<T> {
  const botStore = useBotStore();
  const variantStore = useVariantStore();

  return computed<T>({
    get(): T {
      const bot = botStore.currentBot;
      if (!bot) return fallback;

      const rawValue = getEffectiveValue(bot, path, variantStore.activeVariant);

      return rawValue === undefined || rawValue === null
        ? fallback
        : (rawValue as T);
    },
    set(value: T) {
      const bot = botStore.currentBot;
      if (!bot) return;

      setVariantValue(bot, path, value, variantStore.activeVariant);
      botStore.setDirty();
    },
  });
}
