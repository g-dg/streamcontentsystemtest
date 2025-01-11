import { defineStore } from "pinia";
import { ref } from "vue";

/** State store */
export const useDebugStore = defineStore("debug", () => {
  const debugEnabled = ref(false);

  return {
    debugEnabled,
  }
});
