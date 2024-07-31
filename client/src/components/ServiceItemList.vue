<script setup lang="ts">
import { ref } from "vue";

import { useServiceStore, type ServiceItem } from "@/stores/service";
import { uuid } from "@/helpers/random";

const serviceStore = useServiceStore();

function selectIndex(index: number) {
  serviceStore.selectedItemIndex = index;
}

function clearService() {
  if (
    serviceStore.serviceData.serviceItems.length > 0 &&
    confirm("Really clear service?")
  ) {
    serviceStore.clearService();
    scrollToTop();
  }
}

const topScrollElement = ref<HTMLDivElement>();
function scrollToTop() {
  topScrollElement.value?.scrollIntoView();
}

// data for drag and drop
interface DragDropData {
  instanceId: string;
  srcIndex: number;
  serviceItem: ServiceItem;
}

// used to detect drag and drop between different component instances
const instanceId = uuid();

const draggableIndex = ref<number | null>(null);
function dragHandleEnableDrag(index: number) {
  draggableIndex.value = index;
}

// index of the currently hovered item
const dragHoveredIndex = ref<number | null>(null);

// handles drag and drop start
function dragStart(evt: DragEvent, index: number) {
  if (evt.dataTransfer == null) return;

  const data: DragDropData = {
    instanceId: instanceId,
    srcIndex: index,
    serviceItem: serviceStore.serviceData.serviceItems[index],
  };

  evt.dataTransfer.setData("application/json", JSON.stringify(data));
  evt.dataTransfer.dropEffect = "move";

  dragHoveredIndex.value = index;
}

// handles showing room for drag and dropped item
function dragOver(evt: DragEvent, index: number) {
  evt.preventDefault();
  evt.dataTransfer!.dropEffect = "move";
  dragHoveredIndex.value = index;
}

// handles drop of item
function drop(evt: DragEvent, index: number) {
  evt.preventDefault();
  const data = JSON.parse(
    evt.dataTransfer?.getData("application/json") ?? JSON.stringify(null)
  ) as DragDropData | null;

  dragHoveredIndex.value = null;

  // return if instance id is incorrect since it may cause inconsistencies
  if (data == null) return;

  let destIndex = index;

  // remove source item only if instance id matches
  if (data.instanceId == instanceId) {
    serviceStore.removeItem(data.srcIndex);
    // update destination index if the item was removed before the source index
    if (destIndex > data.srcIndex) {
      destIndex = Math.max(destIndex - 1, 0);
    }
  }

  // insert item at new index
  serviceStore.addItem(data.serviceItem, true, destIndex);

  draggableIndex.value = null;
}

function dragEnd(evt: DragEvent, index: number) {
  dragHoveredIndex.value = null;
  draggableIndex.value = null;
}
</script>

<template>
  <form
    @submit.prevent
    class="root"
    style="height: 100%; display: flex; flex-direction: column"
  >
    <div style="flex: 0; position: sticky; top: 0px">
      <span style="display: inline-block">
        <button @click="serviceStore.importService()">Load Service</button>
        <button @click="serviceStore.exportService()">Save Service</button>
        <button @click="clearService()">Clear Service</button>
        <button @click="serviceStore.addEmpty()">Add Empty</button>
        <button @click="serviceStore.addText('mainText', '')">Main Text</button>
        <button @click="serviceStore.addText('subText', '')">Sub Text</button>
        <button @click="serviceStore.addText('smallText', '')">
          Small Text
        </button>
        <span
          :style="{
            visibility: serviceStore.unsavedChanges ? 'visible' : 'hidden',
          }"
        >
          <em><strong> Unsaved Changes! </strong></em>
        </span>
      </span>
    </div>

    <div style="flex: 1 1 auto; height: 4lh">
      <div
        style="
          height: 100%;
          overflow: auto;
          display: flex;
          flex-direction: column;
        "
      >
        <div ref="topScrollElement" style="flex: 0"></div>

        <div
          v-for="(item, index) in serviceStore.serviceData.serviceItems"
          :key="item.id"
          @click="selectIndex(index)"
          :class="{ 'selected-item': serviceStore.selectedItemIndex == index }"
          style="flex: 0"
          :draggable="draggableIndex == index"
          @dragstart="dragStart($event, index)"
          @dragover="dragOver($event, index)"
          @drop="drop($event, index)"
          @dragend="dragEnd($event, index)"
        >
          <div v-if="dragHoveredIndex == index" style="height: 2lh"></div>

          <button @click.stop="serviceStore.removeItem(index)">Del</button>

          <button
            @click.stop="serviceStore.moveItem(index, -1)"
            :disabled="index == 0"
          >
            Up
          </button>

          <button
            @click.stop="serviceStore.moveItem(index, 1)"
            :disabled="
              index + 1 == serviceStore.serviceData.serviceItems.length
            "
          >
            Dn
          </button>

          <button
            @mousedown="dragHandleEnableDrag(index)"
            @touchstart="dragHandleEnableDrag(index)"
          >
            Move
          </button>

          <template v-if="item.comment">
            {{ item.comment }}
          </template>

          <template v-else-if="item.type == 'song'">
            {{ (item.text ?? "") != "" ? item.text : item.song?.title }}
          </template>

          <em v-else-if="item.type == 'empty'"> &lt; Empty &gt; </em>

          <em v-else-if="item.type == 'mainText'"> &lt; Main Text &gt; </em>

          <em v-else-if="item.type == 'subText'"> &lt; Sub Text &gt; </em>

          <em v-else-if="item.type == 'smallText'"> &lt; Small Text &gt; </em>

          <em v-else> &lt; Unknown &gt; </em>
        </div>

        <div
          v-if="dragHoveredIndex != null"
          @dragover="
            dragOver($event, serviceStore.serviceData.serviceItems.length)
          "
          @drop="drop($event, serviceStore.serviceData.serviceItems.length)"
          style="flex: 1"
        >
          <div
            v-if="
              dragHoveredIndex == serviceStore.serviceData.serviceItems.length
            "
            style="height: 2lh"
          ></div>
          <div style="text-align: center">
            <em>&lt; Move to end &gt;</em>
          </div>
        </div>

        <div
          v-if="serviceStore.serviceData.serviceItems.length == 0"
          style="text-align: center"
        >
          <em> This service has no items </em>
        </div>
      </div>
    </div>
  </form>
</template>

<style lang="scss" scoped>
.selected-item {
  background-color: black;
  color: white;
}
</style>
