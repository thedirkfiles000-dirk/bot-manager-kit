import type { ExportTarget, ExportContext } from "@/types/exportTarget";
import { buildPolyBuzzExport, buildDialogExamples } from "@/utils/exportObjectBuilder";
import { generateDialogMarkdown } from "@/utils/exportMarkdownEngine";
import YAML from "yaml";

function formatByMode(obj: any, markdown: string, ctx: ExportContext): string {
  if (ctx.format === "asMarkdown") return markdown;
  if (ctx.format === "asYAML") return YAML.stringify(obj, { lineWidth: 0 });
  return JSON.stringify(obj, null, 0);
}

export const polybuzzTarget: ExportTarget = {
  id: "polybuzz",
  name: "PolyBuzz - Regular Template",
  icon: "mdi-creation-outline",
  defaultFormat: "asMarkdown",
  markdownStyle: {
    headingOffset: 0,
    includeTitle: false,
    bundleDialog: false,
    hoistBoundariesMeta: true,
  },
  buildExportObject: buildPolyBuzzExport,
  fields: [
    {
      id: "polybuzz-name",
      label: "Bot Name",
      extract: (ctx) => ctx.bot.name || "",
    },
    {
      id: "polybuzz-intro",
      label: "Intro (Search Listing Description)",
      extract: (ctx) => ctx.bot.intro || "",
    },
    {
      id: "polybuzz-greeting",
      label: "Greeting",
      extract: (ctx) => ctx.bot.greeting || "",
    },
    {
      id: "polybuzz-background",
      label: "Background",
      extract: (ctx) => formatByMode(ctx.maskedObject, ctx.markdown, ctx),
    },
    {
      id: "polybuzz-dialog",
      label: "Dialog Examples",
      extract: (ctx) => {
        const dialog = buildDialogExamples(ctx.bot);
        if (ctx.format === "asMarkdown") {
          return generateDialogMarkdown(dialog?.dialog_examples, ctx.capsKeys);
        }
        if (ctx.format === "asYAML") return YAML.stringify(dialog, { lineWidth: 0 });
        return JSON.stringify(dialog, null, 0);
      },
    },
  ],
};
