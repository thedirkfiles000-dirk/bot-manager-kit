// src/stores/activeSchemaStore.ts
//
// Holds the schema that drives the current session: the parsed JSON, derived
// display metadata, and the compiled AJV validator. Also tracks the list of
// schemas discovered on disk for the picker.
//
// The active schema is intentionally not persisted — every launch starts at
// the picker. (Future change: optional "remember last" toggle.)

import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { ErrorObject } from "ajv";
import { createBotValidator, type BotValidator } from "@/utils/botValidator";

export interface SchemaMetadata {
  /** Filesystem-safe identifier — the BotSchemas/<name>/ directory name. */
  name: string;
  /** Display name from the schema's `title` field (falls back to `name`). */
  title: string;
  /** Optional description from the schema's `description` field. */
  description?: string;
  /** The raw parsed schema JSON. */
  raw: unknown;
}

export const useActiveSchemaStore = defineStore("activeSchema", () => {
  const active = ref<SchemaMetadata | null>(null);
  const available = ref<SchemaMetadata[]>([]);
  // Validator lives outside the ref because it's not serializable and we don't
  // want Pinia/devtools trying to walk into a compiled AJV closure.
  let validator: BotValidator | null = null;

  const hasActiveSchema = computed(() => active.value !== null);

  function setAvailable(list: SchemaMetadata[]) {
    available.value = list;
  }

  function setActive(meta: SchemaMetadata) {
    active.value = meta;
    validator = createBotValidator(meta.raw);
  }

  function clearActive() {
    active.value = null;
    validator = null;
  }

  function validateBot(data: unknown): { valid: boolean; errors: ErrorObject[] } {
    if (!validator) {
      return {
        valid: false,
        errors: [
          {
            keyword: "noSchema",
            instancePath: "",
            schemaPath: "",
            params: {},
            message: "No schema is active",
          } as ErrorObject,
        ],
      };
    }
    return validator.validate(data);
  }

  return {
    active,
    available,
    hasActiveSchema,
    setAvailable,
    setActive,
    clearActive,
    validateBot,
  };
});
