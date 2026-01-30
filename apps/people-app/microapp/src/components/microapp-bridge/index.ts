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

declare global {
  interface Window {
    nativebridge?: {
      requestToken: () => void;
      resolveToken: (token: string) => void;
      requestQR: () => void;
      resolveQR: (qrString: string) => void;
      resolveQRCode: (qrData: string) => void;
      rejectQRCode: (error: string) => void;
    };
    ReactNativeWebView?: {
      postMessage: (message: string) => void;
    };
  }
}

// Function to get token from React Native
export const getToken = (callback: Callback<string>): void => {
  if (window.nativebridge) {
    window.nativebridge.requestToken();
    window.nativebridge.resolveToken = (token: string) => {
      callback(token);
    };
  } else {
    console.error("Native bridge is not available");
    callback();
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
    console.error(ErrorMessages.NATIVE_BRIDGE_NOT_AVAILABLE);
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
    console.error("Native bridge is not available");
  }
};
