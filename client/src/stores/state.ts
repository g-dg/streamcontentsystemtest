import { defineStore } from "pinia";

import { useState } from "@/helpers/state";
import { SERVICE_DATA_VERSION, type ServiceData } from "./service";

/** Display state */
export interface DisplayState {
  template: string;
  placeholders: Record<string, string>;
}

/** State store */
export const useDisplayStateStore = defineStore("displayState", () => {
  const DISPLAY_STATE_CHANNEL = "display";

  const stateManager = useState<DisplayState | undefined>(DISPLAY_STATE_CHANNEL, undefined);

  return stateManager;
});

export interface OperationState {
  service: ServiceData;
}

export const useOperationStateStore = defineStore("operationState", () => {
  const OPERATION_STATE_CHANNEL = "operation";

  const stateManager = useState<OperationState>(OPERATION_STATE_CHANNEL, {
    service: {
      version: SERVICE_DATA_VERSION,
      items: [],
      data: [],
    },
  });

  return stateManager;
});
