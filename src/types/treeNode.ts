import type { Component } from 'vue';

export interface TreeNode {
  id: string;
  title: string;
  icon: string;
  component?: Component | null;     // null = folder / group node
  props?: Record<string, any>;
  subPaths?: string[];               // schema field paths covered by this node (used by the schema-driven tree)
  children?: TreeNode[];
}