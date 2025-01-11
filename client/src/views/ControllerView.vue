<script setup lang="ts">
import { useDisplayStateStore } from "@/stores/state";
import DesktopControl from "../components/ui/DesktopControl.vue";
import MobileControl from "../components/ui/MobileControl.vue";
import { useSongStore } from "@/stores/song";
import { onMounted, onUnmounted, ref, watch, type PropType } from "vue";

const props = defineProps({
  controllerType: {
    type: String as PropType<"auto" | "desktop" | "mobile">,
    required: false,
    default: () => "auto"
  }
});

const songStore = useSongStore();
const displayStateStore = useDisplayStateStore();

displayStateStore.restoreState = true;
onUnmounted(() => displayStateStore.restoreState = false);

onMounted(() => songStore.loadSongs(false));

/** Guesses whether to use the mobile display */
function isMobile(): boolean {
  // if user requests a display type, use it
  if (props.controllerType != "auto") return props.controllerType == "mobile";

  // use UserAgentData if available
  if ((navigator as any).userAgentData != undefined) return (navigator as any).userAgentData.mobile;

  // else if "Mobile" or "Tablet" are in the user agent string, assume mobile
  return /Mobile|Tablet/.test(navigator.userAgent)
}

const mobile = ref(isMobile());

function setMobile() {
  mobile.value = isMobile();
}

watch(() => props.controllerType, setMobile);
onMounted(() => window.addEventListener("resize", setMobile));
onUnmounted(() => window.removeEventListener("resize", setMobile));
</script>

<template>
  <div>
    <MobileControl v-if="mobile" />
    <DesktopControl v-else />
  </div>
</template>

<style lang="scss" scoped></style>
