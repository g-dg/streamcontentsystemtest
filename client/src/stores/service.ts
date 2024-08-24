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

export interface ServiceItemDragDropData {
  instanceId: string | null;
  srcIndex: number | null;
  serviceItem: ServiceItem;
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

  /** Currently selected item */
  const selectedItem = computed(() =>
    selectedItemIndex.value != null
      ? serviceData.value.serviceItems[selectedItemIndex.value]
      : null
  );

  /** Creates an empty item */
  function emptyItem(): ServiceItem {
    return {
      id: uuid(),
      type: "empty",
    };
  }

  /** Creates a song item */
  function songItem(songTitle: string): ServiceItem {
    return {
      id: uuid(),
      type: "song",
      song: { title: songTitle, verses: [] },
    };
  }

  /** Creates a text item */
  function textItem(
    type: "mainText" | "subText" | "smallText",
    text: string
  ): ServiceItem {
    return {
      id: uuid(),
      type,
      text,
    };
  }

  /** Add item */
  function addItem(
    item: ServiceItem,
    select: boolean = true,
    index: number | null = null
  ) {
    const insertIndex =
      index ??
      (selectedItemIndex.value != null
        ? selectedItemIndex.value + 1
        : serviceData.value.serviceItems.length);
    serviceData.value.serviceItems.splice(insertIndex, 0, item);
    if (select) {
      selectedItemIndex.value = insertIndex;
    }
  }

  /** Remove item by index */
  function removeItem(index: number) {
    if (index == selectedItemIndex.value) {
      selectedSubItemId.value = null;
      selectedItemIndex.value = null;
    }
    if (selectedItemIndex.value != null && index < selectedItemIndex.value) {
      selectedSubItemId.value = null;
      selectedItemIndex.value = Math.max(0, selectedItemIndex.value - 1);
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

          const convertedServiceData = convertImportToInternal(fileContent);

          // set serviceData
          serviceData.value = convertedServiceData;
          savedServiceData.value = JSON.stringify(serviceData.value);
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

      const convertedServiceData = convertInternalToExport(serviceData.value);

      // create object url
      const objectURL = URL.createObjectURL(
        new Blob([JSON.stringify(convertedServiceData)], {
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

  function convertInternalToExport(serviceData: ServiceData): any {
    let ret: any = {};
    ret.serviceItems = serviceData.serviceItems.map((item) => {
      let ret: any = {};
      ret.type = item.type;
      if (item.song != undefined) {
        let song: any = {};
        song.title = item.song.title;
        song.verses = item.song.verses.map((verse) => verse);
        ret.song = song;
      }
      if (item.text != undefined) ret.text = item.text;
      if (item.comment != undefined) ret.comment = item.comment;
      return ret;
    });
    if (serviceData.title != undefined) ret.title = serviceData.title;
    if (serviceData.description != undefined)
      ret.description = serviceData.description;
    return ret;
  }

  function convertImportToInternal(serviceData: any): ServiceData {
    let ret: any = {};
    ret.serviceItems = serviceData.serviceItems.map((item: any) => {
      let ret: any = {};
      ret.id = uuid();
      ret.type = item.type;
      if (item.song != undefined) {
        let song: any = {};
        song.title = item.song.title;
        song.verses = item.song.verses.map((verse: any) => verse);
        ret.song = song;
      }
      if (item.text != undefined) ret.text = item.text;
      if (item.comment != undefined) ret.comment = item.comment;
      return ret;
    });
    if (serviceData.title != undefined) ret.title = serviceData.title;
    if (serviceData.description != undefined)
      ret.description = serviceData.description;
    return ret;
  }

  return {
    unsavedChanges,
    serviceData,
    selectedItemIndex,
    selectedSubItemId,
    selectedItem,
    emptyItem,
    songItem,
    textItem,
    addItem,
    removeItem,
    moveItem,
    clearService,
    importService,
    exportService,
  };
});
