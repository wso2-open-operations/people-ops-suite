// RTK Query API for user-related endpoints
import { createApi } from "@reduxjs/toolkit/query/react";

import { UserInfoInterface } from "@/types/types";
import { AppConfig } from "@config/config";

import { baseQueryWithRetry } from "./BaseQuery";

export const userApi = createApi({
  reducerPath: "userApi",
  baseQuery: baseQueryWithRetry,
  tagTypes: ["User"],
  endpoints: (builder) => ({
    /**
     * Fetch current user information
     * Automatically caches and deduplicates requests
     */
    getUserInfo: builder.query<UserInfoInterface, void>({
      query: () => AppConfig.serviceUrls.userInfo,
      providesTags: ["User"],
    }),
  }),
});

export const { useGetUserInfoQuery, useLazyGetUserInfoQuery } = userApi;
