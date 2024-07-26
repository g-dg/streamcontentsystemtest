<script setup lang="ts">
import { useSongStore } from "@/stores/song";
import { onMounted } from "vue";
import { useServiceStore } from "@/stores/service";
import { useStateStore, type StateContent } from "@/stores/state";
import PreviewIFrame from "./PreviewIFrame.vue";
import SongList from "./SongList.vue";
import ServiceItemList from "./ServiceItemList.vue";
import ServiceItemContentList from "./ServiceItemContentList.vue";

const songStore = useSongStore();
const serviceStore = useServiceStore();
const stateStore = useStateStore();

onMounted(songStore.loadSongs);

onMounted(stateStore.connect);

function setContent(content: StateContent) {
  stateStore.setState(content);
}

const appFullName = __APP_NAME_FULL__;
const appCopyright = __APP_COPYRIGHT__;
</script>

<template>
  <div
    style="display: flex; flex-direction: column; height: calc(100vh - 16px)"
  >
    <div style="flex: 1; display: flex">
      <div style="flex: 1; display: flex; flex-direction: column">
        <div style="flex: 1; display: flex; flex-direction: column">
          <div style="flex: 0">All Songs:</div>
          <div style="flex: 1">
            <SongList />
          </div>
        </div>
        <div style="flex: 0 auto; display: flex; flex-direction: column">
          <div style="flex: 1">
            <PreviewIFrame border :scale="1 / 3" />
          </div>
          <footer style="flex: auto">
            {{ appFullName }}
            {{ appCopyright }}
            (<RouterLink :to="{ name: 'about' }">About</RouterLink>)
          </footer>
        </div>
      </div>
      <div style="flex: 1; display: flex; flex-direction: column">
        <div style="flex: 0">Service:</div>
        <div style="flex: 1">
          <ServiceItemList />
        </div>
      </div>
      <div style="flex: 1; display: flex; flex-direction: column">
        <div style="flex: 0">Items:</div>
        <div style="flex: 1">
          <ServiceItemContentList @set-content="setContent" />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped></style>
