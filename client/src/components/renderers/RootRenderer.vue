<script lang="ts" setup>
import { computed } from "vue";

import type { StateContent } from "@/stores/state";

import MainTextRenderer from "@/components/renderers/MainTextRenderer.vue";
import SmallTextRenderer from "@/components/renderers/SmallTextRenderer.vue";
import SongRenderer from "@/components/renderers/SongRenderer.vue";
import SongTitleRenderer from "@/components/renderers/SongTitleRenderer.vue";
import SubTextRenderer from "@/components/renderers/SubTextRenderer.vue";

const props = defineProps<{ content: StateContent | null; fontSize: string }>();

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
    class="renderer"
    :style="{
      'font-size': fontSize,
      'background-color':
        content?.background ?? false ? '#000' : 'rgba(0,0,0,0)',
      'text-shadow': textShadow,
    }"
  >
    <SmallTextRenderer
      :content="content"
      :font-size="fontSize"
      style="position: absolute; top: 0; left: 0; right: 0; bottom: 0"
    />
    <SubTextRenderer
      :content="content"
      :font-size="fontSize"
      style="position: absolute; top: 0; left: 0; right: 0; bottom: 0"
    />
    <MainTextRenderer
      :content="content"
      :font-size="fontSize"
      style="position: absolute; top: 0; left: 0; right: 0; bottom: 0"
    />
    <SongTitleRenderer
      :content="content"
      :font-size="fontSize"
      style="position: absolute; top: 0; left: 0; right: 0; bottom: 0"
    />
    <SongRenderer
      :content="content"
      :font-size="fontSize"
      style="position: absolute; top: 0; left: 0; right: 0; bottom: 0"
    />
  </div>
</template>

<style lang="scss" scoped>
.renderer {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  font-family: "Ubuntu", "Liberation Sans", "Arial", sans-serif;
  color: #fff;
}
</style>
