import { fetchBaseQuery, retry } from "@reduxjs/toolkit/query";
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { Mutex } from "async-mutex";

import { SERVICE_BASE_URL } from "../config/config";

let ACCESS_TOKEN: string;
let REFRESH_TOKEN_CALLBACK: () => Promise<{ accessToken: string }>;
let LOGOUT_CALLBACK: () => void;

export const setTokens = (
  accessToken: string,
  refreshCallback: () => Promise<{ accessToken: string }>,
  logoutCallBack: () => void,
) => {
  ACCESS_TOKEN = accessToken;
  REFRESH_TOKEN_CALLBACK = refreshCallback;
  LOGOUT_CALLBACK = logoutCallBack;
};

const baseQuery = fetchBaseQuery({
  baseUrl: SERVICE_BASE_URL,
  prepareHeaders: (headers) => {
    if (ACCESS_TOKEN) {
      // headers.set("Authorization", `Bearer${ACCESS_TOKEN}`);
      headers.set("x-jwt-assertion", ACCESS_TOKEN);
    }
  },
});

const mutex = new Mutex();
export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
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
          console.error("Token refresh failed - no access token returned");
          LOGOUT_CALLBACK();
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

/*
 * Base query with retry logic and automatic token refresh
 * Retries failed requests up to 3 times
 */
export const baseQueryWithRetry = retry(
  async (args: string | FetchArgs, api, extraOptions) => {
    const result = await baseQuery(args, api, extraOptions);

    if (result.error) {
      if (result.error.status !== 401) {
        retry.fail(result.error, result.meta);
      }
    }

    return result;
  },
  {
    maxRetries: 3,
  },
);
