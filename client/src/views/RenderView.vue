<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";

import { useDisplayStateStore, type DisplayState } from "@/stores/state";
import { useConfigStore } from "@/stores/config";
import { uuid } from "@/helpers/random";

const props = defineProps<{ displayName?: string }>();

const defaultState: DisplayState = { template: "", placeholders: {} };

const loading = ref(1);

const configStore = useConfigStore();
async function loadConfig() {
  loading.value++;
  await configStore.loadConfig();
  loading.value--;
}
loadConfig();

/** display config for current display */
const displayConfig = computed(() =>
  configStore.getDisplayConfig(props.displayName)
);

const displayStateStore = useDisplayStateStore();

function resolvePlaceholderContent(displayState: DisplayState | undefined): string {
  const map = new Map<string, string>();

  //         __ ____            __
  //       _/_//_/ /_____  ____/ /___
  //     _/_//_// __/ __ \/ __  / __ \
  //   _/_//_/ / /_/ /_/ / /_/ / /_/ /
  //  /_//_/   \__/\____/\__,_/\____/
  //todo: Resolve placeholder content

  return JSON.stringify(displayState, undefined, 4);
}

const currentState = computed<DisplayState | undefined>(
  () => displayStateStore.currentState
);

const route = useRoute();

const DEFAULT_RENDER_DELAY = 0;
/** Render delay from display config */
const renderDelay = computed(
  () => displayConfig.value?.render_delay ?? DEFAULT_RENDER_DELAY
);

const delayedState = ref<DisplayState>(
  currentState.value ?? defaultState
);

// schedule state update after render delay
watch(currentState, (state) => {
  if (state != undefined) {
    window.setTimeout(() => {
      delayedState.value = state;
    }, renderDelay.value);
  }
});

const DEFAULT_TRANSITION_SPEED = 0;
/**
 * Speed in milliseconds for transitions
 */
const transitionSpeed = computed(
  () => displayConfig.value?.fade_speed ?? DEFAULT_TRANSITION_SPEED
);

/**
 * Returns whether the specified state renders as opaque.
 * Used for transition timing.
 */
function stateRendersAsOpaque(state: DisplayState): boolean {
  return configStore.getDisplayTemplate(props.displayName, state.template).has_background ?? true;
}

/**
 * Queue of elements with the last item being the current state and any previous items being transitioned away.
 */
const transitionQueue = ref<Array<{ id: string; state: DisplayState }>>([]);
/**
 * References to elements corresponding to render queue
 */
const transitionElements = ref<Array<HTMLElement>>();

/**
 * Returns whether the states should be treated as the same states
 */
function isStateSame<T>(a: T, b: T): boolean {
  // since we map the object in a consistent way, we can simply compare the JSON of each object
  return (JSON.stringify(a) == JSON.stringify(b));
}

function addNewState(state: DisplayState) {
  if (state == undefined) return;

  // if we're transitioning to identical states, ignore it
  const currentLatestState =
    transitionQueue.value[transitionQueue.value.length - 1];
  if (
    currentLatestState !== undefined &&
    isStateSame(currentLatestState.state, state)
  )
    return;

  const id = uuid();
  transitionQueue.value.push({ id, state: state });

  /*
    If the new state renders as opaque (i.e. has a background), we need to delay the transitioning out or removal of the previous item by the transition duration.
    This is because the opacities don't add together, they get averaged instead.
    This causes it to transition to 50% opacity as it approaches the middle of swapping and transition back to 100% opacity as it gets to the end.
    This causes a flash of the content behind (i.e. the stream contents).
    If the items render as transparent, we can start transitioning the first element out right away since it will look funny if the transition has to last twice as long and the middle point has both elements on screen with full opacity.
  */
  const removalDelay = stateRendersAsOpaque(state)
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
  delayedState,
  () => {
    addNewState(delayedState.value);
  },
  { deep: true }
);

onMounted(() => loading.value--);

const rendererRootElement = ref<Element>();
function toggleFullscreen() {
  if (displayConfig.value.allow_fullscreen != true) return;

  if (document.fullscreenElement == undefined) {
    if (rendererRootElement.value?.requestFullscreen)
      rendererRootElement.value?.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
}
</script>

<template>
  <div v-if="loading == 0" ref="rendererRootElement" @dblclick="toggleFullscreen" class="full-size"
    style="background: transparent;">
    <TransitionGroup name="fade">
      <div v-for="entry in transitionQueue" :key="entry.id" ref="transitionElements" class="full-size transition-fade"
        :style="{ transition: `opacity ${transitionSpeed}ms linear` }">
        <div v-html="''"></div>
      </div>
    </TransitionGroup>
  </div>
</template>

<style lang="scss" scoped>
.full-size {
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
