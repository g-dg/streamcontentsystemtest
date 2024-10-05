<script setup lang="ts">
import { RouterLink, RouterView } from "vue-router";
import { computed } from "vue";

import router from "./router";

const showHeaderFooter = computed(() => {
  if (router.currentRoute.value.matched.length > 0) return false;
  return router.currentRoute.value.meta.showHeaderFooter ?? false;
});

const noTheme = computed(() => {
  if (router.currentRoute.value.matched.length == 0) return true;
  return router.currentRoute.value.meta.noTheme ?? false;
});

const appFullName = __APP_NAME_FULL__;
const appCopyright = __APP_COPYRIGHT__;
</script>

<template>
  <div class="app-root" :class="{ themed: !noTheme }">
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
  margin-top: 1lh;
  padding: 0.5em;
}
</style>
