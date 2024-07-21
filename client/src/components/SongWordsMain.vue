<script setup lang="ts">
import { useSongStore } from "@/stores/song";
import { onMounted } from "vue";
import { useServiceStore } from "@/stores/service";
import { useStateStore } from "@/stores/state";
import SongList from "../components/SongList.vue";
import ServiceSongList from "./ServiceSongList.vue";
import ServiceVerseList from "./ServiceVerseList.vue";

const songStore = useSongStore();
const serviceStore = useServiceStore();
const stateStore = useStateStore();

onMounted(songStore.loadSongs);

onMounted(stateStore.connect);

function setVerse(content: string) {
  stateStore.setState(content);
}
</script>

<template>
  <div style="display: flex">
    <div style="flex: 1">
      All Songs:
      <SongList />
    </div>
    <div style="flex: 1">
      Service:
      <ServiceSongList />
    </div>
    <div style="flex: 1">
      Verses:
      <ServiceVerseList @set-verse="setVerse" />
    </div>
  </div>
</template>

<style lang="scss" scoped></style>
