// Copyright (c) 2026, WSO2 LLC. (http://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import { sendNativeLog } from ".";

/**
 * Logger class for logging messages to the React Native DevTools
 */
export class Logger {
  // Info/Basic Logs
  static info(message: string, data?: any) {
    sendNativeLog(message, data, "info");
  }

  // Error Logs
  static error(message: string, data?: any) {
    sendNativeLog(message, data, "error");
  }

  // Warning Logs
  static warn(message: string, data?: any) {
    sendNativeLog(message, data, "warn");
  }
}
