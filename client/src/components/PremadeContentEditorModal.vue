<script lang="ts" setup>
import { ref } from "vue";

import ModalDialog from "./ModalDialog.vue";
import SongEditor from "./PremadeContentEditor.vue";

const props = defineProps<{ songTitle?: string }>();

const modalOpen = ref(false);
</script>

<template>
  <span>
    <button @click="modalOpen = true">
      {{ songTitle != undefined ? "Edit" : "Create" }}
    </button>
    <ModalDialog v-model="modalOpen">
      <div style="height: 50vh">
        <SongEditor :itemTitle="songTitle" @close="modalOpen = false" />
      </div>
    </ModalDialog>
  </span>
</template>

<style lang="scss" scoped></style>
