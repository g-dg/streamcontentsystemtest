<script lang="ts" setup>
import { computed } from "vue";

const props = defineProps<{ border?: boolean; scale?: number }>();

const DEFAULT_REGULAR_FONT_SIZE = 40;
const scaledFontSize = computed(
  () => DEFAULT_REGULAR_FONT_SIZE * (props.scale ?? 1)
);
</script>

<template>
  <iframe
    :src="`/display/preview?font-size=${scaledFontSize}`"
    :style="{
      border: border ? '1px black solid' : 'none',
      width: '100%',
      height: '100%',
      'aspect-ratio': '16 / 9',
    }"
  ></iframe>
</template>

<style lang="scss" scoped></style>
