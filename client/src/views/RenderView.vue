<script setup lang="ts">
import MainTextRenderer from "@/components/renderers/MainTextRenderer.vue";
import SmallTextRenderer from "@/components/renderers/SmallTextRenderer.vue";
import SongRenderer from "@/components/renderers/SongRenderer.vue";
import SongTitleRenderer from "@/components/renderers/SongTitleRenderer.vue";
import SubTextRenderer from "@/components/renderers/SubTextRenderer.vue";
import { useStateStore } from "@/stores/state";
import { computed, onMounted } from "vue";
import { useRoute } from "vue-router";

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

const TEXT_SHADOW_LAYERS = 8;
const textShadow = computed(() =>
  [...Array(TEXT_SHADOW_LAYERS).keys()]
    .map(() => `0px 0px calc(${fontSize.value} / 4) black`)
    .join(",")
);
</script>

<template>
  <div
    class="renderer"
    :style="{
      'font-size': fontSize,
      'background-color':
        currentContent?.background ?? false ? '#000' : 'rgba(0,0,0,0)',
      ...((currentContent?.background ?? false) && false
        ? {}
        : {
            'text-shadow': textShadow,
          }),
    }"
  >
    <SongRenderer
      :font-size="fontSize"
      style="position: absolute; top: 0; left: 0; right: 0; bottom: 0"
    />
    <SongTitleRenderer
      :font-size="fontSize"
      style="position: absolute; top: 0; left: 0; right: 0; bottom: 0"
    />
    <SmallTextRenderer
      :font-size="fontSize"
      style="position: absolute; top: 0; left: 0; right: 0; bottom: 0"
    />
    <SubTextRenderer
      :font-size="fontSize"
      style="position: absolute; top: 0; left: 0; right: 0; bottom: 0"
    />
    <MainTextRenderer
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

<style lang="scss">
body {
  margin: 0px;
}
</style>

<style lang="scss">
@font-face {
  font-family: "Ubuntu";
  font-display: swap;
  src: local("Ubuntu"),
    url(@/assets/ubuntu-font-family/Ubuntu-R.ttf) format("truetype");
}
</style>
