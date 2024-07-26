<script setup lang="ts">
import { api } from "@/api/api";
import { onMounted, ref } from "vue";

const license = ref<string>();
async function loadLicense() {
  license.value = await api("server-info/license", "GET", undefined, {
    returnType: "text",
  });
}
onMounted(loadLicense);

const serverVersion = ref<string>();
async function loadVersion() {
  serverVersion.value = await api("server-info/version", "GET", undefined, {
    returnType: "text",
  });
}
onMounted(loadVersion);

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
      You may request the source code by emailing
      <a href="mailto:garnet@garnetdg.ca">Garnet DeGelder</a>
    </p>
  </main>
</template>

<style lang="scss" scoped></style>
