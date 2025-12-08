import { fetchBaseQuery, retry } from "@reduxjs/toolkit/query";
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { Mutex } from "async-mutex";

import { SERVICE_BASE_URL } from "../config/config";

let ACCESS_TOKEN: string;
let REFRESH_TOKEN_CALLBACK: () => Promise<{ accessToken: string }>;

export const setTokens = (
  accessToken: string,
  refreshCallback: () => Promise<{ accessToken: string }>,
) => {
  ACCESS_TOKEN = accessToken;
  REFRESH_TOKEN_CALLBACK = refreshCallback;
};

const baseQuery = fetchBaseQuery({
  baseUrl: SERVICE_BASE_URL,
  prepareHeaders: (headers) => {
    if (ACCESS_TOKEN) {
      headers.set("Authorization", `Bear${ACCESS_TOKEN}`);
      headers.set("x-jwt-assertion", ACCESS_TOKEN);
    }
  },
});

const mutex = new Mutex();
const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  await mutex.waitForUnlock();
  let result = await baseQuery(args, api, extraOptions);
  if (result.error && result.error.status === 401) {
    if (!mutex.isLocked()) {
      const release = await mutex.acquire();

      try {
        const refreshResult = await REFRESH_TOKEN_CALLBACK();
        if (refreshResult?.accessToken) {
          ACCESS_TOKEN = refreshResult.accessToken;
          result = await baseQuery(args, api, extraOptions);
        } else {
          // logout
        }
      } catch (error) {
        console.error("Error refreshing token:", error);
      } finally {
        release();
      }
    } else {
      // wait until the mutex is available without locking it
      await mutex.waitForUnlock();
      result = await baseQuery(args, api, extraOptions);
    }
  }
  return result;
};

/**
 * Base query with retry logic and automatic token refresh
 * Retries failed requests up to 3 times
 */
export const baseQueryWithRetry = retry(baseQueryWithReauth, {
  maxRetries: 3,
});
