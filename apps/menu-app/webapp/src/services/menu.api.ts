// RTK Query API for menu-related endpoints
import { createApi } from "@reduxjs/toolkit/query/react";

import type { Menu } from "@/types/types";

import { baseQueryWithRetry } from "./BaseQuery";

export const menuApi = createApi({
  reducerPath: "menuApi",
  baseQuery: baseQueryWithRetry,
  tagTypes: ["Menu"],
  endpoints: (builder) => ({
    getMenu: builder.query<Menu, void>({
      query: () => "menu",
      providesTags: ["Menu"],
    }),
  }),
});

export const { useGetMenuQuery } = menuApi;
