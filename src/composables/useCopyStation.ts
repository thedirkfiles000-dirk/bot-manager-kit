import { computed, ref, type Ref } from "vue";
import type { ExportTarget, ExportFormat, ExportContext } from "@/types/exportTarget";
import type { GrokBotProfile } from "@/types/botSchema";
import { generateBackgroundMarkdown } from "@/utils/exportMarkdownEngine";
import { useJsonMasking } from "@/composables/useJsonMasking";

export interface TargetState {
  target: ExportTarget;
  bot: Ref<GrokBotProfile | null>;
  exportObject: Ref<Record<string, any>>;
  masking: ReturnType<typeof useJsonMasking>;
  markdown: Ref<string>;
  context: Ref<ExportContext>;
  copiedFields: Ref<Set<string>>;
}

export function useCopyStation(bot: Ref<GrokBotProfile | null>, targets: ExportTarget[]) {
  const format = ref<ExportFormat>("asMarkdown");
  const capsKeys = ref(true);

  function createTargetState(target: ExportTarget): TargetState {
    const copiedFields = ref<Set<string>>(new Set());

    const exportObject = computed<Record<string, any>>(() => {
      if (!bot.value) return {};
      return target.buildExportObject(bot.value);
    });

    const masking = useJsonMasking({
      baseObject: exportObject,
      suffix: `${target.id}-background`,
      rootName: `${target.name} Export`,
    });

    const maskedObject = computed(() => masking.maskedObject.value ?? exportObject.value);

    const markdown = computed(() => {
      if (!bot.value) return "";
      return generateBackgroundMarkdown(
        maskedObject.value,
        bot.value.name,
        target.markdownStyle,
        capsKeys.value,
      );
    });

    const context = computed<ExportContext>(() => ({
      bot: bot.value!,
      maskedObject: maskedObject.value,
      format: format.value,
      capsKeys: capsKeys.value,
      markdown: markdown.value,
    }));

    return {
      target,
      bot,
      exportObject,
      masking,
      markdown,
      context,
      copiedFields,
    };
  }

  const targetStates = targets.map(createTargetState);

  return {
    format,
    capsKeys,
    targetStates,
  };
}
