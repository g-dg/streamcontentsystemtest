<script setup lang="ts">
import { computed, ref, watch } from "vue";

import { natcasecmp } from "@/helpers/sort";
import { useServiceStore } from "@/stores/service";
import { usePremadeContentStore } from "@/stores/premadeContent";
import { useConfigStore } from "@/stores/config";

const props = defineProps<{
  readonly?: boolean;
  mobileController?: boolean;
}>();

const premadeContentStore = usePremadeContentStore();

const serviceStore = useServiceStore();

const configStore = useConfigStore();
configStore.loadConfig();

const song = computed(() =>
  serviceStore.selectedItem?.type == "premade" &&
    serviceStore.selectedItem?.premade?.name != undefined
    ? (premadeContentStore.premadeContent.items ?? {})[serviceStore.selectedItem.premade.name]
    : undefined
);

const songVerses = computed(() => song.value?.pages);
const songVerseNumbersSorted = computed(() =>
  Object.keys(songVerses.value ?? {}).sort((a, b) => natcasecmp([a, b]))
);

const topScrollElement = ref<HTMLDivElement>();
function scrollToTop() {
  if (props.mobileController) return;
  topScrollElement.value?.scrollIntoView();
}
watch(() => serviceStore.selectedItem, scrollToTop);

// checks if a particular verse is enabled
function verseIsEnabled(verse: string): boolean {
  const enabledSongVerses = serviceStore.selectedItem?.premade?.items ?? [];
  return enabledSongVerses.length == 0 || enabledSongVerses.includes(verse);
}

// scroll selected item into view
const contentItemElements = ref<Array<HTMLElement> | HTMLElement>([]);
watch(
  () => serviceStore.selectedSubItemId,
  () => {
    if (props.mobileController) return;
    const itemId = serviceStore.selectedSubItemId;
    if (itemId != undefined) {
      if (serviceStore.selectedItem?.type == "premade") {
        const verseIndex = songVerseNumbersSorted.value.indexOf(itemId);
        if (
          verseIndex != -1 &&
          typeof contentItemElements.value == "object" &&
          contentItemElements.value != undefined &&
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
function setSelectedVersesFromVerseString(verseString: string) {
  if (!(configStore.config.parse_selected_verses ?? true)) return;

  const versesPart =
    /:(?<verses>[^:]+$)/.exec(verseString ?? "")?.groups?.["verses"] ?? "";

  if (!versesPart.split("").every((x) => "0123456789 ,-".includes(x))) return;

  const parsedVerses = parseSequence(versesPart);
  if (
    parsedVerses.length != 0 &&
    serviceStore.selectedItem?.premade?.items != undefined
  ) {
    serviceStore.selectedItem.premade.items = parsedVerses.filter((x) =>
      songVerseNumbersSorted.value.includes(x)
    );
  }
}
// watch(() => serviceStore.selectedItem?.text, () => setSelectedVersesFromVerseString(serviceStore.selectedItem?.text));

</script>

<template>
  <div style="height: 100%; display: flex; flex-direction: column">
    <div style="flex: 1 1 auto" :style="{ height: mobileController ? 'auto' : '4lh' }">
      <div style="height: 100%; overflow: auto">
        <div ref="topScrollElement"></div>

        <div v-if="songVerses != undefined" v-for="(verseName, index) in songVerseNumbersSorted" :key="verseName"
          ref="contentItemElements" :data-index="index">
          <label :for="'song_verse_enable_' + verseName">
            <input v-if="serviceStore.selectedItem?.premade != undefined" v-model="serviceStore.selectedItem.premade.items"
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

        <div v-if="serviceStore.selectedItem == undefined" style="text-align: center">
          <em> No item is selected </em>
        </div>
      </div>
    </div>

    <div v-if="!readonly" style="flex: 0">
      <hr />

      <span v-if="serviceStore.selectedItem != undefined" style="display: inline-block">
        Name:
        <input v-model="serviceStore.selectedItem.comment" type="text" />
      </span>

      <div>
        <template v-if="
          serviceStore.selectedItemType == 'song' &&
          serviceStore.selectedItem != undefined
        ">
          <input v-model="serviceStore.selectedItem.text" type="text" placeholder="Song Verses" style="width: 100%" />
          <button @click="clearText">Clear</button>
        </template>

        <template v-if="(['mainText', 'subText', 'smallText', 'optionalText'] as Array<string | undefined>).includes(serviceStore.selectedItemType) &&
          serviceStore.selectedItem != undefined
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
