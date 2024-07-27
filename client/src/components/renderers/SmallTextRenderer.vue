<script setup lang="ts">
import { type StateContent } from "@/stores/state";

const props = defineProps<{ content: StateContent | null; fontSize: string }>();
</script>

<template>
  <div v-if="content?.smallText != undefined" class="renderer">
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
  overflow: auto;
  display: flex;
  align-items: end;
}
.text {
  text-align: center;
  white-space: pre-wrap;
  overflow: auto;
  max-height: calc(100vh);
  width: calc(100vw);
}
</style>
