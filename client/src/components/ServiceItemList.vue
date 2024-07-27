<script setup lang="ts">
import { useServiceStore } from "@/stores/service";
import { useSongStore } from "@/stores/song";

const songStore = useSongStore();
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
  }
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
      <div style="height: 100%; overflow: auto">
        <div ref="topScrollElement"></div>
        <div
          v-for="(item, index) in serviceStore.serviceData.serviceItems"
          :key="item.id"
          @click="selectIndex(index)"
          :class="{ 'selected-item': serviceStore.selectedItemIndex == index }"
        >
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
          <input
            v-model="serviceStore.selectedItemIndex"
            :value="index"
            type="radio"
          />
          <template v-if="item.comment">
            {{ item.comment }}
          </template>
          <template v-else-if="item.type == 'song'">
            {{
              (item.comment ?? "") != ""
                ? item.comment
                : (item.text ?? "") != ""
                ? item.text
                : item.song?.title
            }}
          </template>
          <em v-else-if="item.type == 'empty'"> &lt; Empty &gt; </em>
          <em v-else-if="item.type == 'mainText'"> &lt; Main Text &gt; </em>
          <em v-else-if="item.type == 'subText'"> &lt; Sub Text &gt; </em>
          <em v-else-if="item.type == 'smallText'"> &lt; Small Text &gt; </em>
          <em v-else> &lt; Unknown &gt; </em>
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
