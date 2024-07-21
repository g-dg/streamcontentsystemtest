import { defineStore } from "pinia";
import {
  computed,
  nextTick,
  ref,
  watch,
  type ComputedRef,
  type Ref,
} from "vue";
import { useSongStore } from "./song";

export interface ServiceData {
  songs: Array<{ song: string; verses: Array<string> }>;
  textContent: Record<string, string>;
}

export const useServiceStore = defineStore("service", () => {
  const songStore = useSongStore();

  const unsavedChanges = ref(false);
  const serviceData: Ref<ServiceData> = ref({ songs: [], textContent: {} });
  //TODO: add checks for unsaved changes

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
      ? serviceData.value.songs[selectedSongIndex.value]?.song
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
    serviceData.value.songs.push({ song: songTitle, verses: [] });
  }

  function removeSong(index: number) {
    if (index == selectedSongIndex.value) {
      selectedVerseName.value = null;
      selectedSongIndex.value = null;
    }
    serviceData.value.songs.splice(index, 1);
  }

  function moveSong(index: number, direction: number) {
    const value = serviceData.value.songs[index];
    const swapValue = serviceData.value.songs[index + direction];

    serviceData.value.songs[index + direction] = value;
    serviceData.value.songs[index] = swapValue;

    if (index == selectedSongIndex.value) {
      selectedSongIndex.value = index + direction;
    } else if (index + direction == selectedSongIndex.value) {
      selectedSongIndex.value = index;
    }
  }

  function clearService() {
    selectedVerseName.value = null;
    selectedSongIndex.value = null;
    serviceData.value.songs = [];
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

      serviceData.value = fileContent;

      nextTick(() => (unsavedChanges.value = false));
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
        new Blob([JSON.stringify(serviceData.value)], {
          type: "application/json",
        })
      );
      const fileLink = document.createElement("a");
      fileLink.setAttribute("href", objectURL);
      fileLink.setAttribute("download", filename);
      fileLink.click();
      window.setTimeout(() => URL.revokeObjectURL(objectURL), 1000 * 60 * 60);
      nextTick(() => (unsavedChanges.value = false));
    } catch (e) {
      console.error(e);
      alert("An error occurred exporting the file.");
    }
  }

  return {
    unsavedChanges: computed(() => unsavedChanges.value),
    serviceData,
    selectedSongIndex,
    selectedVerseName,
    selectedSongTitle,
    selectedSong,
    selectedVerseContent,
    addSong,
    removeSong,
    moveSong,
    clearService,
    importService,
    exportService,
  };
});
