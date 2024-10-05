<script lang="ts" setup>
import { computed } from "vue";

const props = defineProps<{ border?: boolean; scale?: number }>();

const DEFAULT_NORMAL_FONT_SIZE = 40;
const scaledFontSize = computed(
  () => DEFAULT_NORMAL_FONT_SIZE * (props.scale ?? 1)
);
</script>

<template>
  <div
    :style="{
      border: border ? '1px rgba(var(--fg), 0.5) solid' : 'none',
      backgroundClip: 'padding-box',
      backgroundColor: 'white',
    }"
  >
    <iframe
      :src="`/display/preview?font-size=${scaledFontSize}`"
      :style="{
        border: 'none',
        width: '100%',
        height: '100%',
        aspectRatio: '16 / 9',
        display: 'block',
      }"
    ></iframe>
  </div>
</template>

<style lang="scss" scoped></style>
