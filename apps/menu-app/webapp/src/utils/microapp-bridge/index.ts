// Copyright (c) 2026, WSO2 LLC. (http://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

type Callback<T> = (data?: T) => void;

export enum Topic {
  nativeLog = "native_log",
}

declare global {
  interface Window {
    nativebridge?: {
      requestToken: () => void;
      resolveToken: (token: string) => void;
    };
    ReactNativeWebView?: {
      postMessage: (message: string) => void;
    };
  }
}

/**
 * Fetch the token from the native bridge
 * @param callback - The callback to receive the token
 */
export const getToken = (callback: Callback<string>): void => {
  if (window.nativebridge) {
    window.nativebridge.requestToken();
    window.nativebridge.resolveToken = (token: string) => {
      callback(token);
    };
  } else {
    console.error("Native bridge is not available to fetch token(s)");
    callback();
  }
};

/**
 * Trigger an action in the super app
 * @param topic - The topic to trigger
 * @param data - The data to send
 */
const triggerSuperAppAction = (topic: Topic, data?: any): void => {
  if (window.ReactNativeWebView) {
    const messageData = JSON.stringify({
      topic,
      data,
    });
    window.ReactNativeWebView.postMessage(messageData);
  } else {
    console.error("React Native WebView is not available");
  }
};

type LogLevel = "error" | "warn" | "info" | "debug";

/**
 * Send a log message to the native side
 * @param message - The message to send
 * @param data - The data to send
 * @param level - The level of the log
 */
export const sendNativeLog = (
  message?: any,
  data?: any,
  level: LogLevel = "debug"
): void => {
  if (window.nativebridge && window.ReactNativeWebView) {
    triggerSuperAppAction(Topic.nativeLog, {
      message,
      data,
      level,
    });
  } else {
    console.error("Native bridge is not available to send logs");
  }
};
