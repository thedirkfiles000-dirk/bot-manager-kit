import MarkdownIt from "markdown-it";
import { computed, type MaybeRefOrGetter, toValue } from "vue";

const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
});

/** Render a markdown string to HTML. */
export function renderMarkdown(source: string): string {
  return md.render(source);
}

/** Reactive computed that renders markdown from a ref/getter. */
export function useMarkdownRenderer(source: MaybeRefOrGetter<string>) {
  return computed(() => renderMarkdown(toValue(source)));
}
