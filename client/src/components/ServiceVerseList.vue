<script setup lang="ts">
import { useServiceStore } from "@/stores/service";
import { useSongStore } from "@/stores/song";
import { computed, ref, watch, type Ref } from "vue";

const emit = defineEmits<{ (e: "setVerse", content: string): void }>();

const songStore = useSongStore();
const serviceStore = useServiceStore();

function selectVerse(verse: string) {
  serviceStore.selectedVerseName = verse;

  if (serviceStore.selectedVerseContent != null) {
    emit("setVerse", serviceStore.selectedVerseContent);
  }
}

function blankScreen() {
  emit("setVerse", "");
}

const topScrollElement: Ref<HTMLDivElement | undefined> = ref();
function scrollToTop() {
  topScrollElement.value?.scrollIntoView();
}
watch(
  computed(() => ({
    song: serviceStore.selectedSong,
    index: serviceStore.selectedSongIndex,
  })),
  scrollToTop,
  { deep: true }
);
</script>

<template>
  <form @submit.prevent class="root">
    <div style="position: sticky; top: 0px">
      <span style="display: inline-block">
        <button @click="blankScreen">Blank Screen</button>
      </span>
    </div>
    <div
      style="
        height: calc(50vh - (var(--main-header-footer-size) / 2));
        overflow: auto;
      "
    >
      <div ref="topScrollElement"></div>
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
        <strong style="font-size: 125%; font-weight: bold">{{ verseName }}</strong>
        <pre>{{ verseContent }}</pre>
        <hr />
      </div>
      <div v-if="serviceStore.selectedSong == null" style="text-align: center">
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
.selected-song {
  background-color: black;
  color: white;
}
</style>
