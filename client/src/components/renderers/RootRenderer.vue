<script lang="ts" setup>
import { computed } from "vue";

import type { StateContent } from "@/stores/state";

import MainTextRenderer from "@/components/renderers/MainTextRenderer.vue";
import SmallTextRenderer from "@/components/renderers/SmallTextRenderer.vue";
import SongRenderer from "@/components/renderers/SongRenderer.vue";
import SongTitleRenderer from "@/components/renderers/SongTitleRenderer.vue";
import SubTextRenderer from "@/components/renderers/SubTextRenderer.vue";
import type { DisplayConfig } from "@/stores/config";

const props = defineProps<{
  content: StateContent | null;
  displayConfig: DisplayConfig;
  fontSize: string;
}>();

// Text shadow is built up by layering multiple shadows over eachother
const TEXT_SHADOW_LAYERS = 8;
const textShadow = computed(() =>
  [...Array(TEXT_SHADOW_LAYERS).keys()]
    .map(() => `0px 0px calc(${props.fontSize} / 4) black`)
    .join(",")
);
</script>

<template>
  <div
    :class="[
      'renderer',
      ...(displayConfig.main_content ? ['renderer-is-main-content'] : []),
      ...(displayConfig.noninteractable ? ['renderer-is-noninteractable'] : []),
    ]"
    :style="{
      'font-size': fontSize,
      'background-color':
        content?.background ?? false ? '#000' : 'rgba(0,0,0,0)',
      'text-shadow': textShadow,
    }"
  >
    <SmallTextRenderer
      v-if="!displayConfig.hide_small_text"
      :content="content"
      :display-config="displayConfig"
      :font-size="fontSize"
      class="renderer-item full-size"
    />
    <SubTextRenderer
      :content="content"
      :display-config="displayConfig"
      :font-size="fontSize"
      class="renderer-item full-size"
    />
    <MainTextRenderer
      :content="content"
      :display-config="displayConfig"
      :font-size="fontSize"
      class="renderer-item full-size"
    />
    <SongTitleRenderer
      :content="content"
      :display-config="displayConfig"
      :font-size="fontSize"
      class="renderer-item full-size"
    />
    <SongRenderer
      :content="content"
      :display-config="displayConfig"
      :font-size="fontSize"
      class="renderer-item full-size"
    />
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
  color: #fff;
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
