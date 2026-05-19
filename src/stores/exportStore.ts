import { defineStore } from "pinia";
import { ref } from "vue";

export const useExportStore = defineStore(
  "export",
  () => {
    const masks = ref<Record<string, string[]>>({});

    function setMask(key: string, ids: string[]) {
      masks.value[key] = ids;
    }

    return { masks, setMask };
  },
  {
    persist: {
      key: "grokbot-export-masks", // Explicit key is safer in v4
      storage: sessionStorage, // Direct reference to sessionStorage
      pick: ["masks"], // 'paths' was renamed to 'pick' in newer versions
    },
  },
);
