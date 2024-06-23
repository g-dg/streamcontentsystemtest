<script setup lang="ts">
import { TextClient } from "@/api/text";
import clone from "@/helpers/clone";
import { natcasecmp } from "@/helpers/sort";
import { computed, onMounted, ref, watch } from "vue";
import EditorList from "./EditorList.vue";

const oldTextContent = ref<Record<string, string>>({});
const textKeys = computed(() =>
  Object.keys(newTextContent.value).sort((a, b) => natcasecmp([a, b]))
);

const newTextContent = ref<Record<string, string>>({});

async function loadAll() {
  const content = await TextClient.listText();
  oldTextContent.value = clone(content);
  newTextContent.value = clone(content);
}
onMounted(loadAll);

const lineCounts = computed(() =>
  Object.fromEntries(
    textKeys.value.map((key) => [
      key,
      newTextContent.value[key].split("\n").length,
    ])
  )
);

const charCounts = computed(() =>
  Object.fromEntries(
    textKeys.value.map((key) => [key, newTextContent.value[key].length])
  )
);

async function clear() {
  for (let key of Object.keys(newTextContent.value)) {
    newTextContent.value[key] = "";
  }
}

const unsaved = computed(
  () =>
    JSON.stringify(newTextContent.value) != JSON.stringify(oldTextContent.value)
);
async function save() {
  for (let key of Object.keys(newTextContent.value)) {
    if (newTextContent.value[key] != oldTextContent.value[key]) {
      await TextClient.setText(key, newTextContent.value[key]);
    }
  }
  await loadAll();
}

let importFileInput: HTMLInputElement;
async function importText() {
  importFileInput = document.createElement("input");
  importFileInput.setAttribute("type", "file");
  importFileInput.addEventListener("change", processImport);
  importFileInput.click();
}
async function processImport() {
  const rawFileContent = (await importFileInput.files?.[0].text()) ?? "{}";
  try {
    const fileContent = JSON.parse(rawFileContent);

    if (typeof fileContent != "object" || fileContent == null) {
      return;
    }

    for (let key of Object.keys(newTextContent.value)) {
      if (typeof fileContent[key] == "string") {
        newTextContent.value[key] = fileContent[key];
      }
    }
    await save();
  } catch {}
}

async function exportText() {
  const objectURL = URL.createObjectURL(
    new Blob([JSON.stringify(newTextContent.value)], {
      type: "application/json",
    })
  );
  const fileLink = document.createElement("a");
  fileLink.setAttribute("href", objectURL);
  const now = new Date();
  fileLink.setAttribute(
    "download",
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(now.getDate()).padStart(2, "0")} ${
      now.getHours() < 12 ? "AM" : "PM"
    }.json`
  );
  fileLink.click();
  window.setTimeout(() => URL.revokeObjectURL(objectURL), 3600000);
}
</script>

<template>
  <form @submit.prevent class="root">
    <div style="position: sticky; top: 0px; text-align: right">
      <span style="display: inline-block; padding: 1em">
        <span v-if="unsaved" class="large-font"><em>Unsaved Changes!</em></span>
        <button @click="save" class="large-font">Save</button>
        <button @click="loadAll" class="large-font">Reload</button>
        <button @click="clear" class="large-font">Clear</button>
        <button @click="importText" class="large-font">Import</button>
        <button @click="exportText" class="large-font">Export</button>
      </span>
    </div>

    <div style="display: flex">
      <div style="flex: 1; height: calc(100vh - 10em); overflow: auto; border: 1px solid black">
        <EditorList
          v-model="newTextContent"
          :text-keys="textKeys"
          :line-counts="lineCounts"
          :char-counts="charCounts"
        />
      </div>
      <div style="flex: 1; height: calc(100vh - 10em); overflow: auto; border: 1px solid black">
        <EditorList
          v-model="newTextContent"
          :text-keys="textKeys"
          :line-counts="lineCounts"
          :char-counts="charCounts"
        />
      </div>
    </div>
  </form>
</template>

<style lang="scss" scoped>
.root {
  --large-font-size: 150%;
}

.large-font {
  font-size: var(--large-font-size);
}
</style>
