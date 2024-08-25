import { defineStore } from "pinia";
import { computed, ref } from "vue";

import { ContentClient } from "@/api/content";
import { natcasecmp } from "@/helpers/sort";

const SONG_FILE = "songs.json";

/** Song store */
export const useSongStore = defineStore("song", () => {
  /** List of songs */
  const songs = ref<Record<string, Record<string, string>>>({});

  /** Song tiles sorted by name */
  const songTitlesSorted = computed(() =>
    Object.keys(songs.value).sort((a, b) => natcasecmp([a, b]))
  );

  let songLoadingPromise: Promise<void> | null = null;

  /** Load songs from server */
  function loadSongs(force = false): Promise<void> {
    if (songLoadingPromise == null) {
      songLoadingPromise = loadSongsAsync(force);
    }
    return songLoadingPromise;
  }

  async function loadSongsAsync(force = false): Promise<void> {
    if (!force && Object.keys(songs.value).length > 0) {
      return;
    }

    try {
      const content = await ContentClient.getContent(SONG_FILE);
      const converted = JSON.parse(content);
      songs.value = converted;
    } catch (e) {
      console.error(e);
      alert("An error occurred loading songs. (Is the server running?)");
    }

    songLoadingPromise = null;
  }

  async function saveSongs() {
    try {
      const songsJson = JSON.stringify(
        Object.fromEntries(
          Object.entries(songs.value)
            .sort((a, b) => natcasecmp([a[0], b[0]]))
            .map(([title, song]) => [
              title,
              Object.fromEntries(
                Object.entries(song).sort((a, b) => natcasecmp([a[0], b[0]]))
              ),
            ])
        )
      );

      await ContentClient.setContent(SONG_FILE, songsJson);
    } catch (e) {
      console.error(e);
      alert("An error occurred saving songs. (Is the server running?)");
    }
  }

  return {
    songs,
    songTitlesSorted,
    loadSongs,
    saveSongs,
  };
});
