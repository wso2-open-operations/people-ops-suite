// RTK Query API for user-related endpoints
import { createApi } from "@reduxjs/toolkit/query/react";

import { AppConfig } from "@config/config";

import { baseQueryWithRetry } from "./BaseQuery";

export interface UserInfoInterface {
  employeeId: string;
  firstName: string;
  lastName: string;
  workEmail: string;
  employeeThumbnail: string | null;
  jobRole: string;
  privileges: number[];
}

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

export const { useGetUserInfoQuery } = userApi;
