<script setup lang="ts">

import {
  useServiceStore,
  type ServiceItem,
  type ServiceItemDragDropData,
} from "@/stores/service";
import { useInstanceIdStore } from "@/stores/instanceId";
import { useDisplayStateStore } from "@/stores/state";

const props = defineProps<{
  readonly?: boolean;
  mobileController?: boolean;
}>();

const serviceStore = useServiceStore();
const displayStateStore = useDisplayStateStore();
const instanceIdStore = useInstanceIdStore();

async function loadService() {
  if (
    !serviceStore.unsavedChanges ||
    confirm("There are unsaved changes. Really load service?")
  ) {
    await serviceStore.importService();
  }
}

async function saveService() {
  await serviceStore.exportService();
}

function newItemDragStart(evt: DragEvent, newItem: ServiceItem) {
  if (evt.dataTransfer == null) return;

  const data: ServiceItemDragDropData = {
    appInstanceId: instanceIdStore.appInstanceId,
    componentInstanceId: null,
    srcIndex: null,
    serviceItem: newItem,
  };

  evt.dataTransfer.setData("application/json", JSON.stringify(data));
  evt.dataTransfer.dropEffect = "move";
}

const appFullName = __APP_NAME_FULL__;
const appVersion = __APP_VERSION__;
</script>

<template>
  <div style="height: 100%; width: 100%; display: flex;">
    <RouterLink :to="{ name: 'about' }" target="_blank">
      {{ appFullName }} {{ appVersion }}
    </RouterLink>
    &nbsp;

    <button @click="loadService()">Load</button>
    <button @click="saveService()">Save</button>

    &nbsp;

    <button @click="serviceStore.goToPreviousSubItem">Back</button>
    <button @click="serviceStore.goToNextSubItem">Next</button>

    &nbsp;

    <button @click="serviceStore.addItem(serviceStore.emptyItem(), true)" draggable="true"
      @dragstart="newItemDragStart($event, serviceStore.emptyItem())">
      Empty
    </button>

    <button @click="serviceStore.addItem(serviceStore.blankItem(), true)" draggable="true"
      @dragstart="newItemDragStart($event, serviceStore.blankItem())">
      Blank
    </button>

    <button @click="
      serviceStore.addItem(serviceStore.textItem('mainText', ''), true)
      " draggable="true" @dragstart="
        newItemDragStart($event, serviceStore.textItem('mainText', ''))
        ">
      Main Text
    </button>

    <button @click="
      serviceStore.addItem(serviceStore.textItem('subText', ''), true)
      " draggable="true" @dragstart="
        newItemDragStart($event, serviceStore.textItem('subText', ''))
        ">
      Sub Text
    </button>

    <button @click="
      serviceStore.addItem(serviceStore.textItem('smallText', ''), true)
      " draggable="true" @dragstart="
        newItemDragStart($event, serviceStore.textItem('smallText', ''))
        ">
      Small Text
    </button>

    <button @click="
      serviceStore.addItem(serviceStore.textItem('optionalText', ''), true)
      " draggable="true" @dragstart="
        newItemDragStart($event, serviceStore.textItem('optionalText', ''))
        ">
      Optional Text
    </button>

    <div style="flex: 1"></div>

    <span :style="{
      visibility: serviceStore.unsavedChanges ? 'visible' : 'hidden',
    }">
      <em><strong> Unsaved Changes! </strong></em>
    </span>

    &nbsp;

    <span v-if="displayStateStore.connected">
      Connected
    </span>
    <strong v-else style="color: red;">
      <em>
        *** DISCONNECTED! ***
      </em>
    </strong>

  </div>
</template>

<style lang="scss" scoped></style>
