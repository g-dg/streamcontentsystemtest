<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useRoute } from "vue-router";

import RootRenderer from "@/components/renderers/RootRenderer.vue";

import { useStateStore } from "@/stores/state";

const stateStore = useStateStore();
onMounted(stateStore.connect);
const currentContent = computed(() => stateStore.currentState.content);

const route = useRoute();

const DEFAULT_FONT_SIZE = "40pt";

const fontSize = computed(() => {
  const size_query = (route.query["font-size"] as string) ?? null;
  const number_size = size_query?.match(/^\d+(\.\d+)?$/)?.[0];
  if (number_size != null) return `${number_size}pt`;
  if (size_query != null) return size_query;
  return DEFAULT_FONT_SIZE;
});
</script>

<template>
  <RootRenderer :content="currentContent" :font-size="fontSize" />
</template>

<style lang="scss" scoped></style>

<style lang="scss">
body {
  margin: 0px;
}
</style>
