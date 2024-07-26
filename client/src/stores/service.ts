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
import { uuid } from "@/helpers/random";

export interface ServiceData {
  serviceItems: Array<ServiceItem>;
}

export interface ServiceItem {
  id: string;
  type: "empty" | "song" | "mainText" | "subText" | "smallText";
  song?: ServiceSong;
  text?: string;
  comment?: string;
}

export interface ServiceSong {
  title: string;
  verses: Array<string>;
}

export const useServiceStore = defineStore("service", () => {
  const songStore = useSongStore();

  const unsavedChanges = ref(false);
  const serviceData: Ref<ServiceData> = ref({ serviceItems: [] });
  //TODO: add checks for unsaved changes

  const selectedItemIndex = ref<number | null>(null);
  const selectedSubItemIndex = ref<number | string | null>(null);
  watch(
    selectedItemIndex,
    (newIndex: number | null, oldIndex: number | null) => {
      if (newIndex != null && newIndex != oldIndex) {
        selectedSubItemIndex.value = null;
      }
    }
  );

  const selectedItem = computed(() =>
    selectedItemIndex.value != null
      ? serviceData.value.serviceItems[selectedItemIndex.value]
      : null
  );

  function addEmpty() {
    addItem(
      {
        id: uuid(),
        type: "empty",
      },
      true
    );
  }

  function addSong(songTitle: string) {
    addItem(
      {
        id: uuid(),
        type: "song",
        song: { title: songTitle, verses: [] },
      },
      true
    );
  }

  function addText(type: "mainText" | "subText" | "smallText", text: string) {
    addItem(
      {
        id: uuid(),
        type,
        text,
      },
      true
    );
  }

  function addItem(item: ServiceItem, select: boolean = true) {
    const index =
      selectedItemIndex.value != null
        ? selectedItemIndex.value + 1
        : serviceData.value.serviceItems.length;
    serviceData.value.serviceItems.splice(index, 0, item);
    if (select) {
      selectedItemIndex.value = index;
    }
  }

  function removeItem(index: number) {
    if (index == selectedItemIndex.value) {
      selectedSubItemIndex.value = null;
      selectedItemIndex.value = null;
    }
    serviceData.value.serviceItems.splice(index, 1);
  }

  function moveItem(index: number, direction: number) {
    const value = serviceData.value.serviceItems[index];
    const swapValue = serviceData.value.serviceItems[index + direction];

    serviceData.value.serviceItems[index + direction] = value;
    serviceData.value.serviceItems[index] = swapValue;

    if (index == selectedItemIndex.value) {
      selectedItemIndex.value = index + direction;
    } else if (index + direction == selectedItemIndex.value) {
      selectedItemIndex.value = index;
    }
  }

  function clearService() {
    selectedSubItemIndex.value = null;
    selectedItemIndex.value = null;
    serviceData.value.serviceItems = [];
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
    selectedItemIndex,
    selectedSubItemIndex,
    selectedItem,
    addEmpty,
    addSong,
    addText,
    addItem,
    removeItem,
    moveItem,
    clearService,
    importService,
    exportService,
  };
});
