<script setup lang="ts">
import { RouterLink, RouterView } from "vue-router";
import { computed } from "vue";
import router from "./router";

const showHeaderFooter = computed(
  () =>
    router.currentRoute.value.meta.showHeaderFooter ??
    router.currentRoute.value.matched.length > 0
);

const appFullName = __APP_NAME_FULL__;
const appCopyright = __APP_COPYRIGHT__;
</script>

<template>
  <div>
    <header v-if="showHeaderFooter"></header>

    <main>
      <RouterView />
    </main>

    <footer v-if="showHeaderFooter">
      {{ appFullName }}
      {{ appCopyright }}
      (<RouterLink :to="{ name: 'about' }">About</RouterLink>)
    </footer>
  </div>
</template>

<style lang="scss" scoped>
footer {
  margin-top: 1.5em;
}
</style>
