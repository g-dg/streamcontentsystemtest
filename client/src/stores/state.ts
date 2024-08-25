import { defineStore } from "pinia";
import { computed, ref } from "vue";

import { API_URI } from "@/api/api";
import { sleep } from "@/helpers/sleep";
import { randomString } from "@/helpers/random";
import { clone } from "@/helpers/clone";

/** State object */
export interface CurrentState {
  id: string;
  content: StateContent;
}

/** App-specific state */
export interface StateContent {
  background: boolean;
  song?: string;
  songTitle?: string;
  mainText?: string;
  subText?: string;
  smallText?: string;
}

/** State store */
export const useStateStore = defineStore("state", () => {
  // Taken from my Rust-Vue state system with authentication removed

  const WS_PATH = "api/state";
  const RECONNECT_DELAY = 1000;
  const DEFAULT_PING_DELAY = 1000;
  const STATE_ID_LENGTH = 16;
  const PING_ID_LENGTH = 8;

  let _ws: WebSocket | null = null;

  const _currentState = ref<CurrentState>({
    id: "",
    content: {
      background: false,
    },
  });

  let _messageListener: ((evt: MessageEvent<any>) => void) | null = null;
  let _closeListener: ((evt: CloseEvent) => void) | null = null;
  let _errorListener: ((evt: Event) => void) | null = null;

  let _isConnecting = ref<boolean>(false);
  let _isConnected = ref<boolean>(false);
  let _isDisconnecting = ref<boolean>(false);

  let _debug: boolean = true;

  let _pingLoopDelay: number | null = DEFAULT_PING_DELAY;
  let _pingLoopTaskId: Symbol | undefined;
  let _pingLoopPromise: Promise<void> | undefined = undefined;

  function _waitForMessage<T>(
    extractFunction: (message: any) => T | undefined
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const cleanupListeners = () => {
        _ws!.removeEventListener("error", errorListener);
        _ws!.removeEventListener("close", closeListener);
        _ws!.removeEventListener("message", messageListener);
      };

      const messageListener = (evt: MessageEvent<any>) => {
        try {
          const message_json = evt.data;
          const message = JSON.parse(message_json);
          const result = extractFunction(message);
          if (result !== undefined) {
            resolve(result);
            cleanupListeners();
          }
        } catch (e) {
          reject(e);
          cleanupListeners();
        }
      };

      const closeListener = (evt: CloseEvent) => {
        reject(evt);
        cleanupListeners();
      };

      const errorListener = (evt: Event) => {
        reject(evt);
        cleanupListeners();
      };

      _ws!.addEventListener("message", messageListener);
      _ws!.addEventListener("close", closeListener);
      _ws!.addEventListener("error", errorListener);
    });
  }

  async function _connectWs() {
    const wsUri = new URL(`${API_URI}${WS_PATH}`);
    if (wsUri.protocol === "https:") {
      wsUri.protocol = "wss:";
    } else {
      wsUri.protocol = "ws:";
    }

    // connect to websocket
    _ws = new WebSocket(wsUri);

    // wait for connection to open
    await new Promise<void>((resolve, reject) => {
      const removeListeners = () => {
        _ws!.removeEventListener("open", openListener);
        _ws!.removeEventListener("error", errorListener);
      };

      const errorListener = (e: Event) => {
        reject(e);
        removeListeners();
      };
      _ws!.addEventListener("error", errorListener);

      const openListener = () => {
        resolve();
        removeListeners();
      };
      _ws!.addEventListener("open", openListener);

      if (_ws!.readyState === WebSocket.OPEN) {
        resolve();
        removeListeners();
      }
    });
  }

  /**
   * Connects (or reconnects) to the state websocket
   */
  async function connect(reconnect = false): Promise<void> {
    // exit if already connecting or disconnecting
    if (_isConnecting.value || _isDisconnecting.value) {
      return;
    }
    _isConnecting.value = true;

    // exit if reconnect is not forced
    if (_isConnected.value && !reconnect) {
      return;
    }

    // disconnect (if connected)
    await disconnect();
    _isDisconnecting.value = false;

    // connect
    while (_ws == null && !_isDisconnecting.value) {
      try {
        await _connectWs();
      } catch (e) {
        if (_debug) {
          console.error("Error occurred connecting to state websocket", e);
        }
        _ws = null;
        await sleep(RECONNECT_DELAY);
      }
    }

    if (_isDisconnecting.value) {
      return;
    }

    if (_ws == null) {
      throw new Error("Could not connect to state websocket");
    }

    _isConnected.value = true;

    const existingState = clone(currentState.value);

    // set up message listener
    _messageListener = async (evt: MessageEvent<any>) => {
      try {
        const response = JSON.parse(evt.data);

        // set state if state changed
        if (response.state !== undefined) {
          _currentState.value = response.state;
        }

        // respond to pings
        if (response.ping !== undefined) {
          _ws?.send(JSON.stringify({ pong: response.ping }));
        }
      } catch (e) {
        if (_debug) {
          console.error("Error parsing response from state websocket", e);
        }
        connect();
      }
    };
    _ws.addEventListener("message", _messageListener);

    // set up close listener
    _closeListener = async (evt: CloseEvent) => {
      // reconnect if we're not closing the connection on our end
      if (!_isDisconnecting.value) {
        connect();
      }
    };
    _ws.addEventListener("close", _closeListener);

    // set up error handler (reconnect on error)
    _errorListener = async (evt: Event) => {
      if (_debug) {
        console.error("Error occurred on state websocket", evt);
      }
      connect();
    };
    _ws.addEventListener("error", _errorListener);

    // get latest value
    await refresh();

    // set state if state on server side is not set (i.e. if the server restarted)
    if (currentState.value.id == "" && existingState.id != "") {
      await _setRawState(existingState);
    }

    _startPingLoop();

    _isConnecting.value = false;
  }

  /**
   * Disconnects from the state websocket, cancelling any reconnect attempts
   */
  async function disconnect(): Promise<void> {
    _isDisconnecting.value = true;
    _isConnected.value = false;
    _isConnecting.value = false;

    _endPingLoop();
    _ws?.removeEventListener("message", _messageListener!);
    _ws?.removeEventListener("close", _closeListener!);
    _ws?.removeEventListener("error", _errorListener!);
    _ws?.close();
    _ws = null;
  }

  /**
   * Whether the websocket is connected
   */
  const connected = computed<boolean>(() => _isConnected.value);

  /**
   * The current state
   */
  const currentState = computed<CurrentState>(() => _currentState.value);

  async function _setRawState(state: CurrentState): Promise<CurrentState> {
    const request = JSON.stringify({
      state,
    });

    const setPromise = _waitForMessage((message) => message.state);

    _ws?.send(request);

    return await setPromise;
  }

  /**
   * Sets a new state
   * @param state State to set
   */
  async function setState(state: any): Promise<CurrentState> {
    const id = randomString(STATE_ID_LENGTH);

    return await _setRawState({
      id,
      content: state,
    });
  }

  /**
   * Requests a refresh of the state
   */
  async function refresh(): Promise<CurrentState> {
    const request = JSON.stringify({ get: true });

    const refreshPromise = _waitForMessage((message) => message.state);

    _ws?.send(request);

    return await refreshPromise;
  }

  /**
   * Sends a ping to the server and waits for a response
   */
  async function ping(): Promise<void> {
    const value = randomString(PING_ID_LENGTH);

    const pingRequest = JSON.stringify({ ping: value });

    const pongPromise = _waitForMessage((message) =>
      message.pong == value ? message.pong : undefined
    );

    _ws?.send(pingRequest);

    return await pongPromise;
  }

  function _startPingLoop() {
    _pingLoopTaskId = Symbol();
    _pingLoopPromise = _pingLoop(_pingLoopTaskId);
  }

  async function _pingLoop(taskId: Symbol) {
    while (_pingLoopTaskId == taskId && _pingLoopDelay != null) {
      await ping();
      await sleep(_pingLoopDelay);
    }
  }

  async function _endPingLoop() {
    _pingLoopTaskId = undefined;
    await _pingLoopPromise;
  }

  /**
   * Sets the ping delay
   */
  function setPingDelay(ms: number | null) {
    _pingLoopDelay = ms;
  }

  // connect when store is loaded
  connect();

  return {
    connect,
    disconnect,
    connected,
    currentState,
    setState,
    refresh,
    ping,
    setPingDelay,
  };
});
