import json2md from "json2md";
import type { MarkdownStyle } from "@/types/exportTarget";

/**
 * Shared markdown generation helpers extracted from both exporter panels.
 * All functions are pure — no Vue reactivity, no side effects.
 */

type HeadingLevel = "h1" | "h2" | "h3" | "h4";

/** Shift a heading level by an offset (e.g., h1 + 1 = h2). Clamps to h4. */
function shiftH(base: HeadingLevel, offset: number): HeadingLevel {
  const level = parseInt(base[1]) + offset;
  return `h${Math.min(level, 4)}` as HeadingLevel;
}

/** Heading for a structural section label — caps-aware. Never used for data values. */
export function labelH(level: HeadingLevel, text: string, capsKeys: boolean): json2md.DataObject {
  const label = capsKeys
    ? text.toUpperCase().replace(/[^A-Z0-9&]+/g, "_").replace(/^_|_$/g, "")
    : text;
  return { [level]: label };
}

/** Format a key for display — UPPER_SNAKE_CASE when capsKeys is on. */
export function displayKey(key: string | undefined, capsKeys: boolean): string {
  if (!key) return key ?? "";
  if (!capsKeys) return key;
  return key.toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, "");
}

/** Build a markdown list from key-value pairs, filtering empties. */
export function markdownList(
  elements: { key: string; value: number | string | string[] | undefined }[],
  capsKeys: boolean,
): string[] {
  const result = [];
  for (const element of elements.filter((x) => !!x.value)) {
    if (Array.isArray(element.value) && element.value.length > 0) {
      result.push(`${displayKey(element.key, capsKeys)}: ${element.value.join(", ") ?? ""}`);
    } else {
      result.push(`${displayKey(element.key, capsKeys)}: ${element.value ?? ""}`);
    }
  }
  return result;
}

/** Convert json2md data array to a markdown string, collapsing excess newlines. */
export function toMarkdown(data: json2md.DataObject[]): string {
  return json2md(data).replace(/\n{2,}/g, "\n").replace(/^ +(?=-)/gm, "");
}

/**
 * Generate the full background markdown from a masked export object.
 * Parameterized by MarkdownStyle to handle PolyBuzz vs HotChatBots differences.
 */
export function generateBackgroundMarkdown(
  data: Record<string, any>,
  botName: string,
  style: MarkdownStyle,
  capsKeys: boolean,
): string {
  const md: json2md.DataObject[] = [];
  const h1: HeadingLevel = shiftH("h1", style.headingOffset);
  const h2: HeadingLevel = shiftH("h2", style.headingOffset);
  const h3: HeadingLevel = shiftH("h3", style.headingOffset);

  // HotChatBots includes bot name as title
  if (style.includeTitle) {
    md.push({ h1: botName || "Untitled Bot" });
  }

  // Response Priority (ordered tie-breaker, exported above rp_rules)
  if (data.response_priority?.length) {
    md.push(labelH(h1, "Response Priority", capsKeys));
    md.push({ ol: data.response_priority });
  }

  // Global RP Rules
  if (data.rp_rules?.length) {
    md.push(labelH(h1, "Global RP Rules", capsKeys));
    md.push({ ul: data.rp_rules });
  }

  // Boundaries & Meta — hoisted (PolyBuzz) or nested in canon (HotChatBots)
  if (style.hoistBoundariesMeta && (data.boundaries || data.meta)) {
    md.push(labelH(h1, "Boundaries & Meta", capsKeys));
    md.push({
      ul: markdownList([
        { key: "Allowed", value: data.boundaries?.allowed },
        { key: "Disallowed", value: data.boundaries?.disallowed },
        { key: "Fourth Wall", value: data.meta?.fourth_wall_behavior },
        { key: "Continuity", value: data.meta?.continuity_rules },
      ], capsKeys),
    });
  }

  // Canon
  if (data.canon) {
    const canonTitle = style.hoistBoundariesMeta ? "Canon" : "Canon (World & Persistent Facts)";
    md.push(labelH(h1, canonTitle, capsKeys));

    if (style.hoistBoundariesMeta) {
      // PolyBuzz order: triggers, scenario, setting, cohorts, anchors, lorebook
      renderCanonTriggers(md, data, h2, capsKeys);
      renderCanonScenario(md, data, h2, capsKeys);
      renderCanonSetting(md, data, h2, capsKeys);
      renderCanonCohorts(md, data, h2, h3, capsKeys);
      renderCanonAnchors(md, data, h2, capsKeys);
      renderCanonLorebook(md, data, h2, capsKeys);
    } else {
      // HotChatBots order: setting, scenario, anchors, triggers, cohorts, lorebook, boundaries & meta
      renderCanonSetting(md, data, h2, capsKeys, "Realism Level");
      renderCanonScenario(md, data, h2, capsKeys);
      renderCanonAnchors(md, data, h2, capsKeys);
      renderCanonTriggers(md, data, h2, capsKeys);
      renderCanonCohorts(md, data, h2, h3, capsKeys);
      renderCanonLorebook(md, data, h2, capsKeys);

      // Nested boundaries & meta (HotChatBots)
      if (data.canon.boundaries || data.canon.meta) {
        md.push(labelH(h2, "Boundaries & Meta", capsKeys));
        md.push({
          ul: markdownList([
            { key: "Allowed", value: data.canon.boundaries?.allowed },
            { key: "Disallowed", value: data.canon.boundaries?.disallowed },
            { key: "Fourth Wall", value: data.canon.meta?.fourth_wall_behavior },
            { key: "Continuity", value: data.canon.meta?.continuity_rules },
          ], capsKeys),
        });
      }
    }
  }

  // Characters
  const characterNames = Object.keys(data).filter(
    (key) =>
      !["name", "intro", "greeting", "rp_rules", "response_priority", "boundaries", "meta", "canon", "framing", "dialog_examples"].includes(key) &&
      typeof data[key] === "object" &&
      data[key]?.name,
  );

  if (characterNames.length) {
    md.push(labelH(h1, "Characters", capsKeys));

    characterNames.forEach((charKey) => {
      const char = data[charKey];
      // Character name is a data value — never caps'd
      md.push({ [h2]: char.name ?? charKey });

      md.push({
        ul: markdownList([
          { key: "Role", value: char.role },
          { key: "Archetype", value: char.archetype },
          { key: "Nickname", value: char.nickname },
          { key: "Full Name", value: char.full_name },
          { key: "Age", value: char.age },
          { key: "Gender", value: char.gender },
          { key: "Orientation", value: char.orientation },
          { key: "Overview", value: char.overview },
          { key: "Core Drive", value: char.core_drive },
          { key: "User Viewpoint", value: char.user_viewpoint },
          { key: "Backstory", value: char.backstory },
        ], capsKeys),
      });

      // Sub-sections vary by heading offset
      if (style.hoistBoundariesMeta) {
        // PolyBuzz: personality, appearance, skills, story_hooks, relationships, behavior, anchors, triggers, pet_names, progression
        renderCharPersonality(md, char, h3, capsKeys);
        renderCharAppearance(md, char, h3, capsKeys);
      } else {
        // HotChatBots: appearance, personality, skills, story_hooks, relationships, behavior, pet_names, progression
        renderCharAppearance(md, char, h3, capsKeys);
        renderCharPersonality(md, char, h3, capsKeys);
      }

      const skillsLabel = style.hoistBoundariesMeta ? "Skills" : "Skills & Abilities";
      renderCharSkills(md, char, h3, capsKeys, skillsLabel);
      renderCharStoryHooks(md, char, h3, capsKeys);

      if (style.hoistBoundariesMeta) {
        renderCharRelationshipsPolyBuzz(md, char, h3, capsKeys);
      } else {
        renderCharRelationshipsHotChatBots(md, char, h3, capsKeys);
      }

      renderCharBehavior(md, char, h3, capsKeys, style);
      renderCharPetNames(md, char, h3, capsKeys);
      renderCharProgression(md, char, h3, capsKeys);
    });
  }

  // Dialog examples (HotChatBots bundles into background)
  if (style.bundleDialog) {
    renderDialogExamples(md, data, h1, h2, capsKeys);
  }

  return toMarkdown(md);
}

/** Generate standalone dialog markdown (PolyBuzz separate dialog tab). */
export function generateDialogMarkdown(
  dialogExamples: { dialog: string[] }[] | undefined,
  capsKeys: boolean,
): string {
  if (!dialogExamples?.length) return "";
  const md: json2md.DataObject[] = [];
  for (const dialog of dialogExamples) {
    md.push(labelH("h3", "Dialog", capsKeys));
    for (const dialogLine of dialog.dialog) {
      md.push({ p: dialogLine });
    }
  }
  return toMarkdown(md);
}

// ─── Canon section renderers ───────────────────────────────────

function renderCanonTriggers(md: json2md.DataObject[], data: Record<string, any>, h: HeadingLevel, capsKeys: boolean) {
  if (data.canon.triggers?.length) {
    md.push(labelH(h, "Triggers & Conditionals", capsKeys));
    md.push({ ul: data.canon.triggers });
  }
}

function renderCanonScenario(md: json2md.DataObject[], data: Record<string, any>, h: HeadingLevel, capsKeys: boolean) {
  if (data.canon.scenario) {
    md.push(labelH(h, "Scenario", capsKeys));
    md.push({
      ul: markdownList([
        { key: "Premise", value: data.canon.scenario.premise },
        { key: "Ongoing Dynamic", value: data.canon.scenario.ongoing_dynamic },
        { key: "Your Role", value: data.canon.scenario.starting_state_with_user },
      ], capsKeys),
    });
  }
}

function renderCanonSetting(md: json2md.DataObject[], data: Record<string, any>, h: HeadingLevel, capsKeys: boolean, realismLabel: string = "Realism") {
  if (data.canon.setting) {
    md.push(labelH(h, "Setting", capsKeys));
    md.push({
      ul: markdownList([
        { key: "Location", value: data.canon.setting.location },
        { key: "Era", value: data.canon.setting.era },
        { key: "City / Region", value: data.canon.setting.city },
        { key: "Specific Location", value: data.canon.setting.specific_location },
        { key: "Environment / Tone", value: data.canon.setting.environment_tone },
        { key: realismLabel, value: data.canon.setting.realism },
        { key: "Lifestyle / Context", value: data.canon.setting.lifestyle },
      ], capsKeys),
    });
  }
}

function renderCanonCohorts(md: json2md.DataObject[], data: Record<string, any>, h: HeadingLevel, hSub: HeadingLevel, capsKeys: boolean) {
  if (data.canon.cohorts?.length) {
    md.push(labelH(h, "Supporting Cast (Cohort)", capsKeys));
    data.canon.cohorts.forEach((c: any) => {
      md.push({ [hSub]: c.name ?? "Unnamed" }); // data value — never caps'd
      md.push({
        ul: markdownList([
          { key: "Role", value: c.role },
          { key: "Signature", value: c.signature },
          { key: "Notes", value: c.notes },
        ], capsKeys),
      });
      if (c.surfacing_rules?.length) {
        md.push({ p: `${displayKey("Surfacing Rules", capsKeys)}:` });
        md.push({ ul: c.surfacing_rules });
      }
    });
  }
}

function renderCanonAnchors(md: json2md.DataObject[], data: Record<string, any>, h: HeadingLevel, capsKeys: boolean) {
  if (data.canon.anchors?.length) {
    md.push(labelH(h, "Persistent Anchors", capsKeys));
    md.push({ ul: data.canon.anchors });
  }
}

function renderCanonLorebook(md: json2md.DataObject[], data: Record<string, any>, h: HeadingLevel, capsKeys: boolean) {
  if (data.canon.lorebook?.length) {
    md.push(labelH(h, "Lorebook", capsKeys));
    md.push({
      ul: markdownList(
        data.canon.lorebook.map((e: any) => ({ key: e.keyword, value: e.content })),
        capsKeys,
      ),
    });
  }
}

// ─── Character section renderers ───────────────────────────────

function renderCharPersonality(md: json2md.DataObject[], char: any, h: HeadingLevel, capsKeys: boolean) {
  if (char.personality) {
    md.push(labelH(h, "Personality", capsKeys));
    md.push({
      ul: markdownList([
        { key: "Traits", value: char.personality.traits },
        { key: "Motivations", value: char.personality.motivations },
        { key: "Fears", value: char.personality.fears },
        { key: "Values", value: char.personality.values },
      ], capsKeys),
    });
  }
}

function renderCharAppearance(md: json2md.DataObject[], char: any, h: HeadingLevel, capsKeys: boolean) {
  if (char.appearance) {
    md.push(labelH(h, "Appearance", capsKeys));
    md.push({
      ul: markdownList([
        { key: "Height", value: char.appearance.height },
        { key: "Build", value: char.appearance.build },
        { key: "Hair", value: char.appearance.hair },
        { key: "Eyes", value: char.appearance.eyes },
        { key: "Style", value: char.appearance.style },
        { key: "Notable Features", value: char.appearance.notable_features },
      ], capsKeys),
    });
  }
}

function renderCharSkills(md: json2md.DataObject[], char: any, h: HeadingLevel, capsKeys: boolean, skillsLabel: string) {
  if (char.skills) {
    const skillItems = markdownList([
      { key: "Expertise", value: char.skills.expertise },
      { key: "Hobbies", value: char.skills.hobbies },
      { key: "Strengths", value: char.skills.strengths },
      { key: "Limitations", value: char.skills.limitations },
    ], capsKeys);
    if (skillItems.length) {
      md.push(labelH(h, skillsLabel, capsKeys));
      md.push({ ul: skillItems });
    }
  }
}

function renderCharStoryHooks(md: json2md.DataObject[], char: any, h: HeadingLevel, capsKeys: boolean) {
  if (char.story_hooks) {
    const hookItems = markdownList([
      { key: "Current Conflict", value: char.story_hooks.current_conflict },
      { key: "Goals", value: char.story_hooks.goals },
    ], capsKeys);
    if (hookItems.length) {
      md.push(labelH(h, "Story Hooks", capsKeys));
      md.push({ ul: hookItems });
    }
  }
}

function renderCharRelationshipsPolyBuzz(md: json2md.DataObject[], char: any, h: HeadingLevel, capsKeys: boolean) {
  if (char.relationships?.length || char.relationship_history) {
    md.push(labelH(h, "Relationships", capsKeys));
    const relItems: string[] = [];
    if (char.relationship_history)
      relItems.push(...markdownList([{ key: "History", value: char.relationship_history }], capsKeys));
    (char.relationships ?? []).forEach((r: any) => {
      if (r.name)
        relItems.push(...markdownList([{ key: r.name, value: [r.role, r.notes].filter(Boolean).join(" — ") }], capsKeys));
    });
    if (relItems.length) md.push({ ul: relItems });
  }
}

function renderCharRelationshipsHotChatBots(md: json2md.DataObject[], char: any, h: HeadingLevel, capsKeys: boolean) {
  if (char.relationships?.length) {
    md.push(labelH(h, "Relationships", capsKeys));
    md.push({
      ul: markdownList(
        char.relationships.map((r: any) => ({
          key: r.name,
          value: [r.role, r.notes].filter(Boolean).join(" — "),
        })),
        capsKeys,
      ),
    });
  }
}

function renderCharBehavior(
  md: json2md.DataObject[],
  char: any,
  h: HeadingLevel,
  capsKeys: boolean,
  style: MarkdownStyle,
) {
  if (style.hoistBoundariesMeta) {
    // PolyBuzz behavior layout
    const hasBehavior = char.character_rp_rules?.length || char.behavior_rules;
    if (hasBehavior) {
      md.push(labelH(h, "Behavior Rules", capsKeys));
      const bItems = markdownList([
        { key: "Boundaries", value: char.behavior_rules?.boundaries },
        { key: "Speech Style", value: char.behavior_rules?.speech_style },
        { key: "Dialect or Accent", value: char.behavior_rules?.dialect_or_accent },
        { key: "Romantic Availability", value: char.behavior_rules?.romantic_availability },
        { key: "Pacing", value: char.behavior_rules?.pacing_preference },
        { key: "Themes", value: char.behavior_rules?.character_specific_themes },
        { key: "Preferred Scenes", value: char.behavior_rules?.preferred_scene_types },
        { key: "Disallowed Scenes", value: char.behavior_rules?.disallowed_scenes },
      ], capsKeys);
      if (bItems.length) md.push({ ul: bItems });
      if (char.character_rp_rules?.length) {
        md.push(labelH(h, "Character RP Rules", capsKeys));
        md.push({ ul: char.character_rp_rules });
      }
    }

    if (char.character_anchors?.length) {
      md.push(labelH(h, "Character Anchors", capsKeys));
      md.push({ ul: char.character_anchors });
    }

    if (char.character_triggers?.length) {
      md.push(labelH(h, "Character Triggers", capsKeys));
      md.push({ ul: char.character_triggers });
    }
  } else {
    // HotChatBots behavior layout
    if (char.character_rp_rules?.length || char.behavior_rules || char.character_anchors?.length || char.character_triggers?.length) {
      md.push(labelH(h, "Behavior Rules", capsKeys));
      if (char.character_rp_rules?.length) md.push({ ul: char.character_rp_rules });
      md.push({
        ul: markdownList([
          { key: "Speech Style", value: char.behavior_rules?.speech_style },
          { key: "Dialect or Accent", value: char.behavior_rules?.dialect_or_accent },
          { key: "Pacing Preference", value: char.behavior_rules?.pacing_preference },
          { key: "Romantic Availability", value: char.behavior_rules?.romantic_availability },
          { key: "Boundaries", value: char.behavior_rules?.boundaries },
          { key: "Character Themes", value: char.behavior_rules?.character_specific_themes },
          { key: "Preferred Scene Types", value: char.behavior_rules?.preferred_scene_types },
          { key: "Disallowed Scenes", value: char.behavior_rules?.disallowed_scenes },
        ], capsKeys),
      });
      if (char.character_anchors?.length) {
        md.push(labelH(h, "Character Anchors", capsKeys));
        md.push({ ul: char.character_anchors });
      }
      if (char.character_triggers?.length) {
        md.push(labelH(h, "Character Triggers", capsKeys));
        md.push({ ul: char.character_triggers });
      }
    }
  }
}

function renderCharPetNames(md: json2md.DataObject[], char: any, h: HeadingLevel, capsKeys: boolean) {
  if (char.pet_names?.length) {
    md.push(labelH(h, "Pet Names", capsKeys));
    md.push({
      ul: markdownList(
        char.pet_names.map((p: any) => ({ key: p.name, value: p.trigger || "Always" })),
        capsKeys,
      ),
    });
  }
}

const PHASE_ORDER: Record<string, number> = { early: 0, mid: 1, late: 2 };

function renderCharProgression(md: json2md.DataObject[], char: any, h: HeadingLevel, capsKeys: boolean) {
  if (char.progression_phases?.length) {
    md.push(labelH(h, "Progression Phases", capsKeys));
    const sorted = [...char.progression_phases].sort(
      (a: any, b: any) => (PHASE_ORDER[a.phase] ?? 99) - (PHASE_ORDER[b.phase] ?? 99),
    );
    md.push({
      ul: sorted.map((p: any) => {
        const phaseTag = `[${displayKey(p.phase, capsKeys)}]`;
        const categoryKey = displayKey(`${p.category || "Phase"} Shift`, capsKeys);
        const cuePart = p.cue ? ` (${displayKey("cue", capsKeys)}: ${p.cue})` : "";
        return `${phaseTag} ${categoryKey}${cuePart}: ${p.description}`;
      }),
    });
  }
}

function renderDialogExamples(md: json2md.DataObject[], data: Record<string, any>, h1: HeadingLevel, h2: HeadingLevel, capsKeys: boolean) {
  const dialogData = data.dialog_examples ?? { dialog_examples: [] };
  if (dialogData.dialog_examples?.length > 0) {
    md.push(labelH(h1, "Dialog Examples", capsKeys));
    for (const dialog of dialogData.dialog_examples) {
      md.push(labelH(h2, "Dialog", capsKeys));
      for (const dialogLine of dialog.dialog) {
        md.push({ p: dialogLine });
      }
    }
  }
}

