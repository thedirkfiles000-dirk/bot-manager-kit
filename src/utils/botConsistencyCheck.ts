// src/utils/botConsistencyCheck.ts
// Pre-export validation for GrokBotProfile consistency.
// Runs against the effective (variant-merged) bot and returns a flat list of issues.

import { GrokBotProfile } from "@/types/botSchema";

export type IssueSeverity = "error" | "warn" | "info";

export interface ConsistencyIssue {
  severity: IssueSeverity;
  section: string;
  message: string;
}

export function botConsistencyCheck(bot: GrokBotProfile): ConsistencyIssue[] {
  const issues: ConsistencyIssue[] = [];

  const characters = bot.background?.characters ?? [];
  const cohorts = bot.background?.cohorts ?? [];

  // Build canonical name sets for cross-reference checks
  const characterNames = new Set(
    characters.map((c) => (c.name ?? "").trim().toLowerCase()).filter(Boolean),
  );
  const cohortNames = new Set(
    cohorts.map((c) => (c.name ?? "").trim().toLowerCase()).filter(Boolean),
  );
  const rosterNames = new Set([...characterNames, ...cohortNames]);

  // ─── Bot-level ────────────────────────────────────────────────────────────

  if (characters.length === 0 && cohorts.length === 0) {
    issues.push({
      severity: "error",
      section: "Bot",
      message: "Bot has no characters and no supporting cast. Add at least one character or cohort entry.",
    });
  }

  // ─── Cohort ───────────────────────────────────────────────────────────────

  cohorts.forEach((cohort, idx) => {
    const label = cohort.name?.trim() || `Cohort #${idx + 1}`;
    if (!cohort.name?.trim()) {
      issues.push({
        severity: "error",
        section: "Supporting Cast",
        message: `Cohort entry #${idx + 1} has no name.`,
      });
    }
    const hasAnyDetail =
      cohort.role?.trim() || cohort.signature?.trim() || cohort.notes?.trim();
    if (!hasAnyDetail) {
      issues.push({
        severity: "warn",
        section: "Supporting Cast",
        message: `"${label}" has only a name — add at least a role so the LLM has something to work with.`,
      });
    }
    // Collision with a character name
    if (cohort.name?.trim() && characterNames.has(cohort.name.trim().toLowerCase())) {
      issues.push({
        severity: "warn",
        section: "Supporting Cast",
        message: `"${cohort.name.trim()}" appears in both the character roster and the supporting cast. This may confuse the LLM.`,
      });
    }
  });

  // ─── Lorebook ─────────────────────────────────────────────────────────────

  const lorebook = bot.background?.lorebook ?? [];
  lorebook.forEach((entry, idx) => {
    const label = entry.keyword?.trim() || `Entry #${idx + 1}`;
    if (!entry.keyword?.trim()) {
      issues.push({
        severity: "warn",
        section: "Lorebook",
        message: `Lorebook entry #${idx + 1} has no keyword — it will never be recalled.`,
      });
    }
    if (!entry.content?.trim()) {
      issues.push({
        severity: "warn",
        section: "Lorebook",
        message: `Lorebook entry "${label}" has no content — it will export as an empty recall.`,
      });
    }
  });

  // ─── Per-character ─────────────────────────────────────────────────────────

  characters.forEach((char, charIdx) => {
    const charLabel = char.name?.trim() || `Character #${charIdx + 1}`;

    // Name
    if (!char.name?.trim()) {
      issues.push({
        severity: "error",
        section: "Characters",
        message: `Character #${charIdx + 1} has no name.`,
      });
    }

    // Dialog examples — speaker name validation
    const examples = char.dialog_examples ?? [];
    let hasAnyExample = false;
    examples.forEach((lines, exIdx) => {
      if (!lines || lines.length === 0) return;
      hasAnyExample = true;
      const exLabel = `Example ${exIdx + 1}`;
      lines.forEach((line, lineIdx) => {
        const speaker = (line.speaker ?? "").trim();
        if (!speaker) {
          issues.push({
            severity: "warn",
            section: `${charLabel} / Dialog`,
            message: `${exLabel}, line ${lineIdx + 1} has no speaker name.`,
          });
        } else if (!rosterNames.has(speaker.toLowerCase())) {
          // Heuristic: single-word generic stand-ins like "User", "You", "Human" are fine
          const knownGenerics = new Set(["user", "you", "human", "player", "narrator"]);
          if (!knownGenerics.has(speaker.toLowerCase())) {
            issues.push({
              severity: "warn",
              section: `${charLabel} / Dialog`,
              message: `Speaker "${speaker}" in ${exLabel} doesn't match any character or cohort name.`,
            });
          }
        }
      });
    });
    if (!hasAnyExample) {
      issues.push({
        severity: "info",
        section: `${charLabel}`,
        message: `"${charLabel}" has no dialog examples. Few-shot examples help the LLM match voice and tone.`,
      });
    }

    // Relationships — referenced names not in roster
    (char.relationships ?? []).forEach((rel, relIdx) => {
      const name = (rel.name ?? "").trim();
      if (!name) {
        issues.push({
          severity: "warn",
          section: `${charLabel} / Relationships`,
          message: `Relationship entry #${relIdx + 1} for "${charLabel}" has no name.`,
        });
      } else if (!rosterNames.has(name.toLowerCase())) {
        issues.push({
          severity: "info",
          section: `${charLabel} / Relationships`,
          message: `"${name}" is listed in ${charLabel}'s relationships but is not in the character roster or supporting cast. Consider adding them as a cohort member if the LLM needs context.`,
        });
      }
    });

    // Progression phases
    const phases = char.progression_phases ?? [];
    phases.forEach((phase, phaseIdx) => {
      if (!phase.description?.trim()) {
        issues.push({
          severity: "warn",
          section: `${charLabel} / Progression Phases`,
          message: `Phase #${phaseIdx + 1} (${phase.category ?? "Phase"} Shift, ${phase.phase ?? "?"}) has no description.`,
        });
      }
    });

    // Duplicate phase + category combos
    const phaseKeys = phases.map(
      (p) => `${p.phase ?? "?"}:${p.category ?? "Phase"}`,
    );
    const seen = new Set<string>();
    const dupes = new Set<string>();
    phaseKeys.forEach((key) => {
      if (seen.has(key)) dupes.add(key);
      seen.add(key);
    });
    dupes.forEach((key) => {
      const [phaseBucket, type] = key.split(":");
      issues.push({
        severity: "warn",
        section: `${charLabel} / Progression Phases`,
        message: `Multiple ${type} Shifts in the ${phaseBucket} phase. Consider merging them or using a cue to differentiate.`,
      });
    });

    // Pet names
    (char.pet_names ?? []).forEach((entry, idx) => {
      if (!entry.name?.trim()) {
        issues.push({
          severity: "warn",
          section: `${charLabel} / Pet Names`,
          message: `Pet name entry #${idx + 1} has no term. Empty pet names are ignored on export.`,
        });
      }
    });
  });

  return issues;
}
