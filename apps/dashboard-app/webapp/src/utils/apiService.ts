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
import axios, { AxiosInstance, CancelTokenSource } from "axios";
import * as rax from "retry-axios";

import {
  API_RETRY_ATTEMPTS,
  API_RETRY_DELAY_MS,
  API_RETRY_METHODS,
  API_RETRY_STATUS_CODES,
} from "@config/auth";
import { CommonMessage } from "@config/messages";

interface APIServiceOptions {
  idToken: string;
  callback: () => Promise<{ idToken: string }>;
}

class APIService {
  private instance: AxiosInstance;
  private idToken: string;
  private authRequestInterceptorId: number | null = null;
  private authResponseInterceptorId: number | null = null;
  private cancelTokenSource = axios.CancelToken.source();
  private cancelTokenMap: Map<string, CancelTokenSource> = new Map();
  private callback: () => Promise<{ idToken: string }>;

  private isRefreshing = false;
  private refreshPromise: Promise<{ idToken: string }> | null = null;

  constructor(options: APIServiceOptions) {
    this.instance = axios.create();
    rax.attach(this.instance);

    this.idToken = options.idToken;
    this.callback = options.callback;

    (this.instance.defaults as unknown as rax.RaxConfig).raxConfig = {
      retry: API_RETRY_ATTEMPTS,
      instance: this.instance,
      httpMethodsToRetry: API_RETRY_METHODS,
      statusCodesToRetry: API_RETRY_STATUS_CODES,
      retryDelay: API_RETRY_DELAY_MS,

      onRetryAttempt: async () => {
        const existingPromise = this.refreshPromise;
        if (existingPromise) {
          return existingPromise;
        }

        if (!this.isRefreshing) {
          this.isRefreshing = true;
          const promise = Promise.resolve()
            .then(() => this.callback())
            .then((res) => {
              this.updateTokens(res.idToken);
              this.updateRequestInterceptor();
              return res;
            })
            .finally(() => {
              this.isRefreshing = false;
              this.refreshPromise = null;
            });
          this.refreshPromise = promise;
        }

        const refresh = this.refreshPromise;
        if (!refresh) {
          this.isRefreshing = false;
          return Promise.reject(new Error(CommonMessage.auth.tokenRefreshPromiseMissing));
        }

        return refresh;
      },
    };

    this.updateRequestInterceptor();
    this.updateResponseInterceptor();
  }

  public getAxiosInstance(): AxiosInstance {
    return this.instance;
  }

  public getCancelToken() {
    return this.cancelTokenSource;
  }

  public updateCancelToken(): CancelTokenSource {
    this.cancelTokenSource = axios.CancelToken.source();
    return this.cancelTokenSource;
  }

  public updateTokens(idToken: string) {
    this.idToken = idToken;
  }

  public clearEndpointCancelToken(config?: unknown) {
    const endpointKey = (config as { _endpointKey?: string } | undefined)?._endpointKey;
    const requestToken = (config as { _cancelTokenSource?: CancelTokenSource } | undefined)
      ?._cancelTokenSource;

    if (!endpointKey || !requestToken) {
      return;
    }

    const currentToken = this.cancelTokenMap.get(endpointKey);
    if (currentToken === requestToken) {
      this.cancelTokenMap.delete(endpointKey);
    }
  }

  public updateResponseInterceptor() {
    if (this.authResponseInterceptorId !== null) {
      this.instance.interceptors.response.eject(this.authResponseInterceptorId);
    }

    this.authResponseInterceptorId = this.instance.interceptors.response.use(
      (response) => {
        this.clearEndpointCancelToken(response.config);
        return response;
      },
      (error) => {
        this.clearEndpointCancelToken(error?.config);
        return Promise.reject(error);
      },
    );
  }

  public updateRequestInterceptor() {
    if (this.authRequestInterceptorId !== null) {
      this.instance.interceptors.request.eject(this.authRequestInterceptorId);
    }

    this.authRequestInterceptorId = this.instance.interceptors.request.use(
      (config) => {
        config.headers.set("Authorization", `Bearer ${this.idToken}`);

        const endpoint = config.url || "";
        const params = config.params ? `?${new URLSearchParams(config.params).toString()}` : "";
        const endpointKey = `${endpoint}${params}`;

        if (config.method?.toUpperCase() === "GET") {
          const existingToken = this.cancelTokenMap.get(endpointKey);
          if (existingToken) {
            existingToken.cancel(`Request cancelled for endpoint: ${endpointKey}`);
          }

          const newTokenSource = axios.CancelToken.source();
          this.cancelTokenMap.set(endpointKey, newTokenSource);
          (config as { _endpointKey?: string })._endpointKey = endpointKey;
          (config as { _cancelTokenSource?: CancelTokenSource })._cancelTokenSource =
            newTokenSource;
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

let apiServiceInstance: APIService | null = null;

export const initializeAPIService = (options: APIServiceOptions): APIService => {
  apiServiceInstance = new APIService(options);
  return apiServiceInstance;
};

export const getAPIService = (): AxiosInstance => {
  if (!apiServiceInstance) {
    throw new Error("APIService not initialized. Call initializeAPIService first.");
  }
  return apiServiceInstance.getAxiosInstance();
};

export const updateAPITokens = (idToken: string): void => {
  if (apiServiceInstance) {
    apiServiceInstance.updateTokens(idToken);
    apiServiceInstance.updateRequestInterceptor();
  }
};

export default apiServiceInstance;
