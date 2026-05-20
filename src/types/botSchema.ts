/* eslint-disable */
/**
 * TypeScript shape for the bundled Starter schema. Mirrors src/assets/starter.schema.json.
 *
 * NOTE: When task #9 lands (schema-driven panels), this hand-written type
 * goes away — the editor will work off the parsed JSON schema directly,
 * and call sites that currently `import type { StarterBot }` will type as
 * `Record<string, unknown>` or a generated type per schema. For now this
 * keeps the Starter-bot-shaped code type-safe.
 */
export interface StarterBot {
  /** Unique identifier (UUID). Stamped by the kit. */
  id: string;
  /** Display name. */
  name: string;
  /** ISO timestamp, stamped on save. */
  lastModified: string;

  tagline?: string;
  sex?: string;
  age?: number;
  personality?: string;
  backstory?: string;
  goals?: string;
  likes?: string[];
  dislikes?: string[];

  /** Image filenames stored in the bot's images/ directory. */
  images?: string[];
  /** Filename (from `images`) used as the Library card thumbnail. */
  profileImage?: string;
}
