<script setup lang="ts">
import { computed, ref } from "vue";

import { useServiceStore } from "@/stores/service";
import { useSongStore } from "@/stores/song";

const songStore = useSongStore();
const serviceStore = useServiceStore();

function addToService(songTitle: string) {
  serviceStore.addSong(songTitle);
}

const search = ref("");

/** Song titles filtered by search */
const filteredSongTitles = computed(() => {
  /*
    Search splits (on spaces) the search string and each song title into terms.
    Items are returned if every search term is included in a title term.
    Title terms that start with numbers must match only the number part completely 
    to prevent "1" from matching "11", but allow "1" to match "1a".
  */
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
</script>

<template>
  <form
    @submit.prevent
    class="root"
    style="height: 100%; display: flex; flex-direction: column"
  >
    <div style="flex: 0; position: sticky; top: 0px">
      <span style="display: inline-block">
        <button @click="songStore.loadSongs()">Reload</button>
        <input v-model="search" type="search" placeholder="Search" />
        <button @click="search = ''">Clear Search</button>
      </span>
    </div>

    <div style="flex: 1 1 auto; height: 4lh">
      <div style="height: 100%; overflow: auto">
        <div v-for="song in filteredSongTitles" :key="song">
          <button @click="addToService(song)">Add</button>
          {{ song }}
        </div>
      </div>
    </div>
  </form>
</template>

<style lang="scss" scoped></style>
