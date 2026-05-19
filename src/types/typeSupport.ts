// Utility type for deep partials
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object | undefined | null
    ? T[P] extends Array<infer U>
      ? Array<DeepPartial<U>> | undefined
      : DeepPartial<T[P]> | undefined
    : T[P] | undefined;
};

// Core recursive applicator (generic for reuse)
export function applyDefaults<T extends Record<string, any>>(
  partial: DeepPartial<T>,
  defaults: T,
): T {
  const result: Partial<T> = {};
  // Iterate over defaults' keys (ensures we cover all required fields)
  Object.keys(defaults).forEach((key) => {
    const typedKey = key as keyof T;
    const defaultValue = defaults[typedKey];
    const partialValue = (partial as any)[typedKey];
    if (
      defaultValue &&
      typeof defaultValue === "object" &&
      !Array.isArray(defaultValue)
    ) {
      // Recurse for nested objects
      if (Array.isArray(partialValue)) {
        // Partial has array but default is object: override fully
        (result as any)[typedKey] = partialValue;
      } else {
        // Deep merge nested - FIX: Use (partialValue || {}) to avoid passing undefined
        (result as any)[typedKey] = applyDefaults(
          (partialValue || {}) as DeepPartial<typeof defaultValue>,
          defaultValue,
        );
      }
    } else if (Array.isArray(defaultValue)) {
      // For arrays: use partial if provided, else default
      (result as any)[typedKey] = Array.isArray(partialValue)
        ? partialValue
        : defaultValue;
    } else {
      // Primitives: use partial if defined, else default
      (result as any)[typedKey] = (
        partialValue !== undefined ? partialValue : defaultValue
      ) as any;
    }
  });
  // Optional: Preserve extra keys from partial (if input might have unknowns)
  // Object.keys(partial || {}).forEach((key) => {
  // if (!(key in defaults)) {
  // (result as any)[key] = (partial as any)[key];
  // }
  // });
  return result as T;
}


// Recursive cleaner: omits empty strings/arrays/objects (if all children empty)

/**
 * Recursively strips empty values from a nested object/array structure.
 * - Empties: undefined, null, empty strings (""), empty arrays ([]), empty objects ({}).
 * - Non-empties: numbers (including 0), booleans, non-empty strings.
 * - For objects: Omits keys with empty cleaned values; returns undefined if no keys remain.
 * - For arrays: Recurses on elements, filters out empties; returns undefined if empty after filtering.
 * - Preserves non-empty structure.
 * - NEW: forbiddenFields - An optional array of top-level field names to delete regardless of value.
 */
export function stripEmpties(obj: unknown, forbiddenFields: string[] = []): unknown {
  const forbiddenSet = new Set(forbiddenFields);  // Fast lookup

  if (obj === undefined || obj === null) {
    return undefined;
  }

  if (typeof obj !== 'object') {
    // Primitive check
    if (typeof obj === 'string' && obj === '') {
      return undefined;
    }
    // Numbers (incl. 0), booleans, non-empty strings: keep
    return obj;
  }

  if (Array.isArray(obj)) {
    // Recurse and filter
    const cleaned = obj
      .map(item => stripEmpties(item, forbiddenFields))  // Pass forbiddenFields down if needed for nested
      .filter((item): item is Exclude<unknown, undefined> => item !== undefined);
    return cleaned.length > 0 ? cleaned : undefined;
  }

  // Plain object: assume Record<string, unknown>
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    // Skip if key is in forbiddenFields (top-level or adapt for nested paths if needed)
    if (forbiddenSet.has(key)) {
      continue;  // Delete no matter what
    }

    const cleanedValue = stripEmpties(value, forbiddenFields);
    if (cleanedValue !== undefined) {
      result[key] = cleanedValue;
    }
  }

  return Object.keys(result).length > 0 ? result : undefined;
}
