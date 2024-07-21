<script setup lang="ts">
import { useServiceStore } from "@/stores/service";
import { useSongStore } from "@/stores/song";
import { computed, ref } from "vue";

const songStore = useSongStore();
const serviceStore = useServiceStore();

function addToService(songTitle: string) {
  serviceStore.addSong(songTitle);
}

const search = ref("");

const filteredSongTitles = computed(() => {
  if (search.value.trim() == "") {
    return songStore.songTitlesSorted;
  }
  const searchSplit = search.value
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
          if (titleTerm.match(/^\d+/) != null) return titleTerm == searchTerm;
          return titleTerm.includes(searchTerm);
        });
    })
  );
});
</script>

<template>
  <form @submit.prevent class="root">
    <div style="position: sticky; top: 0px">
      <span style="display: inline-block">
        <button @click="songStore.loadSongs()">Reload</button>
        <input v-model="search" type="search" placeholder="Search" />
        <button @click="search = ''">Clear Search</button>
      </span>
    </div>
    <div
      style="
        height: calc(50vh - (var(--main-header-footer-size) / 2));
        overflow: auto;
      "
    >
      <div v-for="song in filteredSongTitles" :key="song">
        <button @click="addToService(song)">Add</button>
        {{ song }}
      </div>
    </div>
  </form>
</template>

<style lang="scss" scoped></style>
