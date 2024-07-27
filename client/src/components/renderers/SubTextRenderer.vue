<script setup lang="ts">
import { type StateContent } from "@/stores/state";

const props = defineProps<{ content: StateContent | null; fontSize: string }>();
</script>

<template>
  <div v-if="content?.subText != undefined" class="renderer">
    <div class="text" :style="{ padding: `calc(${fontSize} / 4)` }">
      {{ content.subText }}
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
  padding: 3.5vh 3.5vw;
}
.text {
  text-align: center;
  white-space: pre-wrap;
  overflow: auto;
  max-height: calc(100vh - 7vh);
  width: calc(100vw - 7vw);
  font-weight: bold;
}
</style>
