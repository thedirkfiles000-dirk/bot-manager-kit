<template>
  <v-card flat>
    <!-- Header with format selectors (only shown for complex exports) -->
    <v-card-actions v-if="modes.length > 0" class="pa-4">
      <v-btn
        v-for="mode in modes"
        :key="mode"
        @click="activeFormat = mode"
        :color="activeFormat === mode ? 'primary' : 'secondary'"
        variant="outlined"
        class="mr-2"
      >
        {{ modeDisplay(mode) }}
      </v-btn>

      <v-spacer />

      <slot name="header-extra" />
    </v-card-actions>

    <!-- Main display area -->
    <v-card-text
      class="text-start"
      :class="{ 'pa-4': modes.length > 0 }"
      :style="maxHeightStyle"
    >
      <div v-if="showRendered" v-html="renderedHtml" />

      <pre
        v-else
        ref="preRef"
        tabindex="0"
        @keydown.ctrl.a.prevent="selectAll"
        @keydown.ctrl.c.prevent="copyText"
      ><code
                    class="font-monospace text-body-2"
                    :class="{ 'wrap-lines': effectiveWrap }"
                    v-text="currentRawText"
                  /></pre>
    </v-card-text>

    <!-- Bottom controls -->
    <v-card-actions :class="{ 'pa-0': modes.length === 0 }">
      <slot name="footer-extra" />

      <v-checkbox
        v-if="showWrapCheckbox"
        v-model="activeWrapLines"
        :disabled="showRendered"
        label="Wrap Lines"
        density="compact"
        hide-details
      />

      <v-checkbox
        v-if="showRenderCheckbox"
        v-model="activeRenderMarkdown"
        label="Render Markdown"
        density="compact"
        hide-details
      />

      <v-spacer />

      <span class="text-caption mr-4">Characters: {{ charCount }}</span>

      <v-btn
        @click="copyText"
        color="primary"
        :variant="modes.length === 0 ? 'outlined' : undefined"
      >
        Copy {{ name }}
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { computed, ref, StyleValue, watch, useTemplateRef } from "vue";
import YAML from "yaml";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";

type FormatMode = "asYAML" | "asJSON" | "asMarkdown";

const props = defineProps({
  /** Display name for the "Copy ..." button (e.g. "Background") */
  name: { type: String, required: true },

  /** Structured object used for YAML/JSON output (null for simple text exports) */
  objectContent: { type: Object as () => any | null, default: null },

  /** String content used for text/markdown output (always required) */
  stringContent: { type: String, required: true },

  /** Sanitized HTML for rendered markdown (computed in parent) */
  renderedHtml: { type: String, default: "" },

  /** Available export formats – empty array = simple text mode */
  modes: {
    type: Array as () => FormatMode[],
    default: () => [],
  },

  /** Optional max height for scrollable area (null = no scrolling) */
  maxHeight: { type: String, default: "60vh" },

  /** Optional external binding for current format */
  currentFormat: {
    type: String as () => FormatMode | "text" | null,
    default: null,
  },

  /** Optional external binding for wrap lines */
  wrapLines: { type: Boolean, default: null },

  /** Optional external binding for render markdown */
  renderMarkdown: { type: Boolean, default: null },
});

const emit = defineEmits<{
  "update:currentFormat": [value: FormatMode | "text"];
  "update:wrapLines": [value: boolean];
  "update:renderMarkdown": [value: boolean];
}>();

// Internal state (used when no external v-model is provided)
const internalFormat = ref<FormatMode | "text">("text");
const internalWrap = ref(false);
const internalRender = ref(false);

// Active values (support both internal and external control)
const activeFormat = computed<FormatMode | "text">({
  get() {
    return (props.currentFormat ?? internalFormat.value) as FormatMode | "text";
  },
  set(value) {
    if (props.currentFormat !== null) {
      emit("update:currentFormat", value);
    } else {
      internalFormat.value = value;
    }
  },
});

const activeWrapLines = computed<boolean>({
  get() {
    return props.wrapLines ?? internalWrap.value;
  },
  set(value) {
    if (props.wrapLines !== null) {
      emit("update:wrapLines", value);
    } else {
      internalWrap.value = value;
    }
  },
});

const activeRenderMarkdown = computed<boolean>({
  get() {
    return props.renderMarkdown ?? internalRender.value;
  },
  set(value) {
    if (props.renderMarkdown !== null) {
      emit("update:renderMarkdown", value);
    } else {
      internalRender.value = value;
    }
  },
});

// Ensure format is valid when modes change
watch(
  () => props.modes,
  (newModes) => {
    if (newModes.length > 0) {
      if (!newModes.includes(activeFormat.value as FormatMode)) {
        activeFormat.value = newModes[0];
      }
    } else {
      activeFormat.value = "text";
    }
  },
  { immediate: true },
);

// Helpers
const modeDisplay = (mode: string) => {
  switch (mode) {
    case "asYAML":
      return "YAML";
    case "asJSON":
      return "JSON";
    case "asMarkdown":
      return "Markdown";
    default:
      return mode;
  }
};

const currentRawText = computed(() => {
  const fmt = activeFormat.value;

  // Text or raw markdown mode
  if (fmt === "text" || fmt === "asMarkdown") {
    return props.stringContent;
  }

  // YAML/JSON – require objectContent
  if (props.objectContent == null) return "";

  if (fmt === "asYAML") {
    return YAML.stringify(props.objectContent, { lineWidth: 0 });
  }
  if (fmt === "asJSON") {
    return JSON.stringify(props.objectContent, null, 0);
  }

  return "";
});

const charCount = computed(() => currentRawText.value.length);

const showRendered = computed(
  () => activeFormat.value === "asMarkdown" && activeRenderMarkdown.value,
);

const showRenderCheckbox = computed(
  () =>
    props.modes.includes("asMarkdown") && activeFormat.value === "asMarkdown",
);

const showWrapCheckbox = computed(() => activeFormat.value !== "text");

const effectiveWrap = computed(
  () =>
    activeFormat.value === "text" ||
    showRendered.value ||
    activeWrapLines.value,
);

const maxHeightStyle = computed<StyleValue>(() =>
  props.maxHeight ? { maxHeight: props.maxHeight, overflowY: "auto" } : {},
);

const preRef = useTemplateRef<HTMLElement>("preRef");

function selectAll() {
  const el = preRef.value;
  if (!el) return;
  const selection = window.getSelection();
  if (!selection) return;
  const range = document.createRange();
  range.selectNodeContents(el);
  selection.removeAllRanges();
  selection.addRange(range);
}

const copyText = async () => {
  await writeText(currentRawText.value);
};
</script>

<style scoped>
pre code.wrap-lines {
  white-space: pre-wrap !important;
  word-break: break-word !important;
}
</style>
