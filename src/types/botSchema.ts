/* eslint-disable */
/**
 * This file was hand-aligned to match BM-Net's shared/botSchema.ts so bots
 * can roundtrip between the two apps. Keep it in sync with the JSON schema
 * at src/assets/grokbot.schema.json.
 */

/**
 * JSON schema for a complete GrokBot (roleplay chatbot) profile. Optimized for LLM consistency through clear separation of behavioral rules, persistent facts (anchors), conditional triggers, and fixed-slot dialog examples. Fields are structured to support logical prompt export order while reducing drift and enabling variant overrides.
 */
export interface GrokBotProfile {
  /**
   * Schema version stamp written on save (e.g., '2'). Absent on v1 files — treat absence as v1.
   */
  schema_version?: string;
  /**
   * Unique identifier for the bot (UUID recommended). Used for stable referencing and overrides.
   */
  id: string;
  /**
   * Creator or collection ID (optional, for grouping bots).
   */
  cid?: string;
  /**
   * Display name of the bot/scenario.
   */
  name: string;
  /**
   * Creator-only notes/hints for using or sharing the bot (e.g., recommended user style, RP tips). Excluded from prompt export to avoid LLM confusion.
   */
  usage_hints?: string;
  /**
   * ISO timestamp of last edit.
   */
  lastModified: string;
  /**
   * Long-form internal description/premise of the bot (shown in cards, not sent to LLM).
   */
  intro: string;
  /**
   * The very first message the bot sends to start the chat.
   */
  greeting: string;
  /**
   * Ordered list of response priorities. When instructions conflict, the model
   * applies these in sequence — earlier entries take precedence. Exported near
   * the top of the prompt as RESPONSE_PRIORITY. Defaults are appropriate for
   * most bots; override only when the bot has unusual mechanics.
   */
  response_priority?: string[];
  /**
   * Core persistent roleplay behavioral rules and guidelines (e.g., perspective limits, godmodding prevention, pacing, output format). Placed very early in the exported prompt for strongest LLM adherence. Use neutral, imperative phrasing.
   */
  rp_rules?: string[];
  /**
   * World and scenario definition.
   */
  background?: {
    /**
     * Persistent, always-true world/plot facts that must never be forgotten (including hidden information unknown to characters). Placed early after rp_rules in prompt. Use declarative sentences.
     */
    anchors?: string[];
    /**
     * Global conditional guidance for plot progression, reactions, or revelations. Phrased naturally as 'If/When/Should X, then Y' statements. Relies on LLM reasoning — no regex or runtime matching.
     */
    triggers?: string[];
    /**
     * Physical and atmospheric world details.
     */
    setting?: {
      location?: string;
      environment_tone?: string;
      realism?: string;
      era?: string;
      city?: string;
      specific_location?: string;
      lifestyle?: string;
    };
    /**
     * Plot premise and current state.
     */
    scenario?: {
      premise?: string;
      ongoing_dynamic?: string;
      starting_state_with_user?: string;
    };
    /**
     * Supporting cast — named NPCs or recurring background figures.
     */
    cohorts?: CohortEntry[];
    /**
     * Keyword-keyed world facts for LLM recall.
     */
    lorebook?: LorbookEntry[];
    /**
     * The cast of characters. Full profiles embedded for self-contained bots.
     * May be empty if the scenario relies entirely on cohorts.
     */
    characters?: CharacterProfile[];
    /**
     * Global content safety/scope restrictions.
     */
    boundaries?: {
      allowed?: string[];
      disallowed?: string[];
    };
    /**
     * Technical RP rules.
     */
    meta?: {
      fourth_wall_behavior?: string;
      continuity_rules?: string;
    };
  };
  /**
   * Publishing status of the bot.
   */
  status?: 'unpublished' | 'public' | 'unlisted';
  /**
   * @deprecated Use `status` instead. Kept for backward compatibility.
   */
  flags?: string[];
  images?: string[];
  profileImage?: string;
  imagesCount?: number;
  profileUrl?: string;
}
/**
 * Full character profile. Optimized for LLM voice consistency.
 */
export interface CharacterProfile {
  id: string;
  name: string;
  full_name?: string;
  nickname?: string;
  archetype?: string;
  age?: number;
  gender?: string;
  orientation?: string;
  role?: string;
  overview?: string;
  lastModified: string;
  appearance?: AppearanceBlock;
  personality?: PersonalityBlock;
  backstory?: string;
  relationships?: RelationshipBlock[];
  skills?: SkillsBlock;
  story_hooks?: StoryHooksBlock;
  behavior_rules?: BehaviorRulesBlock;
  character_rp_rules?: string[];
  character_anchors?: string[];
  character_triggers?: string[];
  /**
   * Few-shot examples of voice/style/tone. Each entry is one conversation
   * (an array of DialogLineBlocks). Order is presentational. Empty inner
   * arrays are skipped on export.
   */
  dialog_examples?: DialogLineBlock[][];
  core_drive?: string;
  user_viewpoint?: string;
  pet_names?: PetNameEntry[];
  progression_phases?: ProgressionPhase[];
  relationship_history?: string;
}
export interface AppearanceBlock {
  height?: string;
  build?: string;
  hair?: string;
  eyes?: string;
  style?: string;
  notable_features?: string[];
}
export interface PersonalityBlock {
  traits?: string[];
  motivations?: string;
  fears?: string;
  values?: string;
}
export interface RelationshipBlock {
  name: string;
  role?: string;
  notes?: string;
}
export interface SkillsBlock {
  expertise?: string[];
  hobbies?: string[];
  strengths?: string[];
  limitations?: string[];
}
export interface StoryHooksBlock {
  current_conflict?: string;
  goals?: string;
}
export interface BehaviorRulesBlock {
  boundaries?: string;
  preferred_scene_types?: string[];
  disallowed_scenes?: string[];
  romantic_availability: string;
  speech_style?: string;
  dialect_or_accent?: string;
  pacing_preference?: string;
  character_specific_themes?: string;
}
export interface DialogLineBlock {
  speaker: string;
  line: string;
}
export interface CohortEntry {
  name: string;
  role?: string;
  signature?: string;
  notes?: string;
  /**
   * Conditional guidance for when this cohort member should appear or be
   * referenced. Use If/When phrasing.
   */
  surfacing_rules?: string[];
}
export interface LorbookEntry {
  keyword: string;
  content: string;
}
export interface PetNameEntry {
  name: string;
  trigger?: string;
}
export interface ProgressionPhase {
  /**
   * Where in the narrative arc this shift belongs. early = opening beats;
   * mid = developed dynamic; late = mature relationship/scene.
   */
  phase: "early" | "mid" | "late";
  /**
   * The kind of shift. Phase = broad behavioral; Narrative = plot/scene;
   * Tone = emotional register.
   */
  category?: "Phase" | "Narrative" | "Tone";
  /**
   * Optional natural-language anchor for when this shift should land
   * (e.g. "after the first emotional confession").
   */
  cue?: string;
  description: string;
}
