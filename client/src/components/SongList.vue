<script setup lang="ts">
import { useServiceStore } from "@/stores/service";
import { useSongStore } from "@/stores/song";

const songStore = useSongStore();
const serviceStore = useServiceStore();

function addToService(songTitle: string) {
  serviceStore.addSong(songTitle);
}
</script>

<template>
  <form @submit.prevent class="root">
    <div style="position: sticky; top: 0px">
      <span style="display: inline-block">
        <button @click="songStore.loadSongs()">Reload All Songs</button>
      </span>
    </div>
    <div
      style="height: calc(100vh - var(--header-footer-size)); overflow: auto"
    >
      <div v-for="song in songStore.songTitlesSorted" :key="song">
        <button @click="addToService(song)">Add</button>
        {{ song }}
      </div>
    </div>
  </form>
</template>

<style lang="scss" scoped>
.root {
  --header-footer-size: 7.5em;
}
</style>
