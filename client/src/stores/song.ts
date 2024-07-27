import { defineStore } from "pinia";
import { computed, ref } from "vue";

import { ContentClient } from "@/api/content";
import clone from "@/helpers/clone";
import { natcasecmp } from "@/helpers/sort";

/** Song store */
export const useSongStore = defineStore("song", () => {
  /** List of songs */
  const songs = ref<Record<string, Record<string, string>>>({});

  /** Song tiles sorted by name */
  const songTitlesSorted = computed(() =>
    Object.keys(songs.value).sort((a, b) => natcasecmp([a, b]))
  );

  /** Load songs from server */
  async function loadSongs() {
    try {
      const content = await ContentClient.listContent();
      const converted = Object.fromEntries(
        Object.entries(content).map(([key, value]) => [key, JSON.parse(value)])
      );
      songs.value = clone(converted);
    } catch (e) {
      console.error(e);
      alert(
        "An error occurred loading all songs content. (Is the server running?)"
      );
    }
  }

  return {
    songs,
    songTitlesSorted,
    loadSongs,
  };
});
