<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useStateStore } from "@/stores/state";

const stateStore = useStateStore();
onMounted(stateStore.connect);

const currentContent = computed(() => stateStore.currentState.content);
</script>

<template>
  <div class="renderer">
    <div class="text">
      {{ currentContent }}
    </div>
  </div>
</template>

<style lang="scss" scoped>
.renderer {
  width: 100vw;
  height: 100vh;
  overflow: auto;
  background-color: #000;
  color: #fff;
  display: flex;
  align-items: center;
  padding: 3.5vh 3.5vw;
}
.text {
  white-space: pre-wrap;
  overflow: auto;
  max-height: 100vh;
  max-width: 100vw;
}
</style>
