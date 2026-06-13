<script lang="ts" setup>
import { ref } from "vue";

import ModalDialog from "../utility/ModalDialog.vue";
import SongEditor from "./SongEditor.vue";

const props = defineProps<{ songTitle?: string }>();

const modalOpen = ref(false);
</script>

<template>
  <span>
    <button @click="modalOpen = true">
      {{ songTitle != undefined ? "Edit" : "Create" }}
    </button>
    <ModalDialog v-model="modalOpen">
      <div style="height: 66.667vh">
        <SongEditor :songTitle="songTitle" @close="modalOpen = false" />
      </div>
    </ModalDialog>
  </span>
</template>

<style lang="scss" scoped></style>
