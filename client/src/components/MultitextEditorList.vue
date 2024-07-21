<script setup lang="ts">
import MultitextEditorComponent from "./MultitextEditorComponent.vue";

const props = defineProps<{
  textKeys: string[];
}>();
const emit = defineEmits(["update"]);

const model = defineModel<Record<string, string>>();
</script>

<template>
  <form @submit.prevent class="root">
    <div v-for="key in textKeys" :key="key">
      <MultitextEditorComponent v-model="(model as any)[key]" :title="key" />
    </div>
  </form>
</template>

<style lang="scss" scoped></style>
