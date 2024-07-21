<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useStateStore } from "@/stores/state";
import { useRoute } from "vue-router";

const route = useRoute();

const stateStore = useStateStore();
onMounted(stateStore.connect);

const currentContent = computed(() => stateStore.currentState.content);

const fontSize = computed(() => {
  const size = parseInt((route.query["font-size"] as string) ?? "");
  if (isNaN(size) || size < 8) return 40;
  else return size;
});
</script>

<template>
  <div class="renderer">
    <div class="text" :style="{ 'font-size': `${fontSize}pt` }">
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
  font-family: "Ubuntu", "Liberation Sans", "Arial", sans-serif;
  overflow: auto;
  max-height: 100vh;
  max-width: 100vw;
}
</style>
