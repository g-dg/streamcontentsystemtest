<script setup lang="ts">
import { onMounted, ref } from "vue";

import { api } from "@/api/api";

const license = ref<string>();
/** Get license from server */
async function loadLicense() {
  license.value = await api("server-info/license", "GET", undefined, {
    returnType: "text",
  });
}
onMounted(loadLicense);

const serverVersion = ref<string>();
/** Get server version from server */
async function loadVersion() {
  serverVersion.value = await api("server-info/version", "GET", undefined, {
    returnType: "text",
  });
}
onMounted(loadVersion);

// access constants in template
const clientVersion = __APP_VERSION__;
const appName = __APP_NAME__;
const appFullName = __APP_NAME_FULL__;
</script>

<template>
  <main>
    <h1>{{ appName }}</h1>

    <h2>
      <em> {{ appFullName }} </em>
    </h2>

    <h2>Version:</h2>
    <dl>
      <dt>Client:</dt>
      <dd>
        <code> {{ clientVersion }} </code>
      </dd>

      <dt>Server:</dt>
      <dd>
        <em v-if="serverVersion == undefined"> Loading... </em>
        <code v-else> {{ serverVersion }}</code>
      </dd>
    </dl>

    <h2>License:</h2>
    <code v-if="license != undefined">
      <pre>{{ license }}</pre>
    </code>
    <em v-else> MIT License </em>

    <h2>Source Code:</h2>
    <p>
      Source code can be accessed on
      <a
        href="https://github.com/g-dg/streamcontentsystemtest"
        target="_blank"
        rel="noopener noreferrer"
        >Github</a
      >
    </p>
  </main>
</template>

<style lang="scss" scoped></style>
