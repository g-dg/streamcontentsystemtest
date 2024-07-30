import { defineStore } from "pinia";
import { computed, ref, watch } from "vue";

import { uuid } from "@/helpers/random";

/** Service data */
export interface ServiceData {
  serviceItems: Array<ServiceItem>;
  title?: string;
  description?: string;
}

/** Service item */
export interface ServiceItem {
  id: string;
  type: "empty" | "song" | "mainText" | "subText" | "smallText";
  song?: ServiceSong;
  text?: string;
  comment?: string;
}

/** Service song */
export interface ServiceSong {
  title: string;
  verses: Array<string>;
}

/** Service store */
export const useServiceStore = defineStore("service", () => {
  /** Service data */
  const serviceData = ref<ServiceData>({ serviceItems: [] });

  /** Copy of service data used to detect unsaved changes */
  const savedServiceData = ref<string>(JSON.stringify(serviceData.value));
  /** Whether there are unexported changes */
  const unsavedChanges = computed(
    () => JSON.stringify(serviceData.value) != savedServiceData.value
  );

  /** Selected item index */
  const selectedItemIndex = ref<number | null>(null);
  /** Selected sub item id */
  const selectedSubItemId = ref<number | string | null>(null);

  watch(
    selectedItemIndex,
    (newIndex: number | null, oldIndex: number | null) => {
      // unselect sub item if different item is selected
      if (newIndex != null && newIndex != oldIndex) {
        selectedSubItemId.value = null;
      }
    }
  );

  /** Selected item */
  const selectedItem = computed(() =>
    selectedItemIndex.value != null
      ? serviceData.value.serviceItems[selectedItemIndex.value]
      : null
  );

  /** Add empty item */
  function addEmpty() {
    addItem(
      {
        id: uuid(),
        type: "empty",
      },
      true
    );
  }

  /** Add selected song */
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

  /** Add text item */
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

  /** Add item */
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

  /** Remove item by index */
  function removeItem(index: number) {
    if (index == selectedItemIndex.value) {
      selectedSubItemId.value = null;
      selectedItemIndex.value = null;
    }
    serviceData.value.serviceItems.splice(index, 1);
  }

  /** Swap item by id with relative position */
  function moveItem(index: number, direction: number) {
    const value = serviceData.value.serviceItems[index];
    const swapValue = serviceData.value.serviceItems[index + direction];

    // swap items
    serviceData.value.serviceItems[index + direction] = value;
    serviceData.value.serviceItems[index] = swapValue;

    // update selected index to move with moved item
    if (index == selectedItemIndex.value) {
      selectedItemIndex.value = index + direction;
    } else if (index + direction == selectedItemIndex.value) {
      selectedItemIndex.value = index;
    }
  }

  /** Remove all items from service */
  function clearService() {
    selectedSubItemId.value = null;
    selectedItemIndex.value = null;
    serviceData.value.serviceItems = [];
  }

  /** Import service from file */
  async function importService() {
    try {
      // create file dialog
      const importFileInput = document.createElement("input");
      importFileInput.setAttribute("type", "file");

      // handle file selection
      importFileInput.addEventListener("change", async () => {
        try {
          const rawFileContent =
            (await importFileInput.files?.[0].text()) ?? "{}";

          const fileContent = JSON.parse(rawFileContent);

          // basic validation
          if (
            typeof fileContent != "object" ||
            fileContent == null ||
            typeof fileContent.serviceItems != "object" ||
            !Array.isArray(fileContent.serviceItems)
          ) {
            alert("Invalid file format");
            return;
          }

          // unselect everything
          selectedItemIndex.value = null;
          selectedSubItemId.value = null;

          // set serviceData
          savedServiceData.value = JSON.stringify(fileContent);
          serviceData.value = fileContent;
        } catch (e) {
          console.error(e);
          alert(
            "An error occurred importing the file. (Is it a valid format?)"
          );
        }
      });

      // open file dialog
      importFileInput.click();
    } catch (e) {
      console.error(e);
      alert("An error occurred preparing for file import.");
    }
  }

  /** Export service to file */
  async function exportService() {
    try {
      // build filename
      const now = new Date();
      const filename = `${now.getFullYear()}-${String(
        now.getMonth() + 1
      ).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${
        now.getHours() < 12 ? "AM" : "PM"
      }.json`;

      // create object url
      const objectURL = URL.createObjectURL(
        new Blob([JSON.stringify(serviceData.value)], {
          type: "application/json",
        })
      );

      // create link
      const fileLink = document.createElement("a");
      fileLink.setAttribute("href", objectURL);
      fileLink.setAttribute("download", filename);
      fileLink.click();

      savedServiceData.value = JSON.stringify(serviceData.value);

      // schedule object url revocation
      window.setTimeout(() => URL.revokeObjectURL(objectURL), 1000 * 60 * 60);
    } catch (e) {
      console.error(e);
      alert("An error occurred exporting the file.");
    }
  }

  return {
    unsavedChanges,
    serviceData,
    selectedItemIndex,
    selectedSubItemId,
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
