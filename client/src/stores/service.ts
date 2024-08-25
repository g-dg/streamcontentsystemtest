import { defineStore } from "pinia";
import { computed, nextTick, ref, watch } from "vue";

import { uuid } from "@/helpers/random";
import { natcasecmp } from "@/helpers/sort";

import { useSongStore } from "./song";
import { useStateStore, type StateContent } from "./state";

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
  enabled: boolean;
}

/** Service song */
export interface ServiceSong {
  title: string;
  verses: Array<string>;
}

export interface ExportedServiceData {
  serviceItems: Array<ExportedServiceItem>;
  title?: string;
  description?: string;
}
export interface ExportedServiceItem {
  type: "empty" | "song" | "mainText" | "subText" | "smallText";
  song?: ExportedServiceSong;
  text?: string;
  comment?: string;
  enabled?: boolean;
}
export interface ExportedServiceSong {
  title: string;
  verses: Array<string>;
}

/** Data for drag and drop */
export interface ServiceItemDragDropData {
  instanceId: string | null;
  srcIndex: number | null;
  serviceItem: ServiceItem;
}

/** Service store */
export const useServiceStore = defineStore("service", () => {
  const stateStore = useStateStore();

  const songStore = useSongStore();
  songStore.loadSongs();

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
  const selectedSubItemId = ref<string | null>(null);

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

  const selectedItemType = computed(() => selectedItem.value?.type);

  /** Creates an empty item */
  function emptyItem(): ServiceItem {
    return {
      id: uuid(),
      type: "empty",
      enabled: true,
    };
  }

  /** Creates a song item */
  function songItem(songTitle: string): ServiceItem {
    return {
      id: uuid(),
      type: "song",
      song: { title: songTitle, verses: [] },
      enabled: true,
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
      enabled: true,
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

  function getState(): StateContent {
    switch (selectedItemType.value) {
      case "empty": {
        return { background: false };
      }
      case "song": {
        const songVerses =
          selectedItem.value?.song?.title != null
            ? songStore.songs[selectedItem.value.song.title]
            : null;
        const verseContent =
          (songVerses ?? {})[selectedSubItemId.value ?? ""] ?? undefined;
        return {
          background: true,
          song: verseContent,
          songTitle:
            (selectedItem.value?.text ?? "") != ""
              ? selectedItem.value?.text
              : selectedItem.value?.song?.title ?? "",
        };
      }
      case "mainText": {
        return {
          background: false,
          mainText: selectedItem.value?.text ?? undefined,
        };
      }
      case "subText": {
        return {
          background: false,
          subText: selectedItem.value?.text ?? undefined,
        };
      }
      case "smallText": {
        return {
          background: false,
          smallText: selectedItem.value?.text ?? undefined,
        };
      }
      default: {
        return { background: false };
      }
    }
  }

  async function selectAndShowItem(
    subItemId: string,
    itemIndex: number | undefined = undefined
  ) {
    if (itemIndex !== undefined) {
      selectedItemIndex.value = itemIndex;
      await nextTick();
    }
    selectedSubItemId.value = subItemId;

    stateStore.setState(getState());
  }

  function showEmptyScreen() {
    stateStore.setState({ background: false });
  }
  function showBlackScreen() {
    stateStore.setState({ background: true });
  }

  const enabledItemList = computed<
    Array<{ item: number; subitem: string; enabled: boolean }>
  >(() => {
    return serviceData.value.serviceItems
      .map((item, index) => {
        if (item.type == "song") {
          const songVerseTitlesSorted = Object.keys(
            songStore.songs[item.song?.title ?? ""] ?? {}
          ).sort((a, b) => natcasecmp([a, b]));
          return songVerseTitlesSorted.map((verseTitle) => {
            const enabled =
              (item.song?.verses.length == 0 ||
                item.song?.verses.includes(verseTitle)) ??
              false;
            return { item: index, subitem: verseTitle, enabled };
          });
        } else {
          return { item: index, subitem: "0", enabled: item.enabled };
        }
      })
      .flat();
  });

  function getAdjacentEnabledSubItem(
    itemIndex: number | null,
    subItemId: string | null,
    step: -1 | 1
  ): {
    item: number;
    subitem: string;
  } | null {
    const index = enabledItemList.value.findIndex(
      (testItem) => testItem.item == itemIndex && testItem.subitem == subItemId
    );

    if (index == -1) {
      return null;
    }

    for (
      let i = index + step;
      i >= 0 && i < enabledItemList.value.length;
      i += step
    ) {
      const item = enabledItemList.value[i];
      if (item.enabled) {
        return item;
      }
    }

    return null;
  }

  async function goToNextSubItem() {
    const nextItem = getAdjacentEnabledSubItem(
      selectedItemIndex.value,
      selectedSubItemId.value,
      1
    );

    if (nextItem != null) {
      await selectAndShowItem(nextItem.subitem, nextItem.item);
    }
  }

  async function goToPreviousSubItem() {
    const previousItem = getAdjacentEnabledSubItem(
      selectedItemIndex.value,
      selectedSubItemId.value,
      -1
    );

    if (previousItem != null) {
      await selectAndShowItem(previousItem.subitem, previousItem.item);
    }
  }

  async function selectContent(subItemId: string) {}

  async function setContent(itemId: number, subItemId: string) {}

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

  function convertInternalToExport(
    serviceData: ServiceData
  ): ExportedServiceData {
    let ret: ExportedServiceData = {
      serviceItems: serviceData.serviceItems.map((item) => {
        let ret: ExportedServiceItem = {
          type: item.type,
        };
        if (item.song != undefined) {
          let song: ExportedServiceSong = {
            title: item.song.title,
            verses: item.song.verses.map((verse) => verse),
          };
          ret.song = song;
        }
        if (item.text != undefined) ret.text = item.text;
        if (item.comment != undefined) ret.comment = item.comment;
        if (!item.enabled) ret.enabled = false;
        return ret;
      }),
    };
    if (serviceData.title != undefined) ret.title = serviceData.title;
    if (serviceData.description != undefined)
      ret.description = serviceData.description;
    return ret;
  }

  function convertImportToInternal(
    serviceData: ExportedServiceData
  ): ServiceData {
    let ret: ServiceData = {
      serviceItems: serviceData.serviceItems.map((item) => {
        let ret: ServiceItem = {
          id: uuid(),
          type: item.type,
          enabled: item.enabled ?? true,
        };
        if (item.song != undefined) {
          let song: ServiceSong = {
            title: item.song.title,
            verses: item.song.verses.map((verse) => verse),
          };
          ret.song = song;
        }
        if (item.text != undefined) ret.text = item.text;
        if (item.comment != undefined) ret.comment = item.comment;
        return ret;
      }),
    };
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
    selectedItemType,
    emptyItem,
    songItem,
    textItem,
    addItem,
    removeItem,
    moveItem,
    clearService,
    selectAndShowItem,
    showEmptyScreen,
    showBlackScreen,
    goToNextSubItem,
    goToPreviousSubItem,
    importService,
    exportService,
  };
});
