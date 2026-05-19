// src/composables/useVariantAnyField.ts
import { computed, WritableComputedRef } from "vue";
import { useVariantField } from "@/composables/useVariantField.ts";
import { useVariantCharacterField } from "@/composables/useVariantCharacterField.ts";
import { fieldPath, type FieldPath } from "@/types/fieldPath";

export function useVariantAnyField<T = string>(
  path: FieldPath,
  fallback: T = "" as unknown as T,
): WritableComputedRef<T> {
  if (path.startsWith("character.")) {
    const parts = path.split(".");
    if (parts.length < 3) {
      // Invalid path – return no-op computed to prevent crashes
      return computed({
        get: () => fallback,
        set: () => {},
      });
    }

    const characterId = parts[1];
    const subPath = parts.slice(2).join(".");

    const characterComputed = useVariantCharacterField<T>(characterId, subPath);

    return computed<T>({
      get(): T {
        const rawValue = characterComputed.value;
        return rawValue === undefined || rawValue === null
          ? fallback
          : (rawValue as T);
      },
      set(value: T) {
        characterComputed.value = value;
      },
    });
  }

  // Bot-level path
  return useVariantField<T>(fieldPath(path), fallback);
}
