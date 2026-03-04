// Copyright (c) 2025 WSO2 LLC. (https://www.wso2.com).
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
import axios, { AxiosInstance, CancelTokenSource } from "axios";
import * as rax from "retry-axios";

import {
  API_RETRY_ATTEMPTS,
  API_RETRY_DELAY_MS,
  API_RETRY_METHODS,
  API_RETRY_STATUS_CODES,
} from "@config/auth";
import { CommonMessage } from "@config/messages";

export class APIService {
  private static _instance: AxiosInstance;
  private static _idToken: string;
  private static _cancelTokenSource = axios.CancelToken.source();
  private static _cancelTokenMap: Map<string, CancelTokenSource> = new Map();
  private static callback: () => Promise<{ accessToken: string }>;

  private static _isRefreshing = false;
  private static _refreshPromise: Promise<{ accessToken: string }> | null = null;

  constructor(idToken: string, callback: () => Promise<{ accessToken: string }>) {
    APIService._instance = axios.create();
    rax.attach(APIService._instance);

    APIService._idToken = idToken;
    APIService.updateRequestInterceptor();
    APIService.updateResponseInterceptor();
    APIService.callback = callback;
    (APIService._instance.defaults as unknown as rax.RaxConfig).raxConfig = {
      retry: API_RETRY_ATTEMPTS,
      instance: APIService._instance,
      httpMethodsToRetry: API_RETRY_METHODS,
      statusCodesToRetry: API_RETRY_STATUS_CODES,
      retryDelay: API_RETRY_DELAY_MS,

      onRetryAttempt: async () => {
        if (!APIService._isRefreshing && !APIService._refreshPromise) {
          APIService._isRefreshing = true;
          APIService._refreshPromise = Promise.resolve()
            .then(() => APIService.callback())
            .then((res) => {
              APIService.updateTokens(res.accessToken);
              APIService._instance.interceptors.request.clear();
              APIService.updateRequestInterceptor();
              return res;
            })
            .finally(() => {
              APIService._isRefreshing = false;
              APIService._refreshPromise = null;
            });
        }

        const refresh = APIService._refreshPromise;
        if (!refresh) {
          APIService._isRefreshing = false;
          APIService._refreshPromise = null;
          return Promise.reject(new Error(CommonMessage.auth.tokenRefreshPromiseMissing));
        }

        return refresh;
      },
    };
  }

  public static getInstance(): AxiosInstance {
    return APIService._instance;
  }

  public static getCancelToken() {
    return APIService._cancelTokenSource;
  }

  public static updateCancelToken(): CancelTokenSource {
    APIService._cancelTokenSource = axios.CancelToken.source();
    return APIService._cancelTokenSource;
  }

  private static updateTokens(idToken: string) {
    APIService._idToken = idToken;
  }

  private static clearEndpointCancelToken(config?: unknown) {
    const endpointKey = (config as { _endpointKey?: string } | undefined)?._endpointKey;
    const requestToken = (config as { _cancelTokenSource?: CancelTokenSource } | undefined)?._cancelTokenSource;

    if (!endpointKey || !requestToken) {
      return;
    }

    const currentToken = APIService._cancelTokenMap.get(endpointKey);
    if (currentToken === requestToken) {
      APIService._cancelTokenMap.delete(endpointKey);
    }
  }

  private static updateResponseInterceptor() {
    APIService._instance.interceptors.response.use(
      (response) => {
        APIService.clearEndpointCancelToken(response.config);
        return response;
      },
      (error) => {
        APIService.clearEndpointCancelToken(error?.config);
        return Promise.reject(error);
      },
    );
  }

  private static updateRequestInterceptor() {
    APIService._instance.interceptors.request.use(
      (config) => {
        // config.headers.set("x-jwt-assertion", APIService._idToken);
        config.headers.set("Authorization", "Bearer " + APIService._idToken);

        // Create a unique key including URL and query params
        const endpoint = config.url || "";
        const params = config.params ? `?${new URLSearchParams(config.params).toString()}` : "";
        const endpointKey = `${endpoint}${params}`;

        // Only auto-cancel GET requests. POST/PUT/DELETE requests should be allowed
        // to run concurrently even to the same endpoint (e.g., saving breakfast and lunch).
        if (config.method?.toUpperCase() === "GET") {
          const existingToken = APIService._cancelTokenMap.get(endpointKey);
          if (existingToken) {
            existingToken.cancel(`Request cancelled for endpoint: ${endpointKey}`);
          }

          const newTokenSource = axios.CancelToken.source();
          APIService._cancelTokenMap.set(endpointKey, newTokenSource);
          (config as { _endpointKey?: string })._endpointKey = endpointKey;
          (config as { _cancelTokenSource?: CancelTokenSource })._cancelTokenSource = newTokenSource;
          config.cancelToken = newTokenSource.token;
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      },
    );
  }
}
