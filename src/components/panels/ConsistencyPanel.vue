<!-- src/components/panels/ConsistencyPanel.vue -->
<!-- Pre-export consistency check panel. Non-blocking — warns, never prevents export. -->
<template>
  <v-card
    flat
    :color="panelColor"
    class="mb-4 consistency-panel"
    :border="true"
  >
    <v-card-title
      class="d-flex align-center cursor-pointer py-2 px-4"
      style="user-select: none"
      @click="expanded = !expanded"
    >
      <v-icon :icon="statusIcon" :color="iconColor" class="mr-2" size="20" />
      <span class="text-body-2 font-weight-medium" :class="titleClass">
        {{ titleText }}
      </span>

      <v-badge
        v-if="errorCount > 0"
        :content="errorCount"
        color="error"
        inline
        class="ml-2"
      />
      <v-badge
        v-if="warnCount > 0"
        :content="warnCount"
        color="warning"
        inline
        class="ml-1"
      />

      <v-spacer />

      <v-icon
        :icon="expanded ? 'mdi-chevron-up' : 'mdi-chevron-down'"
        size="18"
        class="text-medium-emphasis"
      />
    </v-card-title>

    <v-expand-transition>
      <div v-if="expanded">
        <v-divider />
        <v-card-text class="py-2 px-4">
          <div v-if="issues.length === 0" class="text-body-2 text-medium-emphasis py-1">
            No issues found. This export looks consistent.
          </div>

          <template v-else>
            <!-- Group by section -->
            <div
              v-for="(group, section) in groupedIssues"
              :key="section"
              class="mb-3"
            >
              <div class="text-caption font-weight-bold text-uppercase text-medium-emphasis mb-1">
                {{ section }}
              </div>
              <div
                v-for="(issue, idx) in group"
                :key="idx"
                class="d-flex align-start mb-1"
              >
                <v-icon
                  :icon="severityIcon(issue.severity)"
                  :color="severityColor(issue.severity)"
                  size="16"
                  class="mt-0.5 mr-2 flex-shrink-0"
                />
                <span class="text-body-2">{{ issue.message }}</span>
              </div>
            </div>

            <div class="text-caption text-medium-emphasis mt-2 pt-2" style="border-top: 1px solid rgba(128,128,128,0.2)">
              Export is not blocked by these issues — they are advisory only.
            </div>
          </template>
        </v-card-text>
      </div>
    </v-expand-transition>
  </v-card>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import type { ConsistencyIssue, IssueSeverity } from "@/utils/botConsistencyCheck";

const props = defineProps<{
  issues: ConsistencyIssue[];
}>();

const expanded = ref(false);

const errorCount = computed(() => props.issues.filter((i) => i.severity === "error").length);
const warnCount = computed(() => props.issues.filter((i) => i.severity === "warn").length);
const infoCount = computed(() => props.issues.filter((i) => i.severity === "info").length);

// Group issues by section
const groupedIssues = computed(() => {
  const groups: Record<string, ConsistencyIssue[]> = {};
  for (const issue of props.issues) {
    if (!groups[issue.section]) groups[issue.section] = [];
    groups[issue.section].push(issue);
  }
  return groups;
});

const panelColor = computed(() => {
  if (errorCount.value > 0) return "error-lighten-5";
  if (warnCount.value > 0) return undefined;
  return undefined;
});

const statusIcon = computed(() => {
  if (errorCount.value > 0) return "mdi-alert-circle";
  if (warnCount.value > 0) return "mdi-alert";
  if (infoCount.value > 0) return "mdi-information";
  return "mdi-check-circle";
});

const iconColor = computed(() => {
  if (errorCount.value > 0) return "error";
  if (warnCount.value > 0) return "warning";
  if (infoCount.value > 0) return "info";
  return "success";
});

const titleClass = computed(() => {
  if (errorCount.value > 0) return "text-error";
  if (warnCount.value > 0) return "text-warning";
  return "text-medium-emphasis";
});

const titleText = computed(() => {
  if (props.issues.length === 0) return "Consistency Check — All Clear";
  const parts: string[] = [];
  if (errorCount.value > 0) parts.push(`${errorCount.value} error${errorCount.value > 1 ? "s" : ""}`);
  if (warnCount.value > 0) parts.push(`${warnCount.value} warning${warnCount.value > 1 ? "s" : ""}`);
  if (infoCount.value > 0) parts.push(`${infoCount.value} suggestion${infoCount.value > 1 ? "s" : ""}`);
  return `Consistency Check — ${parts.join(", ")}`;
});

function severityIcon(severity: IssueSeverity): string {
  if (severity === "error") return "mdi-alert-circle";
  if (severity === "warn") return "mdi-alert";
  return "mdi-information-outline";
}

function severityColor(severity: IssueSeverity): string {
  if (severity === "error") return "error";
  if (severity === "warn") return "warning";
  return "info";
}
</script>
