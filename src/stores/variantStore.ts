import { defineStore } from "pinia";

export const useVariantStore = defineStore("variant", {
  state: () => ({
    activeVariant: null as string | null,
  }),
  actions: {
    setActiveVariant(value: string | null) {
      this.activeVariant = value;
    },
  },
  persist: true,
});
