// src/utils/schemaLoader.ts
//
// Discovers and manages schemas in appLocalDataDir/BotSchemas/<name>/. Each
// schema dir contains a schema.json and a bots/ subdir. The bundled Starter
// schema is seeded on first run if BotSchemas/ doesn't exist yet.

import { appLocalDataDir, join } from "@tauri-apps/api/path";
import {
  exists,
  mkdir,
  readDir,
  readTextFile,
  remove,
  rename,
  writeTextFile,
} from "@tauri-apps/plugin-fs";
import { revealItemInDir } from "@tauri-apps/plugin-opener";
import bundledStarterSchema from "@/assets/starter.schema.json";
import type { SchemaMetadata } from "@/stores/activeSchemaStore";

const DEFAULT_SCHEMA_NAME = "Starter";

/** Absolute path to the BotSchemas root, creating it if needed. */
export async function getSchemasRoot(): Promise<string> {
  const appDir = await appLocalDataDir();
  return join(appDir, "BotSchemas");
}

/**
 * Ensure the BotSchemas root exists. If it's empty, seed the bundled
 * Starter schema so the picker has something to offer on first launch.
 */
export async function ensureSchemasRoot(): Promise<void> {
  const root = await getSchemasRoot();
  await mkdir(root, { recursive: true });

  const entries = await readDir(root);
  const hasAny = entries.some((e) => e.name);
  if (hasAny) return;

  // First run — seed the default schema.
  const defaultDir = await join(root, DEFAULT_SCHEMA_NAME);
  await mkdir(await join(defaultDir, "bots"), { recursive: true });
  await writeTextFile(
    await join(defaultDir, "schema.json"),
    JSON.stringify(bundledStarterSchema, null, 2),
  );
}

/** Walk BotSchemas/ and parse each valid schema.json into SchemaMetadata. */
export async function discoverSchemas(): Promise<SchemaMetadata[]> {
  await ensureSchemasRoot();
  const root = await getSchemasRoot();
  const entries = await readDir(root);
  const out: SchemaMetadata[] = [];

  for (const entry of entries) {
    if (!entry.name) continue;
    const schemaPath = await join(root, entry.name, "schema.json");
    if (!(await exists(schemaPath))) continue;
    try {
      const raw = JSON.parse(await readTextFile(schemaPath));
      const title =
        typeof raw?.title === "string" && raw.title.trim()
          ? raw.title
          : entry.name;
      const description =
        typeof raw?.description === "string" ? raw.description : undefined;
      out.push({ name: entry.name, title, description, raw });
    } catch (e) {
      console.warn(`Skipping malformed schema at ${schemaPath}:`, e);
    }
  }

  return out.sort((a, b) => a.title.localeCompare(b.title));
}

/** Path to a schema's directory (does not validate existence). */
export async function schemaDirFor(schemaName: string): Promise<string> {
  const root = await getSchemasRoot();
  return join(root, schemaName);
}

/**
 * Bots directory for a given schema. Creates the directory if missing so
 * callers can immediately write into it.
 */
export async function botsDirFor(schemaName: string): Promise<string> {
  const dir = await join(await schemaDirFor(schemaName), "bots");
  await mkdir(dir, { recursive: true });
  return dir;
}

/** Count of bot folders inside a schema's bots/ directory. */
export async function countBotsFor(schemaName: string): Promise<number> {
  const dir = await botsDirFor(schemaName);
  const entries = await readDir(dir);
  let count = 0;
  for (const entry of entries) {
    if (!entry.name) continue;
    if (await exists(await join(dir, entry.name, "bot.json"))) count++;
  }
  return count;
}

// ── Schema name validation ───────────────────────────────────────────────

const RESERVED_WINDOWS_NAMES = new Set([
  "CON", "PRN", "AUX", "NUL",
  "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9",
  "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9",
]);

/**
 * Validate a schema name. Returns null if valid, otherwise a user-facing
 * error message. Constraints: non-empty, ≤ 50 chars, no path or filesystem
 * metacharacters, not a reserved Windows device name.
 */
export function validateSchemaName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return "Name can't be empty.";
  if (trimmed.length > 50) return "Name is too long (max 50 characters).";
  if (/[\\/:*?"<>|]/.test(trimmed))
    return `Name can't contain any of: \\ / : * ? " < > |`;
  if (/[.\s]$/.test(trimmed))
    return "Name can't end in a dot or whitespace.";
  if (RESERVED_WINDOWS_NAMES.has(trimmed.toUpperCase()))
    return `"${trimmed}" is a reserved name on Windows; pick something else.`;
  return null;
}

/** Returns true if a schema directory with this name already exists. */
export async function schemaExists(name: string): Promise<boolean> {
  const dir = await schemaDirFor(name);
  return exists(dir);
}

// ── Lifecycle operations ─────────────────────────────────────────────────

/** Minimal schema template used when the user creates a new schema. */
function newSchemaTemplate(title: string): object {
  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    title,
    description:
      "A new schema. Add fields under `properties` and annotate them with x-ui-panel / x-ui-section / x-export-target. The editor tree and Copy Station pick up changes automatically.",
    type: "object",
    required: ["id", "name", "lastModified"],
    properties: {
      id: {
        type: "string",
        description: "Unique identifier (UUID). Stamped by the kit.",
        "x-ui-panel": "hidden",
      },
      lastModified: {
        type: "string",
        format: "date-time",
        description: "Last edit timestamp. Stamped by the kit on save.",
        "x-ui-panel": "hidden",
      },
      name: {
        type: "string",
        description: "Display name shown on the Library card.",
        "x-ui-panel": "text",
        "x-ui-section": "Basic",
        "x-ui-order": 10,
        "x-export-target": "Background",
        "x-export-label": "Name",
      },
      description: {
        type: "string",
        description: "Free-form description — replace this field with whatever your schema needs.",
        "x-ui-panel": "textarea",
        "x-ui-section": "Basic",
        "x-ui-order": 20,
        "x-export-target": "Background",
        "x-export-label": "Description",
      },
    },
    additionalProperties: false,
  };
}

/**
 * Create a new schema directory with a template schema.json and an empty
 * bots/ subdir. Throws if the name is invalid or already exists.
 */
export async function createSchema(name: string): Promise<void> {
  const err = validateSchemaName(name);
  if (err) throw new Error(err);
  const trimmed = name.trim();
  if (await schemaExists(trimmed)) {
    throw new Error(`A schema named "${trimmed}" already exists.`);
  }
  const dir = await schemaDirFor(trimmed);
  await mkdir(await join(dir, "bots"), { recursive: true });
  await writeTextFile(
    await join(dir, "schema.json"),
    JSON.stringify(newSchemaTemplate(trimmed), null, 2),
  );
}

/**
 * Duplicate an existing schema's schema.json under a new name. Does NOT
 * copy bots — duplication is for forking the schema design, not the data.
 */
export async function duplicateSchema(
  srcName: string,
  newName: string,
): Promise<void> {
  const err = validateSchemaName(newName);
  if (err) throw new Error(err);
  const trimmed = newName.trim();
  if (await schemaExists(trimmed)) {
    throw new Error(`A schema named "${trimmed}" already exists.`);
  }
  const srcPath = await join(await schemaDirFor(srcName), "schema.json");
  if (!(await exists(srcPath))) {
    throw new Error(`Source schema "${srcName}" not found.`);
  }
  const dstDir = await schemaDirFor(trimmed);
  await mkdir(await join(dstDir, "bots"), { recursive: true });
  const content = await readTextFile(srcPath);
  // Update the embedded `title` if it matches the old folder name, so the
  // picker doesn't show "Starter" for a duplicate named "MyFork".
  let updated = content;
  try {
    const parsed = JSON.parse(content);
    if (typeof parsed.title === "string" && parsed.title === srcName) {
      parsed.title = trimmed;
      updated = JSON.stringify(parsed, null, 2);
    }
  } catch {
    // ignore — write the source bytes verbatim if parse fails
  }
  await writeTextFile(await join(dstDir, "schema.json"), updated);
}

/**
 * Rename a schema's directory. The schema's `title` field is left alone —
 * the directory name is the identifier; the title is the display label
 * (the user controls each independently).
 */
export async function renameSchema(
  oldName: string,
  newName: string,
): Promise<void> {
  const err = validateSchemaName(newName);
  if (err) throw new Error(err);
  const trimmed = newName.trim();
  if (trimmed === oldName) return;
  if (await schemaExists(trimmed)) {
    throw new Error(`A schema named "${trimmed}" already exists.`);
  }
  const oldDir = await schemaDirFor(oldName);
  if (!(await exists(oldDir))) {
    throw new Error(`Schema "${oldName}" not found.`);
  }
  const newDir = await schemaDirFor(trimmed);
  await rename(oldDir, newDir);
}

/**
 * Recursively delete a schema's directory, including all bots inside. Use
 * with confirmation — destructive and irreversible.
 */
export async function deleteSchema(name: string): Promise<void> {
  const dir = await schemaDirFor(name);
  if (!(await exists(dir))) {
    throw new Error(`Schema "${name}" not found.`);
  }
  await remove(dir, { recursive: true });
}

/** Open the schema's directory in the OS file manager. */
export async function revealSchemaInFileManager(name: string): Promise<void> {
  const dir = await schemaDirFor(name);
  if (!(await exists(dir))) {
    throw new Error(`Schema "${name}" not found.`);
  }
  await revealItemInDir(dir);
}
