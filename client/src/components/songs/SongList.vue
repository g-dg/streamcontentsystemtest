<script setup lang="ts">
import { computed, ref, watch } from "vue";

import {
  useServiceStore,
  type ServiceItemDragDropData,
} from "@/stores/service";
import { useSongStore } from "@/stores/song";
import { useInstanceIdStore } from "@/stores/instanceId";

import SongEditorModal from "./SongEditorModal.vue";

const songStore = useSongStore();
const serviceStore = useServiceStore();
const instanceIdStore = useInstanceIdStore();

function addToService(songTitle: string) {
  serviceStore.addItem(serviceStore.songItem(songTitle), true);
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
    return songStore.songTitlesSorted;
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

  return songStore.songTitlesSorted.filter((title) =>
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
const draggableIndex = ref<number | null>(null);
function dragHandleEnableDrag(index: number, enable: boolean) {
  draggableIndex.value = enable ? index : null;
}
watch(filteredSongTitles, () => (draggableIndex.value = null));

function dragStart(evt: DragEvent, songTitle: string) {
  if (evt.dataTransfer == null) return;

  const data: ServiceItemDragDropData = {
    appInstanceId: instanceIdStore.appInstanceId,
    componentInstanceId: null,
    srcIndex: null,
    serviceItem: serviceStore.songItem(songTitle),
  };

  evt.dataTransfer.setData("application/json", JSON.stringify(data));
  evt.dataTransfer.dropEffect = "move";
}

function dragEnd() {
  draggableIndex.value = null;
}
</script>

<template>
  <form
    @submit.prevent
    class="root"
    style="height: 100%; display: flex; flex-direction: column"
  >
    <div style="flex: 0">
      <span style="display: inline-block">
        <button @click="songStore.loadSongs()">Reload</button>
        <SongEditorModal />
        <input
          v-model="search"
          ref="searchBoxElement"
          type="search"
          placeholder="Search"
          @focus="searchBoxElement?.select()"
        />
        <button @click="clearSearch">Clear</button>
      </span>
    </div>

    <div style="flex: 1 1 auto; height: 4lh">
      <div style="height: 100%; overflow: auto">
        <div
          v-for="(song, index) in filteredSongTitles"
          :key="song"
          :draggable="draggableIndex == index"
          @dragstart="dragStart($event, song)"
          @dragend="dragEnd()"
        >
          <button
            @mousedown="dragHandleEnableDrag(index, true)"
            @mouseup="dragHandleEnableDrag(index, true)"
            @click="addToService(song)"
          >
            Add
          </button>
          <SongEditorModal :songTitle="song" />
          {{ song }}
        </div>
      </div>
    </div>
  </form>
</template>

<style lang="scss" scoped></style>
