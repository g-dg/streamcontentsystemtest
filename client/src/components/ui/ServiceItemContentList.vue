<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";

import { natcasecmp } from "@/helpers/sort";
import { useServiceStore } from "@/stores/service";
import { useSongStore } from "@/stores/song";
import { useConfigStore } from "@/stores/config";

const songStore = useSongStore();
const serviceStore = useServiceStore();

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
  if (serviceStore.selectedItemIndex != undefined)
    serviceStore.serviceData.serviceItems[serviceStore.selectedItemIndex].text =
      "";
}

// checks if a particular verse is enabled
function verseIsEnabled(verse: string): boolean {
  const enabledSongVerses = serviceStore.selectedItem?.song?.verses ?? [];
  return enabledSongVerses.length == 0 || enabledSongVerses.includes(verse);
}

// enable all song verses
function selectAll() {
  if (serviceStore.selectedItem?.song?.verses != undefined) {
    serviceStore.selectedItem.song.verses = [];
  }
}

// scroll selected item into view
const contentItemElements = ref<Array<HTMLElement> | HTMLElement>([]);
watch(
  () => serviceStore.selectedSubItemId,
  () => {
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
          contentItemElements.value[verseIndex]?.scrollIntoView({
            block: "nearest",
          });
        }
      }
    }
  }
);

// parses number sequence strings
// supports positive numbers only
// supports spaces and commas for separating numbers
// supports dashes for specifying ranges (only ascending works)
function parseSequence(
  title: string,
  maxSequenceLength: number = 65536
): Array<string> {
  // current number we're building (empty if no current number)
  let currentNumber = "";

  // start of sequence we're building (empty if no sequence)
  let sequenceStart = "";

  // output array
  let output = [];

  // iterate through all characters, including an undefined at the end
  for (let i = 0; i <= title.length; i++) {
    const c = title[i];

    // if whitespace and not building number
    if ([" "].includes(c) && currentNumber == "") {
      // next character
      continue;
    }

    // if a digit
    if (["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"].includes(c)) {
      // add to current number
      currentNumber += c;
      // next character
      continue;
    }

    // if number is finished building
    if ([",", "-", " ", undefined].includes(c)) {
      // if we have a number we're building
      if (currentNumber != "") {
        // don't exceed max sequence length
        if (output.length >= maxSequenceLength) throw new Error();
        // add number to list
        output.push(currentNumber);
      }

      // if building sequence
      if (sequenceStart.length != 0) {
        // parse start
        const start = parseInt(sequenceStart);
        // parse end
        const end = parseInt(currentNumber);
        // remove number that just got added
        output.pop();
        // create sequence
        for (let n = start + 1; n <= end; n++) {
          // don't exceed max sequence length
          if (output.length >= maxSequenceLength) throw new Error();
          // add to list
          output.push(n.toString());
        }
        // reset sequence start
        sequenceStart = "";
      }

      // if starting a sequence
      if (["-"].includes(c)) {
        // save the sequence start
        sequenceStart = output[output.length - 1];
      }

      // reset current number
      currentNumber = "";
    }
  }

  return output;
}

// select verses based on verse string
function setSelectedVersesFromVerseString() {
  const configStore = useConfigStore();
  if (!(configStore.config.parse_selected_verses ?? true)) return;

  const verseString = serviceStore.selectedItem?.text;
  const versesPart = verseString?.match(/:([^:]+$)/)?.[1] ?? "";

  if (!versesPart.split("").every((x) => "0123456789 ,-".includes(x))) return;

  const parsedVerses = parseSequence(versesPart);
  if (
    parsedVerses.length != 0 &&
    serviceStore.selectedItem?.song?.verses != undefined
  ) {
    serviceStore.selectedItem.song.verses = parsedVerses.filter((x) =>
      songVerseNumbersSorted.value.includes(x)
    );
  }
}
watch(() => serviceStore.selectedItem?.text, setSelectedVersesFromVerseString);

const displayKeyboardBlanked = ref(false);

function addKeypressHandler() {
  document.addEventListener("keydown", keypressHandler);
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
        case "n":
          evt.preventDefault();
          serviceStore.goToNextSubItem();
          break;
        case "ArrowLeft":
        case "ArrowUp":
        case "Backspace":
        case "PageUp":
        case "p":
          evt.preventDefault();
          serviceStore.goToPreviousSubItem();
          break;
        case "Home":
          evt.preventDefault();
          serviceStore.goToFirstSubItem();
          break;
        case "End":
          evt.preventDefault();
          serviceStore.goToLastSubItem();
          break;
        case ".":
        case "b":
          evt.preventDefault();
          if (
            !displayKeyboardBlanked.value ||
            serviceStore.selectedItem == null
          ) {
            serviceStore.showBlackScreen();
            displayKeyboardBlanked.value = true;
          } else {
            serviceStore.showCurrentItem();
            displayKeyboardBlanked.value = false;
          }
          break;
        case ",":
        case "w":
          evt.preventDefault();
          if (
            !displayKeyboardBlanked.value ||
            serviceStore.selectedItem == null
          ) {
            serviceStore.showEmptyScreen();
            displayKeyboardBlanked.value = true;
          } else {
            serviceStore.showCurrentItem();
            displayKeyboardBlanked.value = false;
          }
          break;
      }
      if (evt.key.length == 1) {
        evt.preventDefault();
      }
    }
  }
}

onMounted(() => addKeypressHandler());
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
          ref="contentItemElements"
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
          ref="contentItemElements"
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
            >{{ serviceStore.selectedItem?.text }}</pre
          >
          <hr />
        </div>

        <div
          v-if="serviceStore.selectedItemType == 'empty'"
          ref="contentItemElements"
        >
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
        v-if="serviceStore.selectedItem != null"
        style="display: inline-block"
      >
        Name:
        <input v-model="serviceStore.selectedItem.comment" type="text" />
      </span>

      <div>
        <template
          v-if="
            serviceStore.selectedItemType == 'song' &&
            serviceStore.selectedItem != null
          "
        >
          <input
            v-model="serviceStore.selectedItem.text"
            type="text"
            placeholder="Song Verses"
            style="width: 100%"
          />
          <button @click="clearText">Clear</button>
        </template>

        <template
          v-if="(['mainText', 'subText', 'smallText'] as Array<string|undefined>).includes(serviceStore.selectedItemType) &&
            serviceStore.selectedItem != null
          "
        >
          <textarea
            ref="textTextAreaElement"
            v-model="serviceStore.selectedItem.text"
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
  white-space: pre-wrap;
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
