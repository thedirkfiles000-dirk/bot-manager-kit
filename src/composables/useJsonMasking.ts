import { computed, ComputedRef, ref } from "vue";
import { useExportStore } from "@/stores/exportStore.ts";
import { useBotStore } from "@/stores/botStore.ts";

interface MaskTreeNode {
  id: string;
  name: string;
  children?: MaskTreeNode[];
}

export function useJsonMasking({
  baseObject,
  suffix,
  rootName = "Export Root",
}: {
  baseObject: ComputedRef<Record<string, any> | undefined>;
  suffix: string;
  rootName?: string;
}) {
  const exportStore = useExportStore();
  const botStore = useBotStore();

  const botId = botStore.currentBot?.id || "temp"

  // Create a reactive key so the store lookup updates if the bot changes
  const maskKey = computed(() => `${botId}_${suffix}`);

  // Reactive binding to the Pinia store
  const maskedIds = computed({
    get: () => exportStore.masks[maskKey.value] || [],
    set: (val: string[]) => exportStore.setMask(maskKey.value, val),
  });

  const opened = ref<string[]>([]);

  // Recursive tree builder (unchanged from previous generic version)
  const buildTree = (
    value: any,
    currentPath: string,
    displayName: string,
  ): MaskTreeNode => {
    if (value === null || value === undefined) {
      return { id: currentPath, name: `${displayName} (empty)` };
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return { id: currentPath, name: `${displayName} (empty array)` };
      }

      const children: MaskTreeNode[] = value.map((item: any, idx: number) => {
        let itemName = `[${idx + 1}]`;
        if (
          typeof item === "object" &&
          item !== null &&
          "dialog" in item &&
          Array.isArray(item.dialog)
        ) {
          const count = item.dialog.length;
          itemName = `Example #${idx + 1} (${count} line${count !== 1 ? "s" : ""})`;
        } else if (typeof item === "object" && item !== null) {
          const subKeys = Object.keys(item).length;
          itemName = `Item ${idx + 1} (${subKeys} ${subKeys === 1 ? "property" : "properties"})`;
        }
        return buildTree(item, `${currentPath}[${idx}]`, itemName);
      });

      return {
        id: currentPath,
        name: `${displayName} (${value.length} items)`,
        children,
      };
    }

    if (typeof value === "object") {
      const keys = Object.keys(value);
      if (keys.length === 0) {
        return { id: currentPath, name: `${displayName} (empty object)` };
      }

      const children: MaskTreeNode[] = keys.map((key) => {
        // Always use just the key as display name
        return buildTree(value[key], `${currentPath}.${key}`, key);
      });

      return {
        id: currentPath,
        name: displayName,
        children,
      };
    }

    // Primitive
    const valStr = String(value);
    const truncated = valStr.length > 80 ? valStr.slice(0, 80) + "..." : valStr;
    return { id: currentPath, name: `${displayName}: ${truncated}` };
  };

  const treeItems = computed<MaskTreeNode[]>(() => {
    if (!baseObject.value) return [];

    const rootObj = baseObject.value;
    const rootKeys = Object.keys(rootObj).filter((k) => k !== "id");

    if (rootKeys.length === 0) {
      return [{ id: "root", name: `${rootName} (empty)` }];
    }

    const children: MaskTreeNode[] = rootKeys.map((key) => {
      return buildTree(rootObj[key], `root.${key}`, key);
    });

    return [
      {
        id: "root",
        name: rootName,
        children,
      },
    ];
  });

  const isExcluded = (id: string): boolean => {
    return maskedIds.value.some(
      (masked) =>
        id === masked ||
        id.startsWith(`${masked}.`) ||
        id.startsWith(`${masked}[`),
    );
  };

  const unset = (obj: any, path: string) => {
    if (!path || path === "root") return;
    let cleanPath = path.replace(/^root\.?/, "");
    if (!cleanPath) return;

    const parts = cleanPath.match(/[^.[\]]+/g) || [];
    let current = obj;

    for (let i = 0; i < parts.length - 1; i++) {
      const key = parts[i];
      if (!(key in current)) return;
      current = current[key];
    }

    const lastKey = parts[parts.length - 1];
    if (Array.isArray(current)) {
      const idx = parseInt(lastKey, 10);
      if (!isNaN(idx)) current.splice(idx, 1);
    } else if (current && typeof current === "object") {
      delete current[lastKey];
    }
  };

  const maskedObject = computed(() => {
    if (!baseObject.value) return null;
    const clone = structuredClone(baseObject.value);

    // Sort descending to handle array index shifting
    const sortedMasked = [...maskedIds.value].sort((a, b) => {
      return b.localeCompare(a, undefined, {
        numeric: true,
        sensitivity: "base",
      });
    });

    for (const path of sortedMasked) {
      unset(clone, path);
    }
    return clone;
  });

  const resetMask = () => exportStore.setMask(maskKey.value, []);

  return {
    treeItems,
    isExcluded,
    maskedObject,
    resetMask,
    opened,
    maskedCount: computed(() => maskedIds.value.length),
    maskedIds, // Return this so the component can v-model to it
  };
}
