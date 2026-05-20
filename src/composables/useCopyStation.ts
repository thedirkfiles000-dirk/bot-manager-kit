// src/composables/useCopyStation.ts
//
// Walks the active schema for fields tagged with `x-export-target`, groups
// them by target, sorts by `x-export-order`, and exposes per-target render
// state for the Copy Station view. Per-field mask toggles are kept in a
// session-scoped Set (resets on navigation away).
//
// This is intentionally pure-ish: the composable returns reactive refs that
// the view binds to. All markdown shaping lives in @/utils/exportMarkdown.

import { computed, ref, type ComputedRef, type Ref } from "vue";
import get from "lodash/get";
import { useActiveSchemaStore } from "@/stores/activeSchemaStore";
import { useBotStore } from "@/stores/botStore";
import {
  ALL_OUTPUT_TARGETS,
  defaultLabel,
  renderOutput,
  type ExportField,
  type OutputTarget,
} from "@/utils/exportMarkdown";

interface SchemaPropMeta {
  name: string;
  panel: string | undefined;
  label: string;
  target: OutputTarget;
  order: number;
  declarationIndex: number;
}

export interface TargetCardState {
  target: OutputTarget;
  /** Fields the schema has assigned to this target, in render order. */
  fields: ComputedRef<ExportField[]>;
  /** Whether any field is present at all (used to dim empty cards). */
  hasFields: ComputedRef<boolean>;
  /** Final rendered markdown, with masking applied. */
  markdown: ComputedRef<string>;
  /** Names of fields currently masked from this target. */
  maskedFields: Ref<Set<string>>;
  toggleMask(name: string): void;
  resetMask(): void;
}

export interface CopyStationState {
  targets: TargetCardState[];
}

/** Discover fields per output target from the active schema. */
function collectFieldMeta(): Record<OutputTarget, SchemaPropMeta[]> {
  const store = useActiveSchemaStore();
  const schema = store.active?.raw as
    | { properties?: Record<string, any> }
    | undefined;

  const buckets: Record<OutputTarget, SchemaPropMeta[]> = {
    Intro: [],
    Greeting: [],
    Background: [],
    "Dialog Examples": [],
  };

  if (!schema?.properties) return buckets;

  let i = 0;
  for (const [name, def] of Object.entries(schema.properties)) {
    const target = def["x-export-target"] as OutputTarget | undefined;
    if (!target || !ALL_OUTPUT_TARGETS.includes(target)) {
      i++;
      continue;
    }
    buckets[target].push({
      name,
      panel: def["x-ui-panel"] as string | undefined,
      label: (def["x-export-label"] as string | undefined) ?? defaultLabel(name),
      target,
      order: (def["x-export-order"] as number | undefined) ?? Number.POSITIVE_INFINITY,
      declarationIndex: i++,
    });
  }

  // Sort each bucket by export order, breaking ties by declaration order.
  for (const arr of Object.values(buckets)) {
    arr.sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return a.declarationIndex - b.declarationIndex;
    });
  }

  return buckets;
}

export function useCopyStation(): CopyStationState {
  const botStore = useBotStore();

  // Schema metadata is computed once on composable creation. The active schema
  // doesn't change mid-session — picking a different schema unmounts this view.
  const buckets = collectFieldMeta();

  const targets: TargetCardState[] = ALL_OUTPUT_TARGETS.map((target) => {
    const metas = buckets[target];
    const maskedFields = ref<Set<string>>(new Set());

    const fields = computed<ExportField[]>(() => {
      const bot = botStore.currentBot as Record<string, unknown> | null;
      if (!bot) return [];
      return metas
        .filter((m) => !maskedFields.value.has(m.name))
        .map((m) => ({
          name: m.name,
          value: get(bot, m.name),
          panel: m.panel,
          label: m.label,
        }));
    });

    const hasFields = computed(() => metas.length > 0);

    const markdown = computed(() => renderOutput(target, fields.value));

    function toggleMask(name: string) {
      const next = new Set(maskedFields.value);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      maskedFields.value = next;
    }

    function resetMask() {
      maskedFields.value = new Set();
    }

    return {
      target,
      fields,
      hasFields,
      markdown,
      maskedFields,
      toggleMask,
      resetMask,
    };
  });

  return { targets };
}

/** Helper for the view: list of {name, label} pairs declared for a target. */
export function metaFor(target: OutputTarget): { name: string; label: string }[] {
  const buckets = collectFieldMeta();
  return buckets[target].map((m) => ({ name: m.name, label: m.label }));
}
