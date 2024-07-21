<script setup lang="ts">
import { computed, ref } from "vue";

const props = defineProps<{
  title: string;
}>();
const emit = defineEmits(["update"]);

const model = defineModel<string>();

const textAreaElement = ref<HTMLTextAreaElement | null>(null);
const copyButtonElement = ref<HTMLButtonElement | null>(null);

const lineCount = computed(() => model.value?.split("\n").length ?? 1);

const charCount = computed(() => model.value?.length ?? 0);

const copySupported = computed(() => typeof document.execCommand == "function");
async function copy() {
  textAreaElement.value?.focus();
  textAreaElement.value?.setSelectionRange(0, charCount.value);
  document.execCommand("copy");
  textAreaElement.value?.setSelectionRange(charCount.value, charCount.value);
  copyButtonElement.value?.focus();
}

async function clear() {
  model.value = "";
}

const titleWithoutExtension = computed(() =>
  props.title.replace(/\.[^\.]*$/, "")
);
</script>

<template>
  <div>
    <h1>{{ titleWithoutExtension }}</h1>
    <textarea
      ref="textAreaElement"
      v-model="model"
      :rows="lineCount"
      style="width: 100%"
    ></textarea>
    <button @click="copy" ref="copyButtonElement" :disabled="!copySupported">
      Copy
    </button>
    <button @click="clear">Clear</button>
    Lines: {{ lineCount }} Chars: {{ charCount }}
  </div>
</template>

<style lang="scss" scoped></style>
