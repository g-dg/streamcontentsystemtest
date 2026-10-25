<script lang="ts" setup>
import { ref } from "vue";

import ModalDialog from "../utility/ModalDialog.vue";
import { useServiceStore } from "@/stores/service.ts";
import { ShowClient } from "@/api/shows.ts";
import { natcasecmp } from "@/helpers/sort.ts";

const props = defineProps({
  allowSave: {
    type: Boolean,
    default: true,
  }
});

const serviceStore = useServiceStore();

function removeFilenameExtension(filename: string): string {
  return filename.split(".").slice(0, -1).join(".");
}

const isSelectingForSaving = ref(false);

function openLoadModal() {
  loadAvailaleShows();
  isSelectingForSaving.value = false;
  modalOpen.value = true;
}

function openSaveModal() {
  if (!props.allowSave) return;
  loadAvailaleShows();
  isSelectingForSaving.value = true;
  newName.value = generateName();
  modalOpen.value = true;
}

const loadingShows = ref(false);
const availableShows = ref<Array<string>>([]);

async function loadAvailaleShows() {
  try {
    loadingShows.value = true;
    availableShows.value = [];
    const shows = await ShowClient.listShows();
    availableShows.value = shows
      .map(removeFilenameExtension)
      .sort((a, b) => natcasecmp([a, b]));
  } catch (e) {
    console.error(e);
    alert("Error loading show list");
  } finally {
    loadingShows.value = false;
  }
}

function generateName(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${now.getHours() < 12 ? "AM" : "PM"}`
}

const newName = ref(generateName());

async function loadShow(showName: string) {
  if (serviceStore.unsavedChanges) {
    if (!confirm("There are unsaved changes. Are you sure you want to load a show?"))
      return;
  }

  try {
    const showJson = await ShowClient.getShow(`${showName}.json`);

    serviceStore.importService(showJson);

    modalOpen.value = false;
  } catch (e) {
    console.error(e);
    alert("Error loading show");
  }
}

async function saveShow(showName: string) {
  if (availableShows.value.includes(showName)) {
    if (!confirm("Are you sure you want to overwrite this show?"))
      return;
  }

  try {
    const showJson = serviceStore.exportService();

    await ShowClient.setShow(`${showName}.json`, showJson);

    modalOpen.value = false;
  } catch (e) {
    console.error(e);
    alert("Error saving show");
  }
}

async function deleteShow(showName: string) {
  if (confirm(`Are you sure you want to delete "${showName}"?`)) {
    try {
      await ShowClient.deleteShow(`${showName}.json`);
    } catch (e) {
      console.error(e);
      alert("Error deleting show");
    }
  }
}

function cancel() {
  modalOpen.value = false;
}

const modalOpen = ref(false);
</script>

<template>
  <span>
    <button @click="openLoadModal">
      Load
    </button>
    <button v-if="allowSave" @click="openSaveModal">
      Save
    </button>
    {{ serviceStore.serviceName }}
    <ModalDialog v-model="modalOpen">
      <div style="height: 66.667vh; width: 66.667vw;">
        <div style="height: 100%; width: 100%; display: flex; flex-direction: column;">
          <div>
            <h1>{{ isSelectingForSaving ? "Save Show" : "Load Show" }}</h1>
          </div>
          <div v-if="isSelectingForSaving" style="margin-bottom: 1lh;">
            <input v-model="newName" type="text" placeholder="New name" style="flex: 1" />
            <button @click="saveShow(newName)">Save</button>
          </div>
          <div style="flex: 1; overflow: auto;">
            <div v-if="loadingShows"
              style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
              <div>Loading...</div>
            </div>
            <div v-else>
              <div v-for="show in availableShows" :key="show">
                <button v-if="!isSelectingForSaving" @click="loadShow(show)">
                  Load
                </button>
                <button v-if="isSelectingForSaving" @click="saveShow(show)">
                  Save
                </button>
                <button v-if="isSelectingForSaving" @click="deleteShow(show)">
                  Delete
                </button>
                {{ show }}
              </div>
            </div>
          </div>
          <div style="flex: 0; padding-top: 1lh; display:flex;">
            <div style="flex: 1"></div>
            <button @click="cancel">Cancel</button>
          </div>
        </div>
      </div>
    </ModalDialog>
  </span>
</template>

<style lang="scss" scoped></style>
