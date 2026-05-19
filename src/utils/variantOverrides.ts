import {
  CharacterOverrideEntry,
  GrokBotProfile,
  OverrideBlock,
  OverrideEntry,
} from "@/types/botSchema.ts";
import get from "lodash/get";
import set from "lodash/set";
import cloneDeep from "lodash/cloneDeep";
import isEqual from "lodash/isEqual"; // For deep equality

// Helper to find override (bot or char level)
function findOverride(
  ovBlock: OverrideBlock,
  path: string,
): OverrideEntry | CharacterOverrideEntry | undefined {
  if (path.startsWith("character.")) {
    const parts = path.split(".");
    const charId = parts[1];
    const subPath = parts.slice(2).join(".");
    return ovBlock.character_overrides.find(
      (o) => o.character_id === charId && o.field_path === subPath,
    );
  } else {
    return ovBlock.bot_overrides.find((o) => o.field_path === path);
  }
}

// Resolve the base bot value for any path, including character.* paths which
// map to background.characters[] by id rather than a keyed object property.
function getBaseValue(bot: GrokBotProfile, path: string): any {
  if (path.startsWith("character.")) {
    const parts = path.split(".");
    const charId = parts[1];
    const subPath = parts.slice(2).join(".");
    const char = (bot.background?.characters ?? []).find((c) => c.id === charId);
    if (!char) return undefined;
    return subPath ? get(char, subPath) : char;
  }
  return get(bot, path);
}

// Get effective value for path under active variant (base or base + variant override)
export function getEffectiveValue(
  bot: GrokBotProfile,
  path: string,
  activeVariant: string | null,
): any {
  const baseValue = getBaseValue(bot, path);

  if (activeVariant === null) {
    return baseValue;
  }

  const ovBlock = bot.variants?.[activeVariant];
  if (!ovBlock) {
    return baseValue;
  }

  const override = findOverride(ovBlock, path);
  return override !== undefined ? override.value : baseValue;
}

// Set value for path under active variant
export function setVariantValue(
  bot: GrokBotProfile,
  path: string,
  value: any,
  activeVariant: string | null,
): void {
  if (activeVariant === null) {
    // Set in base
    if (path.startsWith("character.")) {
      const parts = path.split(".");
      const charId = parts[1];
      const subPath = parts.slice(2).join(".");
      const char = (bot.background?.characters ?? []).find((c) => c.id === charId);
      if (!char) return;
      set(char, subPath, value);
    } else {
      set(bot, path, value);
    }
    return;
  }

  if (!bot.variants) {
    bot.variants = {};
  }
  if (!bot.variants[activeVariant]) {
    bot.variants[activeVariant] = {
      bot_overrides: [],
      character_overrides: [],
    };
  }

  const ovBlock = bot.variants[activeVariant];

  let override = findOverride(ovBlock, path);
  if (override) {
    // Update existing
    if (isEqual(override.value, value)) return; // No change
    override.value = value;
  } else {
    // Create new
    if (path.startsWith("character.")) {
      const parts = path.split(".");
      const charId = parts[1];
      const subPath = parts.slice(2).join(".");
      ovBlock.character_overrides.push({
        character_id: charId,
        field_path: subPath,
        value,
      });
    } else {
      ovBlock.bot_overrides.push({ field_path: path, value });
    }
  }

  // Cleanup if value matches base (remove override)
  const baseValue = getBaseValue(bot, path);
  if (isEqual(value, baseValue)) {
    removeOverride(ovBlock, path);
  }

  cleanupEmptyOverrideBlock(bot, activeVariant);
}

// Remove override for path
function removeOverride(ovBlock: OverrideBlock, path: string): void {
  if (path.startsWith("character.")) {
    const parts = path.split(".");
    const charId = parts[1];
    const subPath = parts.slice(2).join(".");
    ovBlock.character_overrides = ovBlock.character_overrides.filter(
      (o) => !(o.character_id === charId && o.field_path === subPath),
    );
  } else {
    ovBlock.bot_overrides = ovBlock.bot_overrides.filter(
      (o) => o.field_path !== path,
    );
  }
}

// Cleanup empty variant block
function cleanupEmptyOverrideBlock(
  bot: GrokBotProfile,
  activeVariant: string,
): void {
  const ovBlock = bot.variants?.[activeVariant];
  if (
    ovBlock &&
    ovBlock.bot_overrides.length === 0 &&
    ovBlock.character_overrides.length === 0
  ) {
    delete bot.variants![activeVariant];
    if (Object.keys(bot.variants!).length === 0) {
      delete bot.variants;
    }
  }
}

// Get set of variants that override the path (or extraPaths)
export function getOverridingVariants(
  bot: GrokBotProfile,
  path?: string,
  extraPaths: string[] = [],
): Set<string> {
  const overriding = new Set<string>();
  const allPaths = path ? [path, ...extraPaths] : extraPaths;

  if (!bot.variants) return overriding;

  for (const [variant, ovBlock] of Object.entries(bot.variants)) {
    for (const p of allPaths) {
      if (findOverride(ovBlock, p) !== undefined) {
        overriding.add(variant);
        break; // One match per variant
      }
    }
  }

  return overriding;
}

/**
 * Permanently applies all overrides from activeVariant into the base bot,
 * then removes the variant block. A no-op if activeVariant is null or missing.
 */
export function resolveVariantIntoBase(
  bot: GrokBotProfile,
  activeVariant: string | null,
): void {
  if (!activeVariant || !bot.variants?.[activeVariant]) return;

  const ovBlock = bot.variants[activeVariant];

  // Apply bot-level overrides directly into the base
  for (const override of ovBlock.bot_overrides) {
    set(bot, override.field_path, override.value);
  }

  // Apply character-level overrides directly into base characters
  for (const co of ovBlock.character_overrides) {
    const char = (bot.background?.characters ?? []).find(
      (c) => c.id === co.character_id,
    );
    if (!char) continue;
    set(char, co.field_path, co.value);
  }

  // Remove the now-resolved variant block
  delete bot.variants[activeVariant];
  if (Object.keys(bot.variants).length === 0) {
    delete bot.variants;
  }
}

export function getEffectiveBot(
  bot: GrokBotProfile | null | undefined,
  activeVariant: string | null,
): GrokBotProfile | null {
  if (!bot) return null;

  // Always start with a deep clone of the base
  const effective = cloneDeep(bot);

  if (activeVariant === null) {
    return effective; // pure base, no overrides applied
  }

  const ovBlock = bot.variants?.[activeVariant];
  if (!ovBlock) {
    return effective; // variant doesn't exist → same as base
  }

  // Apply all bot-level overrides
  for (const override of ovBlock.bot_overrides) {
    set(effective, override.field_path, override.value);
  }

  // Apply all character-level overrides
  for (const co of ovBlock.character_overrides) {
    const chars = effective.background?.characters ?? [];
    const charIndex = chars.findIndex((c) => c.id === co.character_id);
    if (charIndex === -1) continue; // character was deleted — skip orphaned override
    set(chars[charIndex], co.field_path, co.value);
  }

  return effective;
}

export function pruneRedundantOverrides(bot: GrokBotProfile): void {
  if (!bot.variants) return;

  for (const [variantName, ovBlock] of Object.entries(bot.variants)) {
    ovBlock.bot_overrides = ovBlock.bot_overrides.filter(
      (o) => !isEqual(o.value, getBaseValue(bot, o.field_path)),
    );
    ovBlock.character_overrides = ovBlock.character_overrides.filter((o) => {
      const char = (bot.background?.characters ?? []).find(
        (c) => c.id === o.character_id,
      );
      if (!char) return false; // orphaned — prune it too
      return !isEqual(o.value, get(char, o.field_path));
    });
    cleanupEmptyOverrideBlock(bot, variantName);
  }
}
