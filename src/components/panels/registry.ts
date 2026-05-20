// src/components/panels/registry.ts
//
// Maps an `x-ui-panel` string from the schema to the Vue component that
// renders it. The schema-driven tree resolves panel names through this map.
//
// Adding a panel: write the component (must accept a `path: string` prop),
// import it here, and add an entry. Schemas pick it up by setting
// `x-ui-panel: "<name>"` on a property.

import { markRaw, type Component } from "vue";

import GenericTextFieldPanel from "./GenericTextFieldPanel.vue";
import GenericTextareaPanel from "./GenericTextareaPanel.vue";
import GenericNumberFieldPanel from "./GenericNumberFieldPanel.vue";
import ItemListPanel from "./ItemListPanel.vue";
import DialogExamplesPanel from "./DialogExamplesPanel.vue";

export const panelRegistry: Record<string, Component> = {
  text: markRaw(GenericTextFieldPanel),
  textarea: markRaw(GenericTextareaPanel),
  number: markRaw(GenericNumberFieldPanel),
  stringList: markRaw(ItemListPanel),
  dialogExamples: markRaw(DialogExamplesPanel),
};

/** Reserved `x-ui-panel` value that suppresses a field from the editor tree. */
export const HIDDEN_PANEL = "hidden";

/** Look up a panel by name. Returns undefined for unknown names (caller decides what to do). */
export function resolvePanel(name: string | undefined): Component | undefined {
  if (!name || name === HIDDEN_PANEL) return undefined;
  return panelRegistry[name];
}
