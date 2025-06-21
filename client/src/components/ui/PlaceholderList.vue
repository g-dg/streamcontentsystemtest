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

function getDefaultPlaceholder() {
  return {
    name: newPlaceholderName.value,
    value: "",
  };
}

function appendPlaceholder() {
  serviceStore.serviceData.placeholders.push(getDefaultPlaceholder());
  newPlaceholderName.value = "";
}

const editingPlaceholderIndex = ref<number | undefined>(undefined);

function deletePlaceholder(index: number) {
  serviceStore.serviceData.placeholders.splice(index, 1);
  editingPlaceholderIndex.value = undefined;
}

function lineCount(text: string): number {
  return text.split("\n").length;
}

const draggingIndex = ref<number | undefined>(undefined);
function dragStart(evt: DragEvent, index: number) {
  evt.dataTransfer?.setData("application/json", JSON.stringify({
    placeholder: serviceStore.serviceData.placeholders[index],
    index
  }));
}

function drop(evt: DragEvent, index: number) {
  const draggedData = JSON.parse(evt.dataTransfer?.getData("application/json") ?? "{}");
  if (draggedData.placeholder == undefined || draggedData.index == undefined) return;
  evt.preventDefault();
  const draggedIndex = draggedData.index as number;
  const draggedItem = draggedData.placeholder as { name: string, value: string };
  serviceStore.serviceData.placeholders.splice(draggedIndex, 1);
  serviceStore.serviceData.placeholders.splice(index, 0, draggedItem);
  editingPlaceholderIndex.value = index;
  console.debug(JSON.parse(JSON.stringify(serviceStore.serviceData.placeholders)))
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

        <div v-for="(item, index) in serviceStore.serviceData.placeholders" :key="item.name" style="margin-bottom: 1lh;"
          :draggable="draggingIndex == index" @dragstart="(evt) => dragStart(evt, index)"
          @drop="(evt) => drop(evt, index)" @dragenter="(evt) => evt.preventDefault()"
          @dragover="(evt) => evt.preventDefault()" @dragend="draggingIndex = undefined">
          <div style="display: flex;">
            <input v-if="editingPlaceholderIndex == index" v-model="item.name" placeholder="Name" style="flex: 1" />
            <div v-else style="flex: 1"> {{ item.name }} </div>
            <template v-if="editingPlaceholderIndex == index">
              <button @mousedown="draggingIndex = index"> Move </button>
              <button @click="deletePlaceholder(index)"> Delete </button>
              <button @click="editingPlaceholderIndex = undefined"> Cancel </button>
            </template>
            <button v-else @click="editingPlaceholderIndex = index"> Edit </button>
          </div>
          <textarea v-model="item.value" :rows="lineCount(item.value)" placeholder="Value"
            style="width: 100%"></textarea>
        </div>

        <div v-if="serviceStore.serviceData.placeholders.length == 0" style="text-align: center; margin-bottom: 1lh">
          <em> This service has no placeholders </em>
        </div>

        <div>
          <form @submit.prevent style="display: flex;">
            <input v-model="newPlaceholderName" type="text" placeholder="Name" style="flex: 1;" />
            <button @click="appendPlaceholder" type="submit" style="flex: 0;"> Add </button>
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
