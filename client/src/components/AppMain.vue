<script setup lang="ts">
import { onMounted } from "vue";

import { useSongStore } from "@/stores/song";
import { useStateStore, type StateContent } from "@/stores/state";

import PreviewIFrame from "./PreviewIFrame.vue";
import SongList from "./SongList.vue";
import ServiceItemList from "./ServiceItemList.vue";
import ServiceItemContentList from "./ServiceItemContentList.vue";
import ScratchpadEditor from "./ScratchpadEditor.vue";

const songStore = useSongStore();
const stateStore = useStateStore();

onMounted(songStore.loadSongs);

onMounted(stateStore.connect);

/** Set content to server */
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
          <div style="flex: 1">
            <SongList />
          </div>
        </div>
        <div style="flex: 0 auto; display: flex; flex-direction: column">
          <div style="flex: 1">
            <PreviewIFrame border :scale="1 / 3" />
          </div>
          <div style="flex: 0">
            <footer>
              {{ appFullName }}
              {{ appCopyright }}
              (<RouterLink :to="{ name: 'about' }" target="_blank"
                >About</RouterLink
              >)
            </footer>
          </div>
        </div>
      </div>
      <div style="flex: 1; display: flex; flex-direction: column">
        <div style="flex: 3">
          <ServiceItemList />
        </div>
        <div style="flex: 0">
          <div
            :style="{
              visibility: stateStore.connected ? 'hidden' : 'visible',
              textAlign: 'center',
            }"
          >
            <strong style="color: red">
              <em>
                &gt;&gt;&gt;&gt;&gt;&gt;&gt; DISCONNECTED FROM SERVER!!!
                &lt;&lt;&lt;&lt;&lt;&lt;&lt;
              </em>
            </strong>
          </div>
        </div>
        <div style="flex: 1">
          <ScratchpadEditor />
        </div>
      </div>
      <div style="flex: 1; display: flex; flex-direction: column">
        <div style="flex: 1">
          <ServiceItemContentList @set-content="setContent" />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped></style>
