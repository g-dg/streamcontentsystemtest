<script setup lang="ts">
import BasicTextRenderer from "@/components/renderers/BasicTextRenderer.vue";
import { computed } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();

const DEFAULT_FONT_SIZE = "40pt";

const fontSize = computed(() => {
  const size_query = (route.query["font-size"] as string) ?? null;
  const size =
    size_query.match(/^\d+(\.\d+)$/)?.[0] ?? size_query ?? DEFAULT_FONT_SIZE;
  return size;
});
</script>

<template>
  <div class="renderer" :style="{ 'font-size': `${fontSize}pt` }">
    <BasicTextRenderer />
  </div>
</template>

<style lang="scss" scoped>
.renderer {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  font-family: "Ubuntu", "Liberation Sans", "Arial", sans-serif;
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
