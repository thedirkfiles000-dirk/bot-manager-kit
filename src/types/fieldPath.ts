/**
 * Branded string type for dot-notation field paths (e.g. "background.setting.location").
 * Use fieldPath() to construct one — the factory is the single place to add runtime
 * validation in dev mode if needed.
 */
export type FieldPath = string & { readonly __fieldPath: unique symbol };

export function fieldPath(p: string): FieldPath {
  return p as FieldPath;
}
