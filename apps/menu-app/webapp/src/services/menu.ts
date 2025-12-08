// Need to use the React-specific entry point to import createApi
import { createApi, fetchBaseQuery, retry } from "@reduxjs/toolkit/query/react";
import type { 
  BaseQueryFn, 
  FetchArgs, 
  FetchBaseQueryError 
} from "@reduxjs/toolkit/query";
import { Mutex } from "async-mutex";

import type { Menu } from "@/types/types";

import { SERVICE_BASE_URL } from "../config/config";

// Token management
let ID_TOKEN: string;
let REFRESH_TOKEN_CALLBACK: () => Promise<{ accessToken: string }>;

export const setTokens = (
  idToken: string, 
  refreshCallback: () => Promise<{ accessToken: string }>
) => {
  ID_TOKEN = idToken;
  REFRESH_TOKEN_CALLBACK = refreshCallback;
};

const mutex = new Mutex();

// Base query with headers
const baseQuery = fetchBaseQuery({
  baseUrl: SERVICE_BASE_URL,
  prepareHeaders: (headers) => {
    if (ID_TOKEN) {
      headers.set("authorization", `Bearer ${ID_TOKEN}`);
      headers.set("x-jwt-assertion", ID_TOKEN);
    }
    return headers;
  },
});

// Enhanced base query with automatic token refresh on 401
const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  await mutex.waitForUnlock();
  
  let result = await baseQuery(args, api, extraOptions);

  // Handle 401 Unauthorized errors
  if (result.error && result.error.status === 401) {
    // Check if the mutex is locked (another request is already refreshing)
    if (!mutex.isLocked()) {
      const release = await mutex.acquire();
      
      try {
        const refreshResult = await REFRESH_TOKEN_CALLBACK();
        
        if (refreshResult?.accessToken) {
          ID_TOKEN = refreshResult.accessToken;
          result = await baseQuery(args, api, extraOptions);

        } else {
          console.error("Token refresh failed");
        }
      } catch (error) {
        console.error("Error refreshing token:", error);
      } finally {
        release();
      }
    } else {
      await mutex.waitForUnlock();
      // Retry the query after the token has been refreshed
      result = await baseQuery(args, api, extraOptions);
    }
  }

  return result;
};

// Wrap with retry logic for network errors
const baseQueryWithRetry = retry(
  baseQueryWithReauth,
  {
    maxRetries: 3,
  }
);

export const menuApi = createApi({
  reducerPath: "menuApi",
  baseQuery: baseQueryWithRetry,
  endpoints: (builder) => ({
    getMenu: builder.query<Menu, void>({
      query: () => "menu",
    }),
  }),
});

export const { useGetMenuQuery } = menuApi;
