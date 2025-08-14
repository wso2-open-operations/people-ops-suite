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

import {
  getAccessToken,
  setIdToken,
  setAccessToken,
  getIdToken,
} from "./oauth";
import { getToken } from "../components/microapp-bridge";
import { prepareUrlWithEmail } from "./utils";
import { decodeJWT } from "./jwtUtils";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface RequestOptions {
  url: string;
  method: HttpMethod;
  body?: any;
  successFn: (data: any) => void;
  failFn?: (error?: string) => void;
  loadingFn?: (isLoading: boolean) => void;
  headers?: HeadersInit;
  currentTry?: number;
}

const useHttp = () => {
  const MAX_TRIES = 4;

  const handleRequest = async ({
    url,
    method,
    body,
    successFn,
    failFn,
    loadingFn,
    headers,
    currentTry = 1,
  }: RequestOptions): Promise<void> => {
    try {
      if (loadingFn) {
        loadingFn(true);
      }

      const token = getAccessToken();
      if (!token) throw "Token not found";

      const encodedUrl = prepareUrlWithEmail(url, token);
      const defaultHeaders: Record<string, string> = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      // const xJwtAssertion = token;
      // if (xJwtAssertion) {
      //   defaultHeaders["x-jwt-assertion"] = xJwtAssertion;
      // }

      const response = await fetch(encodedUrl, {
        method,
        body: body ? JSON.stringify(body) : null,
        headers: headers || defaultHeaders,
      });

      let responseBody: any = "";
      // let isGatewayForbidden = false;

      try {
        responseBody = await response.json();
      } catch (e) {
        if (response.status === 403) {
          // isGatewayForbidden = true;
        }
      } finally {
        if ([200, 201, 202].includes(response.status)) {
          successFn(responseBody);
          if (loadingFn) loadingFn(false);
        } else {
          if (response.status === 401 && currentTry < MAX_TRIES) {
            handleRequestWithNewToken(() => {
              handleRequest({
                url,
                method,
                body,
                successFn,
                failFn,
                loadingFn,
                headers,
                currentTry: currentTry + 1,
              });
            });
          } else if (currentTry < MAX_TRIES && response.status !== 404) {
            handleRequest({
              url,
              method,
              body,
              successFn,
              failFn,
              loadingFn,
              headers,
              currentTry: currentTry + 1,
            });
          } else {
            console.error(
              (responseBody && responseBody.error) || response.status
            );
            if (failFn)
              failFn((responseBody && responseBody.error) || response.status);
            if (loadingFn) loadingFn(false);
          }
        }
      }
    } catch (err) {
      console.error(err);
      if (failFn) failFn();
      if (loadingFn) loadingFn(false);
    }
  };

  const handleCheckGroups = (
    groupNames: string[] | string,
    resFn: (data: boolean) => void
  ) => {
    const token = getIdToken();

    if (!token) {
      console.error("Jwt token not found");
      resFn(false);
    } else {
      const decoded = decodeJWT<{ groups?: string[] }>(token);
      const userGroups = decoded?.groups ?? [];

      // Normalize input to an array
      const requiredGroups = Array.isArray(groupNames)
        ? groupNames
        : [groupNames];

      const status = requiredGroups.some((group) => userGroups.includes(group));

      resFn(status);
    }
  };

  /**
   * Queue-based token refresh mechanism to prevent race conditions.
   *
   * Problem:
   * When multiple API calls detect an expired token at the same time, each tries to
   * refresh the token simultaneously. This causes multiple redundant token refresh
   * requests and leads to all callbacks being invoked multiple times.
   *
   * Solution:
   * We enqueue all pending callbacks and process them one by one using a flag (`isTokenRequestInProgress`)
   * to ensure only a single token refresh request is active at a time.
   * Once the token is refreshed, all queued callbacks are executed in order.
   *
   * This avoids race conditions and ensures that:
   * - Only one token refresh is sent to the server at a time
   * - All pending requests are resumed after a successful refresh
   */

  const tokenRequestQueue: (() => void)[] = [];
  let isTokenRequestInProgress = false;

  const handleRequestWithNewToken = (callback: () => void): void => {
    tokenRequestQueue.push(callback);
    processTokenQueue();
  };

  const processTokenQueue = () => {
    if (isTokenRequestInProgress || tokenRequestQueue.length === 0) return;

    isTokenRequestInProgress = true;

    const callback = tokenRequestQueue.shift();

    getToken((idToken: string | undefined) => {
      if (idToken) {
        setIdToken(idToken);
        setAccessToken(idToken);

        if (callback) {
          callback(); // Await the callback
        }

        isTokenRequestInProgress = false;
        processTokenQueue(); // Move to next in the queue
      }
    });
  };

  return {
    handleRequest,
    handleRequestWithNewToken,
    handleCheckGroups,
  };
};

export default useHttp;
