// src/utils/treeBuilder.ts
import { markRaw } from "vue";
import type { TreeNode } from "@/types/treeNode.ts";

// ── Panels ────────────────────────────────────────────────
import BotBasicPanel from "@/components/panels/BotBasicPanel.vue";
import BotResponsePriorityPanel from "@/components/panels/BotResponsePriorityPanel.vue";
import BackgroundSettingPanel from "@/components/panels/BackgroundSettingPanel.vue";
import BackgroundScenarioPanel from "@/components/panels/BackgroundScenarioPanel.vue";
import BackgroundBoundariesPanel from "@/components/panels/BackgroundBoundariesPanel.vue";
import BackgroundMetaPanel from "@/components/panels/BackgroundMetaPanel.vue";
import BackgroundAnchorsPanel from "@/components/panels/BackgroundAnchorsPanel.vue";
import BackgroundCohortPanel from "@/components/panels/BackgroundCohortPanel.vue";
import BackgroundLorbookPanel from "@/components/panels/BackgroundLorbookPanel.vue";

import CharacterBasicPanel from "@/components/panels/CharacterBasicPanel.vue";
import CharacterAppearancePanel from "@/components/panels/CharacterAppearancePanel.vue";
import CharacterPersonalityPanel from "@/components/panels/CharacterPersonalityPanel.vue";
import CharacterBackstoryPanel from "@/components/panels/CharacterBackstoryPanel.vue";
import CharacterRelationshipsPanel from "@/components/panels/CharacterRelationshipsPanel.vue";
import CharacterSkillsPanel from "@/components/panels/CharacterSkillsPanel.vue";
import CharacterStoryHooksPanel from "@/components/panels/CharacterStoryHooksPanel.vue";
import CharacterFramingPanel from "@/components/panels/CharacterFramingPanel.vue";
import CharacterBehaviorRulesPanel from "@/components/panels/CharacterBehaviorRulesPanel.vue";
import CharacterDialogExamplesPanel from "@/components/panels/CharacterDialogExamplesPanel.vue";
import CharacterViewpointPanel from "@/components/panels/CharacterViewpointPanel.vue";
import CharacterPetNamesPanel from "@/components/panels/CharacterPetNamesPanel.vue";
import CharacterProgressionPanel from "@/components/panels/CharacterProgressionPanel.vue";

// ── Character sub-tree factory ─────────────────────────────
function buildCharacterNode(char: { id: string; name?: string }): TreeNode {
  const cid = char.id;
  const name = char.name?.trim() || "Character";
  const prefix = `character.${cid}`;

  return {
    id: `char-${cid}`,
    title: name,
    icon: "mdi-account",
    component: null, // ← folder node
    children: [
      {
        id: `char-${cid}-basic`,
        title: "Basic Info",
        icon: "mdi-card-account-details-outline",
        component: markRaw(CharacterBasicPanel),
        props: { charPrefix: prefix },
        subPaths: [
          `${prefix}.name`,
          `${prefix}.full_name`,
          `${prefix}.nickname`,
          `${prefix}.archetype`,
          `${prefix}.age`,
          `${prefix}.gender`,
          `${prefix}.orientation`,
          `${prefix}.role`,
          `${prefix}.overview`,
        ],
      },
      {
        id: `char-${cid}-appearance`,
        title: "Appearance",
        icon: "mdi-face-woman",
        component: markRaw(CharacterAppearancePanel),
        props: { charPrefix: prefix },
        subPaths: [
          `${prefix}.appearance.height`,
          `${prefix}.appearance.build`,
          `${prefix}.appearance.hair`,
          `${prefix}.appearance.eyes`,
          `${prefix}.appearance.notable_features`,
          `${prefix}.appearance.style`,
        ],
      },
      {
        id: `char-${cid}-personality`,
        title: "Personality",
        icon: "mdi-head-heart",
        component: markRaw(CharacterPersonalityPanel),
        props: { charPrefix: prefix },
        subPaths: [
          `${prefix}.personality.traits`,
          `${prefix}.personality.motivations`,
          `${prefix}.personality.fears`,
          `${prefix}.personality.values`,
        ],
      },
      // ── Backstory ───────────────────────────────────────
      {
        id: `char-${cid}-backstory`,
        title: "Backstory",
        icon: "mdi-book-open-page-variant",
        component: markRaw(CharacterBackstoryPanel),
        props: { charPrefix: prefix },
        subPaths: [`${prefix}.backstory`],
      },
      // ── Relationships ───────────────────────────────────
      {
        id: `char-${cid}-relationships`,
        title: "Relationships",
        icon: "mdi-account-multiple",
        component: markRaw(CharacterRelationshipsPanel),
        props: { charPrefix: prefix },
        subPaths: [`${prefix}.relationships`, `${prefix}.relationship_history`],
      },
      // ── Skills ──────────────────────────────────────────
      {
        id: `char-${cid}-skills`,
        title: "Skills & Abilities",
        icon: "mdi-school",
        component: markRaw(CharacterSkillsPanel),
        props: { charPrefix: prefix },
        subPaths: [
          `${prefix}.skills.expertise`,
          `${prefix}.skills.hobbies`,
          `${prefix}.skills.strengths`,
          `${prefix}.skills.limitations`,
        ],
      },
      // ── Story Hooks ─────────────────────────────────────
      {
        id: `char-${cid}-hooks`,
        title: "Story Hooks",
        icon: "mdi-target",
        component: markRaw(CharacterStoryHooksPanel),
        props: { charPrefix: prefix },
        subPaths: [
          `${prefix}.story_hooks.current_conflict`,
          `${prefix}.story_hooks.goals`,
        ],
      },
      // ── Drive & Viewpoint ────────────────────────────────
      {
        id: `char-${cid}-viewpoint`,
        title: "Drive & Viewpoint",
        icon: "mdi-eye-circle-outline",
        component: markRaw(CharacterViewpointPanel),
        props: { charPrefix: prefix },
        subPaths: [`${prefix}.core_drive`, `${prefix}.user_viewpoint`],
      },
      // ── Framing ─────────────────────────────────────────
      {
        id: `char-${cid}-framing`,
        title: "Character RP Rules",
        icon: "mdi-format-quote-open",
        component: markRaw(CharacterFramingPanel),
        props: { charPrefix: prefix },
        subPaths: [`${prefix}.character_rp_rules`],
      },
      // ── Behavior Rules ──────────────────────────────────
      {
        id: `char-${cid}-behavior`,
        title: "Behavior Rules",
        icon: "mdi-robot",
        component: markRaw(CharacterBehaviorRulesPanel),
        props: { charPrefix: prefix },
        subPaths: [
          `${prefix}.behavior_rules.boundaries`,
          `${prefix}.behavior_rules.speech_style`,
          `${prefix}.behavior_rules.pacing_preference`,
          `${prefix}.behavior_rules.romantic_availability`,
          `${prefix}.behavior_rules.character_specific_themes`,
          `${prefix}.character_anchors`,
          `${prefix}.character_triggers`,
        ],
      },
      // ── Pet Names ───────────────────────────────────────
      {
        id: `char-${cid}-petnames`,
        title: "Pet Names",
        icon: "mdi-heart-outline",
        component: markRaw(CharacterPetNamesPanel),
        props: { charPrefix: prefix },
        subPaths: [`${prefix}.pet_names`],
      },
      // ── Progression ─────────────────────────────────────
      {
        id: `char-${cid}-progression`,
        title: "Progression Phases",
        icon: "mdi-chart-timeline-variant",
        component: markRaw(CharacterProgressionPanel),
        props: { charPrefix: prefix },
        subPaths: [`${prefix}.progression_phases`],
      },
      // ── Dialog Examples (most important for style) ──────
      {
        id: `char-${cid}-dialog`,
        title: "Dialog Examples",
        icon: "mdi-message-text",
        component: markRaw(CharacterDialogExamplesPanel),
        props: { charPrefix: prefix },
        subPaths: [`${prefix}.dialog_examples`],
      },
    ],
  };
}

// ── Main tree builder ───────────────────────────────────────
export function buildFullTree(
  characters: Array<{ id: string; name?: string }>,
): TreeNode[] {
  return [
    // ── Bot-level nodes ─────────────────────────────────────
    {
      id: "bot-info",
      title: "Bot Info",
      icon: "mdi-robot",
      component: markRaw(BotBasicPanel),
      subPaths: ["name", "intro", "greeting", "usage_hints", "rp_rules"],
    },
    {
      id: "bot-response-priority",
      title: "Response Priority",
      icon: "mdi-sort-numeric-ascending",
      component: markRaw(BotResponsePriorityPanel),
      subPaths: ["response_priority"],
    },
    {
      id: "background",
      title: "Background",
      icon: "mdi-earth",
      component: null,
      children: [
        {
          id: "bg-setting",
          title: "Setting",
          icon: "mdi-map",
          component: markRaw(BackgroundSettingPanel),
          subPaths: [
            "background.setting.location",
            "background.setting.era",
            "background.setting.city",
            "background.setting.specific_location",
            "background.setting.environment_tone",
            "background.setting.realism",
            "background.setting.lifestyle",
          ],
        },
        {
          id: "bg-scenario",
          title: "Scenario",
          icon: "mdi-script",
          component: markRaw(BackgroundScenarioPanel),
          subPaths: [
            "background.scenario.premise",
            "background.scenario.ongoing_dynamic",
            "background.scenario.starting_state_with_user",
          ],
        },
        {
          id: "bg-boundaries",
          title: "Boundaries",
          icon: "mdi-shield-lock",
          component: markRaw(BackgroundBoundariesPanel),
          subPaths: [
            "background.boundaries.allowed",
            "background.boundaries.disallowed",
          ],
        },
        {
          id: "bg-meta",
          title: "Meta / RP Rules",
          icon: "mdi-cog",
          component: markRaw(BackgroundMetaPanel),
          subPaths: [
            "background.meta.fourth_wall_behavior",
            "background.meta.continuity_rules",
          ],
        },
        {
          id: "bg-anchors",
          title: "Anchors & Triggers",
          icon: "mdi-anchor",
          component: markRaw(BackgroundAnchorsPanel),
          subPaths: [
            "background.anchors",
            "background.triggers",
          ],
        },
        {
          id: "bg-cohort",
          title: "Cohort",
          icon: "mdi-account-group-outline",
          component: markRaw(BackgroundCohortPanel),
          subPaths: ["background.cohorts"],
        },
        {
          id: "bg-lorebook",
          title: "Lorebook",
          icon: "mdi-book-open-variant",
          component: markRaw(BackgroundLorbookPanel),
          subPaths: ["background.lorebook"],
        },
      ],
    },

    // ── Dynamic character sections ──────────────────────────
    ...characters.map(buildCharacterNode),
  ];
}
