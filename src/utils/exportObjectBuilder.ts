import type { GrokBotProfile } from "@/types/botSchema";
import { DeepPartial, stripEmpties } from "@/types/typeSupport";

const FORBIDDEN_FIELDS = ["cid", "usage_hints", "lastModified"];
const CHAR_FORBIDDEN = ["id", "usage_hints", "lastModified"];

/**
 * Build a character export object with fields in PolyBuzz order.
 * PolyBuzz puts backstory before appearance/personality.
 */
function buildCharPolyBuzz(char: any) {
  return stripEmpties(
    {
      name: char.name,
      full_name: char.full_name,
      nickname: char.nickname,
      archetype: char.archetype,
      role: char.role,
      overview: char.overview,
      core_drive: char.core_drive,
      user_viewpoint: char.user_viewpoint,
      age: char.age,
      gender: char.gender,
      orientation: char.orientation,
      backstory: char.backstory,
      personality: char.personality,
      appearance: char.appearance,
      skills: char.skills,
      story_hooks: char.story_hooks,
      relationships: char.relationships,
      relationship_history: char.relationship_history,
      behavior_rules: char.behavior_rules || [],
      character_rp_rules: char.character_rp_rules || [],
      character_anchors: char.character_anchors || [],
      character_triggers: char.character_triggers || [],
      pet_names: char.pet_names,
      progression_phases: char.progression_phases,
    },
    CHAR_FORBIDDEN,
  );
}

/**
 * Build a character export object with fields in HotChatBots order.
 * HotChatBots puts character_anchors/rp_rules/triggers before appearance.
 */
function buildCharHotChatBots(char: any) {
  return stripEmpties(
    {
      name: char.name,
      full_name: char.full_name,
      nickname: char.nickname,
      archetype: char.archetype,
      role: char.role,
      overview: char.overview,
      core_drive: char.core_drive,
      user_viewpoint: char.user_viewpoint,
      age: char.age,
      gender: char.gender,
      orientation: char.orientation,
      character_anchors: char.character_anchors || [],
      character_rp_rules: char.character_rp_rules || [],
      character_triggers: char.character_triggers || [],
      pet_names: char.pet_names,
      progression_phases: char.progression_phases,
      behavior_rules: char.behavior_rules || [],
      appearance: char.appearance,
      personality: char.personality,
      backstory: char.backstory,
      relationships: char.relationships,
      relationship_history: char.relationship_history,
      skills: char.skills,
      story_hooks: char.story_hooks,
    },
    CHAR_FORBIDDEN,
  );
}

/**
 * Build the PolyBuzz export object.
 * Boundaries/meta hoisted out of canon; dialog is separate.
 */
export function buildPolyBuzzExport(bot: GrokBotProfile): Record<string, any> {
  const cleaned = stripEmpties(bot, FORBIDDEN_FIELDS) as DeepPartial<GrokBotProfile>;

  return Object.assign(
    {},
    stripEmpties({
      response_priority: [...(cleaned.response_priority || [])],
      rp_rules: [...(cleaned.rp_rules || [])],
      boundaries: cleaned.background?.boundaries ?? undefined,
      meta: cleaned.background?.meta ?? undefined,
      canon: {
        triggers: cleaned.background?.triggers ?? undefined,
        scenario: cleaned.background?.scenario ?? undefined,
        setting: cleaned.background?.setting ?? undefined,
        cohorts: cleaned.background?.cohorts ?? undefined,
        anchors: cleaned.background?.anchors ?? undefined,
        lorebook: cleaned.background?.lorebook ?? undefined,
      },
    }),
    ...(bot.background?.characters ?? []).map((char) => ({
      [char.name || "Unnamed"]: buildCharPolyBuzz(char),
    })),
  );
}

/**
 * Build the HotChatBots export object.
 * Boundaries/meta nested in canon; dialog bundled.
 */
export function buildHotChatBotsExport(bot: GrokBotProfile): Record<string, any> {
  const cleaned = stripEmpties(bot, FORBIDDEN_FIELDS) as DeepPartial<GrokBotProfile>;
  const dialog = buildDialogExamples(bot);

  return Object.assign(
    {},
    stripEmpties({
      response_priority: [...(cleaned.response_priority || [])],
      rp_rules: [...(cleaned.rp_rules || [])],
      canon: {
        anchors: cleaned.background?.anchors ?? undefined,
        triggers: cleaned.background?.triggers ?? undefined,
        setting: cleaned.background?.setting ?? undefined,
        scenario: cleaned.background?.scenario ?? undefined,
        cohorts: cleaned.background?.cohorts ?? undefined,
        lorebook: cleaned.background?.lorebook ?? undefined,
        boundaries: cleaned.background?.boundaries ?? undefined,
        meta: cleaned.background?.meta ?? undefined,
      },
    }),
    ...(bot.background?.characters ?? []).map((char) => ({
      [char.name || "Unnamed"]: buildCharHotChatBots(char),
    })),
    { dialog_examples: stripEmpties(dialog) },
  );
}

/**
 * Build dialog examples from all characters.
 * Shared between both targets (PolyBuzz uses separately, HotChatBots bundles).
 */
export function buildDialogExamples(bot: GrokBotProfile): { dialog_examples: { dialog: string[] }[] } | undefined {
  if (!bot.background?.characters?.length) return undefined;

  const dialogExamples: { dialog_examples: { dialog: string[] }[] } = {
    dialog_examples: [],
  };

  for (const char of (bot.background?.characters ?? [])) {
    const examples = char.dialog_examples ?? [];
    for (const example of examples) {
      if (!example || example.length === 0) continue;
      const lines = example.filter((l) => l.line.trim().length > 0);
      if (lines.length === 0) continue;
      dialogExamples.dialog_examples.push({
        dialog: lines.map((line) => `${line.speaker}: ${line.line}`),
      });
    }
  }

  return dialogExamples;
}
