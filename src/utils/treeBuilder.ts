// src/utils/treeBuilder.ts
//
// Builds the editor tree by walking the active schema's `properties` and
// resolving `x-ui-panel` strings against the panel registry. Properties with
// no panel (or `x-ui-panel: "hidden"`) are skipped.
//
// Grouping:
//   - Fields with the same `x-ui-section` are grouped under a folder node
//     named after that section.
//   - Fields without `x-ui-section` go under a default "Properties" section.
//   - A section containing exactly one field collapses to a single leaf at
//     the top level (no enclosing folder).
//
// Ordering:
//   - Sections appear in the order their first member is declared in the
//     schema. (Schema declaration order ≈ author intent.)
//   - Within a section, fields are sorted by `x-ui-order` (ascending);
//     unspecified orders fall to the end in schema-declaration order.

import { markRaw } from "vue";
import type { TreeNode } from "@/types/treeNode.ts";
import { useActiveSchemaStore } from "@/stores/activeSchemaStore";
import { resolvePanel } from "@/components/panels/registry";

interface SchemaProp {
  description?: string;
  "x-ui-panel"?: string;
  "x-ui-section"?: string;
  "x-ui-order"?: number;
  "x-ui-label"?: string;
  "x-ui-helper"?: string;
  default?: unknown;
}

interface FieldEntry {
  name: string;
  def: SchemaProp;
  section: string;
  order: number;
  declarationIndex: number;
}

const DEFAULT_SECTION = "Properties";

function titleCase(s: string): string {
  return s
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function makeLeaf(entry: FieldEntry): TreeNode {
  const panel = resolvePanel(entry.def["x-ui-panel"]);
  const label = entry.def["x-ui-label"] ?? titleCase(entry.name);

  const baseProps: Record<string, unknown> = {
    path: entry.name,
    title: label,
  };
  if (entry.def["x-ui-helper"]) baseProps.helperText = entry.def["x-ui-helper"];
  if (entry.def.default !== undefined) baseProps.defaultValue = entry.def.default;

  return {
    id: `field-${entry.name}`,
    title: label,
    icon: "mdi-circle-small",
    component: panel ? markRaw(panel) : null,
    props: baseProps,
    subPaths: [entry.name],
  };
}

export function buildFullTree(): TreeNode[] {
  const schemaStore = useActiveSchemaStore();
  const schema = schemaStore.active?.raw as
    | { properties?: Record<string, SchemaProp> }
    | undefined;
  if (!schema?.properties) return [];

  // Collect renderable fields with their section + order metadata.
  const fields: FieldEntry[] = [];
  let i = 0;
  for (const [name, def] of Object.entries(schema.properties)) {
    const panel = def["x-ui-panel"];
    if (!panel || panel === "hidden") {
      i++;
      continue;
    }
    if (!resolvePanel(panel)) {
      console.warn(`Schema field "${name}" requests unknown panel "${panel}"; skipping.`);
      i++;
      continue;
    }
    fields.push({
      name,
      def,
      section: def["x-ui-section"] ?? DEFAULT_SECTION,
      order: def["x-ui-order"] ?? Number.POSITIVE_INFINITY,
      declarationIndex: i++,
    });
  }

  // Group by section, preserving the order each section was first seen.
  const sectionOrder: string[] = [];
  const bySection = new Map<string, FieldEntry[]>();
  for (const f of fields) {
    if (!bySection.has(f.section)) {
      sectionOrder.push(f.section);
      bySection.set(f.section, []);
    }
    bySection.get(f.section)!.push(f);
  }
  for (const arr of bySection.values()) {
    arr.sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return a.declarationIndex - b.declarationIndex;
    });
  }

  // Build the tree. Single-field sections collapse to a top-level leaf.
  const tree: TreeNode[] = [];
  for (const sectionName of sectionOrder) {
    const entries = bySection.get(sectionName)!;
    if (entries.length === 1) {
      tree.push(makeLeaf(entries[0]));
      continue;
    }
    tree.push({
      id: `section-${slug(sectionName)}`,
      title: sectionName,
      icon: "mdi-folder-outline",
      component: null,
      children: entries.map(makeLeaf),
      subPaths: entries.map((e) => e.name),
    });
  }
  return tree;
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
