<script setup lang="ts">
import { natcasecmp } from "@/helpers/sort";
import { useServiceStore } from "@/stores/service";
import { useSongStore } from "@/stores/song";
import { type StateContent } from "@/stores/state";
import { computed, ref, watch, type Ref } from "vue";

const emit = defineEmits<{ (e: "setContent", content: StateContent): void }>();

const songStore = useSongStore();
const serviceStore = useServiceStore();

const itemType = computed(() => serviceStore.selectedItem?.type);
const songVerses = computed(() =>
  serviceStore.selectedItem?.type == "song" &&
  serviceStore.selectedItem?.song?.title != null
    ? Object.fromEntries(
        Object.entries(
          songStore.songs[serviceStore.selectedItem.song.title]
        ).sort((a, b) => natcasecmp([a[0], b[0]]))
      )
    : null
);

function selectContent(id: number | string) {
  serviceStore.selectedSubItemIndex = id;

  switch (itemType.value) {
    case "empty":
      {
        emit("setContent", { background: false });
      }
      break;
    case "song":
      {
        const verseContent = (songVerses.value ?? {})[id] ?? undefined;
        emit("setContent", {
          background: true,
          song: verseContent,
          songTitle: serviceStore.selectedItem?.text ?? undefined,
        });
      }
      break;
    case "mainText":
      {
        emit("setContent", {
          background: false,
          mainText: serviceStore.selectedItem?.text ?? undefined,
        });
      }
      break;
    case "subText":
      {
        emit("setContent", {
          background: false,
          subText: serviceStore.selectedItem?.text ?? undefined,
        });
      }
      break;
    case "smallText":
      {
        emit("setContent", {
          background: false,
          smallText: serviceStore.selectedItem?.text ?? undefined,
        });
      }
      break;
  }
}

function emptyScreen() {
  emit("setContent", { background: false });
}
function blackScreen() {
  emit("setContent", { background: true });
}

const topScrollElement: Ref<HTMLDivElement | undefined> = ref();
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
</script>

<template>
  <form
    @submit.prevent
    class="root"
    style="height: 100%; display: flex; flex-direction: column"
  >
    <div style="flex: 0; position: sticky; top: 0px">
      <span style="display: inline-block">
        <button @click="emptyScreen">Empty Screen</button>
        <button @click="blackScreen">Black Screen</button>
        <input
          v-if="
            serviceStore.selectedItemIndex != null &&
            serviceStore.serviceData.serviceItems[
              serviceStore.selectedItemIndex
            ] != null
          "
          v-model="
            serviceStore.serviceData.serviceItems[
              serviceStore.selectedItemIndex
            ].comment
          "
          type="text"
          placeholder="Comment"
        />
        <template v-if="itemType == 'song'">
          {{ serviceStore.selectedItem?.song?.title }}
        </template>
        <em v-if="itemType == 'empty'"> Empty </em>
        <em v-if="itemType == 'mainText'"> Main Text </em>
        <em v-if="itemType == 'subText'"> Sub Text </em>
        <em v-if="itemType == 'smallText'"> Small Text </em>
      </span>
      <div>
        <input
          v-if="
            itemType == 'song' &&
            serviceStore.selectedItemIndex != null &&
            serviceStore.serviceData.serviceItems[
              serviceStore.selectedItemIndex
            ] != null
          "
          v-model="
            serviceStore.serviceData.serviceItems[
              serviceStore.selectedItemIndex
            ].text
          "
          type="text"
          placeholder="Song Verses"
          style="width: 100%"
        />
        <template
          v-if="(['mainText', 'subText', 'smallText'] as Array<string|undefined>).includes(itemType) &&
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
      <hr />
    </div>

    <div style="flex: 1 1 auto; height: 2lh">
      <div style="height: 100%; overflow: auto">
        <div ref="topScrollElement"></div>

        <div
          v-if="songVerses != null"
          v-for="(verseContent, verseName) in songVerses"
          :key="verseName"
          @click="selectContent(verseName)"
          :class="{
            'selected-item': serviceStore.selectedSubItemIndex === verseName,
          }"
          style="margin: 1em 0"
        >
          <input
            v-model="serviceStore.selectedSubItemIndex"
            :value="verseName"
            type="radio"
          />
          <strong style="font-size: 125%; font-weight: bold">
            {{ verseName }}
          </strong>
          <pre>{{ verseContent }}</pre>
          <hr />
        </div>

        <div
          v-if="(['mainText', 'subText', 'smallText'] as Array<string|undefined>).includes(itemType)"
          @click="selectContent(0)"
          :class="{
            'selected-item': serviceStore.selectedSubItemIndex == 0,
          }"
        >
          <input
            v-model="serviceStore.selectedSubItemIndex"
            :value="0"
            type="radio"
          />
          <strong style="font-size: 125%; font-weight: bold">
            Text Content
          </strong>
          <pre>{{
            serviceStore.serviceData.serviceItems[
              serviceStore.selectedItemIndex ?? -1
            ]?.text
          }}</pre>
          <hr />
        </div>

        <div
          v-if="itemType == 'empty'"
          @click="selectContent(0)"
          :class="{
            'selected-item': serviceStore.selectedSubItemIndex == 0,
          }"
        >
          <input
            v-model="serviceStore.selectedSubItemIndex"
            :value="0"
            type="radio"
          />
          <strong style="font-size: 125%; font-weight: bold">
            Show Nothing
          </strong>
          <div style="text-align: center">
            <br /><br /><br />
            <em> &lt; Nothing &gt; </em>
            <br /><br /><br /><br /><br />
          </div>
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
  </form>
</template>

<style lang="scss" scoped>
.selected-item {
  background-color: black;
  color: white;
}
</style>
