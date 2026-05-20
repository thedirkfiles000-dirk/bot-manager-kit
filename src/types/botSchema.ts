/* eslint-disable */
/**
 * TypeScript shape for the bundled Starter schema. Mirrors src/assets/starter.schema.json.
 *
 * NOTE: When task #9 fully lands (schema-driven panels — in progress), this
 * hand-written type stays as a convenience for code that operates on the
 * bundled Starter shape. Other schemas have their own bot-shape; that code
 * types as `Record<string, unknown>` and relies on the active schema's
 * validator instead of TS.
 */
export interface StarterBot {
  /** Unique identifier (UUID). Stamped by the kit. */
  id: string;
  /** Display name. */
  name: string;
  /** ISO timestamp, stamped on save. */
  lastModified: string;

  intro?: string;
  greeting?: string;
  sex?: string;
  age?: number;
  personality?: string;
  backstory?: string;
  goals?: string;
  likes?: string[];
  dislikes?: string[];
  dialog_examples?: DialogLineBlock[][];

  /** Image filenames stored in the bot's images/ directory. */
  images?: string[];
  /** Filename (from `images`) used as the Library card thumbnail. */
  profileImage?: string;
}

export interface DialogLineBlock {
  speaker: string;
  line: string;
}
