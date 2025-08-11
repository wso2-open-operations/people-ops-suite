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

import useHttp from "@/utils/http";
import { executeWithTokenHandling } from "@/utils/utils";

const { handleRequest, handleRequestWithNewToken } = useHttp();

const apiClient = <T = any>(
  url: string,
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  body?: Object | null,
  headers?: HeadersInit | null
): Promise<T> => {
  return new Promise((resolve, reject) => {
    executeWithTokenHandling(
      handleRequest,
      handleRequestWithNewToken,
      url,
      method,
      body || null,
      (data: T) => resolve(data),
      (error: any) => reject(error),
      () => {},
      headers
    );
  });
};

export const api = {
  get: <T = any>(url: string, headers?: HeadersInit) =>
    apiClient<T>(url, "GET", null, headers),

  post: <T = any>(url: string, body?: Object, headers?: HeadersInit) =>
    apiClient<T>(url, "POST", body, headers),

  put: <T = any>(url: string, body?: Object, headers?: HeadersInit) =>
    apiClient<T>(url, "PUT", body, headers),

  patch: <T = any>(url: string, body?: Object, headers?: HeadersInit) =>
    apiClient<T>(url, "PATCH", body, headers),

  delete: <T = any>(url: string, headers?: HeadersInit) =>
    apiClient<T>(url, "DELETE", null, headers),
};

export * from "@/services/api/vehicle.service";
