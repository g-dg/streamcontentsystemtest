<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useStateStore } from "@/stores/state";

const stateStore = useStateStore();
const currentContent = computed(() => stateStore.currentState.content);

const props = defineProps<{ fontSize: string }>();
</script>

<template>
  <div v-if="currentContent.songTitle != undefined" class="renderer">
    <div class="text" :style="{ padding: `calc(${fontSize} / 4)` }">
      {{ currentContent.songTitle }}
    </div>
  </div>
</template>

<style lang="scss" scoped>
.renderer {
  width: 100vw;
  height: 100vh;
  overflow: auto;
  display: flex;
  align-items: start;
  padding: 3.5vh 3.5vw;
}
.text {
  text-align: end;
  white-space: pre-wrap;
  overflow: auto;
  max-height: calc(100vh - 7vh);
  width: calc(100vw - 7vw);
  font-weight: bold;
}
</style>
