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

import type { HttpMethod } from "@asgardeo/auth-react";

const MAX_TRIES = 2;

export class ApiService {
  private static _apiInstance: ApiService;
  private _getIdToken: (() => Promise<string>) | null = null;

  private constructor(getIdToken: (() => Promise<string>) | null) {
    this._getIdToken = getIdToken;
  }

  public static setApiInstance(getIdToken: () => Promise<string>) {
    ApiService._apiInstance = new ApiService(getIdToken);
  }

  public static getApiInstance(): ApiService {
    if (!this._apiInstance) {
      throw new Error("API instance not set.");
    }
    return this._apiInstance;
  }

  public static handleRequest = async (
    url: string,
    method: HttpMethod,
    body: Object | null,
    successFn: (param: any) => void,
    failFn: (param: any) => void,
    loadingFn: (param: any) => void,
    currentTry?: number | null
  ) => {
    var tries: number = Boolean(currentTry) ? (currentTry as number) : 0;
    try {
      if (loadingFn) {
        loadingFn(true);
      }

      var encodedUrl = encodeURI(url);
      var bearerToken: string =
        "Bearer " + (await ApiService._apiInstance?._getIdToken?.());

      const response = await fetch(encodedUrl, {
        method: method,
        body: body ? JSON.stringify(body) : null,
        headers: {
          "Content-Type": "application/json",
          Authorization: bearerToken,
          // "x-jwt-assertion": getAccessToken(),
        },
      });

      let responseBody: any;

      // Assumptions
      // The only reason we may get 403 responses from Gateway is due to user input validation issues (rules blocking certain user inputs).
      // The other reasons may be due to code-level issues. But we assume they are already fixed after testing.
      // We only show the custom error msg for post / patch / put requests
      // We also assume that the gateway is sending a html page in response (therefore no json body and therefore handled in catch)
      try {
        responseBody = await response.json();
      } catch (e) {
      } finally {
        let customErrMsg = "";

        if (
          response.status === 200 ||
          response.status === 202 ||
          response.status === 201
        ) {
          successFn(responseBody);

          if (loadingFn) {
            loadingFn(false);
          }
        } else {
          if (response.status === 401 && tries < MAX_TRIES) {
            // refreshAccessToken().then(() => handleRequest(encodedUrl, method, body, successFn, failFn, loadingFn, null, ++tries));
          } else if (tries < MAX_TRIES) {
            ApiService.handleRequest(
              encodedUrl,
              method,
              body,
              successFn,
              failFn,
              loadingFn,
              null
            );
          } else {
            console.error(
              (responseBody && responseBody.error) || response.status
            );
            if (failFn) {
              failFn(customErrMsg);
            }
            if (loadingFn) {
              loadingFn(false);
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
      if (failFn) {
        failFn(err);
      }
      if (loadingFn) {
        loadingFn(false);
      }
    }
  };
}
