<script setup lang="ts">
import { computed, ref, watch } from "vue";

import {
  useServiceStore,
  type ServiceItemDragDropData,
} from "@/stores/service";

const props = defineProps<{
  readonly?: boolean;
  mobileController?: boolean;
}>();

const serviceStore = useServiceStore();

function selectIndex(index: number) {
  serviceStore.selectedItemIndex = index;
}

// data for drag and drop

const draggableIndex = ref<number | null>(null);
function dragHandleEnableDrag(index: number, enable: boolean) {
  if (props.mobileController) return; // don't enable drag and drop on mobile
  draggableIndex.value = enable ? index : null;
}
watch(
  computed(() => serviceStore.serviceData.serviceItems),
  () => (draggableIndex.value = null)
);

// handles drag and drop start
function dragStart(evt: DragEvent, index: number) {
  if (evt.dataTransfer == null) return;

  if (serviceStore.serviceData.serviceItems[index] == undefined)
    return;

  const data: ServiceItemDragDropData = {
    srcIndex: index,
    serviceItem: serviceStore.serviceData.serviceItems[index],
  };

  evt.dataTransfer.setData("application/json", JSON.stringify(data));
  evt.dataTransfer.dropEffect = "move";
}

function dragOver(evt: DragEvent) {
  evt.preventDefault();
  evt.dataTransfer!.dropEffect = "move";
}

// handles drop of item
function drop(evt: DragEvent, index: number) {
  evt.preventDefault();
  const data = JSON.parse(
    evt.dataTransfer?.getData("application/json") ?? JSON.stringify(null)
  ) as ServiceItemDragDropData | null;

  if (data == null) return;

  // if source index is provided, move
  if (data.srcIndex != null) {
    serviceStore.removeItem(data.srcIndex);
    serviceStore.addItem(data.serviceItem, true, Math.min(index, serviceStore.serviceData.serviceItems.length));
  } else {
    serviceStore.addItem(data.serviceItem, true, index);
  }

  draggableIndex.value = null;
}

// resets drag and drop state
function dragEnd() {
  draggableIndex.value = null;
}

// scroll selected item into view
const serviceItemElements = ref<Array<HTMLElement> | HTMLElement>([]);
watch(
  () => serviceStore.selectedItemIndex,
  () => {
    if (props.mobileController) return;
    const index = serviceStore.selectedItemIndex;
    if (
      index != null &&
      typeof serviceItemElements.value == "object" &&
      serviceItemElements.value != null &&
      Array.isArray(serviceItemElements.value)
    ) {
      serviceItemElements.value
        .find((x) => parseInt(x.getAttribute("data-index") ?? "") == index - 1)
        ?.scrollIntoView({
          block: "nearest",
        });

      serviceItemElements.value
        .find((x) => parseInt(x.getAttribute("data-index") ?? "") == index + 1)
        ?.scrollIntoView({
          block: "nearest",
        });

      serviceItemElements.value
        .find((x) => parseInt(x.getAttribute("data-index") ?? "") == index)
        ?.scrollIntoView({
          block: "nearest",
        });
    }
  }
);
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

        <div v-for="(item, index) in serviceStore.serviceData.serviceItems" :key="item.id" @click="selectIndex(index)"
          style="flex: 0" ref="serviceItemElements" :data-index="index" :draggable="draggableIndex == index"
          @dragstart="dragStart($event, index)" @dragover="dragOver($event)" @drop="drop($event, index)"
          @dragend="dragEnd()">
          <div :class="{
            'selected-item': serviceStore.selectedItemIndex == index,
          }" style="padding: 0.5lh 0">
            <span v-if="!readonly" style="padding: 0 1em 0 0">
              <button @click.stop="serviceStore.removeItem(index)">Del</button>

              <button @click.stop="serviceStore.moveItem(index, -1)" :disabled="index == 0">
                Up
              </button>

              <button @click.stop="serviceStore.moveItem(index, 1)" :disabled="index + 1 == serviceStore.serviceData.serviceItems.length
                ">
                Dn
              </button>

              <button @mousedown="dragHandleEnableDrag(index, true)" @mouseup="dragHandleEnableDrag(index, true)">
                Move
              </button>
            </span>

            <span style="font-size: 112.5%">
              <template v-if="item.comment">
                {{ item.comment }}
              </template>

              <template v-else-if="item.type == 'song'">
                {{ (item.text ?? "") != "" ? item.text : item.song?.title }}
              </template>

              <em v-else-if="item.type == 'empty'"> &lt; Empty &gt; </em>

              <em v-else-if="item.type == 'blank'"> &lt; Blank &gt; </em>

              <em v-else-if="item.type == 'mainText'"> &lt; Main Text &gt; </em>

              <em v-else-if="item.type == 'subText'"> &lt; Sub Text &gt; </em>

              <em v-else-if="item.type == 'smallText'"> &lt; Small Text &gt; </em>

              <em v-else-if="item.type == 'optionalText'"> &lt; Optional Text &gt; </em>

              <em v-else> &lt; Unknown &gt; </em>
            </span>
          </div>
        </div>

        <div v-if="serviceStore.serviceData.serviceItems.length == 0" style="text-align: center">
          <em> This service has no items </em>
        </div>

        <div @dragover="dragOver($event)" @drop="drop($event, serviceStore.serviceData.serviceItems.length)"
          style="flex: 1;">
          &nbsp;
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
