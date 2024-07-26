<script setup lang="ts">
import { useServiceStore } from "@/stores/service";
import { useSongStore } from "@/stores/song";
import { computed, ref, watch, type Ref } from "vue";

const emit = defineEmits<{ (e: "setContent", content: string): void }>();

const songStore = useSongStore();
const serviceStore = useServiceStore();

function selectContent(verse: string) {
  serviceStore.selectedVerseName = verse;

  if (serviceStore.selectedVerseContent != null) {
    emit("setContent", serviceStore.selectedVerseContent);
  }
}

function blankScreen() {
  emit("setContent", "");
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
  <form
    @submit.prevent
    class="root"
    style="height: 100%; display: flex; flex-direction: column"
  >
    <div style="flex: 0; position: sticky; top: 0px">
      <span style="display: inline-block">
        <button @click="blankScreen">Blank Screen</button>
      </span>
    </div>
    <div style="flex: 1 1 auto; height: 2lh">
      <div style="height: 100%; overflow: auto">
        <div ref="topScrollElement"></div>
        <div
          v-for="(verseContent, verseName) in serviceStore.selectedSong"
          :key="verseName"
          @click="selectContent(verseName)"
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
          <strong style="font-size: 125%; font-weight: bold">{{
            verseName
          }}</strong>
          <pre>{{ verseContent }}</pre>
          <hr />
        </div>
        <div
          v-if="serviceStore.selectedSong == null"
          style="text-align: center"
        >
          <em> No song is selected </em>
        </div>
        <div
          v-else-if="Object.keys(serviceStore.selectedSong).length == 0"
          style="text-align: center"
        >
          <em> This service item has no content </em>
        </div>
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
