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
    v-if="content?.smallText != undefined"
    :class="[
      'renderer',
      ...(displayConfig.main_content ? ['renderer-is-main-content'] : []),
      ...(displayConfig.noninteractable ? ['renderer-is-noninteractable'] : []),
    ]"
  >
    <div
      class="text"
      :style="{
        'font-size': `calc(${fontSize} * 0.75)`,
        padding: `calc(${fontSize} / 4)`,
      }"
    >
      {{ content.smallText }}
    </div>
  </div>
</template>

<style lang="scss" scoped>
.renderer {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: end;
  overflow: auto;
}
.renderer-is-noninteractable {
  overflow: hidden;
}
.renderer-is-main-content {
  align-items: center;
}

.text {
  text-align: center;
  white-space: pre-wrap;
  max-height: calc(100vh);
  width: calc(100vw);
  overflow: auto;
}
.renderer-is-noninteractable .text {
  overflow: hidden;
}
</style>
