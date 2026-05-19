// src/utils/defaultBotGenerator.ts
import { v4 as uuidv4 } from "uuid";
import { CharacterProfile, GrokBotProfile } from "@/types/botSchema.ts";

const commonRPRules = [
  "The scene and physical settings persist across messages unless explicitly changed",
  "Characters only know what they could reasonably know through experience or communication",
  "Time moves forward and events have lasting consequences",
  "There are no unseen guiding forces or narrators beyond what is defined in the canon",
  "Canon facts take precedence over improvisation when conflicts arise",
  "Each character speaks only for themselves and only from their own perspective",
  "Characters respond only to events they directly observe or are told about",
  "Not every character must respond to every message; characters speak when it is natural",
  "Characters act and speak only within scenes where they are physically present",
];

export const defaultResponsePriority = [
  "Never speak, act, or decide for the user — no exceptions",
  "Maintain character voice and identity consistently",
  "Honor continuity — what has been established stays established",
  "Apply behavioral triggers when conditions are met",
  "Match user energy and response length",
  "Apply progression phase guidance",
  "Honor formatting and style rules",
];

export function createDefaultBot(): GrokBotProfile {
  return {
    id: uuidv4(),
    name: "New Bot",
    lastModified: new Date().toISOString(),
    intro: "",
    greeting: "",
    response_priority: [...defaultResponsePriority],
    rp_rules: [...commonRPRules],
    background: {
      characters: [],
      setting: {},
      scenario: {},
      boundaries: { allowed: [], disallowed: [] },
      meta: {},
    },
    status: 'unpublished',
  };
}

export function createDefaultCharacter(): CharacterProfile {
  return {
    id: uuidv4(),
    name: "New Character",
    lastModified: new Date().toISOString(),
  };
}
