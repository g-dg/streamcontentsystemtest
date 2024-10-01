<script setup lang="ts">
import { type DisplayConfig } from "@/stores/config";
import { type StateContent } from "@/stores/state";

const props = defineProps<{
  content: StateContent | null;
  displayConfig: DisplayConfig;
  fontSize: string;
}>();
</script>

<template>
  <div
    v-if="content?.songTitle != undefined"
    :class="[
      'renderer',
      ...(displayConfig.main_content ? ['renderer-is-main-content'] : []),
      ...(displayConfig.noninteractable ? ['renderer-is-noninteractable'] : []),
    ]"
  >
    <div class="text" :style="{ padding: `calc(${fontSize} / 4)` }">
      {{ content.songTitle }}
    </div>
  </div>
</template>

<style lang="scss" scoped>
.renderer {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: start;
  padding: 3.5vh 3.5vw;
  overflow: auto;
}
.renderer-is-noninteractable {
  overflow: hidden;
}

.text {
  text-align: end;
  white-space: pre-wrap;
  max-height: calc(100vh - 7vh);
  width: calc(100vw - 7vw);
  font-weight: bold;
  overflow: auto;
}
.renderer-is-noninteractable .text {
  overflow: hidden;
}
</style>
