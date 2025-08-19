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

import { IS_MICROAPP } from "../config/config";
import { type RequestOptions } from "./http";
import { ApiService } from "./apiService";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export function executeWithTokenHandling(
  handleRequest: ({
    url,
    method,
    body,
    successFn,
    failFn,
    loadingFn,
    headers,
    currentTry,
  }: RequestOptions) => Promise<void>,
  handleRequestWithNewToken: (callback: () => void) => void,
  url: string,
  method: HttpMethod,
  body: Object | null,
  successFn: (param: any) => void,
  failFn: (param: any) => void,
  loadingFn: (param: any) => void,
  headers?: HeadersInit | null
) {
  if (IS_MICROAPP) {
    handleRequestWithNewToken(() => {
      handleRequest({
        url,
        method,
        body,
        successFn,
        failFn,
        loadingFn,
        headers: headers ?? undefined,
      });
    });
  } else {
    ApiService.handleRequest(
      url,
      method,
      body,
      successFn,
      failFn,
      loadingFn,
      null
    );
  }
}

export function getDisplayNameFromJWT(token: string) {
  try {
    const base64Url: string = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );
    const payload = JSON.parse(jsonPayload);

    return payload.given_name + " " + payload.family_name || null;
  } catch (e) {
    console.error("Failed to decode JWT", e);
    return null;
  }
}

export function getEmailFromJWT(token: string) {
  try {
    const base64Url: string = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );
    const payload = JSON.parse(jsonPayload);

    return payload.email || payload.sub || null;
  } catch (e) {
    console.error("Failed to decode JWT", e);
    return null;
  }
}

export function prepareUrlWithEmail(
  urlTemplate: string,
  token: string
): string {
  const email = getEmailFromJWT(token);

  if (!email) {
    console.warn("Email not found in token, returning original URL.");
    return encodeURI(urlTemplate);
  }

  const urlWithEmail = urlTemplate.replace(
    "[email]",
    encodeURIComponent(email)
  );
  return encodeURI(urlWithEmail);
}
