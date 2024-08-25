<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";

import { natcasecmp } from "@/helpers/sort";
import { useServiceStore } from "@/stores/service";
import { useSongStore } from "@/stores/song";
import { useConfigStore } from "@/stores/config";

const songStore = useSongStore();
const serviceStore = useServiceStore();

const songVerses = computed(() =>
  serviceStore.selectedItem?.type == "song" &&
  serviceStore.selectedItem?.song?.title != null
    ? songStore.songs[serviceStore.selectedItem.song.title]
    : null
);
const songVerseNumbersSorted = computed(() =>
  Object.keys(songVerses.value ?? {}).sort((a, b) => natcasecmp([a, b]))
);

const topScrollElement = ref<HTMLDivElement>();
function scrollToTop() {
  topScrollElement.value?.scrollIntoView();
}
watch(
  computed(() => serviceStore.selectedItem?.id),
  scrollToTop,
  { deep: true }
);

const textTextAreaElement = ref<HTMLTextAreaElement | null>(null);
const textCopyButtonElement = ref<HTMLButtonElement | null>(null);

const textCharCount = computed(
  () =>
    serviceStore.serviceData.serviceItems[serviceStore.selectedItemIndex ?? -1]
      ?.text?.length ?? 0
);
const textLineCount = computed(
  () =>
    serviceStore.serviceData.serviceItems[
      serviceStore.selectedItemIndex ?? -1
    ]?.text?.split("\n").length ?? 1
);
const textLongestLine = computed(() =>
  serviceStore.serviceData.serviceItems[
    serviceStore.selectedItemIndex ?? -1
  ]?.text
    ?.split("\n")
    .reduce((acc, line) => Math.max(acc, line.length), 0)
);

const copySupported = computed(() => typeof document.execCommand == "function");
function copyText() {
  textTextAreaElement.value?.focus();
  textTextAreaElement.value?.setSelectionRange(0, textCharCount.value);
  document.execCommand("copy");
  textTextAreaElement.value?.setSelectionRange(
    textCharCount.value,
    textCharCount.value
  );
  textCopyButtonElement.value?.focus();
}

function clearText() {
  if (serviceStore.selectedItemIndex != undefined)
    serviceStore.serviceData.serviceItems[serviceStore.selectedItemIndex].text =
      "";
}

function verseIsEnabled(verse: string): boolean {
  const enabledSongVerses = serviceStore.selectedItem?.song?.verses ?? [];
  return enabledSongVerses.length == 0 || enabledSongVerses.includes(verse);
}

function selectAll() {
  if (serviceStore.selectedItem?.song?.verses != undefined) {
    serviceStore.selectedItem.song.verses = [];
  }
}

const displayBlanked = ref(false);
async function setupKeypressHandler() {
  const configStore = useConfigStore();
  await configStore.loadConfig();
  if (configStore.config.enable_keyboard_shortcuts ?? true) {
    document.addEventListener("keydown", keypressHandler);
  }
}
function removeKeypressHandler() {
  document.removeEventListener("keydown", keypressHandler);
}
function keypressHandler(evt: KeyboardEvent) {
  if (evt.target == document.body) {
    if (!evt.shiftKey && !evt.ctrlKey && !evt.altKey && !evt.metaKey) {
      switch (evt.key) {
        case "ArrowRight":
        case "ArrowDown":
        case " ":
        case "Enter":
        case "PageDown":
          serviceStore.goToNextSubItem();
          break;
        case "ArrowLeft":
        case "ArrowUp":
        case "Backspace":
        case "PageUp":
          serviceStore.goToPreviousSubItem();
          break;
        case "Home":
          serviceStore.goToFirstSubItem();
          break;
        case "End":
          serviceStore.goToLastSubItem();
          break;
        case ".":
        case "b":
          if (!displayBlanked.value || serviceStore.selectedItem == null) {
            serviceStore.showBlackScreen();
            displayBlanked.value = true;
          } else {
            serviceStore.showCurrentItem();
            displayBlanked.value = false;
          }
          break;
        case ",":
        case "w":
          if (!displayBlanked.value || serviceStore.selectedItem == null) {
            serviceStore.showEmptyScreen();
            displayBlanked.value = true;
          } else {
            serviceStore.showCurrentItem();
            displayBlanked.value = false;
          }
          break;
      }
    }
  }
}
onMounted(() => setupKeypressHandler());
onUnmounted(() => removeKeypressHandler());
</script>

<template>
  <form
    @submit.prevent
    class="root"
    style="height: 100%; display: flex; flex-direction: column"
  >
    <div style="flex: 0">
      <span style="display: inline-block">
        <button @click="serviceStore.goToPreviousSubItem">Back</button>
        <button @click="serviceStore.goToNextSubItem">Next</button>

        &nbsp;

        <button @click="serviceStore.showEmptyScreen">Empty Screen</button>
        <button @click="serviceStore.showBlackScreen">Black Screen</button>

        &nbsp;

        <button @click="selectAll">Clear Selection</button>

        <span style="margin-inline-start: 0.5em">
          <template v-if="serviceStore.selectedItemType == 'song'">
            {{ serviceStore.selectedItem?.song?.title }}
          </template>
          <em v-if="serviceStore.selectedItemType == 'empty'"> Empty </em>
          <em v-if="serviceStore.selectedItemType == 'mainText'">
            Main Text
          </em>
          <em v-if="serviceStore.selectedItemType == 'subText'"> Sub Text </em>
          <em v-if="serviceStore.selectedItemType == 'smallText'">
            Small Text
          </em>
        </span>
      </span>

      <hr />
    </div>

    <div style="flex: 1 1 auto; height: 4lh">
      <div style="height: 100%; overflow: auto">
        <div ref="topScrollElement"></div>

        <div
          v-if="songVerses != null"
          v-for="verseName in songVerseNumbersSorted"
          :key="verseName"
        >
          <label :for="'song_verse_enable_' + verseName">
            <input
              v-if="serviceStore.selectedItem?.song != undefined"
              v-model="serviceStore.selectedItem.song.verses"
              :value="verseName"
              type="checkbox"
              :id="'song_verse_enable_' + verseName"
              style="margin: 0 0.5em 0 1em"
            />
            <strong
              style="font-size: 125%; font-weight: bold; padding-right: 1em"
            >
              {{ verseName }}
            </strong>
          </label>
          <pre
            @click="serviceStore.selectAndShowItem(verseName)"
            :class="{
              'service-item': true,
              'selected-service-item':
                serviceStore.selectedSubItemId === verseName,
              'service-item-disabled': !verseIsEnabled(verseName),
            }"
            >{{ songVerses[verseName] }}</pre
          >
          <hr style="margin-bottom: 1em" />
        </div>

        <div
          v-if="(['mainText', 'subText', 'smallText'] as Array<string|undefined>).includes(serviceStore.selectedItemType)"
        >
          <strong
            style="font-size: 125%; font-weight: bold; padding-left: 0.5em"
          >
            Text
          </strong>
          <pre
            @click="serviceStore.selectAndShowItem('0')"
            :class="{
              'service-item': true,
              'selected-service-item': serviceStore.selectedSubItemId === '0',
            }"
            >{{
              serviceStore.serviceData.serviceItems[
                serviceStore.selectedItemIndex ?? -1
              ]?.text
            }}</pre
          >
          <hr />
        </div>

        <div v-if="serviceStore.selectedItemType == 'empty'">
          <strong
            style="font-size: 125%; font-weight: bold; padding-left: 0.5em"
          >
            Empty
          </strong>
          <pre
            @click="serviceStore.selectAndShowItem('0')"
            :class="{
              'service-item': true,
              'selected-service-item': serviceStore.selectedSubItemId === '0',
            }"
          >
            <div style="text-align: center"><em> &lt; Empty &gt; </em></div>
          </pre>
          <hr />
        </div>

        <div
          v-if="serviceStore.selectedItem == null"
          style="text-align: center"
        >
          <em> No item is selected </em>
        </div>
      </div>
    </div>

    <div style="flex: 0">
      <hr />

      <span
        v-if="
          serviceStore.selectedItemIndex != null &&
          serviceStore.serviceData.serviceItems[
            serviceStore.selectedItemIndex
          ] != null
        "
        style="display: inline-block"
      >
        Name:
        <input
          v-model="
            serviceStore.serviceData.serviceItems[
              serviceStore.selectedItemIndex
            ].comment
          "
          type="text"
        />
      </span>

      <div>
        <template
          v-if="
            serviceStore.selectedItemType == 'song' &&
            serviceStore.selectedItemIndex != null &&
            serviceStore.serviceData.serviceItems[
              serviceStore.selectedItemIndex
            ] != null
          "
        >
          <input
            v-model="
              serviceStore.serviceData.serviceItems[
                serviceStore.selectedItemIndex
              ].text
            "
            type="text"
            placeholder="Song Verses"
            style="width: 100%"
          />
          <button @click="clearText">Clear</button>
        </template>

        <template
          v-if="(['mainText', 'subText', 'smallText'] as Array<string|undefined>).includes(serviceStore.selectedItemType) &&
            serviceStore.selectedItemIndex != null &&
            serviceStore.serviceData.serviceItems[
              serviceStore.selectedItemIndex
            ] != null
          "
        >
          <textarea
            ref="textTextAreaElement"
            v-model="
              serviceStore.serviceData.serviceItems[
                serviceStore.selectedItemIndex
              ].text
            "
            :rows="textLineCount"
            placeholder="Content"
            style="width: 100%"
          ></textarea>

          <button
            ref="textCopyButtonElement"
            @click="copyText"
            :disabled="!copySupported"
          >
            Copy
          </button>
          <button @click="clearText">Clear</button>

          Chars: {{ textCharCount }} Lines: {{ textLineCount }} Longest Line:
          {{ textLongestLine }}
        </template>
      </div>
    </div>
  </form>
</template>

<style lang="scss" scoped>
.service-item {
  border: 1px gray solid;
  padding: 1em;
  min-height: 10lh;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.service-item-disabled {
  color: #333;
  background-color: #ccc;
  border: 1px #ccc solid;
}
.selected-service-item {
  background-color: black;
  color: white;
}
</style>
