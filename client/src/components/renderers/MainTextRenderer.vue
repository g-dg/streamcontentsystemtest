<script setup lang="ts">
import { type StateContent } from "@/stores/state";

const props = defineProps<{ content: StateContent; fontSize: string }>();
</script>

<template>
  <div v-if="content.mainText != undefined" class="renderer">
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
  overflow: auto;
  display: flex;
  align-items: center;
  padding: 3.5vh 3.5vw;
}
.text {
  text-align: left;
  white-space: pre-wrap;
  overflow: auto;
  max-height: calc(100vh - 7vh);
  max-width: calc(100vw - 7vw);
  font-weight: bold;
}
</style>
