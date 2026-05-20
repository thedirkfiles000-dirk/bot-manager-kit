import AJV, { type ErrorObject } from "ajv";
import addFormats from "ajv-formats";
import ajvErrors from "ajv-errors";

export interface BotValidator {
  validate(data: unknown): { valid: boolean; errors: ErrorObject[] };
}

/**
 * Kit-recognized custom schema keywords. Registered as no-op keywords on AJV
 * so strict mode doesn't reject them. Schemas use these to describe UI and
 * export behavior to the kit; they have no impact on data validity.
 */
const KIT_KEYWORDS = [
  "x-ui-panel",
  "x-ui-section",
  "x-ui-order",
  "x-ui-label",
  "x-ui-helper",
  "x-export-target",
  "x-export-order",
  "x-export-label",
];

/**
 * Compile a JSON Schema into a reusable validator. One AJV instance per
 * validator keeps things simple — schemas are small and compile is fast.
 */
export function createBotValidator(schema: unknown): BotValidator {
  const ajv = new AJV({
    allErrors: true,
    strict: true,
    verbose: true,
    allowUnionTypes: true,
  });
  addFormats(ajv);
  ajvErrors(ajv);
  for (const kw of KIT_KEYWORDS) {
    ajv.addKeyword({ keyword: kw });
  }

  const fn = ajv.compile(schema as object);

  return {
    validate(data: unknown) {
      const valid = fn(data) as boolean;
      return { valid, errors: fn.errors ?? [] };
    },
  };
}

/** Human-readable formatting for AJV error objects. */
export function formatAjvErrors(errors: ErrorObject[]): string[] {
  return errors.map((err) => {
    const path = err.instancePath || "root";
    const params = err.params as Record<string, string>;
    if (err.keyword === "additionalProperties")
      return `${path}: unexpected field "${params.additionalProperty}"`;
    if (err.keyword === "required")
      return `${path}: missing required field "${params.missingProperty}"`;
    return `${path}: ${err.message}`;
  });
}
