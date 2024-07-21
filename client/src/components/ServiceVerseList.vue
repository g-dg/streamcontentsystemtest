<script setup lang="ts">
import { useServiceStore } from "@/stores/service";
import { useSongStore } from "@/stores/song";

const emit = defineEmits<{ (e: "setVerse", content: string): void }>();

const songStore = useSongStore();
const serviceStore = useServiceStore();

function selectVerse(verse: string) {
  serviceStore.selectedVerseName = verse;

  if (serviceStore.selectedVerseContent != null) {
    emit("setVerse", serviceStore.selectedVerseContent);
  }
}

function blank() {
  emit("setVerse", "");
}
</script>

<template>
  <form @submit.prevent class="root">
    <div style="position: sticky; top: 0px">
      <span style="display: inline-block">
        <button @click="blank">Blank</button>
      </span>
    </div>
    <div
      style="height: calc(100vh - var(--header-footer-size)); overflow: auto"
    >
      <div
        v-for="(verseContent, verseName) in serviceStore.selectedSong"
        :key="verseName"
        @click="selectVerse(verseName)"
        :class="{
          'selected-song': serviceStore.selectedVerseName == verseName,
        }"
        style="margin: 1em 0"
      >
        <input
          v-model="serviceStore.selectedVerseName"
          :value="verseName"
          type="radio"
        />
        {{ verseName }}
        <pre>{{ verseContent }}</pre>
        <hr />
      </div>
      <div v-if="serviceStore.selectedSong == null">
        <em> No song is selected </em>
      </div>
      <div
        v-else-if="Object.keys(serviceStore.selectedSong).length == 0"
        style="text-align: center"
      >
        <em> This song has no verses </em>
      </div>
    </div>
  </form>
</template>

<style lang="scss" scoped>
.root {
  --header-footer-size: 7.5em;
}

.selected-song {
  background-color: black;
  color: white;
}
</style>
