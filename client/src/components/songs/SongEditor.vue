<script lang="ts" setup>
import { natcasecmp } from "@/helpers/sort";
import { useSongStore } from "@/stores/song";
import { onMounted, ref, watch } from "vue";

const props = defineProps<{ songTitle?: string }>();

const emit = defineEmits<{
  (e: "close"): void;
}>();

const songStore = useSongStore();

const editedTitle = ref("");
const editedVerses = ref<Array<{ name: string; content: string }>>([]);

function loadSongFromStore() {
  const song =
    props.songTitle != undefined ? songStore.songs[props.songTitle] : undefined;
  if (song != undefined) {
    editedTitle.value = props.songTitle ?? "";
    const versesSorted = Object.keys(song).sort((a, b) => natcasecmp([a, b]));
    editedVerses.value = versesSorted.map((x) => ({
      name: x,
      content: song[x],
    }));
  } else {
    editedTitle.value = "";
    editedVerses.value = [{ name: "1", content: "" }];
  }
}

onMounted(loadSongFromStore);
watch(() => props.songTitle, loadSongFromStore);

function newVerse() {
  editedVerses.value.push({
    name: String(editedVerses.value.length + 1),
    content: "",
  });
}

function deleteVerse(index: number) {
  editedVerses.value.splice(index, 1);
}

async function saveSong() {
  if (props.songTitle != undefined) {
    delete songStore.songs[props.songTitle];
  }

  songStore.songs[editedTitle.value] = Object.fromEntries(
    editedVerses.value.map((x) => [x.name, x.content])
  );

  await songStore.saveSongs();
  emit("close");
  await songStore.loadSongs();
}

async function deleteSong() {
  if (!confirm("Really delete this song?")) return;

  if (props.songTitle != undefined) {
    delete songStore.songs[props.songTitle];

    await songStore.saveSongs();
  }
  emit("close");
  await songStore.loadSongs();
}

function cancel() {
  emit("close");
  loadSongFromStore();
}
</script>

<template>
  <div style="height: 100%; display: flex; flex-direction: column">
    <input
      v-model="editedTitle"
      type="text"
      placeholder="Song Name"
      style="flex: 0; width: 100%"
    />
    <div style="flex: 1; overflow: auto">
      <div v-for="(verse, index) in editedVerses" :key="verse.name">
        <hr />
        <div style="display: flex">
          <input
            v-model="verse.name"
            type="text"
            placeholder="Verse Name"
            style="flex: 1"
          />
          <button @click="deleteVerse(index)" style="flex: 0">Delete</button>
        </div>
        <textarea
          v-model="verse.content"
          :rows="verse.content.split('\n').length + 1"
          placeholder="Verse Content"
          style="width: 100%"
        ></textarea>
      </div>
      <button @click="newVerse">New Verse</button>
    </div>

    <div style="flex: 0; padding-top: 1lh; text-align: right">
      <button @click="saveSong">Save</button>
      <button v-if="songTitle != undefined" @click="deleteSong">Delete</button>
      <button @click="cancel">Cancel</button>
    </div>
  </div>
</template>

<style lang="scss" scoped></style>
