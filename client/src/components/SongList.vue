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
