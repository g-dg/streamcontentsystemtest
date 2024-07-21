import { ContentClient } from "@/api/content";
import clone from "@/helpers/clone";
import { natcasecmp } from "@/helpers/sort";
import { defineStore } from "pinia";
import { computed, ref, type ComputedRef, type Ref } from "vue";

export interface CurrentState {
  id: string;
  display: DisplayState;
}

export interface DisplayState {
  content: Record<string, string>;
  slide_type_id: string | null;
}

export const useSongStore = defineStore("song", () => {
  const songs = ref<Record<string, Record<string, string>>>({});

  const songTitlesSorted = computed(() =>
    Object.keys(songs.value).sort((a, b) => natcasecmp([a, b]))
  );

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
