// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import { SnackMessage, USER_TIMEZONE_OFFSET } from "@config/constant";
import { showSnackBarMessage } from "@slices/commonSlice/common";
import { createSetMaintenanceStatusAction } from "@slices/healthSlice";
import axios, { AxiosInstance, AxiosResponse, AxiosError, CancelTokenSource } from "axios";
import { Dispatch } from "redux";
import * as rax from "retry-axios";

export class ApiService {
  private static _instance: AxiosInstance;
  private static _idToken: string;
  private static _cancelTokenSource = axios.CancelToken.source();
  private static callback: () => Promise<{ idToken: string }>;

  constructor(idToken: string, callback: () => Promise<{ idToken: string }>, dispatch: Dispatch) {
    ApiService._instance = axios.create();
    rax.attach(ApiService._instance);

    ApiService._idToken = idToken;
    ApiService.updateRequestInterceptor();
    ApiService.callback = callback;

    ApiService._instance.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error: AxiosError) => {
        if (error.response && error.response.status === 503) {
          const responseData = error.response?.data as { message: string };
          try {
            const message = JSON.parse(responseData.message) as {
              isMaintenanceMode?: boolean;
              maintenanceMessage?: string;
            };

            if (message.isMaintenanceMode && message.maintenanceMessage) {
              const setMaintenanceStatusAction = createSetMaintenanceStatusAction(true, message.maintenanceMessage);
              dispatch(setMaintenanceStatusAction);
            }
          } catch (parseError) {
            showSnackBarMessage(snackMessages.error.maintenanceMessageParseError, "error");
          }
        }
        return Promise.reject(error);
      }
    );
    (ApiService._instance.defaults as unknown as rax.RaxConfig).raxConfig = {
      retry: 3,
      instance: ApiService._instance,
      httpMethodsToRetry: ["GET", "HEAD", "OPTIONS", "DELETE", "POST", "PATCH"],
      statusCodesToRetry: [[401]],
      retryDelay: 100,

      onRetryAttempt: async (err) => {
        var res = await callback();
        ApiService.updateTokens(res.idToken);
        ApiService._instance.interceptors.request.clear();
        ApiService.updateRequestInterceptor();
      },
    };
  }

  public static getInstance(): AxiosInstance {
    return ApiService._instance;
  }

  public static getCancelToken() {
    return ApiService._cancelTokenSource;
  }

  public static updateCancelToken(): CancelTokenSource {
    ApiService._cancelTokenSource = axios.CancelToken.source();
    return ApiService._cancelTokenSource;
  }

  private static updateTokens(idToken: string) {
    ApiService._idToken = idToken;
  }

  private static updateRequestInterceptor() {
    ApiService._instance.interceptors.request.use(
      async (config) => {
        let res = await this.callback();
        config.headers.set("Authorization", "Bearer " + res.idToken);
        config.headers.set("x-jwt-assertion", res.idToken);
        config.headers.set("x-user-timezone-offset", USER_TIMEZONE_OFFSET);
        return config;
      },
      (error) => {
        Promise.reject(error);
      }
    );
  }
}