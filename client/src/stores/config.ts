import { defineStore } from "pinia";
import { computed, ref } from "vue";

import { ConfigClient } from "@/api/config";

export interface Config {
  displays?: Record<string, DisplayConfig>;
  templates?: Record<string, Record<string, TemplateConfig>>;
  preview_displays?: Array<string>;
  parse_selected_verses?: boolean;
  ask_service_export_filename?: boolean;
}

export interface DisplayConfig {
  group?: string;
  noninteractable?: boolean;
  allow_fullscreen?: boolean;
  render_delay?: number;
  fade_speed?: number;
}

export interface TemplateConfig {
  template: string;
  has_background?: boolean;
}

/** Config store */
export const useConfigStore = defineStore("config", () => {
  const _config = ref<Config>({});
  /** Client config from server */
  const config = computed(() => _config.value);

  let loadPromise: Promise<void> | undefined = undefined;

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
    if (loadPromise == undefined) {
      loadPromise = _loadConfig();
    }
    return loadPromise;
  }

  function getDisplayConfig(displayName: string | undefined): DisplayConfig {
    return {
      ...(config.value.displays?.[""] ?? {}),
      ...(config.value.displays?.[displayName ?? ""] ?? {}),
    };
  }

  function getDisplayTemplate(displayName: string | undefined, template: string | undefined): TemplateConfig {
    const displayConfig = getDisplayConfig(displayName);
    return config.value.templates?.[template ?? ""]?.[displayConfig?.group ?? ""] ?? {
      template: "",
      has_background: true,
    };
  }

  return {
    config,
    loadConfig,
    getDisplayConfig,
    getDisplayTemplate,
  };
});
