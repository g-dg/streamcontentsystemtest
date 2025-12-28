<script setup lang="ts">
import { type Config, type DisplayConfig } from "@/stores/config";
import { type DisplayState } from "@/stores/state";

const props = defineProps<{
  content: DisplayState | null;
  displayConfig: DisplayConfig;
  config: Config;
  fontSize: string;
  padding: number;
}>();
</script>

<template>
  <div v-if="content?.mainText != undefined" :class="[
    'renderer',
    ...(displayConfig.main_content ? ['renderer-is-main-content'] : []),
    ...(displayConfig.noninteractable ? ['renderer-is-noninteractable'] : []),
  ]" :style="{ padding: `${padding}vh ${padding}vw` }">
    <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
      ">
      <div class="text" :style="{
        padding: `calc(${fontSize} / 4)`,
        maxHeight: `calc(100vh - (${padding}vh * 2))`,
        maxWidth: `calc(100vw - (${padding}vw * 2))`
      }">
        {{ content.mainText }}</div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.renderer {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  overflow: auto;
}

.renderer-is-noninteractable {
  overflow: hidden;
}

.text {
  text-align: left;
  white-space: pre-wrap;
  font-weight: bold;
  overflow: auto;
}

.renderer-is-noninteractable .text {
  overflow: hidden;
}
</style>
