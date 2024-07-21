<script setup lang="ts">
import BasicTextRenderer from "@/components/renderers/BasicTextRenderer.vue";
</script>

<template>
  <div class="renderer">
    <BasicTextRenderer />
  </div>
</template>

<style lang="scss" scoped>
.renderer {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
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
