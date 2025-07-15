<script setup lang="ts">
import { computed, ref, watch } from "vue";

import {
  useServiceStore,
  type ServiceItemDragDropData,
} from "@/stores/service";
import { usePremadeContentStore } from "@/stores/premadeContent";

import SongEditorModal from "./PremadeContentEditorModal.vue";

const songStore = usePremadeContentStore();
const serviceStore = useServiceStore();

function addToService(songTitle: string) {
  serviceStore.addItem({ data: [], template: "", premade: { name: songTitle, items: [] } }, true);
}

const search = ref("");
const searchBoxElement = ref<HTMLInputElement>();

function clearSearch() {
  search.value = "";
  searchBoxElement.value?.focus();
}

/** Song titles filtered by search */
const filteredSongTitles = computed(() => {
  let searchText = search.value;

  searchText =
    /^(?<title>[^:]*)(:[^:]*)?$/.exec(searchText)?.groups?.["title"] ?? "";

  searchText = searchText.trim();

  if (searchText.length == 0) {
    return songStore.premadeContentTitlesSorted;
  }

  /*
    Search splits (on spaces) the search string and each song title into terms.
    Items are returned if every search term is included in a title term.
    Title terms that start with numbers must match only the number part completely 
    to prevent "1" from matching "11", but allow "1" to match "1a".
  */
  const searchSplit = searchText
    .split(" ")
    .filter((term) => term.trim().length > 0);

  return songStore.premadeContentTitlesSorted.filter((title) =>
    searchSplit.every((searchTerm) => {
      searchTerm = searchTerm.toUpperCase();
      return title
        .split(" ")
        .filter((term) => term.trim().length > 0)
        .some((titleTerm) => {
          titleTerm = titleTerm.toUpperCase();
          if (titleTerm == "") return false;
          if (titleTerm.match(/^\d+$/) != null) return titleTerm == searchTerm;
          if (titleTerm.match(/^\d+/) != null)
            return (
              titleTerm.match(/^\d+/)?.[0] == searchTerm.match(/^\d+/)?.[0]
            );
          return titleTerm.includes(searchTerm);
        });
    })
  );
});

// drag and drop to allow dragging the song
const draggableIndex = ref<number | undefined>(undefined);
function dragHandleEnableDrag(index: number, enable: boolean) {
  draggableIndex.value = enable ? index : undefined;
}
watch(filteredSongTitles, () => (draggableIndex.value = undefined));

function dragStart(evt: DragEvent, songTitle: string) {
  if (evt.dataTransfer == undefined) return;

  const data: ServiceItemDragDropData = {
    srcIndex: undefined,
    serviceItem: { data: [], template: "", premade: { name: songTitle, items: [] } },
  };

  evt.dataTransfer.setData("application/json", JSON.stringify(data));
  evt.dataTransfer.dropEffect = "move";
}

function dragEnd() {
  draggableIndex.value = undefined;
}
</script>

<template>
  <div style="height: 100%; display: flex; flex-direction: column">
    <div style="flex: 0">
      <span style="display: inline-block">
        <button @click="songStore.loadPremadeContent()">Reload</button>
        <SongEditorModal />
        <input v-model="search" ref="searchBoxElement" type="search" placeholder="Search"
          @focus="searchBoxElement?.select()" />
        <button @click="clearSearch">Clear</button>
      </span>
    </div>

    <div style="flex: 1 1 auto; height: 4lh">
      <div style="height: 100%; overflow: auto">
        <div v-for="(song, index) in filteredSongTitles" :key="song" :draggable="draggableIndex == index"
          @dragstart="dragStart($event, song)" @dragend="dragEnd()">
          <button @mousedown="dragHandleEnableDrag(index, true)" @mouseup="dragHandleEnableDrag(index, true)"
            @click="addToService(song)">
            Add
          </button>
          <SongEditorModal :songTitle="song" />
          {{ song }}
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped></style>
