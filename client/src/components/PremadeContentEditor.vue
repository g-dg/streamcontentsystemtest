<script lang="ts" setup>
import { natcasecmp } from "@/helpers/sort";
import { usePremadeContentStore } from "@/stores/premadeContent";
import type { PlaceholderValue } from "@/stores/service";
import { onMounted, ref, watch } from "vue";
import PlaceholderList from "./PlaceholderList.vue";

const props = defineProps<{ itemTitle?: string }>();

const emit = defineEmits<{
  (e: "close"): void;
}>();

const songStore = usePremadeContentStore();

const editedTitle = ref("");
const editedVerses = ref<Array<{ name: string; content: Array<PlaceholderValue> }>>([]);
const editedAttribution = ref("");

function loadSongFromStore() {
  const song =
    props.itemTitle != undefined ? songStore.premadeContent.items?.[props.itemTitle] : undefined;
  if (song != undefined) {
    editedTitle.value = props.itemTitle ?? "";
    editedAttribution.value = song.attribution ?? "";
    const versesSorted = Object.keys(song.verses).sort((a, b) =>
      natcasecmp([a, b])
    );
    editedVerses.value = versesSorted.map((x) => ({
      name: x,
      content: song.verses[x],
    }));
  } else {
    editedTitle.value = "";
    editedVerses.value = [{ name: "1", content: "" }];
    editedAttribution.value = "";
  }
}

onMounted(loadSongFromStore);
watch(() => props.itemTitle, loadSongFromStore);

function newVerse() {
  editedVerses.value.push({
    name: String(editedVerses.value.length + 1),
    content: [],
  });
}

function deleteVerse(index: number) {
  editedVerses.value.splice(index, 1);
}

async function saveSong() {
  if (props.itemTitle != undefined && songStore.premadeContent.items != undefined) {
    delete songStore.premadeContent.items?.[props.itemTitle];
  }

  songStore.premadeContent.items[editedTitle.value] = {
    verses: Object.fromEntries(
      editedVerses.value.map((x) => [x.name, x.content])
    ),
    attribution:
      (editedAttribution.value ?? "") == ""
        ? undefined
        : editedAttribution.value,
  };

  await songStore.savePremadeContent();
  emit("close");
  await songStore.loadPremadeContent();
}

async function deleteSong() {
  if (!confirm("Really delete this song?")) return;

  if (props.itemTitle != undefined) {
    delete songStore.premadeContent[props.itemTitle];

    await songStore.savePremadeContent();
  }
  emit("close");
  await songStore.loadPremadeContent();
}

function cancel() {
  emit("close");
  loadSongFromStore();
}
</script>

<template>
  <div style="height: 100%; display: flex; flex-direction: column">
    <input v-model="editedTitle" type="text" placeholder="Song Name" style="flex: 0; width: 100%" />

    <div style="flex: 1; overflow: auto">
      <div v-for="(verse, index) in editedVerses" :key="verse.name">
        <hr />
        <div style="display: flex">
          <input v-model="verse.name" type="text" placeholder="Verse Name" style="flex: 1" />
          <button @click="deleteVerse(index)" style="flex: 0">Delete</button>
        </div>
        <PlaceholderList v-model="verse.content" />
      </div>
      <button @click="newVerse">New Verse</button>
    </div>

    <div style="flex: 0; padding-top: 1lh; text-align: right">
      <input v-model="editedAttribution" type="text" placeholder="Attribution" style="flex: 0; width: 100%" />
      <div>
        <button @click="saveSong">Save</button>
        <button v-if="itemTitle != undefined" @click="deleteSong">
          Delete
        </button>
        <button @click="cancel">Cancel</button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped></style>
