// src/utils/exportMarkdown.ts
//
// Render bot field values into markdown for the Copy Station. Each output
// target has a slightly different shape:
//
//   Intro / Greeting — single-value targets. Field values are concatenated
//                      with blank lines between them; no field labels.
//   Background       — multi-field structured output. Each field becomes a
//                      labeled section keyed off its panel type.
//   Dialog Examples  — structured iteration over array-of-arrays of
//                      DialogLineBlock; each inner array is one example.
//
// Pure functions — no Vue reactivity, no I/O.

import type { DialogLineBlock } from "@/types/botSchema";

export type OutputTarget = "Intro" | "Greeting" | "Background" | "Dialog Examples";

export const ALL_OUTPUT_TARGETS: OutputTarget[] = [
  "Intro",
  "Greeting",
  "Background",
  "Dialog Examples",
];

export interface ExportField {
  /** Property name on the bot (dotted path supported). */
  name: string;
  /** Resolved value to render. May be undefined; renderer decides what to do. */
  value: unknown;
  /** Panel type from the schema (`x-ui-panel`). Drives the rendering shape. */
  panel: string | undefined;
  /** Label for the section heading or list label. Defaults to titleCase(name) if absent. */
  label: string;
}

/** Title-case helper for fallback labels. */
export function defaultLabel(propName: string): string {
  return propName
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function isEmpty(v: unknown): boolean {
  if (v === undefined || v === null) return true;
  if (typeof v === "string") return v.trim().length === 0;
  if (Array.isArray(v)) return v.length === 0;
  return false;
}

/**
 * Render a single field as a markdown block for the Background target.
 * Panel type determines the shape (inline label vs heading vs bullet list).
 */
function renderBackgroundField(f: ExportField): string {
  if (isEmpty(f.value)) return "";

  switch (f.panel) {
    case "text":
    case "number":
      return `**${f.label}:** ${String(f.value)}\n`;

    case "textarea":
      return `### ${f.label}\n\n${String(f.value).trim()}\n`;

    case "stringList": {
      const items = (f.value as string[]).filter((s) => s && s.trim().length > 0);
      if (items.length === 0) return "";
      return `### ${f.label}\n\n${items.map((s) => `- ${s}`).join("\n")}\n`;
    }

    default:
      // Unknown panel — best-effort stringification.
      return `**${f.label}:** ${JSON.stringify(f.value)}\n`;
  }
}

/** Render the Background output as concatenated markdown blocks. */
export function renderBackground(fields: ExportField[]): string {
  return fields
    .map(renderBackgroundField)
    .filter((s) => s.length > 0)
    .join("\n")
    .trimEnd();
}

/**
 * Render Intro or Greeting. These are single-value targets; if multiple
 * fields are tagged for them, the values are joined with blank lines.
 */
export function renderSingleValue(fields: ExportField[]): string {
  return fields
    .map((f) => (isEmpty(f.value) ? "" : String(f.value).trim()))
    .filter((s) => s.length > 0)
    .join("\n\n");
}

/**
 * Render Dialog Examples. Walks an array-of-arrays of {speaker, line}; each
 * inner array becomes one labeled example block.
 */
export function renderDialogExamples(fields: ExportField[]): string {
  const blocks: string[] = [];
  let exampleNum = 1;
  for (const f of fields) {
    if (!Array.isArray(f.value)) continue;
    for (const example of f.value as DialogLineBlock[][]) {
      if (!Array.isArray(example) || example.length === 0) continue;
      const lines = example
        .filter((l) => l && (l.speaker?.trim() || l.line?.trim()))
        .map((l) => `${l.speaker || "??"}: ${l.line || ""}`);
      if (lines.length === 0) continue;
      blocks.push(`## Example ${exampleNum}\n\n${lines.join("\n")}`);
      exampleNum++;
    }
  }
  return blocks.join("\n\n").trim();
}

/** Render an output target by dispatching on the target name. */
export function renderOutput(target: OutputTarget, fields: ExportField[]): string {
  switch (target) {
    case "Intro":
    case "Greeting":
      return renderSingleValue(fields);
    case "Background":
      return renderBackground(fields);
    case "Dialog Examples":
      return renderDialogExamples(fields);
  }
}
