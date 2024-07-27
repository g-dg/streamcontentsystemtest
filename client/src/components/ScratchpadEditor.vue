<script lang="ts" setup>
import { useServiceStore } from "@/stores/service";

const serviceStore = useServiceStore();

function clearScratchpad() {
  serviceStore.serviceData.scratchpad = "";
}
</script>

<template>
  <div style="display: flex; flex-direction: column; width: 100%; height: 100%">
    <div style="flex: 1">
      <textarea
        v-model="serviceStore.serviceData.scratchpad"
        style="width: 100%; height: 100%"
        placeholder="Scratchpad"
      ></textarea>
    </div>

    <div style="flex: 0">
      <button @click="clearScratchpad">Clear</button>
    </div>
  </div>
</template>

<style lang="scss" scoped></style>
