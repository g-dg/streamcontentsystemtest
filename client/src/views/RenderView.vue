<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";

import RootRenderer from "@/components/renderers/RootRenderer.vue";

import { useStateStore, type StateContent } from "@/stores/state";
import { uuid } from "@/helpers/random";

const stateStore = useStateStore();
onMounted(stateStore.connect);
const currentContent = computed(() => stateStore.currentState.content);

const route = useRoute();

const DEFAULT_FONT_SIZE = "40pt";

const fontSize = computed(() => {
  const size_query = (route.query["font-size"] as string) ?? null;
  const number_size = size_query?.match(/^\d+(\.\d+)?$/)?.[0];
  if (number_size != null) return `${number_size}pt`;
  if (size_query != null && size_query.match(/^\d+(\.\d+)?[a-z]*/))
    return size_query;
  return DEFAULT_FONT_SIZE;
});

const SHOW_START_DELAY = 1000;
const FADE_DURATION = 200;

const animationQueue = ref<
  Array<{
    id: string;
    content: StateContent;
  }>
>([
  {
    id: uuid(),
    content: {
      background: false,
    },
  },
]);
const animationQueueElements = ref<Array<HTMLElement>>([]);

function getElementFromQueueId(id: string) {
  const index = animationQueue.value.findIndex((renderer) => renderer.id == id);
  return animationQueueElements.value[index];
}

async function setContent(content: StateContent) {
  const id = uuid();
  animationQueue.value.push({ id, content });

  await nextTick();
  await new Promise((resolve) => window.setTimeout(resolve, 100));

  window.setTimeout(() => {
    getElementFromQueueId(id).classList.add("fade-show");

    const oldItems = animationQueue.value.slice(0, -1);
    oldItems.forEach((item) => {
      const element = getElementFromQueueId(item.id);
      element.classList.remove("fade-show");

      window.setTimeout(() => {
        const index = animationQueue.value.findIndex((x) => x.id == item.id);
        if (index > -1) {
          animationQueue.value.splice(index, 1);
        }
      }, FADE_DURATION);
    });
  }, SHOW_START_DELAY);
}

watch(currentContent, () => setContent(currentContent.value));
</script>

<template>
  <div style="width: 100%; height: 100%">
    <TransitionGroup name="fade">
      <div
        v-for="item in animationQueue"
        :key="item.id"
        ref="animationQueueElements"
        class="fade"
        :style="{
          // transition: `opacity ${FADE_DURATION}ms linear`,
          width: '100%',
          height: '100%',
        }"
      >
        <RootRenderer :content="item.content" :font-size="fontSize" />
      </div>
    </TransitionGroup>
  </div>
</template>

<style lang="scss" scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 200ms linear;
  opacity: 1;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

// .fade {
//   opacity: 0;
// }
// .fade-show {
//   opacity: 1;
// }
</style>

<style lang="scss">
body {
  margin: 0px;
}
</style>
