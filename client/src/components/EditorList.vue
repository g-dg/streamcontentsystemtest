<script setup lang="ts">
import clone from "@/helpers/clone";
import { ref, watch } from "vue";

const props = defineProps<{
  textKeys: string[];
  lineCounts: Record<string, number>;
  charCounts: Record<string, number>;
}>();
const emit = defineEmits(["update"]);

const model = defineModel<Record<string, string>>();
</script>

<template>
  <form @submit.prevent class="root">
    <div v-for="key in textKeys" :key="key">
      <h1>{{ key }}</h1>
      <textarea
        v-model="(model as any)[key]"
        :rows="lineCounts[key]"
        style="width: 100%"
      ></textarea>
      {{ lineCounts[key] }} {{ charCounts[key] }}
    </div>
  </form>
</template>

<style lang="scss" scoped></style>
