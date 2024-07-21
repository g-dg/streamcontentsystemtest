<script setup lang="ts">
import { useSongStore } from "@/stores/song";
import { onMounted } from "vue";
import { useServiceStore } from "@/stores/service";
import { useStateStore } from "@/stores/state";
import SongList from "../components/SongList.vue";
import ServiceSongList from "./ServiceSongList.vue";
import ServiceVerseList from "./ServiceVerseList.vue";
import MultitextEditorSplit from "./MultitextEditorSplit.vue";

const songStore = useSongStore();
const serviceStore = useServiceStore();
const stateStore = useStateStore();

onMounted(songStore.loadSongs);

onMounted(stateStore.connect);

function setVerse(content: string) {
  stateStore.setState(content);
}

const appFullName = __APP_NAME_FULL__;
const appCopyright = __APP_COPYRIGHT__;
</script>

<template>
  <div style="display: flex; flex-direction: column">
    <div style="flex: 1; display: flex">
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
    <div><hr /></div>
    <div style="flex: 1; display: flex">
      <div style="flex: 1; padding-right: 8px">
        <iframe
          src="/display/preview?font-size=16"
          style="border: none; width: 100%; height: calc(100% - 2em)"
        ></iframe>
        <footer>
          {{ appFullName }}
          {{ appCopyright }}
          (<RouterLink :to="{ name: 'about' }">About</RouterLink>)
        </footer>
      </div>
      <div style="flex: 2">
        <MultitextEditorSplit />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped></style>
