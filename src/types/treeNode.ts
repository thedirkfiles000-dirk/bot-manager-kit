import type { Component } from 'vue';

export interface TreeNode {
  id: string;
  title: string;
  icon: string;
  component?: Component | null;     // null = folder / group node
  props?: Record<string, any>;
  subPaths?: string[];               // used by override-badges
  children?: TreeNode[];
}