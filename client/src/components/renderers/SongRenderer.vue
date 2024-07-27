<script setup lang="ts">
import { type StateContent } from "@/stores/state";

const props = defineProps<{ content: StateContent | null; fontSize: string }>();
</script>

<template>
  <div v-if="content?.song != undefined" class="renderer">
    <div class="text" :style="{ padding: `calc(${fontSize} / 4)` }">
      {{ content.song }}
    </div>
  </div>
</template>

<style lang="scss" scoped>
.renderer {
  width: 100vw;
  height: 100vh;
  overflow: auto;
  display: flex;
  align-items: center;
  padding: 3.5vh 3.5vw;
}
.text {
  text-align: start;
  white-space: pre-wrap;
  overflow: auto;
  max-height: calc(100vh - 7vh);
  width: calc(100vw - 7vw);
}
</style>
