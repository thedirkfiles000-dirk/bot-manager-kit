import { computed, type WritableComputedRef } from "vue";
import { useBotStore } from "@/stores/botStore";
import { useVariantStore } from "@/stores/variantStore.ts";
import {
  getEffectiveValue,
  setVariantValue,
} from "@/utils/variantOverrides.ts";

export function useVariantCharacterField<T = unknown>(
  characterId: string,
  subPath: string,
): WritableComputedRef<T> {
  const botStore = useBotStore();
  const variantStore = useVariantStore();

  const fullPath = computed(() => `character.${characterId}.${subPath}`);

  return computed<T>({
    get(): T {
      const bot = botStore.currentBot;
      if (!bot || !characterId) return undefined as unknown as T;
      return getEffectiveValue(bot, fullPath.value, variantStore.activeVariant) as T;
    },
    set(value: T) {
      const bot = botStore.currentBot;
      if (!bot || !characterId) return;
      setVariantValue(bot, fullPath.value, value, variantStore.activeVariant);
      botStore.setDirty();
    },
  });
}
