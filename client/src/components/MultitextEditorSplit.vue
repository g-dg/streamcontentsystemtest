<script setup lang="ts">
import { TextClient } from "@/api/text";
import clone from "@/helpers/clone";
import { natcasecmp } from "@/helpers/sort";
import { computed, onMounted, ref } from "vue";
import MultitextEditorList from "./MultitextEditorList.vue";
import { useServiceStore } from "@/stores/service";

const serviceStore = useServiceStore();

const oldTextContent = ref<Record<string, string>>({});
const textKeys = computed(() =>
  Object.keys(serviceStore.serviceData.textContent ?? {}).sort((a, b) =>
    natcasecmp([a, b])
  )
);

async function loadAll() {
  try {
    const content = Object.fromEntries(
      Object.entries(await TextClient.listText()).sort((a, b) =>
        natcasecmp([a[0], b[0]])
      )
    );
    oldTextContent.value = clone(content);
    serviceStore.serviceData.textContent = clone(content);
  } catch (e) {
    console.error(e);
    alert(
      "An error occurred loading all text content. (Is the server running?)"
    );
  }
}
onMounted(loadAll);

const unsaved = computed(
  () =>
    JSON.stringify(serviceStore.serviceData.textContent) !=
    JSON.stringify(oldTextContent.value)
);
async function save() {
  for (let key of Object.keys(serviceStore.serviceData.textContent)) {
    if (
      serviceStore.serviceData.textContent[key] != oldTextContent.value[key]
    ) {
      try {
        await TextClient.setText(
          key,
          serviceStore.serviceData.textContent[key]
        );
      } catch (e) {
        console.error(e);
        alert(
          `An error occurred saving text content for file "${key}". (Is the server running?)`
        );
      }
    }
  }
  await loadAll();
}
</script>

<template>
  <form @submit.prevent class="root">
    <div style="position: sticky; top: 0px">
      <span style="display: inline-block">
        <button @click="save">Set Content</button>
        <button @click="loadAll">Reload Content</button>
        <span v-if="unsaved">
          <em><strong> Unsaved Changes! </strong></em>
        </span>
      </span>
    </div>

    <div style="display: flex">
      <div
        style="
          flex: 1;
          height: calc(50vh - (var(--header-footer-size) / 2));
          overflow: auto;
        "
      >
        <MultitextEditorList
          v-model="serviceStore.serviceData.textContent"
          :text-keys="textKeys"
        />
      </div>
      <div
        style="
          flex: 1;
          height: calc(50vh - (var(--header-footer-size) / 2));
          overflow: auto;
        "
      >
        <MultitextEditorList
          v-model="serviceStore.serviceData.textContent"
          :text-keys="textKeys"
        />
      </div>
    </div>
  </form>
</template>

<style lang="scss" scoped></style>
