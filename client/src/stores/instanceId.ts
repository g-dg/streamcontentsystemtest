import { uuid } from "@/helpers/random";
import { defineStore } from "pinia";

/** Instance Id store */
export const useInstanceIdStore = defineStore("instanceId", () => {
  /**
   * App instance id
   * Used to prevent a bug (not sure if browser, or desktop environment, or what) where it thinks that you're dragging even if you reload the page.
   */
  const appInstanceId = uuid();

  return {
    appInstanceId,
  };
});
