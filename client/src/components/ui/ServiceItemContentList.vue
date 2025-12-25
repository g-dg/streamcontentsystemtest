<script setup lang="ts">
import { computed, ref, watch } from "vue";

import { natcasecmp } from "@/helpers/sort";
import { useServiceStore } from "@/stores/service";
import { useSongStore } from "@/stores/song";
import { useConfigStore } from "@/stores/config";
import { NUMBER_CHARS, parseSequence, RANGE_CHARS, SEPARATOR_CHARS, SPACE_CHARS } from "@/helpers/parseSequence";

const props = defineProps<{
  readonly?: boolean;
  mobileController?: boolean;
}>();

const songStore = useSongStore();

const serviceStore = useServiceStore();

const configStore = useConfigStore();
configStore.loadConfig();

const song = computed(() =>
  serviceStore.selectedItem?.type == "song" &&
    serviceStore.selectedItem?.song?.title != null
    ? songStore.songs[serviceStore.selectedItem.song.title]
    : null
);

const songVerses = computed(() => song.value?.verses);
const songVerseNumbersSorted = computed(() =>
  Object.keys(songVerses.value ?? {}).sort((a, b) => natcasecmp([a, b]))
);

const topScrollElement = ref<HTMLDivElement>();
function scrollToTop() {
  if (props.mobileController) return;
  topScrollElement.value?.scrollIntoView();
}
watch(() => serviceStore.selectedItem?.id, scrollToTop);

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
  if (serviceStore.selectedItemIndex != undefined && serviceStore.serviceData.serviceItems[serviceStore.selectedItemIndex] != undefined)
    serviceStore.serviceData.serviceItems[serviceStore.selectedItemIndex]!.text = "";
}

// checks if a particular verse is enabled
function verseIsEnabled(verse: string): boolean {
  const enabledSongVerses = serviceStore.selectedItem?.song?.verses ?? [];
  return enabledSongVerses.length == 0 || enabledSongVerses.includes(verse);
}

// scroll selected item into view
const contentItemElements = ref<Array<HTMLElement> | HTMLElement>([]);
watch(
  () => serviceStore.selectedSubItemId,
  () => {
    if (props.mobileController) return;
    const itemId = serviceStore.selectedSubItemId;
    if (itemId != null) {
      if (serviceStore.selectedItem?.type == "song") {
        const verseIndex = songVerseNumbersSorted.value.indexOf(itemId);
        if (
          verseIndex != -1 &&
          typeof contentItemElements.value == "object" &&
          contentItemElements.value != null &&
          Array.isArray(contentItemElements.value)
        ) {
          contentItemElements.value
            .find(
              (x) => parseInt(x.getAttribute("data-index") ?? "") == verseIndex
            )
            ?.scrollIntoView({
              block: "nearest",
            });
        }
      }
    }
  }
);

// select verses based on verse string
function setSelectedVersesFromVerseString() {
  parseWarning.value = undefined;

  if (serviceStore.selectedItem?.type != "song") return;

  if (!(configStore.config.parse_selected_verses ?? true)) return;

  // get verses by taking anything after the last colon (:)
  const verseString = serviceStore.selectedItem?.text;
  const versesPart = /:(?<verses>[^:]+$)/.exec(verseString ?? "")?.groups?.["verses"] ?? "";

  // only warn if the verse part doesn't include letters
  const showParseWarnings = !/[a-zA-Z]/.test(versesPart);

  // ensure verse part is valid
  if (!versesPart.split("").every((x) => [...SPACE_CHARS, ...SEPARATOR_CHARS, ...RANGE_CHARS, ...NUMBER_CHARS].includes(x))) {
    if (showParseWarnings) {
      parseWarning.value = "Invalid characters in song verses string";
    }
    return;
  }

  const parsedVerses = parseSequence(versesPart);

  // set verse numbers
  if (parsedVerses.length != 0) {
    if (serviceStore.selectedItem?.song?.verses != undefined) {
      serviceStore.selectedItem.song.verses = parsedVerses.filter((x) =>
        songVerseNumbersSorted.value.includes(x)
      );
    }
  } else {
    if (versesPart.trim().length > 0) {
      parseWarning.value = "Failed to parse verses";
    }
  }

  if (parsedVerses.some(x => !songVerseNumbersSorted.value.includes(x))) {
    parseWarning.value = "Non-existent verses have been selected in song verses string";
  }
}
watch(() => serviceStore.selectedItem?.text, setSelectedVersesFromVerseString);

const parseWarning = ref<string | undefined>(undefined);

</script>

<template>
  <div style="height: 100%; display: flex; flex-direction: column">
    <div v-if="!readonly" style="flex: 0">
      <span style="display: inline-block">
        <span style="margin-inline-start: 0.5em">
          <template v-if="serviceStore.selectedItemType == 'song'">
            {{ serviceStore.selectedItem?.song?.title }}
          </template>
          <em v-if="serviceStore.selectedItemType == 'empty'"> Empty </em>
          <em v-if="serviceStore.selectedItemType == 'blank'"> Blank </em>
          <em v-if="serviceStore.selectedItemType == 'mainText'"> Main Text </em>
          <em v-if="serviceStore.selectedItemType == 'subText'"> Sub Text </em>
          <em v-if="serviceStore.selectedItemType == 'smallText'"> Small Text </em>
          <em v-if="serviceStore.selectedItemType == 'optionalText'"> Optional Text </em>
        </span>
      </span>

      <div v-if="parseWarning" style="background-color: #ff0; color: #000;">
        {{ parseWarning }}
        <br />
        <button @click="parseWarning = undefined">Acknowledge</button>
      </div>

      <hr />
    </div>

    <div style="flex: 1 1 auto" :style="{ height: mobileController ? 'auto' : '4lh' }">
      <div style="height: 100%; overflow: auto">
        <div ref="topScrollElement"></div>

        <div v-if="songVerses != null" v-for="(verseName, index) in songVerseNumbersSorted" :key="verseName"
          ref="contentItemElements" :data-index="index">
          <label :for="'song_verse_enable_' + verseName">
            <input v-if="serviceStore.selectedItem?.song != undefined" v-model="serviceStore.selectedItem.song.verses"
              :value="verseName" type="checkbox" :id="'song_verse_enable_' + verseName" :disabled="readonly"
              style="margin: 0 0.5em 0 1em" />
            <strong style="font-size: 125%; font-weight: bold; padding-right: 1em">
              {{ verseName }}
            </strong>
          </label>
          <pre @click="serviceStore.selectAndShowItem(verseName)" :class="{
            'service-item': true,
            'selected-service-item':
              serviceStore.selectedSubItemId === verseName,
            'service-item-disabled': !verseIsEnabled(verseName),
          }">{{ songVerses[verseName] }}</pre>
          <hr style="margin-bottom: 1em" />
        </div>

        <div
          v-if="(['mainText', 'subText', 'smallText', 'optionalText'] as Array<string | undefined>).includes(serviceStore.selectedItemType)"
          ref="contentItemElements" :data-index="0">
          <strong style="font-size: 125%; font-weight: bold; padding-left: 0.5em">
            Text
          </strong>
          <pre @click="serviceStore.selectAndShowItem('0')" :class="{
            'service-item': true,
            'selected-service-item': serviceStore.selectedSubItemId === '0',
          }">{{ serviceStore.selectedItem?.text }}</pre>
          <hr />
        </div>

        <div v-if="serviceStore.selectedItemType == 'empty'" ref="contentItemElements" :data-index="0">
          <strong style="font-size: 125%; font-weight: bold; padding-left: 0.5em">
            Empty
          </strong>
          <pre @click="serviceStore.selectAndShowItem('0')" :class="{
            'service-item': true,
            'selected-service-item': serviceStore.selectedSubItemId === '0',
          }">
        <div style="text-align: center"><em> &lt; Empty &gt; </em></div>
      </pre>
          <hr />
        </div>

        <div v-if="serviceStore.selectedItemType == 'blank'" ref="contentItemElements" :data-index="0">
          <strong style="font-size: 125%; font-weight: bold; padding-left: 0.5em">
            Blank
          </strong>
          <pre @click="serviceStore.selectAndShowItem('0')" :class="{
            'service-item': true,
            'selected-service-item': serviceStore.selectedSubItemId === '0',
          }">
        <div style="text-align: center"><em> &lt; Blank &gt; </em></div>
      </pre>
          <hr />
        </div>

        <div v-if="serviceStore.selectedItem == null" style="text-align: center">
          <em> No item is selected </em>
        </div>
      </div>
    </div>

    <div v-if="!readonly" style="flex: 0">
      <hr />

      <span v-if="serviceStore.selectedItem != null" style="display: inline-block">
        Name:
        <input v-model="serviceStore.selectedItem.comment" type="text" />
      </span>

      <div>
        <template v-if="
          serviceStore.selectedItemType == 'song' &&
          serviceStore.selectedItem != null
        ">
          <input v-model="serviceStore.selectedItem.text" type="text" placeholder="Song Verses" style="width: 100%" />
          <button @click="clearText">Clear</button>
        </template>

        <template v-if="(['mainText', 'subText', 'smallText', 'optionalText'] as Array<string | undefined>).includes(serviceStore.selectedItemType) &&
          serviceStore.selectedItem != null
        ">
          <textarea ref="textTextAreaElement" v-model="serviceStore.selectedItem.text" :rows="textLineCount"
            placeholder="Content" style="width: 100%"></textarea>

          <button ref="textCopyButtonElement" @click="copyText" :disabled="!copySupported">
            Copy
          </button>
          <button @click="clearText">Clear</button>

          Chars: {{ textCharCount }} Lines: {{ textLineCount }} Longest Line:
          {{ textLongestLine }}
        </template>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.service-item {
  border: 1px rgba(var(--fg), 0.5) solid;
  padding: 1em;
  min-height: 10lh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  white-space: pre-wrap;
}

.service-item-disabled {
  color: rgba(var(--fg), 0.5);
  background-color: rgba(var(--fg), 0.125);
  border: 1px rgba(var(--fg), 0.25) solid;
}

.selected-service-item {
  background-color: rgb(var(--fg));
  color: rgb(var(--bg));
}
</style>
