import { defineStore } from "pinia";
import { computed, ref } from "vue";

import { ConfigClient } from "@/api/config";

export interface Config {
  displays?: Record<string, DisplayConfig>;
  display_default?: DisplayConfig;
  parse_selected_verses?: boolean;
  ask_service_export_filename?: boolean;
}

export interface DisplayConfig {
  main_content?: boolean;
  noninteractable?: boolean;
  hide_small_text?: boolean;
  render_delay?: number;
  fade_speed?: number;
  font_size?: string;
  background?: string;
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
