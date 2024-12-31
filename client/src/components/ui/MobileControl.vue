<script setup lang="ts">
import { onMounted } from "vue";

import { useSongStore } from "@/stores/song";
import { useDisplayStateStore } from "@/stores/state";
import { useServiceStore } from "@/stores/service";

import ServiceItemList from "./ServiceItemList.vue";
import ServiceItemContentList from "./ServiceItemContentList.vue";
import PreviewIFrame from "../renderers/PreviewIFrame.vue";

const songStore = useSongStore();
const displayStateStore = useDisplayStateStore();
const serviceStore = useServiceStore();

onMounted(() => songStore.loadSongs(false));

const appFullName = __APP_NAME_FULL__;
const appCopyright = __APP_COPYRIGHT__;
</script>

<template>
  <div>
    <div v-if="!displayStateStore.connected" style="text-align: center;">
      <strong style="color: red">
        <em>
          &gt;&gt;&gt;&gt;&gt;&gt;&gt; DISCONNECTED FROM SERVER!!!
          &lt;&lt;&lt;&lt;&lt;&lt;&lt;
        </em>
      </strong>
    </div>
    <div style="display: flex">
      <button @click="serviceStore.importService">Load</button>
      <div style="flex: 1"></div>
      <button @click="serviceStore.setEmptyScreen">Empty</button>
      <button @click="serviceStore.setBlankScreen">Blank</button>
    </div>
    <PreviewIFrame displayName="preview" />
    <hr />
    <div style="display: flex">
      <button @click="serviceStore.goToPreviousSubItem" style="flex: 1; padding: 2em 0; font-size: 125%; font-weight: bold">Previous</button>
      <button @click="serviceStore.goToNextSubItem" style="flex: 1; padding: 2em 0; font-size: 125%; font-weight: bold">Next</button>
    </div>
    <hr />
    <ServiceItemList readonly mobileController />
    <hr />
    <ServiceItemContentList readonly mobileController />
    <hr />
    <footer>
      {{ appFullName }}
      {{ appCopyright }}
      (<RouterLink :to="{ name: 'about' }" target="_blank">About</RouterLink>)
    </footer>
  </div>
</template>

<style lang="scss" scoped></style>
