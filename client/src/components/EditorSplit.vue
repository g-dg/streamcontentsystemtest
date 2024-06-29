<script setup lang="ts">
import { TextClient } from "@/api/text";
import clone from "@/helpers/clone";
import { natcasecmp } from "@/helpers/sort";
import { computed, onMounted, ref } from "vue";
import EditorList from "./EditorList.vue";

const oldTextContent = ref<Record<string, string>>({});
const textKeys = computed(() =>
  Object.keys(newTextContent.value).sort((a, b) => natcasecmp([a, b]))
);

const newTextContent = ref<Record<string, string>>({});

async function loadAll() {
  try {
    const content = await TextClient.listText();
    oldTextContent.value = clone(content);
    newTextContent.value = clone(content);
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
    JSON.stringify(newTextContent.value) != JSON.stringify(oldTextContent.value)
);
async function save() {
  for (let key of Object.keys(newTextContent.value)) {
    if (newTextContent.value[key] != oldTextContent.value[key]) {
      try {
        await TextClient.setText(key, newTextContent.value[key]);
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

let importFileInput: HTMLInputElement;
async function importText() {
  try {
    importFileInput = document.createElement("input");
    importFileInput.setAttribute("type", "file");
    importFileInput.addEventListener("change", processImport);
    importFileInput.click();
  } catch (e) {
    console.error(e);
    alert("An error occurred preparing for file import.");
  }
}
async function processImport() {
  try {
    const rawFileContent = (await importFileInput.files?.[0].text()) ?? "{}";

    const fileContent = JSON.parse(rawFileContent);

    if (typeof fileContent != "object" || fileContent == null) {
      return;
    }

    for (let key of Object.keys(newTextContent.value)) {
      if (typeof fileContent[key] == "string") {
        newTextContent.value[key] = fileContent[key];
      }
    }
  } catch (e) {
    console.error(e);
    alert("An error occurred importing the file. (Is it a valid format?)");
  }
}

async function exportText() {
  try {
    const content = Object.entries(newTextContent.value)
      .sort((a, b) => natcasecmp([a[0], b[0]]))
      .reduce((acc, val) => {
        acc[val[0]] = val[1];
        return acc;
      }, {} as Record<string, string>);

    const objectURL = URL.createObjectURL(
      new Blob([JSON.stringify(content)], {
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
    window.setTimeout(() => URL.revokeObjectURL(objectURL), 60 * 60 * 1000);
  } catch (e) {
    console.error(e);
    alert("An error occurred exporting the file.");
  }
}
</script>

<template>
  <form @submit.prevent class="root">
    <div style="position: sticky; top: 0px; text-align: right">
      <span style="display: inline-block; padding: 1em">
        <span v-if="unsaved" class="large-font"
          ><em><strong> Unsaved Changes! </strong></em></span
        >
        <button @click="save" class="large-font">Save</button>
        <button @click="loadAll" class="large-font">Reload</button>
        <button @click="importText" class="large-font">Import</button>
        <button @click="exportText" class="large-font">Export</button>
      </span>
    </div>

    <div style="display: flex">
      <div
        style="
          flex: 1;
          height: calc(100vh - var(--header-footer-size));
          overflow: auto;
          border: 1px solid black;
        "
      >
        <EditorList v-model="newTextContent" :text-keys="textKeys" />
      </div>
      <div
        style="
          flex: 1;
          height: calc(100vh - var(--header-footer-size));
          overflow: auto;
          border: 1px solid black;
        "
      >
        <EditorList v-model="newTextContent" :text-keys="textKeys" />
      </div>
    </div>
  </form>
</template>

<style lang="scss" scoped>
.root {
  --large-font-size: 150%;
  --header-footer-size: 10em;
}

.large-font {
  font-size: var(--large-font-size);
}
</style>
