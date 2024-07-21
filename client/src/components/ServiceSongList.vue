<script setup lang="ts">
import { useServiceStore } from "@/stores/service";
import { useSongStore } from "@/stores/song";

const songStore = useSongStore();
const serviceStore = useServiceStore();

function selectIndex(index: number) {
  serviceStore.selectedSongIndex = index;
}
</script>

<template>
  <form @submit.prevent class="root">
    <div style="position: sticky; top: 0px">
      <span style="display: inline-block">
        <button @click="serviceStore.importService()">Load Service</button>
        <button @click="serviceStore.exportService()">Save Service</button>
      </span>
    </div>
    <div
      style="height: calc(100vh - var(--header-footer-size)); overflow: auto"
    >
      <div
        v-for="(song, index) in serviceStore.serviceSongs"
        :key="song.song"
        @click="selectIndex(index)"
        :class="{ 'selected-song': serviceStore.selectedSongIndex == index }"
      >
        <button @click.stop="serviceStore.removeSong(index)">Del</button>
        <button
          @click.stop="serviceStore.moveSong(index, -1)"
          :disabled="index == 0"
        >
          Up
        </button>
        <button
          @click.stop="serviceStore.moveSong(index, 1)"
          :disabled="index + 1 == serviceStore.serviceSongs.length"
        >
          Dn
        </button>
        <input
          v-model="serviceStore.selectedSongIndex"
          :value="index"
          type="radio"
        />
        {{ song.song }}
      </div>
      <div
        v-if="serviceStore.serviceSongs.length == 0"
        style="text-align: center"
      >
        <em> This service has no songs </em>
      </div>
    </div>
  </form>
</template>

<style lang="scss" scoped>
.root {
  --header-footer-size: 7.5em;
}

.selected-song {
  background-color: black;
  color: white;
}
</style>
