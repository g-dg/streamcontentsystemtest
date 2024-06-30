<script setup lang="ts">
import EditorComponent from "./EditorComponent.vue";

const props = defineProps<{
  textKeys: string[];
}>();
const emit = defineEmits(["update"]);

const model = defineModel<Record<string, string>>();
</script>

<template>
  <form @submit.prevent class="root">
    <div v-for="key in textKeys" :key="key">
      <EditorComponent v-model="(model as any)[key]" :title="key" />
    </div>
  </form>
</template>

<style lang="scss" scoped></style>
