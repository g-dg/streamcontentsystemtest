<script setup lang="ts">
import { ref } from "vue";

import {
  useServiceStore,
} from "@/stores/service";

const props = defineProps<{
  readonly?: boolean;
  mobileController?: boolean;
}>();

const serviceStore = useServiceStore();

const newPlaceholderName = ref("");

function appendPlaceholder() {
  serviceStore.serviceData.placeholders.push({
    name: newPlaceholderName.value,
    value: "",
  });
  newPlaceholderName.value = "";
}

function lineCount(text: string): number {
  return text.split("\n").length;
}

const topScrollElement = ref<HTMLDivElement>();
function scrollToTop() {
  if (props.mobileController) return;
  topScrollElement.value?.scrollIntoView();
}
</script>

<template>
  <div style="height: 100%; display: flex; flex-direction: column">
    <div style="flex: 1 1 auto" :style="{ height: mobileController ? 'auto' : '4lh' }">
      <div style="
          height: 100%;
          overflow: auto;
          display: flex;
          flex-direction: column;
        ">
        <div ref="topScrollElement" style="flex: 0"></div>

        <div v-for="(item, index) in serviceStore.serviceData.placeholders" :key="item.name"
          style="margin-bottom: 1lh;">
          <input v-model="item.name" style="width: 100%" placeholder="Name" />
          <textarea v-model="item.value" :rows="lineCount(item.value)" style="width: 100%"
            placeholder="Value"></textarea>
        </div>

        <div v-if="serviceStore.serviceData.placeholders.length == 0" style="text-align: center; margin-bottom: 1lh">
          <em> This service has no placeholders </em>
        </div>

        <div>
          <form @submit.prevent>
            <input v-model="newPlaceholderName" type="text" placeholder="Name" />
            <button @click="appendPlaceholder" type="submit"> Add </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.selected-item {
  background-color: rgb(var(--fg));
  color: rgb(var(--bg));
  font-weight: bold;
}
</style>
