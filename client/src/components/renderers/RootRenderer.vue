<script lang="ts" setup>
import { computed, ref } from "vue";

import type { DisplayState } from "@/stores/state";

import MainTextRenderer from "@/components/renderers/MainTextRenderer.vue";
import SmallTextRenderer from "@/components/renderers/SmallTextRenderer.vue";
import SongRenderer from "@/components/renderers/SongRenderer.vue";
import SongTitleRenderer from "@/components/renderers/SongTitleRenderer.vue";
import SongAttributionRenderer from "@/components/renderers/SongAttributionRenderer.vue";
import SubTextRenderer from "@/components/renderers/SubTextRenderer.vue";
import type { Config, DisplayConfig } from "@/stores/config";

const props = defineProps<{
  content: DisplayState | null;
  displayConfig: DisplayConfig;
  config: Config;
  fontSize: string;
  padding: number;
}>();

// Text shadow is built up by layering multiple shadows over eachother
const TEXT_SHADOW_LAYERS = 8;
function generateTextShadow(color: string): string {
  return [...Array(TEXT_SHADOW_LAYERS).keys()]
    .map(() => `0px 0px calc(${props.fontSize} / 4) ${color}`)
    .join(",")
}

const fallbackTextShadow = computed(() => generateTextShadow("#000"));
const textShadow = computed(() => generateTextShadow(props.displayConfig.background ?? "#000"));
</script>

<template>
  <div :class="[
    'renderer',
    ...(displayConfig.main_content ? ['renderer-is-main-content'] : []),
    ...(displayConfig.noninteractable ? ['renderer-is-noninteractable'] : []),
  ]" :style="{
    'font-size': fontSize,
    'background-color':
      content?.background ?? false ? (displayConfig.background ?? '#000') : 'rgba(0,0,0,0)',
    'color': displayConfig.foreground_color ?? '#fff',
    'text-shadow': [fallbackTextShadow, textShadow] as any,
    'font-weight': displayConfig.bold == true ? 'bold' : 'normal',
    'line-height': displayConfig.line_height ?? 1.25,
    'letter-spacing': `${(displayConfig.letter_spacing ?? 0) / 16}em`,
    'word-spacing': `${(displayConfig.word_spacing ?? 0) / 16}em`,
  }">
    <SmallTextRenderer :content="content" :config="config" :display-config="displayConfig" :font-size="fontSize"
      :padding="padding" class="renderer-item full-size" />
    <SubTextRenderer :content="content" :config="config" :display-config="displayConfig" :font-size="fontSize"
      :padding="padding" class="renderer-item full-size" />
    <MainTextRenderer :content="content" :config="config" :display-config="displayConfig" :font-size="fontSize"
      :padding="padding" class="renderer-item full-size" />
    <SongAttributionRenderer :content="content" :config="config" :display-config="displayConfig" :font-size="fontSize"
      :padding="padding" class="renderer-item full-size" />
    <SongTitleRenderer :content="content" :config="config" :display-config="displayConfig" :font-size="fontSize"
      :padding="padding" class="renderer-item full-size" />
    <SongRenderer :content="content" :config="config" :display-config="displayConfig" :font-size="fontSize"
      :padding="padding" class="renderer-item full-size" />
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

.renderer {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  font-family: "Ubuntu", "Liberation Sans", "Arial", sans-serif;

  :deep(::selection) {
    text-shadow: none;
    background-color: Highlight;
    color: HighlightText;
  }
}

.renderer-is-noninteractable {
  cursor: none;

  .renderer-item {
    pointer-events: none;
    -webkit-user-select: none;
    user-select: none;
  }
}
</style>
