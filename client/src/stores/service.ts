import { defineStore } from "pinia";
import { computed, nextTick, ref, watch } from "vue";

import { natcasecmp } from "@/helpers/sort";

import { usePremadeContentStore } from "./premadeContent";
import { useDisplayStateStore, type DisplayState } from "./state";
import { useConfigStore } from "./config";

export const SERVICE_DATA_VERSION = 2;

/** Service data */
export interface ServiceData {
  version: number;
  items: Array<ServiceItem>;
  data: Array<PlaceholderValue>;
}

/** Service item */
export interface ServiceItem {
  name?: string,
  template: string;
  data: Array<PlaceholderValue>;
  premade?: ServicePremade;
  notes?: string;
}

/** Service song */
export interface ServicePremade {
  name: string;
  items: Array<string>;
}

export interface PlaceholderValue {
  name: string;
  value: string;
}

/** Data for service drag and drop */
export interface ServiceItemDragDropData {
  serviceItem: ServiceItem;
  srcIndex: number | undefined;
}

export interface PlaceholderDragDropData {
  value: PlaceholderValue;
  index: number;
}

/** Service store */
export const useServiceStore = defineStore("service", () => {
  const displayStateStore = useDisplayStateStore();

  const premadeContentStore = usePremadeContentStore();
  premadeContentStore.loadPremadeContent();

  const configStore = useConfigStore();
  configStore.loadConfig();

  /** Service data */
  const serviceData = ref<ServiceData>({
    version: SERVICE_DATA_VERSION,
    items: [],
    data: [],
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
      ? serviceData.value.items[selectedItemIndex.value]
      : undefined
  );

  /** Gets a new item */
  function newItem(): ServiceItem {
    return {
      template: "",
      data: [],
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
        : serviceData.value.items.length);
    serviceData.value.items.splice(insertIndex, 0, item);
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
    serviceData.value.items.splice(index, 1);
  }

  /** Swap item by id with relative position */
  function moveItem(index: number, direction: number) {
    const value = serviceData.value.items[index];
    const swapValue = serviceData.value.items[index + direction];

    // swap items
    serviceData.value.items[index + direction] = value;
    serviceData.value.items[index] = swapValue;

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
    serviceData.value.items = [];
  }

  /** Gets the display state from the currently-selected items */
  function getState(): DisplayState {
    let placeholders = {};
    if (selectedItem.value?.premade != undefined) {
      const premadeItem = (premadeContentStore.premadeContent.items ?? {})[selectedItem.value.premade.name];
      const premadeItemData = premadeItem.data ?? [];
      const premadeItemPageData = (premadeItem.pages ?? {})[selectedSubItemId.value ?? ""].data ?? [];
      placeholders = {
        ...placeholders,
        ...Object.fromEntries(premadeItemData.map(x => [x.name, x.value])),
        ...Object.fromEntries(premadeItemPageData.map(x => [x.name, x.value])),
      }
    }
    placeholders = {
      ...placeholders,
      ...Object.fromEntries(serviceData.value.data.map(x => [x.name, x.value])),
      ...Object.fromEntries(selectedItem.value?.data.map(x => [x.name, x.value]) ?? []),
    };
    return {
      template: selectedItem.value?.template ?? "",
      placeholders,
    };
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

  const allItemList = computed<
    Array<{ item: number; subitem: string; enabled: boolean }>
  >(() => {
    return serviceData.value.items
      .map((item, index) => {
        if (item.premade != undefined) {
          const songVerseTitlesSorted = Object.keys(
            premadeContentStore.premadeContent.items?.[item.premade?.name ?? ""].pages ?? {}
          ).sort((a, b) => natcasecmp([a, b]));
          return songVerseTitlesSorted.map((verseTitle) => {
            const enabled =
              (item.premade?.items.length == 0 ||
                item.premade?.items.includes(verseTitle)) ??
              false;
            return { item: index, subitem: verseTitle, enabled };
          });
        } else {
          return { item: index, subitem: "0", enabled: true };
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

          const convertedServiceData = fileContent;

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

      const convertedServiceData = serviceData.value;

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

  return {
    unsavedChanges,
    serviceData,
    selectedItemIndex,
    selectedSubItemId,
    selectedItem,
    newItem,
    addItem,
    removeItem,
    moveItem,
    clearService,
    selectAndShowItem,
    goToNextSubItem,
    goToPreviousSubItem,
    goToFirstSubItem,
    goToLastSubItem,
    showCurrentItem,
    importService,
    exportService,
  };
});
