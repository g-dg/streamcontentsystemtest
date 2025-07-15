import { defineStore } from "pinia";
import { computed, ref } from "vue";

import { ContentClient } from "@/api/content";
import { natcasecmp } from "@/helpers/sort";
import type { PlaceholderValue } from "./service";

const CONTENT_FILE = "content.json";
export const CONTENT_CURRENT_VERSION = 2;

export interface PremadeContent {
  version: number;
  items?: Record<string, PremadeContentItem>;
}

export interface PremadeContentItem {
  group?: string;
  data?: Array<PlaceholderValue>;
  pages?: Record<string, PremadeContentItemPage>
}

export interface PremadeContentItemPage {
  data?: Array<PlaceholderValue>;
}

/** Premade content store */
export const usePremadeContentStore = defineStore("premadeContent", () => {
  /** List of premade content */
  const premadeContent = ref<PremadeContent>({
    version: CONTENT_CURRENT_VERSION,
  });

  /** Content tiles sorted by name */
  const premadeContentTitlesSorted = computed(() =>
    Object.keys(premadeContent.value.items ?? {}).sort((a, b) => natcasecmp([a, b]))
  );

  let contentLoadingPromise: Promise<void> | undefined = undefined;

  /** Load content from server */
  function loadPremadeContent(force = false): Promise<void> {
    if (contentLoadingPromise == undefined) {
      contentLoadingPromise = loadContentAsync(force);
    }
    return contentLoadingPromise;
  }

  async function loadContentAsync(force = false): Promise<void> {
    if (!force && premadeContent.value.items != undefined) {
      return;
    }

    try {
      const content = await ContentClient.getContent(CONTENT_FILE);
      const converted = JSON.parse(content);
      premadeContent.value = converted;
    } catch (e) {
      console.error(e);
      alert("An error occurred loading premade content. (Is the server running?)");
    }

    contentLoadingPromise = undefined;
  }

  async function savePremadeContent() {
    try {
      const premadeContentJson = JSON.stringify(premadeContent.value);

      await ContentClient.setContent(CONTENT_FILE, premadeContentJson);
    } catch (e) {
      console.error(e);
      alert("An error occurred saving premade content. (Is the server running?)");
    }
  }

  return {
    premadeContent,
    premadeContentTitlesSorted,
    loadPremadeContent,
    savePremadeContent,
  };
});
