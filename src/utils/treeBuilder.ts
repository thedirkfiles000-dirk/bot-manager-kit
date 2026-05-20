// src/utils/treeBuilder.ts
//
// Builds the editor tree for the bundled Starter schema. Hand-coded for now;
// task #9 replaces this with a schema-driven walker that builds the same
// structure from the active schema's `x-ui-*` annotations.

import { markRaw } from "vue";
import type { TreeNode } from "@/types/treeNode.ts";

import GenericTextFieldPanel from "@/components/panels/GenericTextFieldPanel.vue";
import GenericNumberFieldPanel from "@/components/panels/GenericNumberFieldPanel.vue";
import GenericTextareaPanel from "@/components/panels/GenericTextareaPanel.vue";
import ItemListPanel from "@/components/panels/ItemListPanel.vue";

export function buildFullTree(): TreeNode[] {
  return [
    {
      id: "identity",
      title: "Identity",
      icon: "mdi-card-account-details-outline",
      component: null,
      children: [
        {
          id: "identity-name",
          title: "Name",
          icon: "mdi-rename-box",
          component: markRaw(GenericTextFieldPanel),
          props: { path: "name", title: "Name" },
          subPaths: ["name"],
        },
        {
          id: "identity-sex",
          title: "Sex",
          icon: "mdi-account-question",
          component: markRaw(GenericTextFieldPanel),
          props: { path: "sex", title: "Sex" },
          subPaths: ["sex"],
        },
        {
          id: "identity-age",
          title: "Age",
          icon: "mdi-numeric",
          component: markRaw(GenericNumberFieldPanel),
          props: { path: "age", title: "Age", defaultValue: 0 },
          subPaths: ["age"],
        },
        {
          id: "identity-tagline",
          title: "Tagline",
          icon: "mdi-format-quote-close",
          component: markRaw(GenericTextareaPanel),
          props: { path: "tagline", title: "Tagline" },
          subPaths: ["tagline"],
        },
      ],
    },
    {
      id: "personality",
      title: "Personality",
      icon: "mdi-head-heart",
      component: markRaw(GenericTextareaPanel),
      props: { path: "personality", title: "Personality" },
      subPaths: ["personality"],
    },
    {
      id: "backstory",
      title: "Backstory",
      icon: "mdi-book-open-page-variant",
      component: markRaw(GenericTextareaPanel),
      props: { path: "backstory", title: "Backstory" },
      subPaths: ["backstory"],
    },
    {
      id: "goals",
      title: "Goals",
      icon: "mdi-target",
      component: markRaw(GenericTextareaPanel),
      props: { path: "goals", title: "Goals" },
      subPaths: ["goals"],
    },
    {
      id: "likes",
      title: "Likes",
      icon: "mdi-thumb-up-outline",
      component: markRaw(ItemListPanel),
      props: { path: "likes", title: "Likes" },
      subPaths: ["likes"],
    },
    {
      id: "dislikes",
      title: "Dislikes",
      icon: "mdi-thumb-down-outline",
      component: markRaw(ItemListPanel),
      props: { path: "dislikes", title: "Dislikes" },
      subPaths: ["dislikes"],
    },
  ];
}
