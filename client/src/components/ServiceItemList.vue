<script setup lang="ts">
import { computed, ref, watch } from "vue";

import {
  useServiceStore,
  type ServiceItem,
  type ServiceItemDragDropData,
} from "@/stores/service";
import { uuid } from "@/helpers/random";

const serviceStore = useServiceStore();

function selectIndex(index: number) {
  serviceStore.selectedItemIndex = index;
}

async function loadService() {
  if (
    !serviceStore.unsavedChanges ||
    confirm("There are unsaved changes. Really load service?")
  ) {
    await serviceStore.importService();
    scrollToTop();
  }
}

async function saveService() {
  await serviceStore.exportService();
  scrollToTop();
}

function clearService() {
  if (
    !serviceStore.unsavedChanges ||
    confirm("There are unsaved changes. Really clear service?")
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

// used to detect drag and drop between different component instances
const instanceId = uuid();

const draggableIndex = ref<number | null>(null);
function dragHandleEnableDrag(index: number, enable: boolean) {
  draggableIndex.value = enable ? index : null;
}
watch(
  computed(() => serviceStore.serviceData.serviceItems),
  () => (draggableIndex.value = null)
);

// index of the currently hovered item
const dragHoveredIndex = ref<number | null>(null);

// handles drag and drop start
function dragStart(evt: DragEvent, index: number) {
  if (evt.dataTransfer == null) return;

  const data: ServiceItemDragDropData = {
    instanceId: instanceId,
    srcIndex: index,
    serviceItem: serviceStore.serviceData.serviceItems[index],
  };

  evt.dataTransfer.setData("application/json", JSON.stringify(data));
  evt.dataTransfer.dropEffect = "move";

  dragHoveredIndex.value = index;
}

// handles showing drop area for dragged item
//TODO: find a way to clear if dragged out of the component and cancelled.
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
  ) as ServiceItemDragDropData | null;

  dragHoveredIndex.value = null;

  // return if instance id is incorrect since it may cause inconsistencies
  if (data == null) return;

  let destIndex = index;

  // remove source item only if source index is provided and instance id matches
  if (data.srcIndex != null && data.instanceId == instanceId) {
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

// resets drag and drop state
function dragEnd(evt: DragEvent, index: number) {
  dragHoveredIndex.value = null;
  draggableIndex.value = null;
}

function newItemDragStart(evt: DragEvent, newItem: ServiceItem) {
  if (evt.dataTransfer == null) return;

  const data: ServiceItemDragDropData = {
    instanceId: null,
    srcIndex: null,
    serviceItem: newItem,
  };

  evt.dataTransfer.setData("application/json", JSON.stringify(data));
  evt.dataTransfer.dropEffect = "move";
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
        <button @click="loadService()">Load</button>
        <button @click="saveService()">Save</button>
        <button @click="clearService()">Clear</button>
        <button
          @click="serviceStore.addItem(serviceStore.emptyItem(), true)"
          draggable="true"
          @dragstart="newItemDragStart($event, serviceStore.emptyItem())"
        >
          Add Empty
        </button>
        <button
          @click="
            serviceStore.addItem(serviceStore.textItem('mainText', ''), true)
          "
          draggable="true"
          @dragstart="
            newItemDragStart($event, serviceStore.textItem('mainText', ''))
          "
        >
          Main Text
        </button>
        <button
          @click="
            serviceStore.addItem(serviceStore.textItem('subText', ''), true)
          "
          draggable="true"
          @dragstart="
            newItemDragStart($event, serviceStore.textItem('subText', ''))
          "
        >
          Sub Text
        </button>
        <button
          @click="
            serviceStore.addItem(serviceStore.textItem('smallText', ''), true)
          "
          draggable="true"
          @dragstart="
            newItemDragStart($event, serviceStore.textItem('smallText', ''))
          "
        >
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
          style="flex: 0"
          :draggable="draggableIndex == index"
          @dragstart="dragStart($event, index)"
          @dragover="dragOver($event, index)"
          @drop="drop($event, index)"
          @dragend="dragEnd($event, index)"
        >
          <div
            v-if="dragHoveredIndex != null && dragHoveredIndex == index"
            style="height: 2lh"
          ></div>

          <div
            :class="{
              'selected-item': serviceStore.selectedItemIndex == index,
            }"
            style="padding: 0.5lh 0"
          >
            <span style="padding: 0 1em 0 0">
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
                @mousedown="dragHandleEnableDrag(index, true)"
                @mouseup="dragHandleEnableDrag(index, true)"
              >
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

              <em v-else-if="item.type == 'mainText'"> &lt; Main Text &gt; </em>

              <em v-else-if="item.type == 'subText'"> &lt; Sub Text &gt; </em>

              <em v-else-if="item.type == 'smallText'">
                &lt; Small Text &gt;
              </em>

              <em v-else> &lt; Unknown &gt; </em>
            </span>
          </div>
        </div>

        <div
          v-if="serviceStore.serviceData.serviceItems.length == 0"
          style="text-align: center"
        >
          <em> This service has no items </em>
        </div>

        <div
          @dragover="
            dragOver($event, serviceStore.serviceData.serviceItems.length)
          "
          @drop="drop($event, serviceStore.serviceData.serviceItems.length)"
          style="flex: 1"
        >
          &nbsp;
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
