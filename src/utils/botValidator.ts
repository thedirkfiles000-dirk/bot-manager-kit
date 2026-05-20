import AJV, { type ErrorObject } from "ajv";
import addFormats from "ajv-formats";
import ajvErrors from "ajv-errors";

export interface BotValidator {
  validate(data: unknown): { valid: boolean; errors: ErrorObject[] };
}

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
