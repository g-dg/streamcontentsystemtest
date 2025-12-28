<script setup lang="ts">
import { type Config, type DisplayConfig } from "@/stores/config";
import { type DisplayState } from "@/stores/state";
import { computed } from "vue";

const props = defineProps<{
  content: DisplayState | null;
  displayConfig: DisplayConfig;
  config: Config;
  fontSize: string;
  padding: number;
}>();

const attribution = computed(() => props.content?.attribution != undefined ? `${props.displayConfig.attribution_prefix ?? ""}${props.content.attribution}${props.displayConfig.attribution_suffix ?? ""}` : undefined);
</script>

<template>
  <div v-if="content?.songTitle != undefined" :class="[
    'renderer',
    ...(displayConfig.main_content ? ['renderer-is-main-content'] : []),
    ...(displayConfig.noninteractable ? ['renderer-is-noninteractable'] : []),
  ]" :style="{ padding: `${padding}vh ${padding}vw` }">
    <div class="text-container" :style="{
      padding: `calc(${fontSize} / 4)`,
      maxHeight: `calc(100vh - (${padding}vh * 2))`,
      width: `calc(100vw - (${padding}vw * 2))`,
      marginLeft: `calc(50vw - ${padding}vw)`
    }">
      <div style="height: 1lh"></div>
      <div class="text" :style="{ fontSize: `${displayConfig.attribution_font_percent}%` }">{{ attribution }}</div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.renderer {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: start;
  overflow: hidden;
}

.text-container {
  text-align: end;
  white-space: pre-wrap;
  overflow: hidden;
  word-spacing: normal;
  letter-spacing: normal;
}

.text {
  font-weight: normal;
  overflow: hidden;
  font-size: 33.333%;
  color: #ccc;
}
</style>
