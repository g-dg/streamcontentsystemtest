import { defineStore } from "pinia";

import { useState } from "@/helpers/state";
import type { ServiceData } from "./service";

/** Display state */
export interface DisplayState {
  background: boolean;
  song?: string;
  songTitle?: string;
  attribution?: string;
  mainText?: string;
  subText?: string;
  smallText?: string;
  alternateText?: string;
  optionalText?: string;
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
      serviceItems: [],
      placeholders: [],
    },
  });

  return stateManager;
});
