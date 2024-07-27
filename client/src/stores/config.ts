import { defineStore } from "pinia";
import { computed, ref } from "vue";

import { ConfigClient } from "@/api/config";

export interface Config {
  displays?: Record<string, DisplayConfig>;
}

export interface DisplayConfig {
  render_delay?: number;
  font_size?: string;
}

export const useConfigStore = defineStore("config", () => {
  const _config = ref<Config>({});
  const config = computed(() => _config.value);

  let loadPromise: Promise<void> | null = null;

  async function _loadConfig() {
    try {
      _config.value = await ConfigClient.getConfig();
    } catch (e) {
      console.error(e);
      alert(
        "An error occurred loading client config. (Is the server running?)"
      );
    }
  }

  function loadConfig() {
    if (loadPromise == null) {
      loadPromise = _loadConfig();
    }
    return loadPromise;
  }

  return {
    config,
    loadConfig,
  };
});
