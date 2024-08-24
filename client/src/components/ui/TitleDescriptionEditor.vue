<script lang="ts" setup>
import { useServiceStore } from "@/stores/service";
import { computed, ref } from "vue";

const serviceStore = useServiceStore();

const copySupported = computed(() => typeof document.execCommand == "function");

const titleCharCount = computed(
  () => serviceStore.serviceData.title?.length ?? 0
);

const titleTextInput = ref<HTMLInputElement>();
const titleCopyButton = ref<HTMLButtonElement>();

function copyTitle() {
  titleTextInput.value?.focus();
  titleTextInput.value?.setSelectionRange(0, titleCharCount.value);
  document.execCommand("copy");
  titleTextInput.value?.setSelectionRange(
    titleCharCount.value,
    titleCharCount.value
  );
  titleCopyButton.value?.focus();
}

function clearTitle() {
  serviceStore.serviceData.title = "";
}

const descriptionCharCount = computed(
  () => serviceStore.serviceData.description?.length ?? 0
);
const descriptionLineCount = computed(
  () => serviceStore.serviceData.description?.split("\n").length ?? 1
);
const descriptionLongestLine = computed(
  () =>
    serviceStore.serviceData.description
      ?.split("\n")
      .reduce((acc, line) => Math.max(acc, line.length), 0) ?? 0
);

const DESCRIPTION_MIN_LINES = 5;
const DESCRIPTION_MAX_LINES = 15;
const descriptionLineShownCount = computed(() =>
  Math.min(
    Math.max(descriptionLineCount.value, DESCRIPTION_MIN_LINES),
    DESCRIPTION_MAX_LINES
  )
);

const descriptionTextArea = ref<HTMLTextAreaElement>();
const descriptionCopyButton = ref<HTMLButtonElement>();

function copyDescription() {
  descriptionTextArea.value?.focus();
  descriptionTextArea.value?.setSelectionRange(0, descriptionCharCount.value);
  document.execCommand("copy");
  descriptionTextArea.value?.setSelectionRange(
    descriptionCharCount.value,
    descriptionCharCount.value
  );
  descriptionCopyButton.value?.focus();
}

function clearDescription() {
  serviceStore.serviceData.description = "";
}
</script>

<template>
  <div>
    <input
      v-model="serviceStore.serviceData.title"
      ref="titleTextInput"
      style="width: 100%"
      placeholder="Title"
    />

    <button ref="titleCopyButton" @click="copyTitle" :disabled="!copySupported">
      Copy
    </button>
    <button @click="clearTitle">Clear</button>

    Chars: {{ titleCharCount }}

    <textarea
      v-model="serviceStore.serviceData.description"
      ref="descriptionTextArea"
      :rows="descriptionLineShownCount"
      style="width: 100%"
      placeholder="Description"
    ></textarea>

    <button
      ref="descriptionCopyButton"
      @click="copyDescription"
      :disabled="!copySupported"
    >
      Copy
    </button>
    <button @click="clearDescription">Clear</button>

    Chars: {{ descriptionCharCount }} Lines: {{ descriptionLineCount }} Longest
    Line:
    {{ descriptionLongestLine }}
  </div>
</template>

<style lang="scss" scoped></style>
