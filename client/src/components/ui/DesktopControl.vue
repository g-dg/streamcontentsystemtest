<script setup lang="ts">
import { onMounted } from "vue";

import { useDisplayStateStore } from "@/stores/state";
import { useServiceStore } from "@/stores/service";

import PreviewSection from "./PreviewSection.vue";
import SongList from "../songs/SongList.vue";
import ServiceItemList from "./ServiceItemList.vue";
import ServiceItemContentList from "./ServiceItemContentList.vue";
import TitleDescriptionEditor from "./TitleDescriptionEditor.vue";

const displayStateStore = useDisplayStateStore();
const serviceStore = useServiceStore();

/** Confirms whether to leave the page if unsaved changes are present */
function unsavedChangesHandler(evt: BeforeUnloadEvent) {
  if (serviceStore.unsavedChanges) {
    evt.preventDefault();
    evt.returnValue = true;
  }
}
/** Sets up unsaved changes leave confirmation */
function setupUnsavedChangesHandler() {
  window.removeEventListener("beforeunload", unsavedChangesHandler);
  window.addEventListener("beforeunload", unsavedChangesHandler);
}
onMounted(setupUnsavedChangesHandler);

const appFullName = __APP_NAME_FULL__;
const appCopyright = __APP_COPYRIGHT__;
</script>

<template>
  <div style="display: flex; flex-direction: column; height: 100vh; padding: 8px">
    <div style="flex: 1; display: flex">
      <div style="flex: 1; display: flex; flex-direction: column">
        <div style="flex: 0">
          <PreviewSection />
        </div>
        <div style="flex: 0">
          <div :style="{
            visibility: displayStateStore.connected ? 'hidden' : 'visible',
            textAlign: 'center',
          }">
            <strong style="color: red">
              <em>
                &gt;&gt;&gt;&gt;&gt;&gt;&gt; DISCONNECTED FROM SERVER!!!
                &lt;&lt;&lt;&lt;&lt;&lt;&lt;
              </em>
            </strong>
          </div>
          <hr />
        </div>
        <div style="flex: 1; display: flex; flex-direction: column">
          <div style="flex: 1">
            <SongList />
          </div>
          <div style="flex: 0">
            <hr />
            <footer>
              {{ appFullName }}
              {{ appCopyright }}
              (<RouterLink :to="{ name: 'about' }" target="_blank">About</RouterLink>)
            </footer>
          </div>
        </div>
      </div>
      <div style="flex: 1; display: flex; flex-direction: column">
        <div style="flex: 1">
          <ServiceItemList />
        </div>
        <div style="flex: 0">
          <hr />
          <TitleDescriptionEditor />
        </div>
      </div>
      <div style="flex: 1; display: flex; flex-direction: column">
        <div style="flex: 1">
          <ServiceItemContentList />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped></style>
