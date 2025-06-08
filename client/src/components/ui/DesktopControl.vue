<script setup lang="ts">
import { onMounted } from "vue";

import { useServiceStore } from "@/stores/service";

import PreviewSection from "./PreviewSection.vue";
import SongList from "../songs/SongList.vue";
import PlaceholderList from "./PlaceholderList.vue";
import ServiceItemList from "./ServiceItemList.vue";
import ServiceItemContentList from "./ServiceItemContentList.vue";
import ControlHeader from "./ControlHeader.vue";

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
</script>

<template>
  <div style="display: flex; flex-direction: column; height: 100vh; padding: 8px">
    <div style="flex: 0; display: flex">
      <ControlHeader />
    </div>
    <div style="flex: 0">
      <hr />
    </div>
    <div style="flex: 1; display: flex">
      <div style="flex: 1; display: flex; flex-direction: column">
        <div style="flex: 0">
          <PreviewSection />
        </div>
        <div style="flex: 1; display: flex; flex-direction: column">
          <div style="flex: 1">
            <SongList />
          </div>
        </div>
      </div>
      <div style="flex: 1; display: flex; flex-direction: column">
        <div style="flex: 1">
          <PlaceholderList />
        </div>
      </div>
      <div style="flex: 1; display: flex; flex-direction: column">
        <div style="flex: 1">
          <ServiceItemList />
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
