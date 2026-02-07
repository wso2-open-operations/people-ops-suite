// Copyright (c) 2025 WSO2 LLC. (https://www.wso2.com).
//
// WSO2 LLC. licenses this file to you under the Apache License,
// Version 2.0 (the "License"); you may not use this file except
// in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.
import { createApi } from "@reduxjs/toolkit/query/react";

import { AppConfig } from "@config/config";
import { SnackMessage } from "@config/constant";
import { enqueueSnackbarMessage } from "@slices/commonSlice/common";

import { baseQueryWithReauth } from "./BaseQuery";

interface Collections {
  count: number;
  collections: Collection[];
}

export interface Collection {
  id: number;
  name: string;
  createdOn: string;
  createdBy: string;
  updatedOn: string;
  updatedBy: string;
}

export interface AddCollectionPayload {
  name: string;
}

export const collectionApi = createApi({
  reducerPath: "collectionApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Collections"],
  endpoints: (builder) => ({
    getCollections: builder.query<Collections, void>({
      query: () => AppConfig.serviceUrls.collections,
      providesTags: ["Collections"],
    }),
    addCollection: builder.mutation<Collection, AddCollectionPayload>({
      query: (payload) => ({
        url: AppConfig.serviceUrls.collections,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Collections"],
      async onQueryStarted(_payload, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(
            enqueueSnackbarMessage({
              message: SnackMessage.success.addCollections || "Collection added successfully",
              type: "success",
            }),
          );
        } catch (error: any) {
          dispatch(
            enqueueSnackbarMessage({
              message:
                error.error?.data?.message ||
                SnackMessage.error.addCollections ||
                "Failed to add collection",
              type: "error",
            }),
          );
        }
      },
    }),
  }),
});

export const { useGetCollectionsQuery, useAddCollectionMutation } = collectionApi;
