<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";

import RootRenderer from "@/components/renderers/RootRenderer.vue";

import { useStateStore, type StateContent } from "@/stores/state";
import { useConfigStore } from "@/stores/config";
import { uuid } from "@/helpers/random";

const props = defineProps<{ displayName?: string }>();

const configStore = useConfigStore();
// load config
onMounted(configStore.loadConfig);

/** display config for current display */
const displayConfig = computed(() =>
  configStore.getDisplayConfig(props.displayName ?? "")
);

const stateStore = useStateStore();
// connect to state
onMounted(stateStore.connect);

const currentContent = computed(() => stateStore.currentState.content);

const route = useRoute();

const DEFAULT_FONT_SIZE = "40pt";

/** Font size from "font-size" query parameter or display config or default font size */
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
/** Render delay from display config */
const renderDelay = computed(
  () => displayConfig.value?.render_delay ?? DEFAULT_RENDER_DELAY
);

const delayedContent = ref<StateContent>(currentContent.value);

// schedule content update after render delay
watch(currentContent, (content) =>
  window.setTimeout(() => {
    delayedContent.value = content;
  }, renderDelay.value)
);

const DEFAULT_TRANSITION_SPEED = 0;
/**
 * Speed in milliseconds for transitions
 */
const transitionSpeed = computed(
  () => displayConfig.value?.fade_speed ?? DEFAULT_TRANSITION_SPEED
);

/**
 * Returns whether the specified content renders as opaque.
 * Used for transition timing.
 */
function contentRendersAsOpaque(content: StateContent): boolean {
  return content.background;
}

/**
 * Queue of elements with the last item being the current state and any previous items being transitioned away.
 */
const transitionQueue = ref<Array<{ id: string; content: StateContent }>>([]);
/**
 * References to elements corresponding to render queue
 */
const transitionElements = ref<Array<HTMLElement>>();

function addContentState(content: StateContent) {
  const id = uuid();
  transitionQueue.value.push({ id, content });

  /*
    If the new content renders as opaque (i.e. has a background), we need to delay the transitioning out or removal of the previous item by the transition duration.
    This is because the opacities don't add together, they get averaged instead.
    This causes it to transition to 50% opacity as it approaches the middle of swapping and transition back to 100% opacity as it gets to the end.
    This causes a flash of the content behind (i.e. the stream contents).
    If the items render as transparent, we can start transitioning the first element out right away since it will look funny if the transition has to last twice as long and the middle point has both elements on screen with full opacity.
  */
  const removalDelay = contentRendersAsOpaque(content)
    ? transitionSpeed.value
    : 0;

  window.setTimeout(removeAllButCurrentState, removalDelay);
}

/**
 * Removes all but the current state which starts the leave transition
 */
function removeAllButCurrentState() {
  transitionQueue.value.splice(0, transitionQueue.value.length - 1);
}

watch(
  delayedContent,
  () => {
    addContentState(delayedContent.value);
  },
  { deep: true }
);
</script>

<template>
  <TransitionGroup name="fade">
    <div
      v-for="entry in transitionQueue"
      :key="entry.id"
      ref="transitionElements"
      class="renderer transition-fade"
      :style="{ transition: `opacity ${transitionSpeed}ms linear` }"
    >
      <RootRenderer :content="entry.content" :font-size="fontSize" />
    </div>
  </TransitionGroup>
</template>

<style lang="scss" scoped>
.renderer {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
}

.transition-fade {
  opacity: 1;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

<style lang="scss">
body {
  margin: 0px;
}
</style>
