<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  textKeys: string[];
}>();
const emit = defineEmits(["update"]);

const model = defineModel<Record<string, string>>();

const lineCounts = computed(() =>
  Object.fromEntries(
    props.textKeys.map((key) => [key, model.value?.[key].split("\n").length])
  )
);

const charCounts = computed(() =>
  Object.fromEntries(
    props.textKeys.map((key) => [key, model.value?.[key].length])
  )
);

async function clear(key: string) {
  if (model.value != undefined) {
    model.value[key] = "";
  }
}
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
      <button @click="clear(key)">Clear</button>
      Lines: {{ lineCounts[key] }} Chars: {{ charCounts[key] }}
    </div>
  </form>
</template>

<style lang="scss" scoped></style>
