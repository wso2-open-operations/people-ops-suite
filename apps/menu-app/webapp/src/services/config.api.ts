// RTK Query API for application configuration endpoints
import { createApi } from "@reduxjs/toolkit/query/react";

import { AppConfig } from "@config/config";

import { baseQueryWithRetry } from "./BaseQuery";

interface SupportTeamEmail {
  team: string;
  email: string;
}

export interface AppConfigInfo {
  supportTeamEmails: SupportTeamEmail[];
}

export const configApi = createApi({
  reducerPath: "configApi",
  baseQuery: baseQueryWithRetry,
  tagTypes: ["Config"],
  endpoints: (builder) => ({
    /**
     * Fetch application configuration
     * Automatically caches and deduplicates requests
     */
    getAppConfig: builder.query<AppConfigInfo, void>({
      query: () => AppConfig.serviceUrls.appConfig,
      providesTags: ["Config"],
    }),
  }),
});

export const { useGetAppConfigQuery } = configApi;
