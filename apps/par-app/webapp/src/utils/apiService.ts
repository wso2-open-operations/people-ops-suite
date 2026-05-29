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

import axios, { AxiosError, AxiosInstance, AxiosResponse, CancelTokenSource } from "axios";
import { Dispatch } from "redux";
import * as rax from "retry-axios";

import { SnackMessage, USER_TIMEZONE_OFFSET } from "@config/constant";
import { ShowSnackBarMessage } from "@slices/commonSlice/common";
import { setMaintenanceStatus } from "@slices/healthSlice/health";

export class ApiService {
  private static _instance: AxiosInstance;
  private static _cancelTokenSource = axios.CancelToken.source();
  private static callback: () => Promise<{ idToken: string }>;

  constructor(callback: () => Promise<{ idToken: string }>, dispatch: Dispatch) {
    ApiService._instance = axios.create();
    rax.attach(ApiService._instance);

    ApiService.callback = callback;
    ApiService.updateRequestInterceptor();

    ApiService._instance.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error: AxiosError) => {
        if (error.response && error.response.status === 503) {
          const responseData = error.response.data as { message: string };
          try {
            const message = JSON.parse(responseData.message) as {
              isMaintenanceMode?: boolean;
              maintenanceMessage?: string;
            };

            if (message.isMaintenanceMode && message.maintenanceMessage) {
              dispatch(
                setMaintenanceStatus({
                  maintenanceStatus: true,
                  maintenanceMessage: message.maintenanceMessage,
                }),
              );
            }
          } catch (parseError) {
            ShowSnackBarMessage(SnackMessage.error.maintenanceMessageParseError, "error");
          }
        }
        return Promise.reject(error);
      },
    );
    (ApiService._instance.defaults as unknown as rax.RaxConfig).raxConfig = {
      retry: 3,
      instance: ApiService._instance,
      httpMethodsToRetry: ["GET", "HEAD", "OPTIONS", "DELETE", "POST", "PATCH"],
      statusCodesToRetry: [[401]],
      retryDelay: 100,

      onRetryAttempt: async (_err) => {
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

  private static updateRequestInterceptor() {
    ApiService._instance.interceptors.request.use(
      async (config) => {
        const res = await this.callback();
        config.headers.set("Authorization", "Bearer " + res.idToken);
        config.headers.set("x-jwt-assertion", res.idToken);
        config.headers.set("x-user-timezone-offset", USER_TIMEZONE_OFFSET);
        return config;
      },
      (error) => {
        return Promise.reject(error);
      },
    );
  }
}
