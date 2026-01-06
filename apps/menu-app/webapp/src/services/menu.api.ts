// RTK Query API for menu-related endpoints
import { createApi } from "@reduxjs/toolkit/query/react";

import type { Menu, MetaData, RawMenu, RawMetaData } from "@/types/types";

import { enqueueSnackbarMessage } from "../slices/commonSlice/common";
import { baseQueryWithRetry } from "./BaseQuery";

interface FeedbackRequest {
  message: string;
  mealType?: string;
}

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
    submitFeedback: builder.mutation<void, FeedbackRequest>({
      query: (feedback) => ({
        url: "feedback",
        method: "POST",
        body: feedback,
      }),
      invalidatesTags: ["Menu"],
      async onQueryStarted(_payload, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(
            enqueueSnackbarMessage({
              message: "Meal feedback submitted successfully",
              type: "success",
            }),
          );
        } catch (error: any) {
          dispatch(
            enqueueSnackbarMessage({
              message: "Failed submit meal feedback",
              type: "error",
            }),
          );
        }
      },
    }),
  }),
});

export const { useGetMenuQuery, useSubmitFeedbackMutation } = menuApi;
