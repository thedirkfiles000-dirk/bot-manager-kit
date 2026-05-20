// src/utils/defaultBotGenerator.ts
//
// Produces a default bot conforming to the bundled Starter schema. When task
// #9 lands schema-driven defaulting, this function moves into the schema
// itself (defaults come from the schema's `default` keyword) and this file
// goes away.

import { v4 as uuidv4 } from "uuid";
import type { StarterBot } from "@/types/botSchema.ts";

export function createDefaultBot(): StarterBot {
  return {
    id: uuidv4(),
    name: "New Bot",
    lastModified: new Date().toISOString(),
    images: [],
  };
}
