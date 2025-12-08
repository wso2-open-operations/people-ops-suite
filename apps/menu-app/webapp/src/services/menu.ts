// Need to use the React-specific entry point to import createApi
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

import type { Menu } from "@/types/types";

import { SERVICE_BASE_URL } from "../config/config";

let ID_TOKEN: string;
let REFRESH_TOKEN: () => Promise<{ accessToken: string }>;

export const setTokens = (idToken: string, accessToken: () => Promise<{ accessToken: string }>) => {
  ((ID_TOKEN = idToken), (REFRESH_TOKEN = accessToken));
};

export const menuApi = createApi({
  reducerPath: "menuApi",
  baseQuery: fetchBaseQuery({
    baseUrl: SERVICE_BASE_URL,
    prepareHeaders: (headers) => {
      headers.set("authorization", `Bearer ${ID_TOKEN}`);
      headers.set("x-jwt-assertion", ID_TOKEN);
    },
  }),
  endpoints: (builder) => ({
    getMenu: builder.query<Menu, void>({
      query: () => "menu",
    }),
  }),
});

export const {useGetMenuQuery} = menuApi;
