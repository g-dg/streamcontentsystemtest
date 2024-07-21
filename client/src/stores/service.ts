import { defineStore } from "pinia";
import { computed, ref, watch, type ComputedRef, type Ref } from "vue";
import { useSongStore } from "./song";

export interface CurrentState {
  id: string;
  display: DisplayState;
}

export interface DisplayState {
  content: Record<string, string>;
  slide_type_id: string | null;
}

export const useServiceStore = defineStore("service", () => {
  const songStore = useSongStore();

  const serviceSongs = ref<Array<{ song: string; verses: Array<string> }>>([]);

  const selectedSongIndex = ref<number | null>(null);
  const selectedVerseName = ref<string | null>(null);
  watch(
    selectedSongIndex,
    (newSongIndex: number | null, oldSongIndex: number | null) => {
      if (newSongIndex != null && newSongIndex != oldSongIndex) {
        selectedVerseName.value = null;
      }
    }
  );

  const selectedSongTitle = computed(() =>
    selectedSongIndex.value != null
      ? serviceSongs.value[selectedSongIndex.value]?.song
      : null
  );
  const selectedSong = computed(() =>
    selectedSongTitle.value != null
      ? songStore.songs[selectedSongTitle.value]
      : null
  );
  const selectedVerseContent = computed(() =>
    selectedVerseName.value != null
      ? selectedSong.value?.[selectedVerseName.value]
      : null
  );

  function addSong(songTitle: string) {
    serviceSongs.value.push({ song: songTitle, verses: [] });
  }

  function removeSong(index: number) {
    serviceSongs.value.splice(index, 1);
  }

  function moveSong(index: number, direction: number) {
    const value = serviceSongs.value[index];
    const swapValue = serviceSongs.value[index + direction];
    serviceSongs.value[index + direction] = value;
    serviceSongs.value[index] = swapValue;
  }

  let importFileInput: HTMLInputElement;
  async function importService() {
    try {
      importFileInput = document.createElement("input");
      importFileInput.setAttribute("type", "file");
      importFileInput.addEventListener("change", processImport);
      importFileInput.click();
    } catch (e) {
      console.error(e);
      alert("An error occurred preparing for file import.");
    }
  }
  async function processImport() {
    try {
      const rawFileContent = (await importFileInput.files?.[0].text()) ?? "{}";

      const fileContent = JSON.parse(rawFileContent);

      if (typeof fileContent != "object" || fileContent == null) {
        return;
      }

      serviceSongs.value = fileContent;
    } catch (e) {
      console.error(e);
      alert("An error occurred importing the file. (Is it a valid format?)");
    }
  }

  async function exportService() {
    try {
      const now = new Date();
      const filename = `${now.getFullYear()}-${String(
        now.getMonth() + 1
      ).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${
        now.getHours() < 12 ? "AM" : "PM"
      }.json`;

      const objectURL = URL.createObjectURL(
        new Blob([JSON.stringify(serviceSongs.value)], {
          type: "application/json",
        })
      );
      const fileLink = document.createElement("a");
      fileLink.setAttribute("href", objectURL);
      fileLink.setAttribute("download", filename);
      fileLink.click();
      window.setTimeout(() => URL.revokeObjectURL(objectURL), 1000 * 60 * 60);
    } catch (e) {
      console.error(e);
      alert("An error occurred exporting the file.");
    }
  }

  return {
    serviceSongs,
    selectedSongIndex,
    selectedVerseName,
    selectedSongTitle,
    selectedSong,
    selectedVerseContent,
    addSong,
    removeSong,
    moveSong,
    importService,
    exportService,
  };
});
