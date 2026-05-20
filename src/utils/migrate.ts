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
 * dynamic array. Empty slots are dropped. Mutates the bot in place. Idempotent
 * — already-migrated arrays pass through.
 */
export function migrateDialogExamples(bot: GrokBotProfile): void {
  const chars = bot.background?.characters;
  if (!chars?.length) return;

  for (const char of chars) {
    migrateOneCharacter(char);
  }
}

function migrateOneCharacter(char: CharacterProfile): void {
  const de = char.dialog_examples as unknown;
  if (!de) return;
  if (Array.isArray(de)) return; // already migrated

  const obj = de as Record<string, DialogLineBlock[] | undefined>;
  const compacted: DialogLineBlock[][] = [];

  for (let oldIdx = 0; oldIdx < LEGACY_SLOT_KEYS.length; oldIdx++) {
    const lines = obj[LEGACY_SLOT_KEYS[oldIdx]];
    if (Array.isArray(lines) && lines.length > 0) {
      compacted.push(lines);
    }
  }

  char.dialog_examples = compacted;
}

/**
 * Run all idempotent migrations on a bot in place. Safe to call on
 * already-modern bots.
 */
export function normalizeBot(bot: GrokBotProfile): void {
  migrateProgressionPhases(bot);
  migrateDialogExamples(bot);
}
