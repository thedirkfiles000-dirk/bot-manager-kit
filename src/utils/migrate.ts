import type {
  CharacterProfile,
  DialogLineBlock,
  GrokBotProfile,
  ProgressionPhase,
} from "@/types/botSchema";

type LegacyPhase = {
  shift_type?: "Phase" | "Narrative" | "Tone";
  from_message?: number;
  to_message?: number;
  description?: string;
} & Partial<ProgressionPhase>;

function bucket(from: number | undefined): ProgressionPhase["phase"] {
  if (from == null || from <= 5) return "early";
  if (from <= 20) return "mid";
  return "late";
}

function migrateOnePhase(p: LegacyPhase): ProgressionPhase {
  if (p.phase) return p as ProgressionPhase;

  const { shift_type, from_message, to_message: _to, description, ...rest } = p;
  return {
    ...rest,
    phase: bucket(from_message),
    category: shift_type,
    description: description ?? "",
  };
}

/**
 * Convert legacy numeric progression phases into the new phase/cue/category
 * shape. Mutates the bot in place. Idempotent.
 */
export function migrateProgressionPhases(bot: GrokBotProfile): void {
  const chars = bot.background?.characters;
  if (!chars?.length) return;
  for (const char of chars) {
    if (!char.progression_phases?.length) continue;
    char.progression_phases = char.progression_phases.map(migrateOnePhase);
  }
}

const LEGACY_SLOT_KEYS = [
  "example_0",
  "example_1",
  "example_2",
  "example_3",
] as const;

/**
 * Convert legacy fixed-slot dialog_examples ({example_0..example_3}) into a
 * dynamic array. Empty slots are dropped. Variant overrides that targeted a
 * specific slot are rewritten to point at the new array index; overrides that
 * targeted an empty source slot are dropped.
 *
 * Mutates the bot in place. Idempotent — already-migrated arrays pass through.
 */
export function migrateDialogExamples(bot: GrokBotProfile): void {
  const chars = bot.background?.characters;
  if (!chars?.length) return;

  for (const char of chars) {
    const remap = migrateOneCharacter(char);
    if (!remap) continue;
    if (!bot.variants) continue;
    rewriteVariantPaths(bot, char.id, remap);
  }
}

/** Returns the old-slot-index → new-array-index remap if migration ran, else null. */
function migrateOneCharacter(char: CharacterProfile): Map<number, number> | null {
  const de = char.dialog_examples as unknown;
  if (!de) return null;
  if (Array.isArray(de)) return null; // already migrated

  const obj = de as Record<string, DialogLineBlock[] | undefined>;
  const compacted: DialogLineBlock[][] = [];
  const remap = new Map<number, number>();

  for (let oldIdx = 0; oldIdx < LEGACY_SLOT_KEYS.length; oldIdx++) {
    const lines = obj[LEGACY_SLOT_KEYS[oldIdx]];
    if (Array.isArray(lines) && lines.length > 0) {
      remap.set(oldIdx, compacted.length);
      compacted.push(lines);
    }
  }

  char.dialog_examples = compacted;
  return remap;
}

function rewriteVariantPaths(
  bot: GrokBotProfile,
  charId: string,
  remap: Map<number, number>,
): void {
  if (!bot.variants) return;
  for (const ovBlock of Object.values(bot.variants)) {
    const next: typeof ovBlock.character_overrides = [];
    for (const co of ovBlock.character_overrides) {
      if (co.character_id !== charId) {
        next.push(co);
        continue;
      }
      const m = co.field_path.match(/^dialog_examples\.example_(\d+)(.*)$/);
      if (!m) {
        next.push(co);
        continue;
      }
      const oldIdx = parseInt(m[1], 10);
      const tail = m[2];
      const newIdx = remap.get(oldIdx);
      if (newIdx === undefined) continue; // pointed at an empty source slot — drop
      next.push({ ...co, field_path: `dialog_examples.${newIdx}${tail}` });
    }
    ovBlock.character_overrides = next;
  }
}

/**
 * Run all idempotent migrations on a bot in place. Safe to call on
 * already-modern bots.
 */
export function normalizeBot(bot: GrokBotProfile): void {
  migrateProgressionPhases(bot);
  migrateDialogExamples(bot);
}
