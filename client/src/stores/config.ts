import { defineStore } from "pinia";
import { computed, ref } from "vue";

import { ConfigClient } from "@/api/config";

export interface Config {
  displays?: Record<string, DisplayConfig>;
  display_default?: DisplayConfig;
}

export interface DisplayConfig {
  render_delay?: number;
  fade_speed?: number;
  font_size?: string;
}

/** Config store */
export const useConfigStore = defineStore("config", () => {
  const _config = ref<Config>({});
  /** Client config from server */
  const config = computed(() => _config.value);

  let loadPromise: Promise<void> | null = null;

  /** Loads config from server */
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

  /** Load config from server. If we're already loading the config, wait for it to finish */
  function loadConfig() {
    if (loadPromise == null) {
      loadPromise = _loadConfig();
    }
    return loadPromise;
  }

  function getDisplayConfig(displayName: string) {
    return {
      ...(config.value.display_default ?? {}),
      ...(config.value.displays?.[displayName] ?? {}),
    };
  }

  return {
    config,
    loadConfig,
    getDisplayConfig,
  };
});
