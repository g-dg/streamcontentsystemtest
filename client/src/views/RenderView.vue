<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";

import RootRenderer from "@/components/renderers/RootRenderer.vue";

import { useStateStore, type StateContent } from "@/stores/state";
import { useConfigStore } from "@/stores/config";

const props = defineProps<{ displayName?: string }>();

const configStore = useConfigStore();
onMounted(configStore.loadConfig);
const displayConfig = computed(
  () => configStore.config.displays?.[props.displayName ?? ""] ?? null
);

const stateStore = useStateStore();
onMounted(stateStore.connect);

const currentContent = computed(() => stateStore.currentState.content);

const route = useRoute();

const DEFAULT_FONT_SIZE = "40pt";

const fontSize = computed(() => {
  const size_raw = (route.query["font-size"] as string) ?? null;
  const number_size = size_raw?.match(/^\d+(\.\d+)?$/)?.[0];
  if (number_size != null) return `${number_size}pt`;
  if (size_raw != null && size_raw.match(/^\d+(\.\d+)?[a-z]*$/))
    return size_raw;
  if (displayConfig.value?.font_size != undefined)
    return displayConfig.value?.font_size;
  return DEFAULT_FONT_SIZE;
});

const DEFAULT_RENDER_DELAY = 0;
const renderDelay = computed(
  () => displayConfig.value?.render_delay ?? DEFAULT_RENDER_DELAY
);

const delayedContent = ref<StateContent>(currentContent.value);

watch(currentContent, (content) =>
  window.setTimeout(() => {
    delayedContent.value = content;
  }, renderDelay.value)
);
</script>

<template>
  <RootRenderer :content="delayedContent" :font-size="fontSize" />
</template>

<style lang="scss" scoped></style>

<style lang="scss">
body {
  margin: 0px;
}
</style>
