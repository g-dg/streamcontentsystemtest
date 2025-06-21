import { defineStore } from "pinia";
import { computed, nextTick, ref, watch } from "vue";

import { uuid } from "@/helpers/random";
import { natcasecmp } from "@/helpers/sort";

import { useSongStore } from "./song";
import { useDisplayStateStore, type DisplayState } from "./state";
import { useConfigStore } from "./config";

/** Service data */
export interface ServiceData {
  serviceItems: Array<ServiceItem>;
  placeholders: Array<Placeholder>;
}

/** Service item */
export interface ServiceItem {
  id: string;
  type: "empty" | "blank" | "song" | "mainText" | "subText" | "smallText" | "optionalText";
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

export interface Placeholder {
  name: string;
  value: string;
}

export interface ExportedServiceData {
  serviceItems?: Array<ExportedServiceItem>;
  placeholders?: Array<ExportedPlaceholder>;
}
export interface ExportedServiceItem {
  type: "empty" | "blank" | "song" | "mainText" | "subText" | "smallText" | "optionalText";
  song?: ExportedServiceSong;
  text?: string;
  comment?: string;
  enabled?: boolean;
}
export interface ExportedServiceSong {
  title: string;
  verses: Array<string>;
}
export interface ExportedPlaceholder {
  name: string;
  value: string;
}

/** Data for service drag and drop */
export interface ServiceItemDragDropData {
  serviceItem: ServiceItem;
  srcIndex: number | undefined;
}

export interface PlaceholderDragDropData {
  placeholder: Placeholder;
  index: number;
}

/** Service store */
export const useServiceStore = defineStore("service", () => {
  const displayStateStore = useDisplayStateStore();

  const songStore = useSongStore();
  songStore.loadSongs();

  const configStore = useConfigStore();
  configStore.loadConfig();

  /** Service data */
  const serviceData = ref<ServiceData>({
    serviceItems: [],
    placeholders: [],
  });

  /** Copy of service data used to detect unsaved changes */
  const savedServiceData = ref<string>(JSON.stringify(serviceData.value));
  /** Whether there are unexported changes */
  const unsavedChanges = computed(
    () => JSON.stringify(serviceData.value) != savedServiceData.value
  );

  /** Selected item index */
  const selectedItemIndex = ref<number | undefined>(undefined);
  /** Selected sub item id */
  const selectedSubItemId = ref<string | undefined>(undefined);

  watch(
    selectedItemIndex,
    (newIndex: number | undefined, oldIndex: number | undefined) => {
      // unselect sub item if different item is selected
      if (newIndex != undefined && newIndex != oldIndex) {
        selectedSubItemId.value = undefined;
      }
    }
  );

  /** Currently selected item */
  const selectedItem = computed(() =>
    selectedItemIndex.value != undefined
      ? serviceData.value.serviceItems[selectedItemIndex.value]
      : undefined
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

  /** Creates a blank item */
  function blankItem(): ServiceItem {
    return {
      id: uuid(),
      type: "blank",
      enabled: true,
    };
  }

  /** Creates a song item */
  function songItem(songTitle: string, displayTitle?: string): ServiceItem {
    return {
      id: uuid(),
      type: "song",
      song: { title: songTitle, verses: [] },
      text: displayTitle,
      enabled: true,
    };
  }

  /** Creates a text item */
  function textItem(
    type: "mainText" | "subText" | "smallText" | "optionalText",
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
    index: number | undefined = undefined
  ) {
    const insertIndex =
      index ??
      (selectedItemIndex.value != undefined
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
      selectedSubItemId.value = undefined;
      selectedItemIndex.value = undefined;
    }
    if (selectedItemIndex.value != undefined && index < selectedItemIndex.value) {
      selectedSubItemId.value = undefined;
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
    selectedSubItemId.value = undefined;
    selectedItemIndex.value = undefined;
    serviceData.value.serviceItems = [];
  }

  const alternateText = computed(() => serviceData.value.serviceItems[0]?.text);

  /** Gets the display state from the currently-selected items */
  function getState(): DisplayState {
    switch (selectedItemType.value) {
      case "empty": {
        return {
          background: false,
          alternateText: alternateText.value,
        };
      }
      case "blank": {
        return {
          background: false,
        };
      }
      case "song": {
        const song =
          selectedItem.value?.song?.title != undefined
            ? songStore.songs[selectedItem.value.song.title]
            : undefined;
        const songVerses = song?.verses;
        const verseContent =
          (songVerses ?? {})[selectedSubItemId.value ?? ""] ?? undefined;
        const songAttribution =
          (song?.attribution ?? "") == "" ? undefined : song?.attribution;
        return {
          background: true,
          song: verseContent,
          songTitle:
            (selectedItem.value?.text ?? "") != ""
              ? selectedItem.value?.text
              : selectedItem.value?.song?.title ?? "",
          attribution: songAttribution,
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
          alternateText: alternateText.value,
        };
      }
      case "optionalText": {
        return {
          background: false,
          optionalText: selectedItem.value?.text ?? undefined,
        }
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

    displayStateStore.setState(getState());
  }

  function setEmptyScreen() {
    displayStateStore.setState({
      background: false,
      alternateText: alternateText.value,
    });
  }
  function setBlankScreen() {
    displayStateStore.setState({
      background: false,
    });
  }

  const allItemList = computed<
    Array<{ item: number; subitem: string; enabled: boolean }>
  >(() => {
    return serviceData.value.serviceItems
      .map((item, index) => {
        if (item.type == "song") {
          const songVerseTitlesSorted = Object.keys(
            songStore.songs[item.song?.title ?? ""].verses ?? {}
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
    itemIndex: number | undefined,
    subItemId: string | undefined,
    step: -1 | 1
  ): {
    item: number;
    subitem: string;
  } | undefined {
    const index = allItemList.value.findIndex(
      (testItem) => testItem.item == itemIndex && testItem.subitem == subItemId
    );

    if (index == -1) {
      return undefined;
    }

    for (
      let i = index + step;
      i >= 0 && i < allItemList.value.length;
      i += step
    ) {
      const item = allItemList.value[i];
      if (item.enabled) {
        return item;
      }
    }

    return undefined;
  }

  async function goToNextSubItem() {
    const nextItem = getAdjacentEnabledSubItem(
      selectedItemIndex.value,
      selectedSubItemId.value,
      1
    );

    if (nextItem != undefined) {
      await selectAndShowItem(nextItem.subitem, nextItem.item);
    }
  }

  async function goToPreviousSubItem() {
    const previousItem = getAdjacentEnabledSubItem(
      selectedItemIndex.value,
      selectedSubItemId.value,
      -1
    );

    if (previousItem != undefined) {
      await selectAndShowItem(previousItem.subitem, previousItem.item);
    }
  }

  async function goToFirstSubItem() {
    const enabledItems = allItemList.value.filter((x) => x.enabled);
    const previousItem = enabledItems[0];

    if (previousItem != undefined) {
      await selectAndShowItem(previousItem.subitem, previousItem.item);
    }
  }

  async function goToLastSubItem() {
    const enabledItems = allItemList.value.filter((x) => x.enabled);
    const previousItem = enabledItems[enabledItems.length - 1];

    if (previousItem != undefined) {
      await selectAndShowItem(previousItem.subitem, previousItem.item);
    }
  }

  async function showCurrentItem() {
    if (selectedSubItemId.value != undefined && selectedItemIndex.value != undefined) {
      await selectAndShowItem(selectedSubItemId.value, selectedItemIndex.value);
    }
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
            fileContent == undefined ||
            typeof fileContent.serviceItems != "object" ||
            !Array.isArray(fileContent.serviceItems)
          ) {
            alert("Invalid file format");
            return;
          }

          // unselect everything
          selectedItemIndex.value = undefined;
          selectedSubItemId.value = undefined;

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
      let filename = "";
      if (configStore.config.ask_service_export_filename ?? false) {
        // ask filename
        filename = prompt("Enter filename") ?? "";
      }

      if (filename == "") {
        // build filename if empty
        const now = new Date();
        filename = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${now.getHours() < 12 ? "AM" : "PM"}.json`;
      }

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
      placeholders: serviceData.placeholders,
    };
    return ret;
  }

  function convertImportToInternal(
    serviceData: ExportedServiceData
  ): ServiceData {
    let ret: ServiceData = {
      serviceItems: serviceData.serviceItems?.map((item) => {
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
      }) ?? [],
      placeholders: serviceData.placeholders ?? [],
    };
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
    blankItem,
    songItem,
    textItem,
    addItem,
    removeItem,
    moveItem,
    clearService,
    selectAndShowItem,
    setEmptyScreen,
    setBlankScreen,
    goToNextSubItem,
    goToPreviousSubItem,
    goToFirstSubItem,
    goToLastSubItem,
    showCurrentItem,
    importService,
    exportService,
  };
});
