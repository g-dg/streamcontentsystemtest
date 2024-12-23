<script setup lang="ts">
import { computed } from "vue";

import { useConfigStore } from "@/stores/config";

import PreviewIFrame from "../renderers/PreviewIFrame.vue";

const configStore = useConfigStore();

const previewDisplays = computed(() => configStore.config.preview_displays ?? []);

</script>

<template>
  <div style="display: flex; flex-direction: row; flex-wrap: wrap; width: 100%">
    <PreviewIFrame v-for="displayName in previewDisplays" :key="displayName" :displayName="displayName" border
      style="flex: 1; min-width: 50%" />
  </div>
</template>

<style lang="scss" scoped></style>
