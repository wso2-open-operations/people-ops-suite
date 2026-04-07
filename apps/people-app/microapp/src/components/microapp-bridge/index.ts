// Copyright (c) 2026 WSO2 LLC. (https://www.wso2.com).
//
// WSO2 LLC. licenses this file to you under the Apache License,
// Version 2.0 (the "License"); you may not use this file except
// in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.

import { ErrorMessages } from "@/utils/constants";
import { TOPIC, type LogLevel, type TopicType } from "./types";
import { Logger } from "@/utils/logger";

type Callback<T> = (data?: T) => void;

let isNativeTokenRequestInProgress = false;
let nativeTokenCallbackQueue: Callback<string>[] = [];

declare global {
  interface Window {
    nativebridge?: {
      requestToken: () => void;
      resolveToken: (token: string) => void;
      requestQR: () => void;
      resolveQR: (qrString: string) => void;
      resolveQRCode: (qrData: string) => void;
      rejectQRCode: (error: string) => void;
      resolveSaveLocalData: () => void;
      rejectSaveLocalData: (error: string) => void;
      resolveGetLocalData: (data: { value: string | null }) => void;
      rejectGetLocalData: (error: string) => void;
      // Cross-microapp bridge API (provided by SuperApp).
      requestOpenMicroApp: (targetAppId: string, launchData?: unknown) => void;
    };
    ReactNativeWebView?: {
      postMessage: (message: string) => void;
    };
  }
}

// Function to get token from React Native
export const getToken = (callback: Callback<string>): void => {

  if (!window.nativebridge) {
    Logger.error("Native bridge is not available");
    callback();
    return;
  }

  nativeTokenCallbackQueue.push(callback);
  if (isNativeTokenRequestInProgress) return;

  isNativeTokenRequestInProgress = true;
  window.nativebridge.resolveToken = (token: string) => {
    const queue = nativeTokenCallbackQueue;
    nativeTokenCallbackQueue = [];
    isNativeTokenRequestInProgress = false;

    queue.forEach((cb) => {
      try {
        cb(token);
      } catch (error) {
        Logger.error("Error while executing native token callback", error);
      }
    });
  };

  try {
    window.nativebridge.requestToken();
  } catch (error) {
    Logger.error("Failed to request token from native bridge", error);
    const queue = nativeTokenCallbackQueue;
    nativeTokenCallbackQueue = [];
    isNativeTokenRequestInProgress = false;
    window.nativebridge.resolveToken = () => {};
    queue.forEach((cb) => {
      try {
        cb();
      } catch (callbackError) {
        Logger.error(
          "Error while executing native token callback after request failure",
          callbackError,
        );
      }
    });
  }
};

/**
 * Trigger an action in the super app
 * @param topic - The topic to trigger
 * @param data - The data to send
 */
const triggerSuperAppAction = (topic: TopicType, data?: unknown): void => {
  if (window.ReactNativeWebView) {
    const messageData = JSON.stringify({
      topic,
      data,
    });
    window.ReactNativeWebView.postMessage(messageData);
  } else {
    Logger.error(ErrorMessages.NATIVE_BRIDGE_NOT_AVAILABLE);
  }
};

/**
 * Send a log message to the native side
 * @param message - The message to send
 * @param data - The data to send
 * @param level - The level of the log
 */
export const sendNativeLog = (
  message?: string,
  data?: unknown,
  level: LogLevel = "debug",
): void => {
  if (window.nativebridge && window.ReactNativeWebView) {
    triggerSuperAppAction(TOPIC.NATIVE_LOG, {
      message,
      data,
      level,
    });
  } else {
    Logger.error(ErrorMessages.NATIVE_BRIDGE_NOT_AVAILABLE);
  }
};

export const goToMyAppsScreen = (): void => {
  if (window.nativebridge) {
    triggerSuperAppAction(TOPIC.NAVIGATE_TO_MY_APPS);
  }
};

// Scan QR Code
export const scanQRCode = (
  successCallback: (qrData: string) => void,
  failedToRespondCallback: (error: string) => void,
): void => {
  if (window.nativebridge && window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(
      JSON.stringify({ topic: TOPIC.QR_REQUEST }),
    );

    window.nativebridge.resolveQRCode = (qrData: string) =>
      successCallback(qrData);
    window.nativebridge.rejectQRCode = (error: string) =>
      failedToRespondCallback(error);
  } else {
    Logger.error("Native bridge is not available");
  }
};

function normalizeKey(key: string): string {
  // Keep the same normalization logic as the wallet microapp bridge.
  return key.toString().replace(" ", "-").toLowerCase();
}

function encodeValue(value: unknown): string {
  return btoa(JSON.stringify(value));
}

function decodeValue<T>(value: string): T {
  return JSON.parse(atob(value)) as T;
}

export const saveLocalDataAsync = async (key: string, value: unknown) => {
  const normalizedKey = normalizeKey(key);
  const encodedValue = encodeValue(value);

  return new Promise<void>((resolve, reject) => {
    if (!window.nativebridge || !window.ReactNativeWebView) {
      Logger.error(ErrorMessages.NATIVE_BRIDGE_NOT_AVAILABLE);
      reject(ErrorMessages.NATIVE_BRIDGE_NOT_AVAILABLE);
      return;
    }

    window.nativebridge.resolveSaveLocalData = () => resolve();
    window.nativebridge.rejectSaveLocalData = (error: string) => reject(error);

    triggerSuperAppAction(TOPIC.SAVE_LOCAL_DATA, {
      key: normalizedKey,
      value: encodedValue,
    });
  });
};

export const getLocalDataAsync = async <T = unknown>(key: string) => {
  const normalizedKey = normalizeKey(key);

  return new Promise<T | null>((resolve, reject) => {
    if (!window.nativebridge || !window.ReactNativeWebView) {
      Logger.error(ErrorMessages.NATIVE_BRIDGE_NOT_AVAILABLE);
      reject(ErrorMessages.NATIVE_BRIDGE_NOT_AVAILABLE);
      return;
    }

    window.nativebridge.resolveGetLocalData = ({ value }) => {
      if (!value) {
        resolve(null);
        return;
      }
      try {
        resolve(decodeValue<T>(value));
      } catch {
        resolve(null);
      }
    };
    window.nativebridge.rejectGetLocalData = (error: string) => reject(error);

    triggerSuperAppAction(TOPIC.GET_LOCAL_DATA, {
      key: normalizedKey,
    });
  });
};

/**
 * Request the super app to open another micro app.
 * Used for switching to the Wallet microapp for payment.
 */
export const requestOpenMicroApp = (
  targetAppId: string,
  launchData?: unknown,
): void => {
  if (window.nativebridge?.requestOpenMicroApp) {
    window.nativebridge.requestOpenMicroApp(targetAppId, launchData);
    return;
  }

  // Fallback: direct postMessage in case the injected bridge method isn't typed.
  if (window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(
      JSON.stringify({
        topic: "open_micro_app",
        data: { targetAppId, launchData },
      }),
    );
    return;
  }

  Logger.error(ErrorMessages.NATIVE_BRIDGE_NOT_AVAILABLE);
};
