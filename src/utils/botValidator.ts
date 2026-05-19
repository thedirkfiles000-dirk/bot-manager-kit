import AJV, { type ErrorObject } from "ajv";
import addFormats from "ajv-formats"; // Optional: for date-time, etc.
import ajvErrors from "ajv-errors"; // Optional: better error messages

// Load schema (adjust path if in public/)
import botSchema from "@/assets/grokbot.schema.json";

const ajv = new AJV({
  allErrors: true,     // Show all errors, not just first
  strict: true,
  verbose: true,       // More detailed errors
  allowUnionTypes: true,
});

addFormats(ajv);       // Enables format: "date-time", etc.
ajvErrors(ajv);        // Optional nicer messages

// Compile once for performance
const validateBot = ajv.compile(botSchema);

export function validateBotData(data: unknown): { valid: boolean; errors: ErrorObject[] } {
  const valid = validateBot(data);
  return {
    valid,
    errors: validateBot.errors ?? [],
  };
}

// Helper to format errors for UI
export function formatAjvErrors(errors: ErrorObject[]): string[] {
  return errors.map(err => {
    const path = err.instancePath || "root";
    const params = err.params as Record<string, string>;
    if (err.keyword === "additionalProperties")
      return `${path}: unexpected field "${params.additionalProperty}"`;
    if (err.keyword === "required")
      return `${path}: missing required field "${params.missingProperty}"`;
    return `${path}: ${err.message}`;
  });
}

/* ==================== COMPLIANCE CLASSIFICATION ==================== */

export type BotCompliance = 'v2' | 'v1' | 'broken';

// UI-only fields added by BotCard that aren't part of the schema
const UI_FIELDS = ['_valid', '_compliance'];

/** Classify a bot's schema compliance. Pure function — no caching. */
export function classifyBot(data: unknown): BotCompliance {
  if (!data || typeof data !== 'object') return 'broken';

  // Strip UI-only fields before validating against the schema
  const clean = { ...(data as Record<string, unknown>) };
  for (const f of UI_FIELDS) delete clean[f];

  // Try v2 schema validation
  const { valid } = validateBotData(clean);
  if (valid) return 'v2';

  // V1 heuristic: has core structural fields but fails current schema validation
  const d = data as any;
  const hasBasicStructure =
    typeof d.id === 'string' &&
    typeof d.name === 'string' &&
    d.background &&
    Array.isArray(d.background.characters);

  return hasBasicStructure ? 'v1' : 'broken';
}