<script setup lang="ts">
import { computed, ref } from "vue";

import {
  useServiceStore,
  type PlaceholderValue,
  type PlaceholderDragDropData,
} from "@/stores/service";

const props = defineProps<{
  readonly?: boolean;
}>();

const model = defineModel<Array<PlaceholderValue>>();

const serviceStore = useServiceStore();

const placeholders = computed<Array<PlaceholderValue>>({
  get() {
    return model.value ?? serviceStore.serviceData.data
  },
  set(newVal: Array<PlaceholderValue>) {
    model.value = newVal;
  }
})


const newPlaceholderName = ref("");

function getDefaultPlaceholder() {
  return {
    name: newPlaceholderName.value,
    value: "",
  };
}

function appendPlaceholder() {
  placeholders.value.push(getDefaultPlaceholder());
  newPlaceholderName.value = "";
}

const editingPlaceholderIndex = ref<number | undefined>(undefined);

function deletePlaceholder(index: number) {
  placeholders.value.splice(index, 1);
  editingPlaceholderIndex.value = undefined;
}

function lineCount(text: string): number {
  return text.split("\n").length;
}

const draggingIndex = ref<number | undefined>(undefined);
function dragStart(evt: DragEvent, index: number) {
  evt.dataTransfer?.setData("application/json", JSON.stringify({
    placeholder: placeholders.value[index],
    index
  }));
  evt.dataTransfer!.dropEffect = "move";
}

function dragEnter(evt: DragEvent) {
  evt.preventDefault();
}

function dragOver(evt: DragEvent) {
  evt.preventDefault();
  evt.dataTransfer!.dropEffect = "move";
}

function drop(evt: DragEvent, index: number) {
  const draggedData = JSON.parse(evt.dataTransfer?.getData("application/json") ?? "{}") as PlaceholderDragDropData;
  if (draggedData.value == undefined || draggedData.index == undefined) return;
  evt.preventDefault();
  const draggedIndex = draggedData.index;
  const draggedItem = draggedData.value;
  placeholders.value.splice(draggedIndex, 1);
  placeholders.value.splice(index, 0, draggedItem);
  editingPlaceholderIndex.value = index;
}

function dragEnd(evt: DragEvent) {
  draggingIndex.value = undefined;
}
</script>

<template>
  <div style="height: 100%; display: flex; flex-direction: column">
    <div style="flex: 1 1 auto; height: 4lh;">
      <div style="
          height: 100%;
          overflow: auto;
          display: flex;
          flex-direction: column;
        ">
        <div v-for="(item, index) in placeholders" :key="item.name" style="margin-bottom: 1lh;"
          :draggable="draggingIndex == index" @dragstart="(evt) => dragStart(evt, index)"
          @drop="(evt) => drop(evt, index)" @dragenter="(evt) => dragEnter(evt)" @dragover="(evt) => dragOver(evt)"
          @dragend="(evt) => dragEnd(evt)">
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

        <div v-if="placeholders.length == 0" style="text-align: center; margin-bottom: 1lh">
          <em> &lt;no placeholders&gt; </em>
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
