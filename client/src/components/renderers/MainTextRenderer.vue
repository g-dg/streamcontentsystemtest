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
    v-if="content?.mainText != undefined"
    :class="[
      'renderer',
      ...(displayConfig.main_content ? ['renderer-is-main-content'] : []),
      ...(displayConfig.noninteractable ? ['renderer-is-noninteractable'] : []),
    ]"
  >
    <div
      style="
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
      "
    >
      <div class="text" :style="{ padding: `calc(${fontSize} / 4)` }">
        {{ content.mainText }}
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.renderer {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  padding: 3.5vh 3.5vw;
  overflow: auto;
}
.renderer-is-noninteractable {
  overflow: hidden;
}

.text {
  text-align: left;
  white-space: pre-wrap;
  max-height: calc(100vh - 7vh);
  max-width: calc(100vw - 7vw);
  font-weight: bold;
  overflow: auto;
}
.renderer-is-noninteractable .text {
  overflow: hidden;
}
</style>
