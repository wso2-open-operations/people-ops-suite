// RTK Query API for menu-related endpoints
import { createApi } from "@reduxjs/toolkit/query/react";

import type { Menu, MetaData, RawMenu, RawMetaData } from "@/types/types";

import { baseQueryWithRetry } from "./BaseQuery";

const transformMetaData = (data: RawMetaData): MetaData => ({
  title: data.title.trim() === "" ? null : data.title,
  description: data.description.trim() === "" ? null : data.description,
});

const transformMenuResponse = (response: RawMenu): Menu => ({
  date: response.date,
  breakfast: transformMetaData(response.breakfast),
  juice: transformMetaData(response.juice),
  lunch: transformMetaData(response.lunch),
  dessert: transformMetaData(response.dessert),
  snack: transformMetaData(response.snack),
});

export const menuApi = createApi({
  reducerPath: "menuApi",
  baseQuery: baseQueryWithRetry,
  tagTypes: ["Menu"],
  endpoints: (builder) => ({
    getMenu: builder.query<Menu, void>({
      query: () => "menu",
      providesTags: ["Menu"],
      transformResponse: (response: RawMenu) => transformMenuResponse(response),
    }),
  }),
});

export const { useGetMenuQuery } = menuApi;
