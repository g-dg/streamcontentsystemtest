import { defineStore } from "pinia";

import { useState } from "@/helpers/state";
import type { ServiceData } from "./service";

/** Display state */
export interface DisplayState {
  background: boolean;
  song?: string;
  songTitle?: string;
  mainText?: string;
  subText?: string;
  smallText?: string;
}

/** State store */
export const useDisplayStateStore = defineStore("displayState", () => {
  const DISPLAY_STATE_CHANNEL = "display";

  const stateManager = useState<DisplayState>(DISPLAY_STATE_CHANNEL, {
    background: false,
  });

  return stateManager;
});

export interface OperationState {
  service: ServiceData;
}

export const useOperationStateStore = defineStore("operationState", () => {
  const OPERATION_STATE_CHANNEL = "operation";

  const stateManager = useState<OperationState>(OPERATION_STATE_CHANNEL, {
    service: {
      serviceItems: [],
    },
  });

  return stateManager;
});
