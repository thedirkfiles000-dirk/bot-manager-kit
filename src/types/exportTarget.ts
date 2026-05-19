import type { GrokBotProfile } from "@/types/botSchema";

export type ExportFormat = "asMarkdown" | "asYAML" | "asJSON";

export interface MarkdownStyle {
  /** PolyBuzz = 0 (h1 top-level), HotChatBots = 1 (h2 top-level, h1 is bot name) */
  headingOffset: 0 | 1;
  /** HotChatBots includes bot name as h1 title */
  includeTitle: boolean;
  /** HotChatBots bundles dialog_examples into the background object */
  bundleDialog: boolean;
  /** HotChatBots nests boundaries/meta inside canon; PolyBuzz hoists them */
  hoistBoundariesMeta: boolean;
}

export interface ExportTarget {
  id: string;
  name: string;
  icon?: string;
  defaultFormat: ExportFormat;
  markdownStyle: MarkdownStyle;
  /** Build the structured export object from a bot profile */
  buildExportObject: (bot: GrokBotProfile) => Record<string, any>;
  /** Fields available for individual copy */
  fields: ExportField[];
}

export interface ExportField {
  id: string;
  label: string;
  /** Extract the copyable text for this field from the context */
  extract: (ctx: ExportContext) => string;
}

export interface ExportContext {
  bot: GrokBotProfile;
  maskedObject: Record<string, any>;
  format: ExportFormat;
  capsKeys: boolean;
  markdown: string;
}
