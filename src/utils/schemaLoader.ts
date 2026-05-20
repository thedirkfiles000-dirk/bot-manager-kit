// src/utils/schemaLoader.ts
//
// Discovers schemas in appLocalDataDir/BotSchemas/<name>/. Each schema dir
// must contain a schema.json. The bundled GrokBot schema is seeded on first
// run if BotSchemas/ doesn't exist yet, so the picker is never empty.

import { appLocalDataDir, join } from "@tauri-apps/api/path";
import {
  exists,
  mkdir,
  readDir,
  readTextFile,
  writeTextFile,
} from "@tauri-apps/plugin-fs";
import bundledGrokBotSchema from "@/assets/grokbot.schema.json";
import type { SchemaMetadata } from "@/stores/activeSchemaStore";

const DEFAULT_SCHEMA_NAME = "GrokBot";

/** Absolute path to the BotSchemas root, creating it if needed. */
export async function getSchemasRoot(): Promise<string> {
  const appDir = await appLocalDataDir();
  return join(appDir, "BotSchemas");
}

/**
 * Ensure the BotSchemas root exists. If it's empty, seed the bundled
 * GrokBot schema so the picker has something to offer on first launch.
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
    JSON.stringify(bundledGrokBotSchema, null, 2),
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

/**
 * Bots directory for a given schema. Creates the directory if missing so
 * callers can immediately write into it.
 */
export async function botsDirFor(schemaName: string): Promise<string> {
  const root = await getSchemasRoot();
  const dir = await join(root, schemaName, "bots");
  await mkdir(dir, { recursive: true });
  return dir;
}

/** Convenience: count of bot folders inside a schema's bots/ directory. */
export async function countBotsFor(schemaName: string): Promise<number> {
  const dir = await botsDirFor(schemaName);
  const entries = await readDir(dir);
  let count = 0;
  for (const entry of entries) {
    if (!entry.name) continue;
    // Bot folders are UUID-named with a bot.json inside; lightweight check.
    if (await exists(await join(dir, entry.name, "bot.json"))) count++;
  }
  return count;
}
