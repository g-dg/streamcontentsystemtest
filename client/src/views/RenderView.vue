<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";

import RootRenderer from "@/components/renderers/RootRenderer.vue";

import { useDisplayStateStore, type DisplayState } from "@/stores/state";
import { useConfigStore } from "@/stores/config";
import { uuid } from "@/helpers/random";

const props = defineProps<{ displayName?: string }>();

const defaultState: DisplayState = { background: false };

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
  configStore.getDisplayConfig(props.displayName ?? "")
);

/** Maps the display state while applying config like alternate blanking and hide small text */
function mapDisplayState(state: DisplayState | null): DisplayState {
  if (state == null)
    return {
      background: false,
    };

  const alternateBlanking = displayConfig.value.alternate_blanking ?? false;
  const hideSmallText = displayConfig.value.hide_small_text ?? false;
  const showOptional = displayConfig.value.show_optional ?? true;

  const newState = {
    background: state.background,
    mainText: state.mainText,
    subText: state.subText,
    smallText: state.smallText,
    optionalText: state.optionalText,
    song: state.song,
    songTitle: state.songTitle,
    attribution: state.attribution,
  };

  // if hide small text is enabled, hide the small text
  if (hideSmallText) {
    newState.smallText = undefined;
  }

  // if alternate blanking is enabled and nothing is showing, show alternate text
  if (alternateBlanking) {
    if ([newState.mainText, newState.subText, newState.smallText, newState.optionalText, newState.song, newState.songTitle, newState.attribution].every((x) => x == undefined)) {
      newState.mainText = state.alternateText;
    }
  }

  // if optional text and show optional is enabled, set main text to optional
  if (state.optionalText != undefined && showOptional) {
    newState.mainText = state.optionalText;
  }

  return newState;
}

const displayStateStore = useDisplayStateStore();

const currentContent = computed<DisplayState | null>(
  () => mapDisplayState(displayStateStore.currentState)
);

const route = useRoute();

const DEFAULT_FONT_SIZE = "5vmin";

/** Font size from "font-size" query parameter or display config or default font size (whichever comes first) */
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

const padding = computed(() =>
  displayConfig.value.padding ?? 3.5
);

const DEFAULT_RENDER_DELAY = 0;
/** Render delay from display config */
const renderDelay = computed(
  () => displayConfig.value?.render_delay ?? DEFAULT_RENDER_DELAY
);

const delayedContent = ref<DisplayState>(
  currentContent.value ?? defaultState
);

// schedule content update after render delay
watch(currentContent, (content) => {
  if (content != null) {
    window.setTimeout(() => {
      delayedContent.value = content;
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
 * Returns whether the specified content renders as opaque.
 * Used for transition timing.
 */
function contentRendersAsOpaque(content: DisplayState): boolean {
  return content.background;
}

/**
 * Queue of elements with the last item being the current state and any previous items being transitioned away.
 */
const transitionQueue = ref<Array<{ id: string; content: DisplayState }>>([]);
/**
 * References to elements corresponding to render queue
 */
const transitionElements = ref<Array<HTMLElement>>();

/**
 * Returns whether the states should be treated as the same states
 */
function isStateSame(a: DisplayState, b: DisplayState): boolean {
  // since we map the object in a consistent way, we can simply compare the JSON of each object
  return (JSON.stringify(a) == JSON.stringify(b));
}

function addContentState(content: DisplayState | null) {
  if (content == null) return;

  // if we're transitioning to identical states, ignore it
  const currentLatestContent =
    transitionQueue.value[transitionQueue.value.length - 1];
  if (
    currentLatestContent !== undefined &&
    isStateSame(currentLatestContent.content, content)
  )
    return;

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

onMounted(() => loading.value--);

const rendererRootElement = ref<Element>();
function toggleFullscreen() {
  if (displayConfig.value.allow_fullscreen != true) return;

  if (document.fullscreenElement == null) {
    if (rendererRootElement.value?.requestFullscreen)
      rendererRootElement.value?.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
}
</script>

<template>
  <div v-if="loading == 0" ref="rendererRootElement" @dblclick="toggleFullscreen" class="full-size"
    :style="{ background: displayConfig.background ?? 'transparent' }">
    <TransitionGroup name="fade">
      <div v-for="entry in transitionQueue" :key="entry.id" ref="transitionElements" class="full-size transition-fade"
        :style="{ transition: `opacity ${transitionSpeed}ms linear` }">
        <RootRenderer :content="entry.content" :config="configStore.config" :display-config="displayConfig"
          :font-size="fontSize" :padding="padding" />
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
