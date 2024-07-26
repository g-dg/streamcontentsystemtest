<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useStateStore } from "@/stores/state";

const stateStore = useStateStore();
const currentContent = computed(() => stateStore.currentState.content);

const props = defineProps<{ fontSize: string }>();
</script>

<template>
  <div v-if="currentContent.smallText != undefined" class="renderer">
    <div
      class="text"
      :style="{
        'font-size': `calc(${fontSize} * 0.75)`,
        padding: `calc(${fontSize} / 4)`,
      }"
    >
      {{ currentContent.smallText }}
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
